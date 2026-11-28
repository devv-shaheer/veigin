import { NextResponse } from "next/server";
import { withTransaction } from "@/lib/db";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";

type CheckoutItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
};

type CheckoutPayload = {
  customerName: string;
  phone: string;
  email: string;
  promoConsent: boolean;
  address: string;
  city: string;
  items: CheckoutItem[];
};

type ProductRow = RowDataPacket & {
  id: number;
  name: string;
  price: number;
  stock: number;
  availability: string;
};

export async function POST(request: Request) {
  let body: CheckoutPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { customerName, phone, email, promoConsent, address, city, items } = body;

  if (!customerName || !phone || !email || !address || !city) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  try {
    const result = await withTransaction(async (conn: PoolConnection) => {
      // Re-verify every product from the database with row lock (stock + price).
      const ids = items.map((i) => i.productId);
      const placeholders = ids.map(() => "?").join(",");
      const [rows] = await conn.query<ProductRow[]>(
        `SELECT id, name, price, stock, availability FROM products WHERE id IN (${placeholders}) FOR UPDATE`,
        ids,
      );
      const byId = new Map<number, ProductRow>();
      for (const r of rows) byId.set(Number(r.id), r);

      const verified: { productId: number; name: string; price: number; quantity: number }[] = [];

      for (const item of items) {
        const p = byId.get(item.productId);
        if (!p) {
          throw new Error(`Product ${item.productId} not found`);
        }
        if (p.availability === "archived" || p.availability === "sold_out") {
          throw new Error(`${p.name} is unavailable`);
        }
        if (p.stock <= 0) {
          throw new Error(`${p.name} is out of stock`);
        }
        const qty = Math.max(1, Math.min(p.stock, Math.floor(item.quantity || 1)));
        if (qty < 1) {
          throw new Error(`Invalid quantity for ${p.name}`);
        }
        verified.push({
          productId: p.id,
          name: p.name,
          price: Number(p.price), // server-side price, not client
          quantity: qty,
        });
      }

      const subtotal = verified.reduce((s, i) => s + i.price * i.quantity, 0);
      const deliveryFee = 200;
      const total = subtotal + deliveryFee;

      const orderNumber = `VGN-${Date.now().toString(36).toUpperCase()}`;
      const [insertResult] = await conn.execute(
        "INSERT INTO orders (order_number, customer_name, phone, email, address, city, subtotal, delivery_fee, total, payment_method, payment_status, order_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'cod', 'awaiting_payment', 'placed')",
        [orderNumber, customerName, phone, email, address, city, subtotal, deliveryFee, total],
      );
      const orderId = (insertResult as { insertId: number }).insertId;

      for (const item of verified) {
        await conn.execute(
          "INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity) VALUES (?, ?, ?, ?, ?)",
          [orderId, item.productId, item.name, item.price, item.quantity],
        );

        // Deduct stock atomically
        const [productBefore] = await conn.query<ProductRow[]>(
          "SELECT stock FROM products WHERE id = ? FOR UPDATE",
          [item.productId]
        );
        const oldStock = productBefore[0]?.stock ?? 0;
        const newStock = Math.max(0, oldStock - item.quantity);
        const newAvailability = newStock === 0 ? "sold_out" : "available";

        await conn.execute(
          "UPDATE products SET stock = ?, availability = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [newStock, newAvailability, item.productId]
        );

        // Log stock change to audit
        await conn.execute(
          `INSERT INTO stock_audit (product_id, admin_user_id, change_type, old_stock, new_stock, adjustment, reason, reference_type, reference_id)
           VALUES (?, NULL, 'order', ?, ?, ?, 'Order placed', 'order', ?)`,
          [item.productId, oldStock, newStock, -item.quantity, orderId]
        );
      }

      void promoConsent;
      return orderId;
    });

    return NextResponse.json({ orderId: result, orderNumber: `VGN-${result}` }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Order failed" },
      { status: 400 },
    );
  }
}