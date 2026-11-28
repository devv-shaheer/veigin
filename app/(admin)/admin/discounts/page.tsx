import { verifySession } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LOGIN_PATH } from "@/lib/admin-paths";
import { DiscountsContent } from "./DiscountsContent";

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

  const buildUrl = (params: Record<string, string>) => {
    const searchParams = new URLSearchParams(params);
    return `/admin/discounts?${searchParams.toString()}`;
  };

  return (
    <DiscountsContent
      searchQuery={searchQuery}
      statusFilter={statusFilter}
      typeFilter={typeFilter}
      page={page}
      editId={editId}
      isCreateMode={isCreateMode}
      success={success}
      totalDiscounts={totalDiscounts}
      totalPages={totalPages}
      discounts={discounts}
      editDiscount={editDiscount}
    />
  );
}