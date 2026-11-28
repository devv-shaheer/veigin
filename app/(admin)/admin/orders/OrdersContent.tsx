"use client";

import Link from "next/link";

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

const PAYMENT_STATUS_OPTIONS = STATUS_OPTIONS.payment_status;
const ORDER_STATUS_OPTIONS = STATUS_OPTIONS.order_status;

interface OrdersContentProps {
  orders: OrderListRow[];
  searchQuery: string;
  paymentStatusFilter: string;
  orderStatusFilter: string;
  page: number;
  totalPages: number;
  totalOrders: number;
  detail: OrderDetail | null;
  detailId: number | null;
  updateOrderStatusAction: (formData: FormData) => Promise<void>;
  updatePaymentStatusAction: (formData: FormData) => Promise<void>;
  addTrackingAction: (formData: FormData) => Promise<void>;
  success?: string;
}

export function OrdersContent({
  orders,
  searchQuery,
  paymentStatusFilter,
  orderStatusFilter,
  page,
  totalPages,
  totalOrders,
  detail,
  detailId,
  updateOrderStatusAction,
  updatePaymentStatusAction,
  addTrackingAction,
  success,
}: OrdersContentProps) {
  const buildUrl = (params: Record<string, string>) => {
    const searchParams = new URLSearchParams(params);
    return `/admin/orders?${searchParams.toString()}`;
  };

  const handlePaymentStatusChange = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set("payment_status", value);
    else params.delete("payment_status");
    params.delete("page");
    window.location.href = buildUrl(Object.fromEntries(params));
  };

  const handleOrderStatusChange = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    if (value) params.set("order_status", value);
    else params.delete("order_status");
    params.delete("page");
    window.location.href = buildUrl(Object.fromEntries(params));
  };

  const buildDetailUrl = (includeDetail = true) => {
    const params: Record<string, string> = {};
    if (searchQuery) params.q = searchQuery;
    if (paymentStatusFilter) params.payment_status = paymentStatusFilter;
    if (orderStatusFilter) params.order_status = orderStatusFilter;
    if (page > 1) params.page = String(page);
    if (includeDetail && detailId) params.detail = String(detailId);
    return buildUrl(params);
  };

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
      {success && (
        <div className="mb-6 admin-shell__card" style={{ backgroundColor: "var(--admin-emerald-subtle)", borderColor: "var(--admin-emerald-border)" }}>
          <span className="font-medium" style={{ color: "var(--admin-emerald)" }}>
            {success === "status" && "Order status updated successfully."}
            {success === "payment" && "Payment status updated successfully."}
            {success === "tracking" && "Tracking ID added and order marked as dispatched."}
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
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Payment:</span>
            <select
              name="payment_status"
              defaultValue={paymentStatusFilter}
              className="admin-shell__select admin-shell__select--sm"
              style={{ minWidth: "160px" }}
              onChange={(e) => handlePaymentStatusChange(e.target.value)}
            >
              <option value="">All Payment Status</option>
              {PAYMENT_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.replace("_", " ")}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Order:</span>
            <select
              name="order_status"
              defaultValue={orderStatusFilter}
              className="admin-shell__select admin-shell__select--sm"
              style={{ minWidth: "180px" }}
              onChange={(e) => handleOrderStatusChange(e.target.value)}
            >
              <option value="">All Order Status</option>
              {ORDER_STATUS_OPTIONS.map((s) => (
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
                          href={buildDetailUrl()}
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
                  href={buildUrl({ page: String(page - 1), ...(searchQuery ? { q: searchQuery } : {}), ...(paymentStatusFilter ? { payment_status: paymentStatusFilter } : {}), ...(orderStatusFilter ? { order_status: orderStatusFilter } : {}) })}
                  className="admin-shell__btn admin-shell__btn--secondary admin-shell__btn--sm"
                >
                  Previous
                </a>
              )}
              {page < totalPages && (
                <a
                  href={buildUrl({ page: String(page + 1), ...(searchQuery ? { q: searchQuery } : {}), ...(paymentStatusFilter ? { payment_status: paymentStatusFilter } : {}), ...(orderStatusFilter ? { order_status: orderStatusFilter } : {}) })}
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
                href={buildDetailUrl(false)}
                className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] text-xl font-medium"
              >
                ✕
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Order Status */}
              <div className="admin-shell__card p-4" style={{ backgroundColor: "var(--admin-bg)" }}>
                <h3 className="font-semibold text-[var(--admin-text)] mb-3">Order Status</h3>
                <form action={updateOrderStatusAction}>
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
                <form action={updatePaymentStatusAction} className="space-y-3">
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
                <form action={addTrackingAction} className="flex items-center gap-3 flex-wrap">
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