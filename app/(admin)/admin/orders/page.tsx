import { verifySession } from "@/lib/admin-auth";
import { query, withTransaction } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LOGIN_PATH } from "@/lib/admin-paths";
import { OrdersContent } from "./OrdersContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Order Management · Admin Panel",
  description: "View, filter, and manage customer orders and fulfillment",
  robots: { index: false, follow: false },
};

type OrderListRow = {
  id: number;
  order_number: string;
  customer_name: string;
  email: string;
  phone: string;
  city: string;
  subtotal: number;
  auto_discount: number;
  discount_code_amount: number;
  delivery_fee: number;
  total: number;
  payment_method: string;
  payment_status: string;
  order_status: string;
  tracking_id: string | null;
  rejection_reason: string | null;
  created_at: string;
  item_count: number;
};

type OrderDetail = OrderListRow & {
  items: Array<{
    id: number;
    product_id: number | null;
    product_name: string;
    unit_price: number;
    quantity: number;
  }>;
  payment_proof_url: string | null;
  easypaisa_txn_id: string | null;
  address: string;
};

type DiscountCodeRow = {
  id: number;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  used_count: number;
};

const STATUS_OPTIONS = {
  order_status: [
    "placed",
    "processing",
    "dispatched",
    "in_transit",
    "delivered",
    "cancellation_requested",
    "cancelled",
    "replacement_requested",
    "refunded",
  ] as const,
  payment_status: ["awaiting_payment", "paid", "rejected", "refunded"] as const,
};

const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  placed: ["processing", "cancelled", "cancellation_requested"],
  processing: ["dispatched", "cancelled", "cancellation_requested"],
  dispatched: ["in_transit", "delivered", "cancelled"],
  in_transit: ["delivered", "cancelled"],
  delivered: ["replacement_requested", "refunded"],
  cancellation_requested: ["cancelled", "placed"],
  cancelled: [],
  replacement_requested: ["refunded", "delivered"],
  refunded: [],
};

const PAYMENT_STATUS_TRANSITIONS: Record<string, string[]> = {
  awaiting_payment: ["paid", "rejected"],
  paid: ["refunded"],
  rejected: ["awaiting_payment", "paid"],
  refunded: [],
};

const PER_PAGE = 20;

// Server Actions
async function updateOrderStatusAction(formData: FormData) {
  "use server";
  const session = await verifySession();
  if (!session) throw new Error("Unauthorized");

  const id = parseInt(formData.get("id") as string, 10);
  const newStatus = formData.get("order_status") as string;

  const current = await query<{ order_status: string }>(
    "SELECT order_status FROM orders WHERE id = ?",
    [id]
  );
  if (!current.length) throw new Error("Order not found");
  if (!VALID_STATUS_TRANSITIONS[current[0].order_status]?.includes(newStatus)) {
    throw new Error("Invalid status transition");
  }

  await query("UPDATE orders SET order_status = ? WHERE id = ?", [newStatus, id]);

  // If cancelled, restore stock
  if (newStatus === "cancelled" && current[0].order_status !== "cancelled") {
    const items = await query<{ product_id: number | null; quantity: number }>(
      "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
      [id]
    );

    for (const item of items) {
      if (!item.product_id) continue;

      const product = await query<{ stock: number }>(
        "SELECT stock FROM products WHERE id = ? LIMIT 1",
        [item.product_id]
      );

      if (!product.length) continue;

      const oldStock = product[0].stock;
      const newStock = oldStock + item.quantity;

      await withTransaction(async (conn) => {
        await conn.query(
          "UPDATE products SET stock = ?, availability = CASE WHEN ? > 0 THEN 'available' ELSE 'sold_out' END WHERE id = ?",
          [newStock, newStock, item.product_id]
        );

        await conn.query(
          `INSERT INTO stock_audit (product_id, admin_user_id, change_type, old_stock, new_stock, adjustment, reason, reference_type, reference_id)
           VALUES (?, ?, 'return', ?, ?, ?, 'Order cancelled - stock restored', 'order', ?)`,
          [item.product_id, session.adminId, oldStock, newStock, item.quantity, id]
        );
      });
    }
  }

  revalidatePath("/admin/orders");
  redirect("/admin/orders?success=status");
}

async function updatePaymentStatusAction(formData: FormData) {
  "use server";
  const session = await verifySession();
  if (!session) throw new Error("Unauthorized");

  const id = parseInt(formData.get("id") as string, 10);
  const newStatus = formData.get("payment_status") as string;
  const paymentProofUrl = (formData.get("payment_proof_url") as string) || null;
  const easypaisaTxnId = (formData.get("easypaisa_txn_id") as string) || null;

  const current = await query<{ payment_status: string; order_status: string }>(
    "SELECT payment_status, order_status FROM orders WHERE id = ?",
    [id]
  );
  if (!current.length) throw new Error("Order not found");
  if (!PAYMENT_STATUS_TRANSITIONS[current[0].payment_status]?.includes(newStatus)) {
    throw new Error("Invalid payment status transition");
  }

  await query(
    `UPDATE orders SET payment_status = ?, payment_proof_url = ?, easypaisa_txn_id = ? WHERE id = ?`,
    [newStatus, paymentProofUrl, easypaisaTxnId, id]
  );

  if (newStatus === "paid" && current[0].order_status === "placed") {
    await query("UPDATE orders SET order_status = 'processing' WHERE id = ?", [id]);
  }

  revalidatePath("/admin/orders");
  redirect("/admin/orders?success=payment");
}

