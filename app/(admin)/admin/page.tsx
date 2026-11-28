import { verifySession } from "@/lib/admin-auth";
import { query } from "@/lib/db";
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
  // Get the admin email from the session
  const session = await verifySession();
  let adminEmail = "admin@veigin.pk";

  // Fetch real metrics from database
  const [productsResult, ordersResult, categoriesResult] = await Promise.all([
    query<{ count: number }>("SELECT COUNT(*) as count FROM products WHERE availability <> 'archived'"),
    query<{ count: number }>("SELECT COUNT(*) as count FROM orders"),
    query<{ count: number }>("SELECT COUNT(*) as count FROM categories"),
  ]);

  const totalProducts = productsResult[0]?.count ?? 0;
  const totalOrders = ordersResult[0]?.count ?? 0;
  const totalCategories = categoriesResult[0]?.count ?? 0;

  // Fetch low stock products count
  const lowStockResult = await query<{ count: number }>(
    "SELECT COUNT(*) as count FROM products WHERE stock > 0 AND stock <= 5 AND availability <> 'archived'"
  );
  const lowStockCount = lowStockResult[0]?.count ?? 0;

  if (session) {
    const users = await query<{ email: string }>(
      "SELECT email FROM admin_users WHERE id = ? LIMIT 1",
      [session.adminId]
    );
    if (users.length > 0) {
      adminEmail = users[0].email;
    }
  }

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
            <div className="admin-shell__stat-value {lowStockCount > 0 ? '' : 'admin-shell__stat-value--placeholder'}">
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
                {/*
                  Fetch recent products for display
                */}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}