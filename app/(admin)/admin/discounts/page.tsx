import { verifySession } from "@/lib/admin-auth";
import { query, withTransaction } from "@/lib/db";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LOGIN_PATH } from "@/lib/admin-paths";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Discount Codes · Admin Panel",
  description: "Create and manage discount codes for promotions",
  robots: { index: false, follow: false },
};

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

const PER_PAGE = 25;

// Server Actions
async function createDiscountAction(formData: FormData) {
  "use server";
  const session = await verifySession();
  if (!session) throw new Error("Unauthorized");

  const code = (formData.get("code") as string)?.trim().toUpperCase();
  const type = (formData.get("type") as string) || "percentage";
  const value = parseFloat(formData.get("value") as string);
  const minOrderValue = parseFloat(formData.get("min_order_value") as string) || null;
  const maxUses = parseInt(formData.get("max_uses") as string, 10) || null;
  const startsAt = (formData.get("starts_at") as string)?.trim() || null;
  const expiresAt = (formData.get("expires_at") as string)?.trim() || null;

  if (!code || !/^[A-Z0-9]{3,20}$/.test(code)) {
    throw new Error("Code must be 3-20 uppercase alphanumeric characters.");
  }
  if (!["percentage", "fixed"].includes(type)) throw new Error("Invalid discount type.");
  if (isNaN(value) || value <= 0) throw new Error("Value must be a positive number.");
  if (type === "percentage" && value > 100) throw new Error("Percentage cannot exceed 100%.");
  if (minOrderValue !== null && minOrderValue < 0) throw new Error("Minimum order value cannot be negative.");
  if (maxUses !== null && maxUses <= 0) throw new Error("Max uses must be positive.");

  // Check for duplicate code
  const existing = await query<{ id: number }>("SELECT id FROM discount_codes WHERE code = ? LIMIT 1", [code]);
  if (existing.length) throw new Error("Discount code already exists.");

  await query(
    `INSERT INTO discount_codes (code, type, value, min_order_value, max_uses, active, starts_at, expires_at, created_at)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?, CURRENT_TIMESTAMP)`,
    [code, type, value, minOrderValue, maxUses, startsAt, expiresAt]
  );

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts?success=created");
}

