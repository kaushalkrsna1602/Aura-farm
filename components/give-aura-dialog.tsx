"use client";

import { useState } from "react";
import { ClayButton } from "@/components/ui/clay-button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { giveAuraAction } from "@/actions/aura";

interface Member {
    user_id: string;
    role: string;
    aura_points: number;
    profiles: {
        full_name: string;
        avatar_url: string;
    } | null; // profiles might be single object or array depending on join
}

export function GiveAuraDialog({
    trigger,
    members,
    groupId,
    currentUserId
}: {
    trigger: React.ReactNode;
    members: Member[];
    groupId: string;
    currentUserId: string;
}) {
    const [open, setOpen] = useState(false);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleGive = async (targetUserId: string) => {
        setLoadingId(targetUserId);
        await giveAuraAction(groupId, targetUserId, 1);
        setLoadingId(null);
        // Logic to close dialog? Maybe keep open to give more.
    };

    const eligibleMembers = members.filter(m => m.user_id !== currentUserId);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-md bg-stone-50 border-stone-200 shadow-clay rounded-3xl h-[600px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-stone-800">
                        Boost Your Team
                    </DialogTitle>
                    <DialogDescription className="text-stone-500">
                        Tap +1 to appreciate someone instantly.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-3 p-1 pr-2 mt-4 scrollbar-hide">
                    {eligibleMembers.length > 0 ? (
                        eligibleMembers.map(member => (
                            <div key={member.user_id} className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl shadow-sm border border-stone-100 hover:border-aura-gold/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-stone-200 overflow-hidden border-2 border-white shadow-sm">
                                        <img
                                            src={member.profiles?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${member.user_id}`}
                                            className="w-full h-full object-cover"
                                            alt="Avatar"
                                        />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-stone-700">{member.profiles?.full_name || 'Unknown'}</h4>
                                        <span className="text-xs font-bold text-stone-400 bg-stone-100 px-2 py-1 rounded-full">{member.aura_points} AP</span>
                                    </div>
                                </div>
                                <ClayButton
                                    onClick={() => handleGive(member.user_id)}
                                    variant="primary"
                                    className="w-14 h-14 rounded-2xl !p-0 flex items-center justify-center text-aura-gold-dark hover:text-aura-gold-dark hover:bg-orange-50 bg-white shadow-clay-sm"
                                    isLoading={loadingId === member.user_id}
                                >
                                    {!loadingId && (
                                        <div className="flex flex-col items-center leading-none">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
                                            <span className="font-black text-sm">1</span>
                                        </div>
                                    )}
                                </ClayButton>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 text-stone-400">
                            <p>It's just you here!</p>
                            <p className="text-sm">Invite friends to start giving aura.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
