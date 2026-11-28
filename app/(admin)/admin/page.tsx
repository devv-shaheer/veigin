import { verifySession } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { fetchRecentProducts, fetchDashboardStats } from "@/lib/admin/dashboard";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LOGIN_PATH } from "@/lib/admin-paths";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Overview · Admin Panel",
  description: "VEIGIN admin dashboard overview",
  robots: {
    index: false,
    follow: false,
  },
} as const;

type RecentOrder = {
  id: number;
  order_number: string;
  customer_name: string;
  email: string;
  total: number;
  order_status: string;
  payment_status: string;
  created_at: string;
};

async function fetchRecentOrders(): Promise<RecentOrder[]> {
  return query<RecentOrder>(
    `SELECT id, order_number, customer_name, email, total, order_status, payment_status, created_at
     FROM orders
     ORDER BY created_at DESC
     LIMIT 5`
  );
}

export default async function AdminPage() {
  const session = await verifySession();
  if (!session) redirect(LOGIN_PATH);

  let adminEmail = "N/A"; // Default or fallback if email isn't found
  const users = await query<{ email: string }>(
    "SELECT email FROM admin_users WHERE id = ? LIMIT 1",
    [session.adminId]
  );
  if (users.length > 0) {
    adminEmail = users[0].email;
  }

  const [recentProducts, stats, recentOrders, categoriesResult] = await Promise.all([
    fetchRecentProducts(),
    fetchDashboardStats(),
    fetchRecentOrders(),
    query<{ count: number }>("SELECT COUNT(*) as count FROM categories"),
  ]);

  const totalProducts = stats.products;
  const totalCategories = categoriesResult[0]?.count ?? 0;
  const lowStockCount = stats.lowStock;

  // Count total orders (all statuses)
  const totalOrdersResult = await query<{ count: number }>("SELECT COUNT(*) as count FROM orders");
  const totalOrders = totalOrdersResult[0]?.count ?? 0;

  // Count pending orders (awaiting_payment + placed/processing)
  const pendingOrdersResult = await query<{ count: number }>(
    `SELECT COUNT(*) as count FROM orders
     WHERE payment_status = 'awaiting_payment'
        OR order_status IN ('placed', 'processing')`
  );
  const pendingOrders = pendingOrdersResult[0]?.count ?? 0;

  // Count orders needing attention (cancellation_requested, replacement_requested)
  const attentionOrdersResult = await query<{ count: number }>(
    `SELECT COUNT(*) as count FROM orders
     WHERE order_status IN ('cancellation_requested', 'replacement_requested')`
  );
  const attentionOrders = attentionOrdersResult[0]?.count ?? 0;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page heading */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-semibold text-[var(--admin-text)] mb-2 tracking-tight">
              Overview
            </h1>
            <p className="text-[var(--admin-text-muted)] text-base max-w-2xl">
              Welcome back, {adminEmail}. Here&apos;s what&apos;s happening with your store.
            </p>
          </div>
        </div>
      </header>

      {/* Summary stats cards */}
      <section className="mb-8">
        <div className="admin-shell__stats-grid">
          <div className="admin-shell__stat">
            <div className="admin-shell__stat-label">Total Products</div>
            <div className="admin-shell__stat-value">{totalProducts.toLocaleString()}</div>
          </div>
          <div className="admin-shell__stat">
            <div className="admin-shell__stat-label">Total Orders</div>
            <div className="admin-shell__stat-value">{totalOrders.toLocaleString()}</div>
          </div>
          <div className="admin-shell__stat">
            <div className="admin-shell__stat-label">Pending Attention</div>
            <div className="admin-shell__stat-value" style={{ color: attentionOrders > 0 ? "var(--admin-amber)" : "var(--admin-text)" }}>
              {pendingOrders.toLocaleString()}
              {attentionOrders > 0 && <span className="admin-shell__badge admin-shell__badge--warning ml-2 text-xs">{attentionOrders} need review</span>}
            </div>
          </div>
          <div className="admin-shell__stat">
            <div className="admin-shell__stat-label">Categories</div>
            <div className="admin-shell__stat-value">{totalCategories.toLocaleString()}</div>
          </div>
          <div className="admin-shell__stat">
            <div className="admin-shell__stat-label">Low Stock Items</div>
            <div className={`admin-shell__stat-value ${lowStockCount > 0 ? '' : 'admin-shell__stat-value--placeholder'}`} style={{ color: lowStockCount > 0 ? "var(--admin-amber)" : "var(--admin-text)" }}>
              {lowStockCount > 0 ? lowStockCount.toLocaleString() : '—'}
              {lowStockCount > 0 && <span className="admin-shell__badge admin-shell__badge--warning ml-2 text-xs">Restock needed</span>}
            </div>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="mb-8">
        <div className="admin-shell__card">
          <div className="admin-shell__card-header">
            <h2 className="admin-shell__card-title">Quick Actions</h2>
            <p className="admin-shell__card-desc">Common tasks to manage your store</p>
          </div>
          <div className="admin-shell__actions flex flex-wrap gap-3">
            <Link
              href="/admin/products?action=new"
              className="admin-shell__btn admin-shell__btn--primary"
            >
              + Add Product
            </Link>
            <Link
              href="/admin/products"
              className="admin-shell__btn admin-shell__btn--secondary"
            >
              View All Products
            </Link>
            <Link
              href="/admin/orders"
              className="admin-shell__btn admin-shell__btn--secondary"
            >
              Manage Orders
            </Link>
            <Link
              href="/admin/inventory"
              className="admin-shell__btn admin-shell__btn--ghost"
            >
              Check Inventory
            </Link>
            <Link
              href="/admin/customers"
              className="admin-shell__btn admin-shell__btn--ghost"
            >
              View Customers
            </Link>
            <Link
              href="/admin/discounts"
              className="admin-shell__btn admin-shell__btn--ghost"
            >
              Discount Codes
            </Link>
          </div>
        </div>
      </section>

      {/* Recent activity - split into two columns */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Products */}
        <div className="admin-shell__card">
          <div className="admin-shell__card-header flex flex-row items-center justify-between">
            <div>
              <h2 className="admin-shell__card-title">Recent Products</h2>
              <p className="admin-shell__card-desc">Latest products added to your catalog</p>
            </div>
            <Link href="/admin/products" className="text-sm font-medium hover:underline" style={{ color: "var(--admin-crimson)" }}>
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="admin-shell__table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="admin-shell__empty">
                      <p>No products yet. <Link href="/admin/products?action=new" className="underline hover:no-underline" style={{ color: "var(--admin-crimson)" }}>Add your first product</Link>.</p>
                    </td>
                  </tr>
                ) : (
                  recentProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="font-medium text-[var(--admin-text)]">{p.name}</div>
                        <div className="text-xs font-mono" style={{ color: "var(--admin-text-muted)" }}>/ {p.slug}</div>
                      </td>
                      <td style={{ color: "var(--admin-text-muted)" }}>
                        {p.category_name || <span className="italic">Unassigned</span>}
                      </td>
                      <td className="font-mono text-[var(--admin-text)]">PKR {p.price.toLocaleString()}</td>
                      <td className="font-mono">
                        <span className={p.stock === 0 ? "font-bold" : ""} style={{ color: p.stock === 0 ? "var(--admin-crimson)" : "var(--admin-text)" }}>
                          {p.stock}
                        </span>
                      </td>
                      <td>
                        <span className={`admin-shell__badge ${
                          p.stock === 0 || p.availability === "sold_out"
                            ? "admin-shell__badge--danger"
                            : p.availability === "exclusive"
                            ? "admin-shell__badge--warning"
                            : "admin-shell__badge--success"
                        }`}
                        >
                          {p.stock === 0 ? "Sold Out" : p.availability}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="admin-shell__card">
          <div className="admin-shell__card-header flex flex-row items-center justify-between">
            <div>
              <h2 className="admin-shell__card-title">Recent Orders</h2>
              <p className="admin-shell__card-desc">Latest customer orders</p>
            </div>
            <Link href="/admin/orders" className="text-sm font-medium hover:underline" style={{ color: "var(--admin-crimson)" }}>
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="admin-shell__table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Order Status</th>
                  <th>Payment</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="admin-shell__empty">
                      <p>No orders yet. Orders will appear here when customers place them.</p>
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td className="font-mono font-medium text-[var(--admin-text)]">{o.order_number}</td>
                      <td>
                        <div className="font-medium text-[var(--admin-text)]">{o.customer_name}</div>
                        <div className="text-xs font-mono" style={{ color: "var(--admin-text-muted)" }}>{o.email}</div>
                      </td>
                      <td className="font-mono text-[var(--admin-text)]">PKR {o.total.toLocaleString()}</td>
                      <td>
                        <span className={`admin-shell__badge ${
                          o.order_status === "delivered" ? "admin-shell__badge--success"
                          : o.order_status === "cancelled" || o.order_status === "refunded" ? "admin-shell__badge--danger"
                          : o.order_status === "dispatched" || o.order_status === "in_transit" ? "admin-shell__badge--warning"
                          : o.order_status === "cancellation_requested" || o.order_status === "replacement_requested" ? "admin-shell__badge--warning"
                          : "admin-shell__badge--neutral"
                        }`}>
                          {o.order_status.replace("_", " ")}
                        </span>
                      </td>
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
                      <td style={{ color: "var(--admin-text-muted)" }}>
                        {new Date(o.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}