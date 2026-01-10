import { createClient } from "@/utils/supabase/server";
import { ClayCard } from "@/components/ui/clay-card";
import { CreateGroupDialog } from "@/components/create-group-dialog";
import { JoinTribeDialog } from "@/components/join-tribe-dialog";
import { SignOutButton } from "@/components/sign-out-button";
import Link from "next/link";

/**
 * Dashboard Page
 * 
 * The main hub for the authenticated user.
 * Displays total Aura points and list of groups.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch user's groups with aura points
  const { data: members } = await supabase
    .from("members")
    .select(`
      aura_points,
      group_id,
      groups (
        id,
        name,
        created_by
      )
    `)
    .eq("user_id", user?.id || "");

  // Calculate total aura
  const totalAura = members?.reduce((sum, m) => sum + (m.aura_points || 0), 0) || 0;

  // Derive groups list from members join
  // Fix: Explicitly type 'm' or validation to avoid 'any' error.
  interface MemberWithGroup {
    aura_points: number;
    groups: {
      id: string;
      name: string;
      created_by: string;
    }
  }
  const myGroups = members?.map((m) => (m as unknown as MemberWithGroup).groups) || [];

  return (
    <main className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
              Welcome back, <span className="text-aura-gold-dark">{user?.user_metadata?.full_name || 'Farmer'}</span>
            </h1>
            <p className="text-muted-foreground mt-1">Here&apos;s your aura status today.</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Profile snippet */}
            <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-stone-100 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-stone-200 overflow-hidden">
                {user?.user_metadata?.avatar_url && (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="text-sm">
                <p className="font-bold text-stone-700">{user?.user_metadata?.full_name}</p>
                <p className="text-stone-400 text-xs truncate max-w-[100px]">{user?.email}</p>
              </div>
            </div>
            <SignOutButton />
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ClayCard className="bg-gradient-to-br from-aura-gold to-orange-400 border-none text-white relative overflow-hidden">
            <div className="relative z-10">
              <p className="font-medium text-white/80 mb-1">Total Aura</p>
              <h2 className="text-5xl font-black tracking-tight">{totalAura}</h2>
            </div>
            <div className="absolute right-[-20px] bottom-[-20px] opacity-20">
              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
          </ClayCard>

          <CreateGroupDialog
            trigger={
              <ClayCard className="text-center flex flex-col items-center justify-center min-h-[160px] border-dashed border-2 border-stone-300 bg-transparent shadow-none hover:bg-stone-50/50 cursor-pointer group transition-colors">
                <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-stone-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </div>
                <h3 className="font-bold text-stone-500">Create New Tribe</h3>
              </ClayCard>
            }
          />

          <JoinTribeDialog
            trigger={
              <ClayCard className="text-center flex flex-col items-center justify-center min-h-[160px] border-dashed border-2 border-stone-300 bg-transparent shadow-none hover:bg-stone-50/50 cursor-pointer group transition-colors">
                <div className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-stone-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                </div>
                <h3 className="font-bold text-stone-500">Join a Tribe</h3>
              </ClayCard>
            }
          />
        </div>

        <h2 className="text-2xl font-bold text-stone-700 mt-8">Your Tribes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myGroups.length > 0 ? (
            myGroups.map((group) => (
              <Link href={`/group/${group.id}`} key={group.id}>
                <ClayCard
                  className="h-48 flex flex-col justify-between group relative overflow-hidden clay-hover cursor-pointer bg-stone-50"
                  interactive
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-stone-700">{group.name}</h3>
                    <p className="text-stone-400 text-sm mt-1">Role: <span className="font-semibold text-aura-gold-dark">Member</span></p>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="flex -space-x-2">
                      {/* Avatars placeholder - would need a separate fetch or join for this group's members to be accurate */}
                      {[1, 2, 3].map(i => (
                        <div key={i} className="w-8 h-8 rounded-full bg-stone-200 border-2 border-white" />
                      ))}
                    </div>
                    <span className="text-stone-400 group-hover:text-stone-600 transition-colors">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </span>
                  </div>
                </ClayCard>
              </Link>
            ))
          ) : (
            <div className="text-center py-12 text-stone-400 bg-stone-50/50 rounded-3xl border border-stone-200/50 col-span-full">
              <p className="text-lg">You haven&apos;t joined any tribes yet.</p>
            </div>
          )}
        </div>
      </div>
    </main >
  );
}
