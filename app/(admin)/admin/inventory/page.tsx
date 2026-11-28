import { verifySession } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LOGIN_PATH } from "@/lib/admin-paths";
import { AdjustStockProvider } from "@/components/AdjustStockModal";
import { InventoryContent } from "./InventoryContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Inventory Management · Admin Panel",
  description: "Manage product stock levels and availability",
  robots: { index: false, follow: false },
};

type InventoryRow = {
  id: number;
  name: string;
  slug: string;
  stock: number;
  availability: string;
  restockable: boolean;
  price: number;
  compare_at_price: number | null;
  category_name: string | null;
  category_slug: string | null;
};

type CategoryRow = {
  id: number;
  name: string;
  slug: string;
};

// Server Actions for Inventory Management
async function adjustStockAction(formData: FormData) {
  "use server";
  const session = await verifySession();
  if (!session) throw new Error("Unauthorized");

  const id = parseInt(formData.get("id") as string, 10);
  const adjustment = parseInt(formData.get("adjustment") as string, 10);
  const reason = (formData.get("reason") as string)?.trim() || "Manual adjustment";

  if (!id || isNaN(adjustment)) {
    throw new Error("Invalid product ID or adjustment value.");
  }

  const product = await query<{ stock: number }>(
    "SELECT stock FROM products WHERE id = ? AND availability <> 'archived' LIMIT 1",
    [id]
  );

  if (product.length === 0) {
    throw new Error("Product not found or archived.");
  }

  const newStock = Math.max(0, product[0].stock + adjustment);
  const newAvailability = newStock === 0 ? "sold_out" : "available";

  await query(
    `UPDATE products SET stock = ?, availability = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [newStock, newAvailability, id]
  );

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/admin/inventory?success=adjusted");
}

async function setAvailabilityAction(formData: FormData) {
  "use server";
  const session = await verifySession();
  if (!session) throw new Error("Unauthorized");

  const id = parseInt(formData.get("id") as string, 10);
  const availability = (formData.get("availability") as string) || "available";

  if (!id) throw new Error("Invalid product ID.");

  const validAvailabilities = ["available", "sold_out", "exclusive", "archived"];
  if (!validAvailabilities.includes(availability)) {
    throw new Error("Invalid availability status.");
  }

  await query(
    `UPDATE products SET availability = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [availability, id]
  );

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/admin/inventory?success=availability");
}

async function fetchInventoryData({
  searchQuery,
  categoryFilter,
  stockFilter,
}: {
  searchQuery: string;
  categoryFilter: string;
  stockFilter: string;
}) {
  // Fetch categories
  const categories = await query<CategoryRow>("SELECT id, name, slug FROM categories ORDER BY sort_order, name");

  // Build inventory query
  let sql = `
    SELECT p.id, p.name, p.slug, p.stock, p.availability, p.restockable,
           p.price, p.compare_at_price, c.name AS category_name, c.slug AS category_slug
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.availability <> 'archived'
  `;
  const queryParams: (string | number)[] = [];

  if (searchQuery) {
    sql += ` AND (p.name LIKE ? OR p.slug LIKE ?)`;
    queryParams.push(`%${searchQuery}%`, `%${searchQuery}%`);
  }

  if (categoryFilter) {
    sql += ` AND c.slug = ?`;
    queryParams.push(categoryFilter);
  }

  // Stock filters
  if (stockFilter === "low") {
    sql += ` AND p.stock > 0 AND p.stock <= 5`;
  } else if (stockFilter === "out") {
    sql += ` AND p.stock = 0`;
  } else if (stockFilter === "in") {
    sql += ` AND p.stock > 5`;
  }

  sql += ` ORDER BY p.stock ASC, p.name ASC`;

  const inventory = await query<InventoryRow>(sql, queryParams);

  // Summary stats
  const [totalResult, lowStockResult, outOfStockResult] = await Promise.all([
    query<{ count: number }>("SELECT COUNT(*) as count FROM products WHERE availability <> 'archived'"),
    query<{ count: number }>("SELECT COUNT(*) as count FROM products WHERE stock > 0 AND stock <= 5 AND availability <> 'archived'"),
    query<{ count: number }>("SELECT COUNT(*) as count FROM products WHERE stock = 0 AND availability <> 'archived'"),
  ]);

  const totalProducts = totalResult[0]?.count ?? 0;
  const lowStockCount = lowStockResult[0]?.count ?? 0;
  const outOfStockCount = outOfStockResult[0]?.count ?? 0;

  return {
    categories,
    inventory,
    totalProducts,
    lowStockCount,
    outOfStockCount,
  };
}

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; stock?: string; success?: string }>;
}) {
  const session = await verifySession();
  if (!session) redirect(LOGIN_PATH);

  const params = await searchParams;
  const searchQuery = params.q || "";
  const categoryFilter = params.category || "";
  const stockFilter = params.stock || "";

  const { categories, inventory, totalProducts, lowStockCount, outOfStockCount } = await fetchInventoryData({
    searchQuery,
    categoryFilter,
    stockFilter,
  });

  return (
    <AdjustStockProvider inventory={inventory}>
      <InventoryContent
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        stockFilter={stockFilter}
        success={params.success}
        categories={categories}
        inventory={inventory}
        totalProducts={totalProducts}
        lowStockCount={lowStockCount}
        outOfStockCount={outOfStockCount}
      />
    </AdjustStockProvider>
  );
}