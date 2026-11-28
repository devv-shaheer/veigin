"use client";

import Link from "next/link";

interface ProductFiltersProps {
  searchQuery: string;
  categoryFilter: string;
  stockFilter: string;
  statusFilter: string;
  sortBy: string;
  categories: { id: number; name: string; slug: string }[];
}

export default function ProductFilters({
  searchQuery,
  categoryFilter,
  stockFilter,
  statusFilter,
  sortBy,
  categories,
}: ProductFiltersProps) {
  const buildHref = (extraParams: Record<string, string>) => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (stockFilter) params.set("stock", stockFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (sortBy !== "newest") params.set("sort", sortBy);
    Object.entries(extraParams).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    return `/admin/products?${params.toString()}`;
  };

  return (
    <div className="admin-shell__card mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
      <form method="GET" action="/admin/products" className="flex items-center gap-3 w-full sm:w-auto flex-1">
        <input
          type="text"
          name="q"
          defaultValue={searchQuery}
          placeholder="Search products by name..."
          className="admin-shell__input w-full sm:w-80"
        />
        {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
        {stockFilter && <input type="hidden" name="stock" value={stockFilter} />}
        {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
        {sortBy !== "newest" && <input type="hidden" name="sort" value={sortBy} />}
        <button type="submit" className="admin-shell__btn admin-shell__btn--secondary">
          Search
        </button>
      </form>

      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-wrap">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          <Link
            href={buildHref({})}
            className={`admin-shell__btn admin-shell__btn--sm whitespace-nowrap ${
              !categoryFilter ? "admin-shell__btn--primary" : ""
            }`}
          >
            All Categories
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={buildHref({ category: c.slug })}
              className={`admin-shell__btn admin-shell__btn--sm whitespace-nowrap ${
                categoryFilter === c.slug ? "admin-shell__btn--primary" : ""
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
            Stock:
          </span>
          <select
            name="stock"
            defaultValue={stockFilter}
            className="admin-shell__select admin-shell__select--sm"
            style={{ minWidth: "120px" }}
            onChange={(e) => {
              const params = new URLSearchParams(window.location.search);
              if (e.target.value) params.set("stock", e.target.value);
              else params.delete("stock");
              params.delete("page");
              window.location.href = `/admin/products?${params.toString()}`;
            }}
          >
            <option value="">All Stock</option>
            <option value="in">In Stock (6+)</option>
            <option value="low">Low Stock (1-5)</option>
            <option value="out">Out of Stock (0)</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
            Status:
          </span>
          <select
            name="status"
            defaultValue={statusFilter}
            className="admin-shell__select admin-shell__select--sm"
            style={{ minWidth: "130px" }}
            onChange={(e) => {
              const params = new URLSearchParams(window.location.search);
              if (e.target.value) params.set("status", e.target.value);
              else params.delete("status");
              params.delete("page");
              window.location.href = `/admin/products?${params.toString()}`;
            }}
          >
            <option value="">All Status</option>
            <option value="active">Active & Visible</option>
            <option value="hidden">Hidden / Inactive</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>
            Sort:
          </span>
          <select
            name="sort"
            defaultValue={sortBy}
            className="admin-shell__select admin-shell__select--sm"
            style={{ minWidth: "160px" }}
            onChange={(e) => {
              const params = new URLSearchParams(window.location.search);
              if (e.target.value !== "newest") params.set("sort", e.target.value);
              else params.delete("sort");
              params.delete("page");
              window.location.href = `/admin/products?${params.toString()}`;
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
            <option value="price_asc">Price (Low-High)</option>
            <option value="price_desc">Price (High-Low)</option>
            <option value="stock_asc">Stock (Low-High)</option>
            <option value="stock_desc">Stock (High-Low)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
