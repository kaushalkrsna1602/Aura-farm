import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * OAuth Callback Route Handler
 *
 * This is the SINGLE entry point for all OAuth code exchange.
 * Following the principle of server-side token exchange for security.
 *
 * PKCE Flow:
 * 1. User clicks "Sign in with Google" on /login
 * 2. Browser → Google → Supabase → /auth/callback?code=xxx
 * 3. Server exchanges code for session (this route)
 * 4. Session cookies set automatically by Supabase SSR
 * 5. User redirected to destination
 *
 * Error Handling:
 * - OAuth provider errors (user cancelled, access denied)
 * - Missing authorization code
 * - Code exchange failures (expired, invalid, PKCE mismatch)
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/farm";

  // Handle OAuth provider errors (e.g., user cancelled)
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  if (error) {
    console.error(`[Auth Callback] OAuth error: ${error} - ${errorDescription}`);
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=${encodeURIComponent(error)}`
    );
  }

  // Validate authorization code presence
  if (!code) {
    console.error("[Auth Callback] No authorization code received");
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=missing_code`
    );
  }

  // Exchange authorization code for session
  const supabase = await createClient();
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("[Auth Callback] Code exchange failed:", exchangeError.message);
    // Common causes: expired code, PKCE verifier mismatch, code already used
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=exchange_failed`
    );
  }

  // Success - redirect to intended destination
  console.log("[Auth Callback] Authentication successful, redirecting to:", next);
  return NextResponse.redirect(`${requestUrl.origin}${next}`);
}
