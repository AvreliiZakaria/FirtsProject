import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Runs on every matched request: refreshes the auth session.
 *
 * We run on all routes except Next internals and static assets, so cookie-based
 * auth stays current across the app. Protected pages additionally check auth
 * inside their server components (redirect to /login if no session).
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static, _next/image, favicon (static assets)
     * - /uploads/* (generated images served by a route handler)
     */
    "/((?!_next/static|_next/image|favicon.ico|uploads/).*).",
  ],
};
