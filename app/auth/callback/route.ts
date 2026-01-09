import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * Auth Callback Route Handler
 *
 * This route handles the OAuth callback from Supabase Auth.
 * It exchanges the authorization code for a session and redirects
 * the user to the dashboard.
 *
 * Flow:
 * 1. User clicks "Sign in with Google"
 * 2. Supabase redirects to Google
 * 3. Google redirects back to this callback with a code
 * 4. We exchange the code for a session
 * 5. Redirect to dashboard
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Successful authentication - redirect to dashboard
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If there's no code or an error occurred, redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
