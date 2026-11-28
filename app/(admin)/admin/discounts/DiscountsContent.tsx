"use client";

import Link from "next/link";

type DiscountRow = {
  id: number;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  min_order_value: number | null;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
};

interface DiscountsContentProps {
  searchQuery: string;
  statusFilter: string;
  typeFilter: string;
  page: number;
  editId: number | null;
  isCreateMode: boolean;
  success?: string;
  totalDiscounts: number;
  totalPages: number;
  discounts: DiscountRow[];
  editDiscount: DiscountRow | null;
}

export function DiscountsContent({
  searchQuery,
  statusFilter,
  typeFilter,
  page,
  editId,
  isCreateMode,
  success,
  totalDiscounts,
  totalPages,
  discounts,
  editDiscount,
}: DiscountsContentProps) {
  const buildUrl = (params: Record<string, string>) => {
    const searchParams = new URLSearchParams(params);
    return `/admin/discounts?${searchParams.toString()}`;
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params: Record<string, string> = {};
    if (searchQuery) params.q = searchQuery;
    if (typeFilter) params.type = typeFilter;
    if (e.target.value) params.status = e.target.value;
    window.location.href = buildUrl(params);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params: Record<string, string> = {};
    if (searchQuery) params.q = searchQuery;
    if (statusFilter) params.status = statusFilter;
    if (e.target.value) params.type = e.target.value;
    window.location.href = buildUrl(params);
  };

  const openCreateModal = () => {
    window.location.href = buildUrl({ ...(searchQuery ? { q: searchQuery } : {}), ...(statusFilter ? { status: statusFilter } : {}), ...(typeFilter ? { type: typeFilter } : {}), create: "true" });
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
            <span className="text-sm font-medium" style={{ color: "var(--admin-crimson)" }}>Discounts</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-[var(--admin-text)] tracking-tight">Discount Codes</h1>
          <p className="text-[var(--admin-text-muted)] text-sm mt-1">Create and manage promotional discount codes.</p>
        </div>
        {!editDiscount && (
          <button
            type="button"
            className="admin-shell__btn admin-shell__btn--primary"
            onClick={openCreateModal}
          >
            Create Discount
          </button>
        )}
      </div>

      {/* Success Banner */}
      {success && (
        <div className="mb-6 admin-shell__card" style={{ backgroundColor: "var(--admin-emerald-subtle)", borderColor: "var(--admin-emerald-border)" }}>
          <span className="font-medium" style={{ color: "var(--admin-emerald)" }}>
            {success === "created" && "Discount code created successfully."}
            {success === "updated" && "Discount code updated successfully."}
            {success === "deleted" && "Discount code deleted successfully."}
          </span>
          <Link href="/admin/discounts" className="text-xs hover:underline" style={{ color: "var(--admin-emerald)" }}>Dismiss</Link>
        </div>
      )}

      {/* Filters and Search */}
      <div className="admin-shell__card mb-8 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <form method="GET" action="/admin/discounts" className="flex items-center gap-3 w-full sm:w-auto flex-1">
          <input
            type="text"
            name="q"
            defaultValue={searchQuery}
            placeholder="Search by code..."
            className="admin-shell__input w-full sm:w-80"
          />
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          {typeFilter && <input type="hidden" name="type" value={typeFilter} />}
          <button type="submit" className="admin-shell__btn admin-shell__btn--secondary">
            Search
          </button>
        </form>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Status:</span>
            <select
              name="status"
              defaultValue={statusFilter}
              className="admin-shell__select admin-shell__select--sm"
              style={{ minWidth: "160px" }}
              onChange={handleStatusChange}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive / Expired</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--admin-text-muted)" }}>Type:</span>
            <select
              name="type"
              defaultValue={typeFilter}
              className="admin-shell__select admin-shell__select--sm"
              style={{ minWidth: "140px" }}
              onChange={handleTypeChange}
            >
              <option value="">All Types</option>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(editDiscount || isCreateMode) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="admin-shell__card max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[var(--admin-text)]">
                {editDiscount ? `Edit Discount: ${editDiscount.code}` : "Create New Discount"}
              </h2>
              <Link
                href={buildUrl({
                  ...(searchQuery ? { q: searchQuery } : {}),
                  ...(statusFilter ? { status: statusFilter } : {}),
                  ...(typeFilter ? { type: typeFilter } : {}),
                  ...(page > 1 ? { page: String(page) } : {}),
                })}
                className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] text-xl font-medium"
              >
                ✕
              </Link>
            </div>

            <form action={editDiscount ? "/admin/discounts/actions" : "/admin/discounts/actions"} method="POST" className="space-y-4">
              {editDiscount && <input type="hidden" name="id" value={String(editDiscount.id)} />}
              <input type="hidden" name="action" value={editDiscount ? "update" : "create"} />

              <div>
                <label className="admin-shell__label">Discount Code</label>
                <input
                  type="text"
                  name="code"
                  defaultValue={editDiscount?.code || ""}
                  placeholder="e.g., SAVE20, WELCOME10"
                  className="admin-shell__input"
                  required
                  readOnly={!!editDiscount}
                  style={{ textTransform: "uppercase" }}
                />
                <p className="admin-shell__hint">3-20 uppercase alphanumeric characters. Cannot be changed after creation.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="admin-shell__label">Type</label>
                  <select name="type" defaultValue={editDiscount?.type || "percentage"} className="admin-shell__select" required>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (PKR)</option>
                  </select>
                </div>
                <div>
                  <label className="admin-shell__label">Value</label>
                  <input
                    type="number"
                    name="value"
                    defaultValue={editDiscount?.value || ""}
                    placeholder={editDiscount?.type === "percentage" ? "e.g., 20" : "e.g., 500"}
                    className="admin-shell__input"
                    step="0.01"
                    min="0.01"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="admin-shell__label">Minimum Order Value (Optional)</label>
                <input
                  type="number"
                  name="min_order_value"
                  defaultValue={editDiscount?.min_order_value || ""}
                  placeholder="e.g., 2000"
                  className="admin-shell__input"
                  step="0.01"
                  min="0"
                />
                <p className="admin-shell__hint">Leave empty for no minimum. Only applies to orders above this amount.</p>
              </div>

              <div>
                <label className="admin-shell__label">Maximum Uses (Optional)</label>
                <input
                  type="number"
                  name="max_uses"
                  defaultValue={editDiscount?.max_uses || ""}
                  placeholder="e.g., 100"
                  className="admin-shell__input"
                  min="1"
                />
                <p className="admin-shell__hint">Leave empty for unlimited uses. Current usage: {editDiscount?.used_count ?? 0}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="admin-shell__label">Starts At (Optional)</label>
                  <input
                    type="datetime-local"
                    name="starts_at"
                    defaultValue={editDiscount?.starts_at ? new Date(editDiscount.starts_at).toISOString().slice(0, 16) : ""}
                    className="admin-shell__input"
                  />
                </div>
                <div>
                  <label className="admin-shell__label">Expires At (Optional)</label>
                  <input
                    type="datetime-local"
                    name="expires_at"
                    defaultValue={editDiscount?.expires_at ? new Date(editDiscount.expires_at).toISOString().slice(0, 16) : ""}
                    className="admin-shell__input"
                  />
                </div>
              </div>

              {editDiscount && (
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="active"
                      defaultChecked={editDiscount.active}
                      className="admin-shell__checkbox"
                    />
                    <span className="text-sm text-[var(--admin-text)]">Active</span>
                  </label>
                  {editDiscount.used_count > 0 && (
                    <span className="admin-shell__badge admin-shell__badge--neutral text-xs">
                      Used {editDiscount.used_count} time(s) — cannot delete
                    </span>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4 border-t" style={{ borderColor: "var(--admin-border)" }}>
                <button type="submit" className="admin-shell__btn admin-shell__btn--primary flex-1">
                  {editDiscount ? "Save Changes" : "Create Discount"}
                </button>
                <Link
                  href={buildUrl({
                    ...(searchQuery ? { q: searchQuery } : {}),
                    ...(statusFilter ? { status: statusFilter } : {}),
                    ...(typeFilter ? { type: typeFilter } : {}),
                    ...(page > 1 ? { page: String(page) } : {}),
                  })}
                  className="admin-shell__btn admin-shell__btn--secondary flex-1 text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>

            {editDiscount && editDiscount.used_count === 0 && (
              <form action="/admin/discounts/actions" method="POST" className="mt-4 pt-4 border-t" style={{ borderColor: "var(--admin-border)" }}>
                <input type="hidden" name="id" value={String(editDiscount.id)} />
                <input type="hidden" name="action" value="delete" />
                <button
                  type="submit"
                  className="admin-shell__btn admin-shell__btn--danger w-full"
                >
                  Delete Discount
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Discounts Table */}
      <div className="admin-shell__card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-shell__table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Min Order</th>
                <th>Usage</th>
                <th>Status</th>
                <th>Validity</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {discounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="admin-shell__empty">
                    <svg className="admin-shell__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                    <p>No discount codes found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                discounts.map((d) => {
                  const isExpired = d.expires_at && new Date(d.expires_at) <= new Date();
                  const isActive = d.active && !isExpired;
                  return (
                    <tr key={d.id}>
                      <td className="font-mono font-medium text-[var(--admin-text)]">{d.code}</td>
                      <td>
                        <span className={`admin-shell__badge ${d.type === "percentage" ? "admin-shell__badge--primary" : "admin-shell__badge--warning"}`}>
                          {d.type}
                        </span>
                      </td>
                      <td className="font-mono text-[var(--admin-text)]">
                        {d.type === "percentage" ? `${d.value}%` : `PKR ${d.value.toLocaleString()}`}
                      </td>
                      <td style={{ color: "var(--admin-text-muted)" }}>
                        {d.min_order_value ? `PKR ${d.min_order_value.toLocaleString()}` : <span className="italic">—</span>}
                      </td>
                      <td className="font-mono text-[var(--admin-text)]">
                        {d.used_count} / {d.max_uses ? d.max_uses.toLocaleString() : <span className="italic">∞</span>}
                        {d.max_uses && d.used_count >= d.max_uses && (
                          <span className="admin-shell__badge admin-shell__badge--danger text-xs ml-1">Maxed</span>
                        )}
                      </td>
                      <td>
                        <span className={`admin-shell__badge ${isActive ? "admin-shell__badge--success" : "admin-shell__badge--neutral"}`}>
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ color: "var(--admin-text-muted)" }}>
                        {d.starts_at ? `From ${new Date(d.starts_at).toLocaleDateString("en-GB")}` : "Immediate"}<br />
                        {d.expires_at ? `Until ${new Date(d.expires_at).toLocaleDateString("en-GB")}` : <span className="italic">No expiry</span>}
                        {isExpired && <span className="admin-shell__badge admin-shell__badge--danger text-xs block mt-1">Expired</span>}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
                          <Link
                            href={buildUrl({
                              edit: String(d.id),
                              ...(searchQuery ? { q: searchQuery } : {}),
                              ...(statusFilter ? { status: statusFilter } : {}),
                              ...(typeFilter ? { type: typeFilter } : {}),
                              ...(page > 1 ? { page: String(page) } : {}),
                            })}
                            className="admin-shell__btn admin-shell__btn--sm"
                            style={{ padding: "var(--space-1) var(--space-2)", fontSize: "11px" }}
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-4 border-t" style={{ borderColor: "var(--admin-border)" }}>
            <div className="text-sm" style={{ color: "var(--admin-text-muted)" }}>
              Page {page} of {totalPages} — {totalDiscounts.toLocaleString()} discount codes
            </div>
            <div className="flex items-center gap-2">
              {page > 1 && (
                <a
                  href={buildUrl({
                    page: String(page - 1),
                    ...(searchQuery ? { q: searchQuery } : {}),
                    ...(statusFilter ? { status: statusFilter } : {}),
                    ...(typeFilter ? { type: typeFilter } : {}),
                  })}
                  className="admin-shell__btn admin-shell__btn--secondary admin-shell__btn--sm"
                >
                  Previous
                </a>
              )}
              {page < totalPages && (
                <a
                  href={buildUrl({
                    page: String(page + 1),
                    ...(searchQuery ? { q: searchQuery } : {}),
                    ...(statusFilter ? { status: statusFilter } : {}),
                    ...(typeFilter ? { type: typeFilter } : {}),
                  })}
                  className="admin-shell__btn admin-shell__btn--secondary admin-shell__btn--sm"
                >
                  Next
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}