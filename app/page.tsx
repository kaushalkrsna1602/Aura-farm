import Link from "next/link";
import { ClayButton } from "@/components/ui/clay-button";
import { ClayCard } from "@/components/ui/clay-card";
import { createClient } from "@/utils/supabase/server";

/**
 * Landing Page
 * 
 * The public entry point for the application.
 * Showcases the value proposition and provides entry to the app.
 */
export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-aura-gold/5 rounded-full blur-3xl opacity-60 animate-aura-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-aura-blue/5 rounded-full blur-3xl opacity-60 animate-aura-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 max-w-4xl w-full text-center space-y-12">
        {/* Hero Section */}
        <div className="space-y-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-gradient-to-br from-aura-gold to-aura-gold-dark shadow-clay mb-4 clay-hover">
            <svg
              className="w-12 h-12 text-stone-900"
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

          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-foreground clay-text">
            Farm<span className="text-transparent bg-clip-text bg-gradient-to-r from-aura-gold via-aura-gold-dark to-aura-gold">Aura</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto">
            Gamify your social circle. Give points. <br className="hidden md:block" />
            Redeem experiences. Live better.
          </p>
        </div>

        {/* CTA Section */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Link href="/farm">
            <ClayButton
              size="lg"
              variant="primary"
              className="h-16 px-10 text-xl shadow-clay-lg"
              rightIcon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              }
            >
              Start Farming Aura
            </ClayButton>
          </Link>

          {!user && (
            <Link href="/login">
              <ClayButton size="lg" variant="ghost" className="h-16 px-8 text-lg">
                Sign In
              </ClayButton>
            </Link>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-16">
          <FeatureCard
            title="Create Tribes"
            desc="Form groups with friends, coworkers, or family."
            icon="users"
          />
          <FeatureCard
            title="Give Aura"
            desc="Recognize good vibes and helpful actions instantly."
            icon="zap"
          />
          <FeatureCard
            title="Redeem Rewards"
            desc="Exchange points for real-life rewards and perks."
            icon="gift"
          />
        </div>
      </div>
    </main>
  );
}

function FeatureCard({ title, desc, icon }: { title: string; desc: string; icon: string }) {
  return (
    <ClayCard className="h-full bg-white/50 backdrop-blur-sm hover:-translate-y-1 transition-transform duration-300">
      <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mb-4 text-aura-gold-dark shadow-clay-sm">
        {icon === 'users' && (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        )}
        {icon === 'zap' && (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )}
        {icon === 'gift' && (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4M16 8l-4-4-4 4" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            {/* Simple box icon replacement for clarity */}
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        )}
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{desc}</p>
    </ClayCard>
  )
}
