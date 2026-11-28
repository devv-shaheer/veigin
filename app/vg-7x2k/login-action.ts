"use server";

import { attemptLogin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export async function loginAction(
  formData: FormData,
): Promise<void> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const result = await attemptLogin(email, password);

  if (result.success) {
    // Redirect to admin on success
    redirect("/admin");
  }
}