async function addTrackingAction(formData: FormData) {
  "use server";
  const session = await verifySession();
  if (!session) throw new Error("Unauthorized");

  const id = parseInt(formData.get("id") as string, 10);
  const trackingId = (formData.get("tracking_id") as string).trim();
  if (!trackingId) throw new Error("Tracking ID is required");

  const current = await query<{ order_status: string }>(
    "SELECT order_status FROM orders WHERE id = ?",
    [id]
  );
  if (!current.length) throw new Error("Order not found");
  if (current[0].order_status !== "dispatched" && current[0].order_status !== "placed") {
    throw new Error("Order must be in 'placed' or 'dispatched' status to add tracking");
  }

  await query(
    `UPDATE orders SET tracking_id = ?, order_status = 'dispatched' WHERE id = ?`,
    [trackingId, id]
  );

  revalidatePath("/admin/orders");
  redirect("/admin/orders?success=tracking");
}

async function fetchDiscountCodes(): Promise<DiscountCodeRow[]> {
  const rows = await query<DiscountCodeRow>(
    `SELECT id, code, type, value, used_count
     FROM discount_codes
     WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > NOW())
     ORDER BY code`
  );
  return rows;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    payment_status?: string;
    order_status?: string;
    page?: string;
    detail?: string;
    success?: string;
  }>;
}) {
  const session = await verifySession();
  if (!session) redirect(LOGIN_PATH);

  const params = await searchParams;
  const searchQuery = params.q || "";
  const paymentStatusFilter = params.payment_status || "";
  const orderStatusFilter = params.order_status || "";
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const detailId = params.detail ? parseInt(params.detail, 10) : null;
  const success = params.success || undefined;
  const offset = (page - 1) * PER_PAGE;

  // Build WHERE clause
  let whereSql = "";
  const whereParams: (string | number)[] = [];

  if (searchQuery) {
    whereSql += ` AND (o.order_number LIKE ? OR o.customer_name LIKE ? OR o.email LIKE ? OR o.phone LIKE ?)`;
    const term = `%${searchQuery}%`;
    whereParams.push(term, term, term, term);
  }
  if (paymentStatusFilter) {
    whereSql += ` AND o.payment_status = ?`;
    whereParams.push(paymentStatusFilter);
  }
  if (orderStatusFilter) {
    whereSql += ` AND o.order_status = ?`;
    whereParams.push(orderStatusFilter);
  }

  // Count total orders
  const countResult = await query<{ total: number }>(
    `SELECT COUNT(*) as total FROM orders o WHERE 1=1 ${whereSql}`,
    whereParams
  );
  const totalOrders = countResult[0]?.total ?? 0;
  const totalPages = Math.ceil(totalOrders / PER_PAGE);

  // Fetch orders list
  const orders = await query<OrderListRow>(
    `SELECT
      o.id, o.order_number, o.customer_name, o.email, o.phone, o.city,
      o.subtotal, o.auto_discount, o.discount_code_amount, o.delivery_fee, o.total,
      o.payment_method, o.payment_status, o.order_status, o.tracking_id,
      o.rejection_reason, o.created_at,
      (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
     FROM orders o
     WHERE 1=1 ${whereSql}
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`,
    [...whereParams, PER_PAGE, offset]
  );

  // Fetch detail if requested
  let detail: OrderDetail | null = null;
  if (detailId) {
    const orderResult = await query<OrderDetail>(
      `SELECT
        o.id, o.order_number, o.customer_name, o.email, o.phone, o.city, o.address,
        o.subtotal, o.auto_discount, o.discount_code_amount, o.delivery_fee, o.total,
        o.payment_method, o.payment_status, o.order_status, o.tracking_id,
        o.rejection_reason, o.created_at,
        o.payment_proof_url, o.easypaisa_txn_id,
        (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
       FROM orders o
       WHERE o.id = ?`,
      [detailId]
    );

    if (orderResult.length) {
      const items = await query<{ id: number; product_id: number | null; product_name: string; unit_price: number; quantity: number }>(
        `SELECT id, product_id, product_name, unit_price, quantity
         FROM order_items
         WHERE order_id = ?
         ORDER BY id`,
        [detailId]
      );
      detail = { ...orderResult[0], items };
    }
  }

  return (
    <OrdersContent
      orders={orders}
      searchQuery={searchQuery}
      paymentStatusFilter={paymentStatusFilter}
      orderStatusFilter={orderStatusFilter}
      page={page}
      totalPages={totalPages}
      totalOrders={totalOrders}
      detail={detail}
      detailId={detailId}
      updateOrderStatusAction={updateOrderStatusAction}
      updatePaymentStatusAction={updatePaymentStatusAction}
      addTrackingAction={addTrackingAction}
      success={success}
    />
  );
}