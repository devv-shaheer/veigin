import { destroySession } from "@/lib/admin-auth";
import { redirect } from "next/navigation";

export async function POST() {
  await destroySession();
  redirect("/vg-7x2k");
}