async function updateDiscountAction(formData: FormData) {
  "use server";
  const session = await verifySession();
  if (!session) throw new Error("Unauthorized");

  const id = parseInt(formData.get("id") as string, 10);
  const type = (formData.get("type") as string) || "percentage";
  const value = parseFloat(formData.get("value") as string);
  const minOrderValue = parseFloat(formData.get("min_order_value") as string) || null;
  const maxUses = parseInt(formData.get("max_uses") as string, 10) || null;
  const startsAt = (formData.get("starts_at") as string)?.trim() || null;
  const expiresAt = (formData.get("expires_at") as string)?.trim() || null;
  const active = formData.get("active") === "on";

  if (!id) throw new Error("Invalid discount ID.");
  if (!["percentage", "fixed"].includes(type)) throw new Error("Invalid discount type.");
  if (isNaN(value) || value <= 0) throw new Error("Value must be a positive number.");
  if (type === "percentage" && value > 100) throw new Error("Percentage cannot exceed 100%.");

  await query(
    `UPDATE discount_codes
     SET type = ?, value = ?, min_order_value = ?, max_uses = ?, active = ?, starts_at = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [type, value, minOrderValue, maxUses, active, startsAt, expiresAt, id]
  );

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts?success=updated");
}

async function deleteDiscountAction(formData: FormData) {
  "use server";
  const session = await verifySession();
  if (!session) throw new Error("Unauthorized");

  const id = parseInt(formData.get("id") as string, 10);
  if (!id) throw new Error("Invalid discount ID.");

  // Check if discount has been used
  const usage = await query<{ used_count: number }>("SELECT used_count FROM discount_codes WHERE id = ? LIMIT 1", [id]);
  if (usage.length && usage[0].used_count > 0) {
    throw new Error("Cannot delete a discount code that has been used. Deactivate it instead.");
  }

  await query("DELETE FROM discount_codes WHERE id = ?", [id]);

  revalidatePath("/admin/discounts");
  redirect("/admin/discounts?success=deleted");
}

type SearchParams = {
  q?: string;
  status?: string;
  type?: string;
  page?: string;
  edit?: string;
  create?: string;
  success?: string;
};

export default async function AdminDiscountsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await verifySession();
  if (!session) redirect(LOGIN_PATH);

  const params = await searchParams;
  const searchQuery = params.q || "";
  const statusFilter = params.status || "";
  const typeFilter = params.type || "";
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const editId = params.edit ? parseInt(params.edit, 10) : null;
  const isCreateMode = params.create === "true";
  const success = params.success;
  const offset = (page - 1) * PER_PAGE;

  // Build discount list query
  let whereSql = "";
  const whereParams: (string | number)[] = [];

  if (searchQuery) {
    whereSql += ` AND code LIKE ?`;
    whereParams.push(`%${searchQuery.toUpperCase()}%`);
  }

  if (statusFilter === "active") {
    whereSql += ` AND active = 1 AND (expires_at IS NULL OR expires_at > NOW())`;
  } else if (statusFilter === "inactive") {
    whereSql += ` AND (active = 0 OR (expires_at IS NOT NULL AND expires_at <= NOW()))`;
  }

  if (typeFilter) {
    whereSql += ` AND type = ?`;
    whereParams.push(typeFilter);
  }

  const countSql = `SELECT COUNT(*) as total FROM discount_codes WHERE 1=1 ${whereSql}`;
  const totalResult = await query<{ total: number }>(countSql, whereParams);
  const totalDiscounts = totalResult[0]?.total ?? 0;
  const totalPages = Math.ceil(totalDiscounts / PER_PAGE);

  const listSql = `
    SELECT * FROM discount_codes
    WHERE 1=1 ${whereSql}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `;
  const listParams = [...whereParams, PER_PAGE, offset];
  const discounts = await query<DiscountRow>(listSql, listParams);

  // Fetch discount to edit
  let editDiscount: DiscountRow | null = null;
  if (editId) {
    const result = await query<DiscountRow>("SELECT * FROM discount_codes WHERE id = ? LIMIT 1", [editId]);
    if (result.length) editDiscount = result[0];
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
            <span className="text-sm font-medium" style={{ color: "var(--admin-crimson)" }}>Discounts</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-[var(--admin-text)] tracking-tight">Discount Codes</h1>
          <p className="text-[var(--admin-text-muted)] text-sm mt-1">Create and manage promotional discount codes.</p>
        </div>
        {!editDiscount && (
          <button
            type="button"
            className="admin-shell__btn admin-shell__btn--primary"
            onClick={() => openCreateModal()}
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
              onChange={(e) => {
                const params = new URLSearchParams(window.location.search);
                if (e.target.value) params.set("status", e.target.value);
                else params.delete("status");
                params.delete("page");
                window.location.href = `/admin/discounts?${params.toString()}`;
              }}
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
              onChange={(e) => {
                const params = new URLSearchParams(window.location.search);
                if (e.target.value) params.set("type", e.target.value);
                else params.delete("type");
                params.delete("page");
                window.location.href = `/admin/discounts?${params.toString()}`;
              }}
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
                href={`/admin/discounts${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}${statusFilter ? `${searchQuery ? "&" : "?"}status=${statusFilter}` : ""}${typeFilter ? `${(searchQuery || statusFilter) ? "&" : "?"}type=${typeFilter}` : ""}${page > 1 ? `${(searchQuery || statusFilter || typeFilter) ? "&" : "?"}page=${page}` : ""}`}
                className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] text-xl font-medium"
              >
                ✕
              </Link>
            </div>

            <form action={editDiscount ? updateDiscountAction : createDiscountAction} method="POST" className="space-y-4">
              {editDiscount && <input type="hidden" name="id" value={editDiscount.id} />}

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
                  href={`/admin/discounts${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ""}${statusFilter ? `${searchQuery ? "&" : "?"}status=${statusFilter}` : ""}${typeFilter ? `${(searchQuery || statusFilter) ? "&" : "?"}type=${typeFilter}` : ""}${page > 1 ? `${(searchQuery || statusFilter || typeFilter) ? "&" : "?"}page=${page}` : ""}`}
                  className="admin-shell__btn admin-shell__btn--secondary flex-1 text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>

            {editDiscount && editDiscount.used_count === 0 && (
              <form action={deleteDiscountAction} method="POST" className="mt-4 pt-4 border-t" style={{ borderColor: "var(--admin-border)" }}>
                <input type="hidden" name="id" value={editDiscount.id} />
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
                            href={`/admin/discounts?edit=${d.id}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}${typeFilter ? `&type=${typeFilter}` : ""}${page > 1 ? `&page=${page}` : ""}`}
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
                  href={`/admin/discounts?page=${page - 1}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}${typeFilter ? `&type=${typeFilter}` : ""}`}
                  className="admin-shell__btn admin-shell__btn--secondary admin-shell__btn--sm"
                >
                  Previous
                </a>
              )}
              {page < totalPages && (
                <a
                  href={`/admin/discounts?page=${page + 1}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}${statusFilter ? `&status=${statusFilter}` : ""}${typeFilter ? `&type=${typeFilter}` : ""}`}
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

// Client-side modal helpers
function openCreateModal() {
  if (typeof window !== "undefined") {
    window.location.href = `/admin/discounts?create=true`;
  }
}