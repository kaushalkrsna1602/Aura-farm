import { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to AuraFlow to start farming aura with your team.",
};

/**
 * Login Page
 *
 * A beautiful Neo-Claymorphism styled login page with Google OAuth.
 * Features:
 * - Centered ClayCard with soft shadows
 * - Animated logo/branding
 * - Single "Sign in with Google" button
 */
export default function LoginPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-aura-gold/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-aura-gold/10 rounded-full blur-3xl" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-card rounded-3xl p-8 shadow-clay border border-stone-100/50">
          {/* Logo & Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-aura-gold to-aura-gold-dark shadow-clay mb-6">
              <svg
                className="w-10 h-10 text-stone-900"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              AuraFarm
            </h1>
            <p className="text-muted-foreground mt-2">
              Farm aura. Redeem life.
            </p>
          </div>

          {/* Login Form (Client Component) */}
          <LoginForm />

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            By signing in, you agree to our{" "}
            <a href="#" className="text-aura-gold hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-aura-gold hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>

        {/* Bottom decoration */}
        <p className="text-center text-sm text-muted-foreground/50 mt-6">
          © 2025 AuraFlow. All rights reserved.
        </p>
      </div>
    </main>
  );
}
