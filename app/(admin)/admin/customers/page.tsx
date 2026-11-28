import { verifySession } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LOGIN_PATH } from "@/lib/admin-paths";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Customer Directory · Admin Panel",
  description: "Manage customer accounts and view order history",
  robots: { index: false, follow: false },
};

type CustomerRow = {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  city: string | null;
  order_count: number;
  total_spent: number;
  last_order_at: string | null;
  created_at: string;
};

type CustomerDetail = CustomerRow & {
  orders: Array<{
    id: number;
    order_number: string;
    total: number;
    order_status: string;
    payment_status: string;
    created_at: string;
    item_count: number;
  }>;
  addresses: Array<{
    id: number;
    label: string | null;
    address: string;
    city: string;
    phone: string;
    customer_name: string | null;
    is_default: boolean;
  }>;
};

const PER_PAGE = 25;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    has_orders?: string;
    page?: string;
    detail?: string;
  }>;
}) {
  const session = await verifySession();
  if (!session) redirect(LOGIN_PATH);

  const params = await searchParams;
  const searchQuery = params.q || "";
  const hasOrdersFilter = params.has_orders || "";
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const detailId = params.detail ? parseInt(params.detail, 10) : null;
  const offset = (page - 1) * PER_PAGE;

  // Build customer list query
  let whereSql = "";
  const whereParams: (string | number)[] = [];

  if (searchQuery) {
    whereSql += ` AND (u.email LIKE ? OR u.name LIKE ? OR u.phone LIKE ? OR u.city LIKE ?)`;
    const term = `%${searchQuery}%`;
    whereParams.push(term, term, term, term);
  }

  if (hasOrdersFilter === "yes") {
    whereSql += ` AND u.order_count > 0`;
  } else if (hasOrdersFilter === "no") {
    whereSql += ` AND u.order_count = 0`;
  }

  // Count total
  const countSql = `
    SELECT COUNT(*) as total FROM (
      SELECT u.id, u.email, u.name, u.phone, u.city, u.created_at,
             COUNT(o.id) as order_count,
             COALESCE(SUM(o.total), 0) as total_spent,
             MAX(o.created_at) as last_order_at
      FROM orders u
      LEFT JOIN orders o ON o.email = u.email
      WHERE 1=1
      GROUP BY u.id, u.email, u.name, u.phone, u.city, u.created_at
    ) AS customers
    WHERE 1=1 ${whereSql}
  `;

  // Actually, let me use a simpler approach - we don't have a customers table separate from orders
  // The customers are derived from orders. Let me adjust.

  // Actually looking at the schema, we don't have a dedicated customers table - customers are from orders
  // So we need to query from orders table

  const countSql2 = `
    SELECT COUNT(DISTINCT email) as total FROM orders WHERE 1=1 ${whereSql}
  `;

  const totalResult = await query<{ total: number }>(countSql2, whereParams);
  const totalCustomers = totalResult[0]?.total ?? 0;
  const totalPages = Math.ceil(totalCustomers / PER_PAGE);

  const listSql = `
    SELECT
      u.email,
      u.name,
      u.phone,
      u.city,
      COUNT(u.id) as order_count,
      COALESCE(SUM(u.total), 0) as total_spent,
      MAX(u.created_at) as last_order_at,
      MIN(u.created_at) as created_at
    FROM orders u
    WHERE 1=1 ${whereSql}
    GROUP BY u.email, u.name, u.phone, u.city
    ORDER BY last_order_at DESC
    LIMIT ? OFFSET ?
  `;

  const listParams = [...whereParams, PER_PAGE, offset];
  const customers = await query<CustomerRow>(listSql, listParams);

  // Fetch detail if requested
  let detail: CustomerDetail | null = null;
  if (detailId) {
    // Find the email for this customer
    const customerEmail = await query<{ email: string }>(
      `SELECT email FROM orders WHERE id = ? LIMIT 1`,
      [detailId]
    );

    if (customerEmail.length) {
      const email = customerEmail[0].email;

      // Get customer info
      const customerInfo = await query<CustomerRow>(
        `SELECT
          u.email, u.name, u.phone, u.city,
          COUNT(u.id) as order_count,
          COALESCE(SUM(u.total), 0) as total_spent,
          MAX(u.created_at) as last_order_at,
          MIN(u.created_at) as created_at
        FROM orders u
        WHERE u.email = ?
        GROUP BY u.email, u.name, u.phone, u.city`,
        [email]
      );

      if (customerInfo.length) {
        // Get orders
        const orders = await query<any>(
          `SELECT id, order_number, total, order_status, payment_status, created_at,
                  (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
           FROM orders o
           WHERE email = ?
           ORDER BY created_at DESC`,
          [email]
        );

        // Get addresses (from most recent orders)
        const addresses = await query<any>(
          `SELECT DISTINCT
            o.id, o.address, o.city, o.phone, o.customer_name,
            NULL as label,
            CASE WHEN o.id = (SELECT MAX(id) FROM orders WHERE email = o.email) THEN 1 ELSE 0 END as is_default
           FROM orders o
           WHERE o.email = ?
           ORDER BY o.id DESC`,
          [email]
        );

        detail = {
          ...customerInfo[0],
          orders,
          addresses,
        };
      }
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
            <span className="text-sm font-medium" style={{ color: "var(--admin-crimson)" }}>Customers</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-[var(--admin-text)] tracking-tight">Customer Directory</h1>
          <p className="text-[var(--admin-text-muted)] text-sm mt-1">View and manage customer accounts and order history.</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="admin-shell__card mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <form method="GET" action="/admin/customers" className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Search by email, name, phone, city..."
            className="admin-shell__input w-full sm:w-80"
          />
          {hasOrdersFilter && <input type="hidden" name="has_orders" value={hasOrdersFilter} />}
          <button type="submit" className="admin-shell__btn admin-shell__btn--secondary">
            Search
          </button>
        </form>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Orders:</span>
            <select
              name="has_orders"
              defaultValue={hasOrdersFilter}
              className="admin-shell__select admin-shell__select--sm"
              style={{ minWidth: "160px" }}
              onChange={(e) => {
                const params = new URLSearchParams(window.location.search);
                if (e.target.value) params.set("has_orders", e.target.value);
                else params.delete("has_orders");
                params.delete("page");
                window.location.href = `/admin/customers?${params.toString()}`;
              }}
            >
              <option value="">All Customers</option>
              <option value="yes">Has Orders</option>
              <option value="no">No Orders (Guests)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="admin-shell__card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-shell__table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Last Order</th>
                <th>First Seen</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-shell__empty">
                    <svg className="admin-shell__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <p>No customers found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.email} style={{ fontWeight: detailId && detail?.email === c.email ? "600" : "400" }}>
                    <td>
                      <div className="font-medium text-[var(--admin-text)]">{c.name || <span className="italic">Guest</span>}</div>
                      <div className="text-xs font-mono" style={{ color: "var(--admin-text-muted)" }}>{c.email}</div>
                    </td>
                    <td style={{ color: "var(--admin-text-muted)" }}>
                      {c.phone || <span className="italic">—</span>}
                    </td>
                    <td style={{ color: "var(--admin-text-muted)" }}>
                      {c.city || <span className="italic">—</span>}
                    </td>
                    <td className="font-mono text-[var(--admin-text)]">{c.order_count}</td>
                    <td className="font-mono text-[var(--admin-text)]">PKR {c.total_spent.toLocaleString()}</td>
                    <td style={{ color: "var(--admin-text-muted)" }}>
                      {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : <span className="italic">Never</span>}
                    </td>
                    <td style={{ color: "var(--admin-text-muted)" }}>
                      {new Date(c.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                        <Link
                          href={`/admin/customers?detail=${c.email}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}${hasOrdersFilter ? `&has_orders=${hasOrdersFilter}` : ""}${page > 1 ? `&page=${page}` : ""}`}
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
              Page {page} of {totalPages} — {totalCustomers.toLocaleString()} customers
            </div>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <a
                  href={`/admin/customers?page=${page - 1}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}${hasOrdersFilter ? `&has_orders=${hasOrdersFilter}` : ""}`}
                  className="admin-shell__btn admin-shell__btn--secondary admin-shell__btn--sm"
                >
                  Previous
                </a>
              )}
              {page < totalPages && (
                <a
                  href={`/admin/customers?page=${page + 1}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}${hasOrdersFilter ? `&has_orders=${hasOrdersFilter}` : ""}`}
                  className="admin-shell__btn admin-shell__btn--secondary admin-shell__btn--sm"
                >
                  Next
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {detail && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="admin-shell__card max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-[var(--admin-text)]">{detail.name || "Guest Customer"}</h2>
                <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>{detail.email}</p>
              </div>
              <Link
                href={`/admin/customers${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}${hasOrdersFilter ? `${searchQuery ? "&" : "?"}has_orders=${hasOrdersFilter}` : ""}${page > 1 ? `${(searchQuery || hasOrdersFilter) ? "&" : "?"}page=${page}` : ""}`}
                className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] text-xl font-medium"
              >
                ✕
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Summary Cards */}
              <div className="admin-shell__card p-4 lg:col-span-1" style={{ backgroundColor: "var(--admin-bg)" }}>
                <h3 className="font-semibold text-[var(--admin-text)] mb-3">Summary</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span style={{ color: "var(--admin-text-muted)" }}>Total Orders:</span>
                    <div className="font-mono text-[var(--admin-text)]">{detail.order_count}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)" }}>Total Spent:</span>
                    <div className="font-mono text-lg" style={{ color: "var(--admin-emerald)" }}>PKR {detail.total_spent.toLocaleString()}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)" }}>Average Order:</span>
                    <div className="font-mono text-[var(--admin-text)]">PKR {detail.order_count > 0 ? Math.round(detail.total_spent / detail.order_count).toLocaleString() : "0"}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)" }}>First Order:</span>
                    <div className="font-mono text-[var(--admin-text)]">{new Date(detail.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)" }}>Last Order:</span>
                    <div className="font-mono text-[var(--admin-text)]">{detail.last_order_at ? new Date(detail.last_order_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Never"}</div>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="admin-shell__card p-4 lg:col-span-1" style={{ backgroundColor: "var(--admin-bg)" }}>
                <h3 className="font-semibold text-[var(--admin-text)] mb-3">Contact</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span style={{ color: "var(--admin-text-muted)" }}>Email:</span>
                    <div className="font-mono text-[var(--admin-text)]">{detail.email}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)" }}>Phone:</span>
                    <div className="font-mono text-[var(--admin-text)]">{detail.phone || "—"}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)" }}>City:</span>
                    <div className="font-mono text-[var(--admin-text)]">{detail.city || "—"}</div>
                  </div>
                  <div>
                    <span style={{ color: "var(--admin-text-muted)" }}>Name:</span>
                    <div className="font-mono text-[var(--admin-text)]">{detail.name || "—"}</div>
                  </div>
                </div>
              </div>

              {/* Addresses */}
              <div className="admin-shell__card p-4 lg:col-span-1" style={{ backgroundColor: "var(--admin-bg)" }}>
                <h3 className="font-semibold text-[var(--admin-text)] mb-3">Addresses ({detail.addresses.length})</h3>
                <div className="space-y-3 text-sm max-h-64 overflow-y-auto">
                  {detail.addresses.length === 0 ? (
                    <p className="italic" style={{ color: "var(--admin-text-muted)" }}>No addresses on file</p>
                  ) : (
                    detail.addresses.map((addr) => (
                      <div key={addr.id} className="border-l-2 pl-3" style={{ borderColor: addr.is_default ? "var(--admin-crimson)" : "var(--admin-border)" }}>
                        <div className="font-medium text-[var(--admin-text)]">{addr.customer_name || detail.name || "Customer"}</div>
                        <div className="text-xs" style={{ color: "var(--admin-text-muted)" }}>{addr.address}</div>
                        <div className="text-xs font-mono" style={{ color: "var(--admin-text-muted)" }}>{addr.city}</div>
                        <div className="text-xs font-mono" style={{ color: "var(--admin-text-muted)" }}>{addr.phone}</div>
                        {addr.is_default && <span className="admin-shell__badge admin-shell__badge--primary text-xs mt-1">Default</span>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Order History */}
            <div className="admin-shell__card overflow-hidden">
              <h3 className="font-semibold text-[var(--admin-text)] mb-4 p-4 border-b" style={{ borderColor: "var(--admin-border)", margin: "0 -1.5rem 1.5rem" }}>Order History ({detail.orders.length})</h3>
              <div className="overflow-x-auto">
                <table className="admin-shell__table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Order Status</th>
                      <th>Payment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.orders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="admin-shell__empty">
                          <p>No orders placed yet.</p>
                        </td>
                      </tr>
                    ) : (
                      detail.orders.map((order) => (
                        <tr key={order.id}>
                          <td className="font-mono font-medium text-[var(--admin-text)]">{order.order_number}</td>
                          <td style={{ color: "var(--admin-text-muted)" }}>
                            {new Date(order.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="font-mono text-[var(--admin-text)]">{order.item_count}</td>
                          <td className="font-mono text-[var(--admin-text)]">PKR {order.total.toLocaleString()}</td>
                          <td>
                            <span className={`admin-shell__badge ${
                              order.order_status === "delivered" ? "admin-shell__badge--success"
                              : order.order_status === "cancelled" || order.order_status === "refunded" ? "admin-shell__badge--danger"
                              : order.order_status === "dispatched" || order.order_status === "in_transit" ? "admin-shell__badge--warning"
                              : "admin-shell__badge--neutral"
                            }`}>
                              {order.order_status.replace("_", " ")}
                            </span>
                          </td>
                          <td>
                            <span className={`admin-shell__badge ${
                              order.payment_status === "paid" ? "admin-shell__badge--success"
                              : order.payment_status === "rejected" ? "admin-shell__badge--danger"
                              : order.payment_status === "refunded" ? "admin-shell__badge--neutral"
                              : "admin-shell__badge--warning"
                            }`}>
                              {order.payment_status.replace("_", " ")}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}