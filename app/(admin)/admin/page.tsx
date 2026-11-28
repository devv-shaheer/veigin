import { verifySession } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { fetchRecentProducts, fetchDashboardStats } from "@/lib/admin/dashboard";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Overview · Admin Panel",
  description: "VEIGIN admin dashboard overview",
  robots: {
    index: false,
    follow: false,
  },
} as const;

export default async function AdminPage() {
  const session = await verifySession();
  if (!session) redirect("/admin/login");

  let adminEmail = "N/A"; // Default or fallback if email isn't found
  const users = await query<{ email: string }>(
    "SELECT email FROM admin_users WHERE id = ? LIMIT 1",
    [session.adminId]
  );
  if (users.length > 0) {
    adminEmail = users[0].email;
  }

  const [recentProducts, stats] = await Promise.all([
    fetchRecentProducts(),
    fetchDashboardStats(),
  ]);

  const totalProducts = stats.products;
  const totalOrders = stats.pendingOrders;

  // Fetch categories count separately or include in fetchDashboardStats
  const categoriesResult = await query<{ count: number }>("SELECT COUNT(*) as count FROM categories");
  const totalCategories = categoriesResult[0]?.count ?? 0;

  const lowStockCount = stats.lowStock;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page heading */}
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-semibold text-[var(--admin-text)] mb-2 tracking-tight">
          Overview
        </h1>
        <p className="text-[var(--admin-text-muted)] text-base max-w-2xl">
          Welcome to the VEIGIN admin dashboard. Manage your products, orders, and store settings from here.
        </p>
      </header>

      {/* Summary stats cards */}
      <section className="mb-8">
        <div className="admin-shell__stats-grid">
          <div className="admin-shell__stat">
            <div className="admin-shell__stat-label">Total Products</div>
            <div className="admin-shell__stat-value">{totalProducts.toLocaleString()}</div>
          </div>
          <div className="admin-shell__stat">
            <div className="admin-shell__stat-label">Active Orders</div>
            <div className="admin-shell__stat-value">{totalOrders.toLocaleString()}</div>
          </div>
          <div className="admin-shell__stat">
            <div className="admin-shell__stat-label">Categories</div>
            <div className="admin-shell__stat-value">{totalCategories.toLocaleString()}</div>
          </div>
          <div className="admin-shell__stat">
            <div className="admin-shell__stat-label">Low Stock Items</div>
            <div className={`admin-shell__stat-value ${lowStockCount > 0 ? '' : 'admin-shell__stat-value--placeholder'}`}>
              {lowStockCount > 0 ? lowStockCount.toLocaleString() : '—'}
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
          <div className="admin-shell__actions">
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
            <span className="admin-shell__btn admin-shell__btn--ghost" style={{ pointerEvents: 'none' }}>
              Manage Orders (Coming Soon)
            </span>
          </div>
        </div>
      </section>

      {/* Recent products / activity */}
      <section>
        <div className="admin-shell__card">
          <div className="admin-shell__card-header">
            <h2 className="admin-shell__card-title">Recent Products</h2>
            <p className="admin-shell__card-desc">Latest products added to your catalog</p>
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
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentProducts.map((p) => (
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
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        href={`/admin/products?edit=${p.id}`}
                        className="text-sm font-medium hover:underline" style={{ color: "var(--admin-text-muted)" }}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}