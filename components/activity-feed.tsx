"use client";

import { ClayCard } from "@/components/ui/clay-card";
import { formatDistanceToNow } from "date-fns";
import { Zap } from "lucide-react";

interface Profile {
    full_name: string | null;
    avatar_url: string | null;
}

interface Transaction {
    id: string;
    amount: number;
    reason: string | null;
    created_at: string;
    from_profile: Profile | null;
    to_profile: Profile | null;
}

interface ActivityFeedProps {
    transactions: Transaction[];
    currentUserId?: string;
}

export function ActivityFeed({ transactions, currentUserId }: ActivityFeedProps) {

    if (transactions.length === 0) {
        return (
            <ClayCard className="bg-white/50 border-stone-100 min-h-[400px] flex items-center justify-center text-center p-8">
                <div className="space-y-3 opacity-50">
                    <div className="w-16 h-16 bg-stone-200 rounded-full flex items-center justify-center mx-auto text-stone-400">
                        <Zap className="w-8 h-8" />
                    </div>
                    <p className="text-stone-500 font-medium">No activity yet.<br />Be the first to give Aura!</p>
                </div>
            </ClayCard>
        );
    }

    return (
        <ClayCard className="bg-stone-100/50 border-stone-200/60 p-0 overflow-hidden h-[600px] flex flex-col relative">
            <div className="p-4 border-b border-stone-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10 flex items-center justify-between">
                <h3 className="font-bold text-stone-700 flex items-center gap-2">
                    Activity Feed
                    <span className="bg-aura-gold/20 text-aura-gold-dark text-[10px] px-2 py-0.5 rounded-full">Live</span>
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-clay">
                {transactions.map((tx) => {
                    const isSystem = !tx.from_profile; // Maybe future use, though currently explicit users

                    return (
                        <div key={tx.id} className="flex gap-3 group animate-in slide-in-from-bottom-2 duration-500">
                            {/* Avatar */}
                            <div className="shrink-0 pt-1">
                                <div className="w-10 h-10 rounded-full bg-stone-200 border-2 border-white shadow-sm overflow-hidden">
                                    <img
                                        src={tx.from_profile?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${tx.id}`}
                                        alt={tx.from_profile?.full_name || "User"}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>

                            {/* Message Bubble */}
                            <div className="flex-1 max-w-[85%]">
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="font-bold text-stone-700 text-sm">
                                        {tx.from_profile?.full_name || "Unknown"}
                                    </span>
                                    <span className="text-xs text-stone-400 flex items-center gap-1">
                                        to <span className="font-medium text-stone-600">{tx.to_profile?.full_name || "Unknown"}</span>
                                    </span>
                                </div>

                                <div className="relative bg-white rounded-2xl rounded-tl-none p-3 shadow-[0_2px_4px_rgba(0,0,0,0.02),0_1px_0_rgba(0,0,0,0.06)] border border-stone-100 group-hover:shadow-md transition-shadow">
                                    <p className="text-stone-700 text-sm leading-relaxed">
                                        {tx.reason || "No reason provided"}
                                    </p>

                                    {/* Amount Badge */}
                                    <div className="absolute -top-2 -right-2 bg-gradient-to-br from-aura-gold to-orange-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm border border-white flex items-center gap-0.5">
                                        <Zap className="w-3 h-3 fill-current" />
                                        {tx.amount}
                                    </div>
                                </div>

                                <span className="text-[10px] text-stone-400 mt-1 pl-1 block">
                                    {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ClayCard>
    );
}
