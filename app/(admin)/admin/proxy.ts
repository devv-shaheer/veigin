import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/admin-auth";

export async function proxy(request: NextRequest) {
  const session = await verifySession();
  if (!session) {
    // Clear any existing session cookie
    cookies().delete("adminSession");
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}