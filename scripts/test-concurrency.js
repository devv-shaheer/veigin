const mysql = require("mysql2/promise");
const { loadEnv } = require("./load-env");

async function testConcurrency() {
  loadEnv();
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  // Create a test product with stock = 1
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL });

  try {
    // Insert or reset test product
    await conn.execute(
      `INSERT INTO products (id, name, slug, price, stock, availability, created_at, updated_at)
       VALUES (999999, 'Concurrency Test Product', 'concurrency-test-product', 1000, 1, 'available', NOW(), NOW())
       ON DUPLICATE KEY UPDATE stock = 1, availability = 'available', updated_at = NOW()`
    );
    console.log("Test product created with stock = 1");

    // Get the test product ID
    const [productRows] = await conn.query(
      "SELECT id FROM products WHERE slug = 'concurrency-test-product' LIMIT 1"
    );
    const productId = productRows[0].id;
    console.log(`Test product ID: ${productId}`);

    // Reset stock to 1 before test
    await conn.execute("UPDATE products SET stock = 1, availability = 'available' WHERE id = ?", [productId]);
    console.log("Stock reset to 1");

    // Simulate two concurrent checkout requests
    console.log("\n--- Starting concurrent checkout simulation ---\n");

    const makeRequest = async (requestId) => {
      const testConn = await mysql.createConnection({ uri: process.env.DATABASE_URL });
      try {
        // Begin transaction
        await testConn.beginTransaction();

        // Lock the product row
        const [rows] = await testConn.query(
          "SELECT stock FROM products WHERE id = ? FOR UPDATE",
          [productId]
        );
        const stock = rows[0]?.stock ?? 0;
        console.log(`Request ${requestId}: Locked product, stock = ${stock}`);

        if (stock <= 0) {
          await testConn.rollback();
          return { success: false, reason: "Out of stock" };
        }

        // Simulate some processing time
        await new Promise(r => setTimeout(r, 100));

        // Deduct stock
        const newStock = stock - 1;
        await testConn.execute(
          "UPDATE products SET stock = ?, availability = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [newStock, newStock === 0 ? "sold_out" : "available", productId]
        );

        // Create order
        const orderNumber = `VGN-TEST-${Date.now()}-${requestId}`;
        const [insertResult] = await testConn.execute(
          "INSERT INTO orders (order_number, customer_name, phone, email, address, city, subtotal, delivery_fee, total, payment_method, payment_status, order_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'cod', 'awaiting_payment', 'placed')",
          [orderNumber, `Test Customer ${requestId}`, '1234567890', `test${requestId}@example.com`, 'Test Address', 'Test City', 1000, 200, 1200]
        );

        await testConn.commit();
        return { success: true, orderId: insertResult.insertId };
      } catch (err) {
        await testConn.rollback();
        return { success: false, reason: err.message };
      } finally {
        await testConn.end();
      }
    };

    // Run both requests concurrently
    const [result1, result2] = await Promise.all([
      makeRequest(1),
      makeRequest(2),
    ]);

    console.log("\n--- Results ---");
    console.log(`Request 1: ${result1.success ? "SUCCESS" : "FAILED"} - ${result1.success ? `Order ${result1.orderId}` : result1.reason}`);
    console.log(`Request 2: ${result2.success ? "SUCCESS" : "FAILED"} - ${result2.success ? `Order ${result2.orderId}` : result2.reason}`);

    // Check final stock
    const [finalStock] = await conn.query("SELECT stock FROM products WHERE id = ?", [productId]);
    console.log(`\nFinal stock: ${finalStock[0].stock}`);

    // Check orders created
    const [orders] = await conn.query(
      "SELECT order_number, id FROM orders WHERE order_number LIKE 'VGN-TEST-%' ORDER BY created_at DESC"
    );
    console.log(`\nOrders created: ${orders.length}`);
    orders.forEach(o => console.log(`  - ${o.order_number} (ID: ${o.id})`));

    // Check stock audit
    const [audit] = await conn.query(
      "SELECT id, old_stock, new_stock, adjustment, reason FROM stock_audit WHERE product_id = ? AND reference_type = 'order' ORDER BY created_at DESC",
      [productId]
    );
    console.log(`\nStock audit entries (order): ${audit.length}`);
    audit.forEach(a => console.log(`  - ID: ${a.id}, old: ${a.old_stock}, new: ${a.new_stock}, adj: ${a.adjustment}, reason: ${a.reason}`));

    // Verify test result
    const successCount = [result1, result2].filter(r => r.success).length;
    if (successCount === 1 && finalStock[0].stock === 0) {
      console.log("\n✅ CONCURRENCY TEST PASSED: Only one order succeeded, stock correctly deducted to 0");
    } else {
      console.log("\n❌ CONCURRENCY TEST FAILED: Race condition detected!");
      process.exit(1);
    }

  } finally {
    // Cleanup
    await conn.execute("DELETE FROM products WHERE slug = 'concurrency-test-product'");
    await conn.execute("DELETE FROM orders WHERE order_number LIKE 'VGN-TEST-%'");
    await conn.execute("DELETE FROM stock_audit WHERE product_id = (SELECT id FROM products WHERE slug = 'concurrency-test-product')");
    await conn.end();
  }
}

testConcurrency().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});