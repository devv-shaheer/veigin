import { verifySession } from "@/lib/admin-auth";
import { query, withTransaction } from "@/lib/db";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LOGIN_PATH } from "@/lib/admin-paths";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Order Management · Admin Panel",
  description: "Manage customer orders, statuses, and fulfillment",
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
  const newStatus = (formData.get("order_status") as string) || "";

  if (!id || !newStatus) throw new Error("Invalid order ID or status.");

  const order = await query<{ order_status: string }>(
    "SELECT order_status FROM orders WHERE id = ? LIMIT 1",
    [id]
  );

  if (!order.length) throw new Error("Order not found.");

  const currentStatus = order[0].order_status;
  const allowed = VALID_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}.`);
  }

  await query(
    `UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [newStatus, id]
  );

  // If cancelled, restore stock
  if (newStatus === "cancelled" && currentStatus !== "cancelled") {
    await restoreStockForOrder(id, session.adminId);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders?detail=${id}`);
  redirect("/admin/orders?success=status");
}

async function updatePaymentStatusAction(formData: FormData) {
  "use server";
  const session = await verifySession();
  if (!session) throw new Error("Unauthorized");

  const id = parseInt(formData.get("id") as string, 10);
  const newStatus = (formData.get("payment_status") as string) || "";
  const proofUrl = ((formData.get("payment_proof_url") as string) || "").trim() || null;
  const txnId = ((formData.get("easypaisa_txn_id") as string) || "").trim() || null;

  if (!id || !newStatus) throw new Error("Invalid order ID or payment status.");

  const order = await query<{ payment_status: string }>(
    "SELECT payment_status FROM orders WHERE id = ? LIMIT 1",
    [id]
  );

  if (!order.length) throw new Error("Order not found.");

  const currentStatus = order[0].payment_status;
  const allowed = PAYMENT_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Cannot transition payment from ${currentStatus} to ${newStatus}.`);
  }

  await query(
    `UPDATE orders SET payment_status = ?, payment_proof_url = ?, easypaisa_txn_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [newStatus, proofUrl, txnId, id]
  );

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders?detail=${id}`);
  redirect("/admin/orders?success=payment");
}

async function addTrackingAction(formData: FormData) {
  "use server";
  const session = await verifySession();
  if (!session) throw new Error("Unauthorized");

  const id = parseInt(formData.get("id") as string, 10);
  const trackingId = (formData.get("tracking_id") as string)?.trim();

  if (!id || !trackingId) throw new Error("Invalid order ID or tracking ID.");

  await query(
    `UPDATE orders SET tracking_id = ?, order_status = 'dispatched', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [trackingId, id]
  );

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders?detail=${id}`);
  redirect("/admin/orders?success=tracking");
}

async function restoreStockForOrder(orderId: number, adminId: number) {
  const items = await query<{ product_id: number | null; quantity: number }>(
    "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
    [orderId]
  );

  for (const item of items) {
    if (!item.product_id) continue;

    // Get current stock
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
        [item.product_id, adminId, oldStock, newStock, item.quantity, orderId]
      );
    });
  }
}

