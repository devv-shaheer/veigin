"use server";

import { destroySession, verifySession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export async function logoutAction() {
  const session = await verifySession();
  if (!session) {
    redirect("/vg-7x2k");
    return;
  }

  await destroySession();
  redirect("/vg-7x2k");
}
