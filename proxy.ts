import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { LOGIN_PATH } from "./lib/admin-paths";
import { verifySession } from "./lib/admin-auth";

// The matcher runs the proxy on /admin paths only
export const config = {
  matcher: ["/admin/:path*", "/vg-7x2k"],
};

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // If the path is the login page, let it through
  if (path === LOGIN_PATH) {
    return NextResponse.next();
  }

  // For all /admin paths, check for a session cookie
  if (path.startsWith("/admin")) {
    const session = await verifySession();

    // No valid session — return 404 (not a redirect, so strangers learn nothing)
    if (!session) {
      return NextResponse.rewrite(new URL("/not-found", request.url));
    }
  }

  // If we get here, the user is on a non-admin path — let it through
  return NextResponse.next();
}