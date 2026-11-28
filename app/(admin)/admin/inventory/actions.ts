"use server";

import { verifySession } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function adjustStockAction(formData: FormData) {
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

  const oldStock = product[0].stock;
  const newStock = Math.max(0, oldStock + adjustment);
  const newAvailability = newStock === 0 ? "sold_out" : "available";

  await query(
    `UPDATE products SET stock = ?, availability = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [newStock, newAvailability, id]
  );

  await query(
    `INSERT INTO stock_audit (product_id, admin_user_id, change_type, old_stock, new_stock, adjustment, reason, reference_type, reference_id)
     VALUES (?, ?, 'adjustment', ?, ?, ?, ?, 'manual', NULL)`,
    [id, session.adminId, oldStock, newStock, adjustment, reason]
  );

  revalidatePath("/admin/inventory");
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/admin/inventory?success=adjusted");
}

export async function setAvailabilityAction(formData: FormData) {
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