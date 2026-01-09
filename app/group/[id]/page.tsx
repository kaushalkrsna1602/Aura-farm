import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { ClayCard } from "@/components/ui/clay-card";
import { ClayButton } from "@/components/ui/clay-button";
import Link from "next/link";
import { JoinGroupButton } from "@/components/join-group-button";
import { ManageGroupDialog } from "@/components/manage-group-dialog";
import { GiveAuraDialog } from "@/components/give-aura-dialog";

export default async function GroupPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Fetch Group Details
    const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("*")
        .eq("id", id)
        .single();

    if (groupError || !group) {
        notFound();
    }

    // 2. Fetch Members (Leaderboard) with Profiles
    const { data: members } = await supabase
        .from("members")
        .select(`
      *,
      profiles:user_id (
        full_name,
        avatar_url
      )
    `)
        .eq("group_id", group.id)
        .order("aura_points", { ascending: false });

    /* Existing fetch logic */

    // 3. Fetch Rewards
    const { data: rewards } = await supabase
        .from("rewards")
        .select("*")
        .eq("group_id", group.id)
        .order("cost", { ascending: true });

    const currentUserMember = members?.find((m) => m.user_id === user?.id);
    const isMember = !!currentUserMember;

    if (!isMember) {
        return (
            <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
                <ClayCard className="max-w-md w-full text-center space-y-6 p-8">
                    <div className="w-20 h-20 bg-aura-gold/20 rounded-full flex items-center justify-center mx-auto text-aura-gold-dark">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-stone-800">{group.name}</h1>
                        <p className="text-stone-500 mt-2">
                            This tribe has <strong>{members?.length || 0}</strong> master farmers. <br />
                            Join them to start farming Aura.
                        </p>
                    </div>
                    <div className="pt-4">
                        <JoinGroupButton groupId={group.id} />
                    </div>
                </ClayCard>
                <Link href="/dashboard" className="text-stone-400 mt-8 hover:text-stone-600 font-medium">
                    Back to Dashboard
                </Link>
            </main>
        )
    }

    return (
        <main className="min-h-screen bg-background p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link href="/dashboard" className="text-stone-400 hover:text-stone-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                            </Link>
                            <span className="text-stone-300 font-bold">/</span>
                            <span className="text-stone-500 font-medium">Tribe</span>
                        </div>
                        <h1 className="text-4xl font-black text-stone-800 tracking-tight">{group.name}</h1>
                        <p className="text-stone-500 font-medium flex items-center gap-2 mt-1">
                            Invite Code: <span className="bg-stone-100 text-stone-600 px-2 py-1 rounded-lg font-mono text-sm border border-stone-200">{group.invite_code}</span>
                        </p>
                    </div>

                    <div className="flex bg-white/50 backdrop-blur rounded-2xl p-2 border border-stone-100 shadow-sm">
                        <div className="px-6 py-2 border-r border-stone-100">
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Your Aura</p>
                            <p className="text-2xl font-black text-aura-gold-dark">{currentUserMember?.aura_points || 0}</p>
                        </div>
                        <div className="px-6 py-2">
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Rank</p>
                            <p className="text-2xl font-black text-stone-600">
                                #{members?.findIndex(m => m.user_id === user?.id) !== undefined ? members.findIndex(m => m.user_id === user?.id) + 1 : '-'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Col: Leaderboard */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-stone-700">Leaderboard</h2>
                            <ClayButton size="sm" variant="ghost">View All</ClayButton>
                        </div>

                        <div className="space-y-4">
                            {members?.map((member, idx) => (
                                <ClayCard key={member.user_id} className="flex items-center justify-between p-4 bg-stone-50/80 hover:bg-stone-50 transition-colors" size="sm">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 flex items-center justify-center font-bold rounded-full ${idx === 0 ? 'bg-aura-gold text-white shadow-clay-sm' : idx === 1 ? 'bg-stone-300 text-white' : idx === 2 ? 'bg-orange-300 text-white' : 'text-stone-400'}`}>
                                            {idx + 1}
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-stone-200 overflow-hidden border-2 border-white shadow-sm">
                                            <img src={member.profiles?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${member.user_id}`} alt="Avatar" className="w-full h-full object-cover" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-stone-700 flex items-center gap-2">
                                                {member.profiles?.full_name}
                                                {member.role === 'admin' && <span className="text-[10px] bg-stone-200 text-stone-500 px-1.5 py-0.5 rounded font-bold uppercase">Admin</span>}
                                            </p>
                                            <p className="text-xs text-stone-400">Master Farmer</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xl font-black text-aura-gold-dark">{member.aura_points} <span className="text-sm font-medium text-stone-400">AP</span></p>
                                    </div>
                                </ClayCard>
                            ))}
                        </div>
                    </div>

                    {/* Right Col: Rewards & Actions */}
                    <div className="space-y-8">
                        {/* Quick Actions */}
                        <ClayCard className="bg-aura-gold/10 border-aura-gold/20">
                            <h3 className="font-bold text-stone-800 mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-3">


                                <GiveAuraDialog
                                    trigger={
                                        <ClayButton variant="primary" className="h-20 flex-col gap-1 text-sm shadow-sm bg-white" leftIcon={<svg className="w-6 h-6 text-aura-gold-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}>
                                            Give Aura
                                        </ClayButton>
                                    }
                                    members={members || []}
                                    groupId={group.id}
                                    currentUserId={user?.id || ""}
                                />
                                <ManageGroupDialog
                                    group={group}
                                    trigger={
                                        <ClayButton variant="secondary" className="h-20 flex-col gap-1 text-sm shadow-sm bg-white" leftIcon={<svg className="w-6 h-6 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>}>
                                            Manage
                                        </ClayButton>
                                    }
                                />
                            </div>
                        </ClayCard>

                        {/* Rewards Shop */}
                        <div>
                            <h2 className="text-2xl font-bold text-stone-700 mb-4">Rewards Shop</h2>
                            <div className="space-y-4">
                                {rewards && rewards.length > 0 ? (
                                    rewards.map(reward => (
                                        <ClayCard key={reward.id} size="sm" className="relative group overflow-hidden hover:border-aura-gold/30 transition-colors cursor-pointer">
                                            <div className="flex justify-between items-start">
                                                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center text-xl shadow-inner">
                                                    {reward.icon === 'coffee' ? '☕' : '⭐'}
                                                </div>
                                                <div className="bg-stone-100 px-3 py-1 rounded-full text-xs font-bold text-stone-600 shadow-sm border border-stone-200">
                                                    {reward.cost} AP
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-stone-700 mt-3">{reward.title}</h4>
                                            <p className="text-xs text-stone-400">Redeem instantly</p>
                                        </ClayCard>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-stone-400 bg-stone-50/50 rounded-3xl border border-stone-200 border-dashed">
                                        <p>No rewards available yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
