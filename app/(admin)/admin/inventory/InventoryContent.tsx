"use client";

import { useAdjustStock } from "@/components/AdjustStockModal";
import Link from "next/link";

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

interface InventoryContentProps {
  searchQuery: string;
  categoryFilter: string;
  stockFilter: string;
  success?: string;
  categories: CategoryRow[];
  inventory: InventoryRow[];
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export function InventoryContent({
  searchQuery,
  categoryFilter,
  stockFilter,
  success,
  categories,
  inventory,
  totalProducts,
  lowStockCount,
  outOfStockCount,
}: InventoryContentProps) {
  const { openAdjustModal } = useAdjustStock();

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
            <span className="text-sm font-medium" style={{ color: "var(--admin-crimson)" }}>Inventory</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-[var(--admin-text)] tracking-tight">Inventory Management</h1>
          <p className="text-[var(--admin-text-muted)] text-sm mt-1">Monitor stock levels, adjust quantities, and manage product availability.</p>
        </div>
      </div>

      {/* Success Banner */}
      {success && (
        <div className="mb-6 admin-shell__card" style={{ backgroundColor: "var(--admin-emerald-subtle)", borderColor: "var(--admin-emerald-border)" }}>
          <span className="font-medium" style={{ color: "var(--admin-emerald)" }}>
            {success === "adjusted" && "Stock successfully adjusted."}
            {success === "availability" && "Availability successfully updated."}
          </span>
          <Link href="/admin/inventory" className="text-xs hover:underline" style={{ color: "var(--admin-emerald)" }}>Dismiss</Link>
        </div>
      )}

      {/* Summary Stats */}
      <section className="mb-8">
        <div className="admin-shell__stats-grid">
          <div className="admin-shell__stat">
            <div className="admin-shell__stat-label">Total Products</div>
            <div className="admin-shell__stat-value">{totalProducts.toLocaleString()}</div>
          </div>
          <div className="admin-shell__stat">
            <div className="admin-shell__stat-label">In Stock</div>
            <div className="admin-shell__stat-value" style={{ color: "var(--admin-emerald)" }}>{(totalProducts - lowStockCount - outOfStockCount).toLocaleString()}</div>
          </div>
          <div className="admin-shell__stat">
            <div className="admin-shell__stat-label">Low Stock (1-5)</div>
            <div className="admin-shell__stat-value" style={{ color: lowStockCount > 0 ? "var(--admin-amber)" : "var(--admin-text)" }}>{lowStockCount.toLocaleString()}</div>
          </div>
          <div className="admin-shell__stat">
            <div className="admin-shell__stat-label">Out of Stock</div>
            <div className="admin-shell__stat-value" style={{ color: outOfStockCount > 0 ? "var(--admin-crimson)" : "var(--admin-text)" }}>{outOfStockCount.toLocaleString()}</div>
          </div>
        </div>
      </section>

      {/* Filters and Search Bar */}
      <div className="admin-shell__card mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <form method="GET" action="/admin/inventory" className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Search products by name..."
            className="admin-shell__input w-full sm:w-80"
          />
          {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
          {stockFilter && <input type="hidden" name="stock" value={stockFilter} />}
          <button type="submit" className="admin-shell__btn admin-shell__btn--secondary">
            Search
          </button>
        </form>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-wrap">
          {/* Category filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            <Link
              href={`/admin/inventory${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}${stockFilter ? `${searchQuery ? "&" : "?"}stock=${stockFilter}` : ""}`}
              className={`admin-shell__btn admin-shell__btn--sm whitespace-nowrap ${!categoryFilter ? "admin-shell__btn--primary" : ""}`}
            >
              All Categories
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/admin/inventory?category=${c.slug}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}${stockFilter ? `&stock=${stockFilter}` : ""}`}
                className={`admin-shell__btn admin-shell__btn--sm whitespace-nowrap ${categoryFilter === c.slug ? "admin-shell__btn--primary" : ""}`}
              >
                {c.name}
              </Link>
            ))}
          </div>

          {/* Stock filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Stock:</span>
            <select
              name="stock"
              defaultValue={stockFilter}
              className="admin-shell__select admin-shell__select--sm"
              style={{ minWidth: "140px" }}
              onChange={(e) => {
                const params = new URLSearchParams(window.location.search);
                if (e.target.value) params.set("stock", e.target.value);
                else params.delete("stock");
                window.location.href = `/admin/inventory?${params.toString()}`;
              }}
            >
              <option value="">All Stock</option>
              <option value="in">In Stock (6+)</option>
              <option value="low">Low Stock (1-5)</option>
              <option value="out">Out of Stock (0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
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
                <th>Restockable</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {inventory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="admin-shell__empty">
                    <svg className="admin-shell__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                      <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p>No products found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                inventory.map((p) => (
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
                      {p.compare_at_price && p.compare_at_price > p.price && (
                        <span className="ml-2 text-xs text-decoration-line-through" style={{ color: "var(--admin-text-muted)" }}>
                          PKR {p.compare_at_price.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="font-mono">
                      <span className={p.stock === 0 ? "font-bold" : p.stock <= 5 ? "font-semibold" : ""} style={{
                        color: p.stock === 0 ? "var(--admin-crimson)" : p.stock <= 5 ? "var(--admin-amber)" : "var(--admin-text)"
                      }}>
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
                            : p.stock <= 5
                            ? "admin-shell__badge--warning"
                            : "admin-shell__badge--success"
                        }`}
                      >
                        {p.stock === 0 ? "Out of Stock" : p.availability}
                      </span>
                    </td>
                    <td>
                      <span className={`admin-shell__badge ${p.restockable ? "admin-shell__badge--success" : "admin-shell__badge--neutral"}`}>
                        {p.restockable ? "Yes" : "No"}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                        {/* Adjust Stock Modal Trigger */}
                        <button
                          type="button"
                          onClick={() => openAdjustModal(p)}
                          className="text-sm font-medium hover:underline" style={{ color: "var(--admin-text-muted)" }}
                        >
                          Adjust
                        </button>
                        {/* Availability Form */}
                        <form action="/admin/inventory/actions" method="POST" className="inline">
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="action" value="setAvailability" />
                          <select
                            name="availability"
                            defaultValue={p.availability}
                            className="admin-shell__select admin-shell__select--sm"
                            style={{ minWidth: "130px" }}
                            onChange={(e) => e.currentTarget.form?.requestSubmit?.()}
                          >
                            <option value="available">Available</option>
                            <option value="sold_out">Sold Out</option>
                            <option value="exclusive">Exclusive</option>
                            <option value="archived">Archived</option>
                          </select>
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