import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

/**
 * Next.js Middleware for AuraFlow
 * 
 * Handles:
 * - Session refresh on every request
 * - Route protection for authenticated pages
 * - Redirects for unauthenticated users
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

/**
 * Matcher configuration
 * 
 * This middleware runs on all routes except:
 * - _next/static (static files)
 * - _next/image (image optimization)
 * - favicon.ico
 * - Public assets (svg, png, jpg, etc.)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