async function fetchDiscountCodes(): Promise<DiscountCodeRow[]> {
  const rows = await query<DiscountCodeRow>(
    "SELECT id, code, type, value, used_count FROM discount_codes WHERE active = 1 ORDER BY code"
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
  const offset = (page - 1) * PER_PAGE;

  // Build order list query
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

  const countSql = `
    SELECT COUNT(*) as total FROM orders o WHERE 1=1 ${whereSql}
  `;
  const totalResult = await query<{ total: number }>(countSql, whereParams);
  const totalOrders = totalResult[0]?.total ?? 0;
  const totalPages = Math.ceil(totalOrders / PER_PAGE);

  const listSql = `
    SELECT o.*,
           (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count
    FROM orders o
    WHERE 1=1 ${whereSql}
    ORDER BY o.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const listParams = [...whereParams, PER_PAGE, offset];
  const orders = await query<OrderListRow>(listSql, listParams);

  // Fetch detail if requested
  let detail: OrderDetail | null = null;
  if (detailId) {
    const detailRows = await query<any>(
      `SELECT o.*,
         JSON_ARRAYAGG(
           JSON_OBJECT(
             'id', oi.id,
             'product_id', oi.product_id,
             'product_name', oi.product_name,
             'unit_price', oi.unit_price,
             'quantity', oi.quantity
           )
         ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.id = ?
       GROUP BY o.id`,
      [detailId]
    );
    if (detailRows.length) {
      detail = {
        ...detailRows[0],
        items: detailRows[0].items?.[0] ? detailRows[0].items : [],
      };
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin" className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] text-sm">
              ← Overview
            </Link>
            <span className="text-[var(--admin-text-muted)]">/</span>
            <span className="text-sm font-medium" style={{ color: "var(--admin-crimson)" }}>Orders</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-[var(--admin-text)] tracking-tight">Order Management</h1>
          <p className="text-[var(--admin-text-muted)] text-sm mt-1">View, filter, and manage customer orders and fulfillment.</p>
        </div>
      </div>

      {/* Success Banner */}
      {params.success && (
        <div className="mb-6 admin-shell__card" style={{ backgroundColor: "var(--admin-emerald-subtle)", borderColor: "var(--admin-emerald-border)" }}>
          <span className="font-medium" style={{ color: "var(--admin-emerald)" }}>
            {params.success === "status" && "Order status updated successfully."}
            {params.success === "payment" && "Payment status updated successfully."}
            {params.success === "tracking" && "Tracking ID added and order marked as dispatched."}
          </span>
          <Link href="/admin/orders" className="text-xs hover:underline" style={{ color: "var(--admin-emerald)" }}>Dismiss</Link>
        </div>
      )}

      {/* Filters and Search */}
      <div className="admin-shell__card mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <form method="GET" action="/admin/orders" className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Search by order #, name, email, phone..."
            className="admin-shell__input w-full sm:w-80"
          />
          {paymentStatusFilter && <input type="hidden" name="payment_status" value={paymentStatusFilter} />}
          {orderStatusFilter && <input type="hidden" name="order_status" value={orderStatusFilter} />}
          <button type="submit" className="admin-shell__btn admin-shell__btn--secondary">
            Search
          </button>
        </form>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-wrap">
          {/* Payment Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Payment:</span>
            <select
              name="payment_status"
              defaultValue={paymentStatusFilter}
              className="admin-shell__select admin-shell__select--sm"
              style={{ minWidth: "160px" }}
              onChange={(e) => {
                const params = new URLSearchParams(window.location.search);
                if (e.target.value) params.set("payment_status", e.target.value);
                else params.delete("payment_status");
                params.delete("page");
                window.location.href = `/admin/orders?${params.toString()}`;
              }}
            >
              <option value="">All Payment Status</option>
              {STATUS_OPTIONS.payment_status.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
          </div>

          {/* Order Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Order:</span>
            <select
              name="order_status"
              defaultValue={orderStatusFilter}
              className="admin-shell__select admin-shell__select--sm"
              style={{ minWidth: "180px" }}
              onChange={(e) => {
                const params = new URLSearchParams(window.location.search);
                if (e.target.value) params.set("order_status", e.target.value);
                else params.delete("order_status");
                params.delete("page");
                window.location.href = `/admin/orders?${params.toString()}`;
              }}
            >
              <option value="">All Order Status</option>
              {STATUS_OPTIONS.order_status.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="admin-shell__card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-shell__table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Tracking</th>
                <th>Date</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="admin-shell__empty">
                    <svg className="admin-shell__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                      <path d="M21 12V7H5v6M3 18h18M5 7l3 6h10" />
                      <path d="M17 21v-4M7 21v-4" />
                    </svg>
                    <p>No orders found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} style={{ fontWeight: detailId === o.id ? "600" : "400" }}>
                    <td>
                      <div className="font-mono font-medium text-[var(--admin-text)]">{o.order_number}</div>
                    </td>
                    <td>
                      <div className="font-medium text-[var(--admin-text)]">{o.customer_name}</div>
                      <div className="text-xs font-mono" style={{ color: "var(--admin-text-muted)" }}>{o.email}</div>
                      <div className="text-xs font-mono" style={{ color: "var(--admin-text-muted)" }}>{o.phone}</div>
                    </td>
                    <td className="font-mono text-[var(--admin-text)]">{o.item_count}</td>
                    <td className="font-mono text-[var(--admin-text)]">PKR {o.total.toLocaleString()}</td>
                    <td>
                      <span className={`admin-shell__badge ${
                        o.payment_status === "paid" ? "admin-shell__badge--success"
                        : o.payment_status === "rejected" ? "admin-shell__badge--danger"
                        : o.payment_status === "refunded" ? "admin-shell__badge--neutral"
                        : "admin-shell__badge--warning"
                      }`}>
                        {o.payment_status.replace("_", " ")}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-shell__badge ${
                        o.order_status === "delivered" ? "admin-shell__badge--success"
                        : o.order_status === "cancelled" || o.order_status === "refunded" ? "admin-shell__badge--danger"
                        : o.order_status === "dispatched" || o.order_status === "in_transit" ? "admin-shell__badge--warning"
                        : "admin-shell__badge--neutral"
                      }`}>
                        {o.order_status.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ color: "var(--admin-text-muted)" }}>
                      {o.tracking_id || <span className="italic">—</span>}
                    </td>
                    <td style={{ color: "var(--admin-text-muted)" }}>
                      {new Date(o.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                        <Link
                          href={`/admin/orders?detail=${o.id}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}${paymentStatusFilter ? `&payment_status=${paymentStatusFilter}` : ""}${orderStatusFilter ? `&order_status=${orderStatusFilter}` : ""}${page > 1 ? `&page=${page}` : ""}`}
                          className="admin-shell__btn admin-shell__btn--sm"
                          style={{ padding: "var(--space-1) var(--space-2)", fontSize: "11px" }}
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t" style={{ borderColor: "var(--admin-border)" }}>
            <div className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
              Page {page} of {totalPages} — {totalOrders.toLocaleString()} orders
            </div>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <a
                  href={`/admin/orders?page=${page - 1}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}${paymentStatusFilter ? `&payment_status=${paymentStatusFilter}` : ""}${orderStatusFilter ? `&order_status=${orderStatusFilter}` : ""}`}
                  className="admin-shell__btn admin-shell__btn--secondary admin-shell__btn--sm"
                >
                  Previous
                </a>
              )}
              {page < totalPages && (
                <a
                  href={`/admin/orders?page=${page + 1}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}${paymentStatusFilter ? `&payment_status=${paymentStatusFilter}` : ""}${orderStatusFilter ? `&order_status=${orderStatusFilter}` : ""}`}
                  className="admin-shell__btn admin-shell__btn--secondary admin-shell__btn--sm"
                >
                  Next
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="admin-shell__card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-[var(--admin-text)]">Order {detail.order_number}</h2>
                <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>{detail.customer_name} · {detail.email}</p>
              </div>
              <Link
                href={`/admin/orders${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}${paymentStatusFilter ? `${searchQuery ? "&" : "?"}payment_status=${paymentStatusFilter}` : ""}${orderStatusFilter ? `${(searchQuery || paymentStatusFilter) ? "&" : "?"}order_status=${orderStatusFilter}` : ""}${page > 1 ? `${(searchQuery || paymentStatusFilter || orderStatusFilter) ? "&" : "?"}page=${page}` : ""}`}
                className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] text-xl font-medium"
              >
                ✕
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Order Status */}
              <div className="admin-shell__card p-4" style={{ backgroundColor: "var(--admin-bg)" }}>
                <h3 className="font-semibold text-[var(--admin-text)] mb-3">Order Status</h3>
                <form action={updateOrderStatusAction} method="POST">
                  <input type="hidden" name="id" value={detail.id} />
                  <select
                    name="order_status"
                    defaultValue={detail.order_status}
                    className="admin-shell__select mb-3"
                    onChange={(e) => e.currentTarget.form?.requestSubmit?.()}
                  >
                    {STATUS_OPTIONS.order_status
                      .filter((s) => VALID_STATUS_TRANSITIONS[detail.order_status]?.includes(s) || s === detail.order_status)
                      .map((s) => (
                        <option key={s} value={s}>{s.replace("_", " ")}</option>
                      ))}
                  </select>
                </form>
                {detail.rejection_reason && (
                  <p className="text-sm" style={{ color: "var(--admin-crimson)" }}>
                    Rejection reason: {detail.rejection_reason}
                  </p>
                )}
              </div>

              {/* Payment Status */}
              <div className="admin-shell__card p-4" style={{ backgroundColor: "var(--admin-bg)" }}>
                <h3 className="font-semibold text-[var(--admin-text)] mb-3">Payment Status</h3>
                <form action={updatePaymentStatusAction} method="POST" className="space-y-3">
                  <input type="hidden" name="id" value={detail.id} />
                  <select
                    name="payment_status"
                    defaultValue={detail.payment_status}
                    className="admin-shell__select"
                    onChange={(e) => e.currentTarget.form?.requestSubmit?.()}
                  >
                    {STATUS_OPTIONS.payment_status
                      .filter((s) => PAYMENT_STATUS_TRANSITIONS[detail.payment_status]?.includes(s) || s === detail.payment_status)
                      .map((s) => (
                        <option key={s} value={s}>{s.replace("_", " ")}</option>
                      ))}
                  </select>
                  <input
                    type="text"
                    name="payment_proof_url"
                    defaultValue={detail.payment_proof_url || ""}
                    placeholder="Payment proof URL (optional)"
                    className="admin-shell__input"
                  />
                  <input
                    type="text"
                    name="easypaisa_txn_id"
                    defaultValue={detail.easypaisa_txn_id || ""}
                    placeholder="Easypaisa Transaction ID (optional)"
                    className="admin-shell__input"
                  />
                </form>
              </div>

              {/* Tracking */}
              <div className="admin-shell__card p-4 lg:col-span-2" style={{ backgroundColor: "var(--admin-bg)" }}>
                <h3 className="font-semibold text-[var(--admin-text)] mb-3">Tracking</h3>
                <form action={addTrackingAction} method="POST" className="flex items-center gap-3 flex-wrap">
                  <input type="hidden" name="id" value={detail.id} />
                  <input
                    type="text"
                    name="tracking_id"
                    placeholder="Enter tracking number"
                    className="admin-shell__input flex-1 min-w-[200px]"
                    required
                  />
                  <button type="submit" className="admin-shell__btn admin-shell__btn--primary">
                    Add Tracking & Mark Dispatched
                  </button>
                </form>
                {detail.tracking_id && (
                  <p className="text-sm mt-2" style={{ color: "var(--admin-text-muted)" }}>
                    Current: <span className="font-mono text-[var(--admin-text)]">{detail.tracking_id}</span>
                  </p>
                )}
              </div>

              {/* Order Totals */}
              <div className="admin-shell__card p-4 lg:col-span-2" style={{ backgroundColor: "var(--admin-bg)" }}>
                <h3 className="font-semibold text-[var(--admin-text)] mb-3">Order Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span style={{ color: "var(--admin-text-muted)" }}>Subtotal:</span>
                    <div className="font-mono text-[var(--admin-text)]">PKR {detail.subtotal.toLocaleString()}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)" }}>Auto Discount:</span>
                    <div className="font-mono" style={{ color: "var(--admin-emerald)" }}>−PKR {detail.auto_discount.toLocaleString()}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)" }}>Code Discount:</span>
                    <div className="font-mono" style={{ color: "var(--admin-emerald)" }}>−PKR {detail.discount_code_amount.toLocaleString()}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)" }}>Delivery Fee:</span>
                    <div className="font-mono text-[var(--admin-text)]">PKR {detail.delivery_fee.toLocaleString()}</div>
                  </div>
                  <div className="lg:col-span-2 pt-2 border-t" style={{ borderColor: "var(--admin-border)" }}>
                    <span className="font-semibold">Total:</span>
                    <div className="font-mono text-lg text-[var(--admin-text)]">PKR {detail.total.toLocaleString()}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)" }}>Payment Method:</span>
                    <div className="font-medium capitalize">{detail.payment_method.replace("_", " ")}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)" }}>City:</span>
                    <div className="font-medium">{detail.city}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="admin-shell__card overflow-hidden">
              <h3 className="font-semibold text-[var(--admin-text)] mb-4 p-4 border-b" style={{ borderColor: "var(--admin-border)", margin: "0 -1.5rem 1.5rem" }}>Order Items ({detail.items.length})</h3>
              <div className="overflow-x-auto">
                <table className="admin-shell__table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Unit Price</th>
                      <th>Qty</th>
                      <th>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="font-medium text-[var(--admin-text)]">{item.product_name}</div>
                          {item.product_id && (
                            <div className="text-xs font-mono" style={{ color: "var(--admin-text-muted)" }}>ID: {item.product_id}</div>
                          )}
                        </td>
                        <td className="font-mono text-[var(--admin-text)]">PKR {item.unit_price.toLocaleString()}</td>
                        <td className="font-mono text-[var(--admin-text)]">{item.quantity}</td>
                        <td className="font-mono text-[var(--admin-text)]">PKR {(item.unit_price * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="admin-shell__card mt-6 p-4">
              <h3 className="font-semibold text-[var(--admin-text)] mb-3">Shipping Address</h3>
              <address className="not-italic" style={{ color: "var(--admin-text)" }}>
                {detail.customer_name}<br />
                {detail.address}<br />
                {detail.city}<br />
                {detail.phone}<br />
                {detail.email}
              </address>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}