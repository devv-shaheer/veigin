import { verifySession } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import ProductFilters from "@/components/ProductFilters";
import DeleteProductButton from "@/components/DeleteProductButton";
import { LOGIN_PATH } from "@/lib/admin-paths";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Product Management · Admin Panel",
  description: "Manage Veigin products, stock, and pricing",
  robots: { index: false, follow: false },
};

type ProductAdminRow = {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  availability: string;
  category_name: string | null;
  category_id: number | null;
  media: string | null;
  compare_at_price: number | null;
  description: string | null;
};

type CategoryRow = {
  id: number;
  name: string;
  slug: string;
};

// Server Actions for Product CRUD
async function createProductAction(formData: FormData) {
  "use server";
  const session = await verifySession();
  if (!session) throw new Error("Unauthorized");

  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const price = parseInt(formData.get("price") as string, 10);
  const stock = parseInt(formData.get("stock") as string, 10) || 0;
  const categoryId = formData.get("category_id") ? parseInt(formData.get("category_id") as string, 10) : null;
  const availability = (formData.get("availability") as string) || "available";
  const imageUrl = (formData.get("image_url") as string)?.trim() || null;

  if (!name || isNaN(price) || price < 0) {
    throw new Error("Invalid product name or price.");
  }

  // Generate unique slug
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!baseSlug) baseSlug = "product";

  let slug = baseSlug;
  let counter = 1;
  for (;;) {
    const existing = await query("SELECT id FROM products WHERE slug = ? LIMIT 1", [slug]);
    if (existing.length === 0) break;
    slug = `${baseSlug}-${counter++}`;
  }

  const media = imageUrl
    ? JSON.stringify([{ url: imageUrl, alt: name, type: "image" }])
    : null;

  await query(
    `INSERT INTO products (name, slug, description, price, stock, category_id, availability, media, show_on_home, home_x, home_y, home_rot)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 50.00, 50.00, 0.00)`,
    [name, slug, description, price, stock, categoryId, availability, media]
  );

  revalidatePath("/products");
  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products?success=created");
}

async function updateProductAction(formData: FormData) {
  "use server";
  const session = await verifySession();
  if (!session) throw new Error("Unauthorized");

  const id = parseInt(formData.get("id") as string, 10);
  const name = (formData.get("name") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const price = parseInt(formData.get("price") as string, 10);
  const stock = parseInt(formData.get("stock") as string, 10) || 0;
  const categoryId = formData.get("category_id") ? parseInt(formData.get("category_id") as string, 10) : null;
  const availability = (formData.get("availability") as string) || "available";
  const imageUrl = (formData.get("image_url") as string)?.trim() || null;

  if (!id || !name || isNaN(price) || price < 0) {
    throw new Error("Invalid product details.");
  }

  // Generate unique slug if name changed or no slug exists
  let slug = formData.get("slug") as string | null;
  if (!slug || slug === "") {
    // Regenerate from name
    let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!baseSlug) baseSlug = "product";
    let candidate = baseSlug;
    let counter = 1;
    for (;;) {
      const existing = await query("SELECT id FROM products WHERE slug = ? AND id != ? LIMIT 1", [candidate, id]);
      if (existing.length === 0) break;
      candidate = `${baseSlug}-${counter++}`;
    }
    slug = candidate;
  }

  const media = imageUrl
    ? JSON.stringify([{ url: imageUrl, alt: name, type: "image" }])
    : null;

  if (media) {
    await query(
      `UPDATE products SET name = ?, description = ?, slug = ?, price = ?, stock = ?, category_id = ?, availability = ?, media = ? WHERE id = ?`,
      [name, description, slug, price, stock, categoryId, availability, media, id]
    );
  } else {
    await query(
      `UPDATE products SET name = ?, description = ?, slug = ?, price = ?, stock = ?, category_id = ?, availability = ? WHERE id = ?`,
      [name, description, slug, price, stock, categoryId, availability, id]
    );
  }

  revalidatePath("/products");
  revalidatePath(`/products/[slug]`, "page");
  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products?success=updated");
}

