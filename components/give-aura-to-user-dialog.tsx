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
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus } from "lucide-react";

interface Member {
    user_id: string;
    role: string;
    aura_points: number;
    profiles: {
        full_name: string | null;
        avatar_url: string | null;
    } | null;
}

interface GiveAuraToUserDialogProps {
    member: Member;
    groupId: string;
}

export function GiveAuraToUserDialog({ member, groupId }: GiveAuraToUserDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState("Quick Boost");

    const handleGive = async () => {
        setLoading(true);
        // Default to giving 1 Aura point
        const res = await giveAuraAction(groupId, member.user_id, 1, reason);
        setLoading(false);

        if (res?.message) {
            toast.error(res.message);
        } else {
            toast.success(`Sent 1 Aura to ${member.profiles?.full_name || 'member'}!`);
            setReason("Quick Boost");
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-stone-100 to-stone-200 text-stone-500 shadow-[0_2px_0_0_#d6d3d1,0_4px_6px_-1px_rgba(0,0,0,0.1)] transition-all hover:-translate-y-0.5 hover:from-white hover:to-stone-100 hover:text-aura-gold-dark hover:shadow-[0_4px_0_0_#d6d3d1,0_6px_8px_-1px_rgba(0,0,0,0.1)] active:translate-y-[2px] active:shadow-[0_0_0_0_#d6d3d1,inset_0_2px_4px_rgba(0,0,0,0.1)] border border-stone-300"
                    title="Give Aura"
                >
                    <Plus className="w-5 h-5 stroke-[3] drop-shadow-sm transition-transform group-hover:scale-110" />
                </button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-md bg-stone-50 border-stone-200 shadow-clay rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-stone-800 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-stone-200 overflow-hidden border-2 border-white shadow-sm">
                            <img
                                src={member.profiles?.avatar_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${member.user_id}`}
                                className="w-full h-full object-cover"
                                alt="Avatar"
                            />
                        </div>
                        <span>Give Aura</span>
                    </DialogTitle>
                    <DialogDescription className="text-stone-500">
                        Appreciate <strong>{member.profiles?.full_name}</strong> with a quick boost.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-400 uppercase tracking-wider pl-1">Reason</label>
                        <Input
                            placeholder="e.g. Helpful code review, Great idea..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="bg-white"
                        />
                    </div>

                    <div className="pt-2">
                        <ClayButton
                            onClick={handleGive}
                            variant="primary"
                            className="w-full h-14 text-white text-lg shadow-clay-md hover:translate-y-[-2px] transition-transform"
                            isLoading={loading}
                        >
                            {!loading && (
                                <span className="flex items-center gap-2">
                                    <Plus className="w-5 h-5 stroke-[3]" />
                                    Send 1 Aura
                                </span>
                            )}
                        </ClayButton>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
