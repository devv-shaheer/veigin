import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/admin-auth";
import { LOGIN_PATH } from "@/lib/admin-paths";

export async function proxy(request: NextRequest) {
  const session = await verifySession();
  if (!session) {
    // Clear any existing session cookie
    const cookieStore = await cookies();
    cookieStore.delete("adminSession");
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }
  return NextResponse.next();
}