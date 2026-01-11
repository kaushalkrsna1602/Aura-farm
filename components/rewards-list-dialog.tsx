"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClayButton } from "@/components/ui/clay-button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getRewardIcon } from "@/utils/reward-icons";
import type { Reward } from "@/types/database";
import { ArrowLeft, Check, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface RewardsListDialogProps {
    trigger: React.ReactNode;
    rewards: Reward[];
    groupId: string;
    userPoints: number;
}

export function RewardsListDialog({
    trigger,
    rewards,
    groupId,
    userPoints,
}: RewardsListDialogProps) {
    const [open, setOpen] = useState(false);
    const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    const filteredRewards = rewards.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleRedeem = async () => {
        if (!selectedReward) return;

        setLoading(true);
        try {
            const { redeemRewardAction } = await import("@/actions/rewards");
            const res = await redeemRewardAction(groupId, selectedReward.id);

            if (res.message && !res.success) {
                toast.error(res.message);
            } else if (res.success && res.message) {
                // Approval-required reward - use neutral toast
                toast(
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⏳</span>
                        <div>
                            <p className="font-semibold text-stone-800">Request Submitted!</p>
                            <p className="text-sm text-stone-500">
                                Waiting for admin approval
                            </p>
                        </div>
                    </div>,
                    { duration: 5000 }
                );
                setOpen(false);
                setSelectedReward(null);
                router.refresh();
            } else {
                toast.success(`Successfully redeemed "${selectedReward.title}"! 🎉`);
                setOpen(false);
                setSelectedReward(null);
                router.refresh();
            }
        } catch {
            toast.error("Failed to redeem reward");
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        setSelectedReward(null);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            setOpen(val);
            if (!val) setTimeout(() => setSelectedReward(null), 300); // Reset after close
        }}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-md bg-stone-50 border-stone-200 shadow-clay rounded-3xl h-[600px] max-h-[85vh] flex flex-col p-0 overflow-hidden">

                {/* Header */}
                <div className="p-6 pb-4 bg-white border-b border-stone-100 flex-none z-10">
                    <DialogHeader className="space-y-1">
                        <div className="flex items-center gap-2">
                            {selectedReward && (
                                <button
                                    onClick={handleBack}
                                    className="mr-1 -ml-2 p-1 rounded-full hover:bg-stone-100 text-stone-400 transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                            )}
                            <DialogTitle className="text-2xl font-black text-stone-800">
                                {selectedReward ? "Redeem Reward" : "Rewards Shop"}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-stone-500">
                            {selectedReward
                                ? "Confirm your selection"
                                : "Spend your hard-earned Aura"}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Search - Only show in list view */}
                    {!selectedReward && (
                        <div className="mt-4 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                            <Input
                                placeholder="Search rewards..."
                                className="pl-9 bg-stone-50 border-stone-200"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="h-[400px] overflow-y-auto p-1 space-y-2 scrollbar-clay bg-stone-50">
                    {!selectedReward ? (
                        // LIST VIEW
                        <div className="grid grid-cols-1 gap-3">
                            {filteredRewards.length > 0 ? (
                                filteredRewards.map(reward => {
                                    const canAfford = userPoints >= reward.cost;
                                    return (
                                        <button
                                            key={reward.id}
                                            onClick={() => setSelectedReward(reward)}
                                            className={`w-full text-left flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 group ${canAfford
                                                ? "bg-white border-stone-200 hover:border-aura-gold/50 shadow-sm hover:shadow-md"
                                                : "bg-stone-100/50 border-stone-100 opacity-70"
                                                }`}
                                        >
                                            <div className="w-14 h-14 rounded-xl bg-stone-50 border border-stone-100 flex items-center justify-center text-2xl shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                                                {getRewardIcon(reward.icon)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-stone-700 truncate pr-2">{reward.title}</h4>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${canAfford
                                                        ? "bg-aura-gold/10 text-aura-gold-dark"
                                                        : "bg-stone-200 text-stone-500"
                                                        }`}>
                                                        {reward.cost} AP
                                                    </span>
                                                </div>
                                                <p className="text-xs text-stone-400 mt-1">
                                                    Redeemable in Aura shop
                                                </p>
                                                {!canAfford && (
                                                    <p className="text-xs text-red-400 mt-2 font-medium">
                                                        Need {reward.cost - userPoints} more AP
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12 text-stone-400">
                                    <p>No rewards found.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        // DETAILS / CONFIRM VIEW
                        <div className="h-full flex flex-col items-center justify-center p-4">
                            <div className="w-24 h-24 bg-gradient-to-br from-aura-gold/20 to-orange-200/30 rounded-3xl flex items-center justify-center text-5xl shadow-clay mb-6 animate-in zoom-in-50 duration-300">
                                {getRewardIcon(selectedReward.icon)}
                            </div>

                            <h3 className="text-2xl font-black text-stone-800 text-center mb-2">
                                {selectedReward.title}
                            </h3>

                            <div className="inline-block bg-stone-100 px-4 py-1.5 rounded-full mb-6">
                                <span className="text-lg font-bold text-aura-gold-dark">
                                    {selectedReward.cost}
                                </span>
                                <span className="text-stone-500 ml-1">AP</span>
                            </div>

                            <div className="w-full max-w-xs bg-white p-4 rounded-xl border border-stone-200 mb-8 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-500">Your Balance</span>
                                    <span className="font-bold text-stone-700">{userPoints} AP</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-stone-500">Cost</span>
                                    <span className="font-bold text-stone-700">-{selectedReward.cost} AP</span>
                                </div>
                                <div className="border-t border-stone-100 pt-3 flex justify-between">
                                    <span className="font-medium text-stone-600">Remaining</span>
                                    <span className={`font-bold ${userPoints >= selectedReward.cost ? "text-aura-gold-dark" : "text-red-500"}`}>
                                        {userPoints - selectedReward.cost} AP
                                    </span>
                                </div>
                            </div>

                            <div className="w-full space-y-3">
                                <ClayButton
                                    variant="primary"
                                    className="w-full h-14 text-lg shadow-clay-md"
                                    onClick={handleRedeem}
                                    disabled={userPoints < selectedReward.cost}
                                    isLoading={loading}
                                >
                                    {userPoints >= selectedReward.cost ? (
                                        <div className="flex items-center gap-2">
                                            <Check className="w-5 h-5 stroke-[3]" />
                                            Confirm Redemption
                                        </div>
                                    ) : (
                                        "Insufficient Points"
                                    )}
                                </ClayButton>
                                <ClayButton
                                    variant="ghost"
                                    className="w-full"
                                    onClick={handleBack}
                                >
                                    Cancel
                                </ClayButton>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
