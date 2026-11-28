import { query } from "@/lib/db";

export type RecentProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  availability: string;
  category_name: string | null;
};

export type DashboardStats = {
  products: number;
  lowStock: number;
  pendingOrders: number;
};

// Unlike the storefront helpers, these do NOT catch errors.
// If the DB breaks, the admin should see it, not an empty list.

export async function fetchRecentProducts(limit = 5): Promise<RecentProduct[]> {
  const rows = await query<{
    id: number;
    name: string;
    slug: string;
    price: number;
    stock: number;
    availability: string;
    category_name: string | null;
  }>(
    "SELECT p.id, p.name, p.slug, p.price, p.stock, p.availability, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.availability <> 'archived' ORDER BY p.id DESC LIMIT ?",
    [limit]
  );
  return rows.map((r) => ({
    id: Number(r.id),
    name: r.name,
    slug: r.slug,
    price: Number(r.price),
    stock: Number(r.stock),
    availability: r.availability,
    category_name: r.category_name,
  }));
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const p = await query<{ total: number; low: number }>(
    "SELECT COUNT(*) AS total, SUM(CASE WHEN stock BETWEEN 1 AND 5 THEN 1 ELSE 0 END) AS low FROM products"
  );
  const o = await query<{ pending: number }>(
    "SELECT COUNT(*) AS pending FROM orders WHERE order_status = 'pending'"
  );
  return {
    products: Number(p[0]?.total ?? 0),
    lowStock: Number(p[0]?.low ?? 0),
    pendingOrders: Number(o[0]?.pending ?? 0),
  };
}