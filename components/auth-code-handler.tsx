"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

/**
 * AuthCodeHandler - Handles OAuth code exchange on any page
 * 
 * This component detects if there's an OAuth authorization code in the URL
 * and exchanges it for a session. This handles the case where Supabase
 * redirects to the root URL instead of /auth/callback.
 * 
 * PKCE Flow:
 * 1. User initiates OAuth from login page (stores PKCE verifier in cookies)
 * 2. Google authenticates user
 * 3. Supabase redirects back with ?code=xxx (to Site URL or redirectTo)
 * 4. This component detects the code and exchanges it for a session
 * 5. User is redirected to the intended destination
 */
export function AuthCodeHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isExchanging, setIsExchanging] = useState(false);

    useEffect(() => {
        const code = searchParams.get("code");

        if (code && !isExchanging) {
            setIsExchanging(true);

            const exchangeCode = async () => {
                try {
                    const supabase = createClient();
                    const { error } = await supabase.auth.exchangeCodeForSession(code);

                    if (error) {
                        console.error("Error exchanging code for session:", error);
                        router.push("/login?error=auth_callback_error");
                        return;
                    }

                    // Successfully authenticated - redirect to farm
                    // Remove the code from the URL and redirect to the intended destination
                    const next = searchParams.get("next") || "/farm";
                    router.push(next);
                } catch (err) {
                    console.error("Error during code exchange:", err);
                    router.push("/login?error=auth_callback_error");
                }
            };

            exchangeCode();
        }
    }, [searchParams, router, isExchanging]);

    // Show a loading state while exchanging the code
    if (searchParams.get("code")) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-aura-gold border-t-transparent mx-auto" />
                    <p className="text-lg text-muted-foreground">Signing you in...</p>
                </div>
            </div>
        );
    }

    return null;
}