async function deleteProductAction(formData: FormData) {
  "use server";
  const session = await verifySession();
  if (!session) throw new Error("Unauthorized");

  const id = parseInt(formData.get("id") as string, 10);
  if (!id) throw new Error("Invalid product ID.");

  // Check if product is referenced in order_items
  const ordersRef = await query<{ count: number }>(
    `SELECT COUNT(*) as count FROM order_items WHERE product_id = ?`,
    [id]
  );

  const hasOrders = ordersRef[0]?.count > 0;

  if (hasOrders) {
    // Archive instead of destructive delete
    await query(`UPDATE products SET availability = 'archived', stock = 0, show_on_home = 0 WHERE id = ?`, [id]);
  } else {
    // Safe to delete
    await query(`DELETE FROM products WHERE id = ?`, [id]);
  }

  revalidatePath("/products");
  revalidatePath("/admin/products");
  revalidatePath("/");
  redirect("/admin/products?success=deleted");
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; stock?: string; status?: string; sort?: string; success?: string; edit?: string; action?: string }>;
}) {
  const session = await verifySession();
  if (!session) redirect(LOGIN_PATH);

  const params = await searchParams;
  const searchQuery = params.q || "";
  const categoryFilter = params.category || "";
  const stockFilter = params.stock || "";
  const statusFilter = params.status || "";
  const sortBy = params.sort || "newest";
  const editId = params.edit ? parseInt(params.edit, 10) : null;
  const isCreating = params.action === "new";

  // Fetch categories
  const categories = await query<CategoryRow>("SELECT id, name, slug FROM categories ORDER BY sort_order, name");

  // Build products query
  let sql = `
    SELECT p.id, p.name, p.slug, p.price, p.stock, p.availability,
           c.name AS category_name, c.id AS category_id, p.media, p.compare_at_price, p.created_at
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

  // Status filters (is_active/is_hidden via availability and show_on_home)
  if (statusFilter === "active") {
    sql += ` AND p.availability = 'available' AND p.show_on_home = 1`;
  } else if (statusFilter === "hidden") {
    sql += ` AND (p.availability <> 'available' OR p.show_on_home = 0)`;
  }

  // Sorting
  const sortMap: Record<string, string> = {
    newest: "p.id DESC",
    oldest: "p.id ASC",
    name_asc: "p.name ASC",
    name_desc: "p.name DESC",
    price_asc: "p.price ASC",
    price_desc: "p.price DESC",
    stock_asc: "p.stock ASC",
    stock_desc: "p.stock DESC",
  };
  sql += ` ORDER BY ${sortMap[sortBy] || sortMap.newest}`;

  const products = await query<ProductAdminRow>(sql, queryParams);

  // Fetch product to edit if requested
  let editProduct: ProductAdminRow | null = null;
  if (editId) {
    const editRows = await query<ProductAdminRow>(
      `SELECT id, name, slug, price, stock, availability, category_id, media, compare_at_price, description FROM products WHERE id = ?`,
      [editId]
    );
    editProduct = editRows[0] || null;
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
            <span className="text-sm font-medium" style={{ color: "var(--admin-crimson)" }}>Products</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-[var(--admin-text)] tracking-tight">Product Management</h1>
          <p className="text-[var(--admin-text-muted)] text-sm mt-1">Manage catalog items, pricing, inventory stock, and availability.</p>
        </div>
        <div>
          <Link
            href="/admin/products?action=new"
            className="admin-shell__btn admin-shell__btn--primary"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {/* Success Banner */}
      {params.success && (
        <div className="mb-6 admin-shell__card border-crimson-border" style={{ backgroundColor: "var(--admin-crimson-subtle)" }}>
          <span className="font-medium" style={{ color: "var(--admin-crimson)" }}>
            {params.success === "created" && "Product successfully created."}
            {params.success === "updated" && "Product successfully updated."}
            {params.success === "deleted" && "Product successfully removed or archived."}
          </span>
          <Link href="/admin/products" className="text-xs hover:underline" style={{ color: "var(--admin-crimson)" }}>Dismiss</Link>
        </div>
      )}

      {/* Modal / Form Overlay for Create or Edit */}
      {(isCreating || editProduct) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="admin-shell__card admin-shell__login-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[var(--admin-text)]">
                {isCreating ? "Add New Product" : `Edit Product: ${editProduct?.name}`}
              </h2>
              <Link href="/admin/products" className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] text-xl font-medium">✕</Link>
            </div>

            <form action={isCreating ? createProductAction : updateProductAction} className="space-y-5">
              {!isCreating && editProduct && (
                <>
                  <input type="hidden" name="id" value={editProduct.id} />
                  <input type="hidden" name="slug" value={editProduct.slug} />
                </>
              )}

              <div className="admin-shell__form-group">
                <label className="admin-shell__label">Product Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editProduct?.name || ""}
                  required
                  className="admin-shell__input"
                  placeholder="e.g. Obsidian Signet Ring"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="admin-shell__form-group">
                  <label className="admin-shell__label">Price (PKR)</label>
                  <input
                    type="number"
                    name="price"
                    defaultValue={editProduct?.price || ""}
                    required
                    min="0"
                    className="admin-shell__input"
                    placeholder="1500"
                  />
                </div>
                <div className="admin-shell__form-group">
                  <label className="admin-shell__label">Stock Quantity</label>
                  <input
                    type="number"
                    name="stock"
                    defaultValue={editProduct?.stock ?? 10}
                    required
                    min="0"
                    className="admin-shell__input"
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="admin-shell__form-group">
                  <label className="admin-shell__label">Category</label>
                  <select
                    name="category_id"
                    defaultValue={editProduct?.category_id || ""}
                    className="admin-shell__select"
                  >
                    <option value="">(No Category)</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-shell__form-group">
                  <label className="admin-shell__label">Availability Status</label>
                  <select
                    name="availability"
                    defaultValue={editProduct?.availability || "available"}
                    className="admin-shell__select"
                  >
                    <option value="available">Available</option>
                    <option value="sold_out">Sold Out</option>
                    <option value="exclusive">Exclusive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="admin-shell__form-group">
                <label className="admin-shell__label">Image URL (Optional)</label>
                <input
                  type="text"
                  name="image_url"
                  defaultValue={
                    editProduct?.media
                      ? (() => {
                          try {
                            const parsed = JSON.parse(editProduct.media);
                            return Array.isArray(parsed) && parsed[0]?.url ? parsed[0].url : "";
                          } catch {
                            return "";
                          }
                        })()
                      : ""
                  }
                  className="admin-shell__input"
                  placeholder="https://..."
                />
                <p className="text-xs mt-1" style={{ color: "var(--admin-text-muted)" }}>Leave blank to use the default gothic PHOTO placeholder.</p>
              </div>

              <div className="admin-shell__form-group">
                <label className="admin-shell__label">Description</label>
                <textarea
                  name="description"
                  defaultValue={editProduct?.description || ""}
                  rows={3}
                  className="admin-shell__textarea"
                  placeholder="Product build details and gothic background..."
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: "var(--admin-border)" }}>
                <Link
                  href="/admin/products"
                  className="admin-shell__btn admin-shell__btn--secondary"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  className="admin-shell__btn admin-shell__btn--primary"
                >
                  {isCreating ? "Create Product" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <ProductFilters
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        stockFilter={stockFilter}
        statusFilter={statusFilter}
        sortBy={sortBy}
        categories={categories}
      />

      {/* Products Table */}
      <div className="admin-shell__card overflow-hidden">
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
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-shell__empty">
                    <svg className="admin-shell__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p>No products found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="font-medium text-[var(--admin-text)]">{p.name}</div>
                      <div className="text-xs font-mono" style={{ color: "var(--admin-text-muted)" }}>/{p.slug}</div>
                    </td>
                    <td style={{ color: "var(--admin-text-muted)" }}>
                      {p.category_name || <span className="italic">Unassigned</span>}
                    </td>
                    <td className="font-mono text-[var(--admin-text)]">
                      PKR {p.price.toLocaleString()}
                    </td>
                    <td className="font-mono">
                      <span className={p.stock === 0 ? "font-bold" : ""} style={{ color: p.stock === 0 ? "var(--admin-crimson)" : "var(--admin-text)" }}>
                        {p.stock}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`admin-shell__badge ${
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
                      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                        <Link
                          href={`/admin/products?edit=${p.id}`}
                          className="text-sm font-medium hover:underline" style={{ color: "var(--admin-text-muted)" }}
                        >
                          Edit
                        </Link>
                        <form action={deleteProductAction} method="POST" className="inline" data-product-id={p.id}>
                          <input type="hidden" name="id" value={p.id} />
                          <DeleteProductButton
                            productId={p.id}
                            productName={p.name}
                          />
                        </form>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}