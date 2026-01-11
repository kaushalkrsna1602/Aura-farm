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

// ============================================================================
// TYPES
// ============================================================================

interface RedeemRewardDialogProps {
    trigger: React.ReactNode;
    reward: Reward;
    groupId: string;
    userPoints: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function RedeemRewardDialog({
    trigger,
    reward,
    groupId,
    userPoints,
}: RedeemRewardDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const canAfford = userPoints >= reward.cost;
    const pointsAfterRedemption = userPoints - reward.cost;

    const handleRedeem = async () => {
        if (!canAfford) {
            toast.error("Insufficient Aura Points");
            return;
        }

        setLoading(true);

        try {
            const { redeemRewardAction } = await import("@/actions/rewards");
            const res = await redeemRewardAction(groupId, reward.id);

            if (res.message && !res.success) {
                toast.error(res.message);
            } else if (res.success && res.message) {
                // Approval-required reward
                toast.success(res.message, { duration: 5000 });
                setOpen(false);
                router.refresh();
            } else {
                toast.success(`Successfully redeemed "${reward.title}"! 🎉`);
                setOpen(false);
                router.refresh();
            }
        } catch {
            toast.error("Failed to redeem reward");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-sm bg-stone-50 border-stone-200 shadow-clay rounded-3xl">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-2xl font-black text-stone-800">
                        Redeem Reward
                    </DialogTitle>
                    <DialogDescription className="text-stone-500">
                        Confirm your redemption
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    {/* Reward Display */}
                    <div className="text-center">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-aura-gold/20 to-orange-200/30 rounded-2xl flex items-center justify-center text-4xl shadow-inner mb-4">
                            {getRewardIcon(reward.icon)}
                        </div>
                        <h3 className="text-xl font-bold text-stone-800">
                            {reward.title}
                        </h3>
                        <div className="inline-block mt-2 bg-stone-100 px-4 py-1.5 rounded-full">
                            <span className="text-lg font-bold text-aura-gold-dark">
                                {reward.cost}
                            </span>
                            <span className="text-stone-500 ml-1">AP</span>
                        </div>
                    </div>

                    {/* Points Breakdown */}
                    <div className="bg-white rounded-xl p-4 border border-stone-200 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-stone-500">Your balance</span>
                            <span className={`font-bold ${canAfford ? "text-stone-700" : "text-red-500"}`}>
                                {userPoints} AP
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-stone-500">Cost</span>
                            <span className="font-bold text-stone-700">
                                -{reward.cost} AP
                            </span>
                        </div>
                        <div className="border-t border-stone-100 pt-2 mt-2">
                            <div className="flex justify-between">
                                <span className="font-medium text-stone-600">
                                    After redemption
                                </span>
                                <span className={`font-bold ${canAfford ? "text-green-600" : "text-red-500"}`}>
                                    {canAfford ? pointsAfterRedemption : "Insufficient"} {canAfford && "AP"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                        {reward.requires_approval && canAfford && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-2">
                                <p className="text-xs text-amber-700">
                                    <strong>🔒 Approval Required:</strong> This reward needs admin approval.
                                    Your points will only be deducted once approved.
                                </p>
                            </div>
                        )}
                        <ClayButton
                            variant={canAfford ? "primary" : "secondary"}
                            className="w-full h-12 text-base"
                            onClick={handleRedeem}
                            disabled={!canAfford}
                            isLoading={loading}
                        >
                            {!canAfford
                                ? "Not Enough Points"
                                : reward.requires_approval
                                    ? "Request Approval"
                                    : "Confirm Redemption"
                            }
                        </ClayButton>
                        <ClayButton
                            variant="ghost"
                            className="w-full"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </ClayButton>
                    </div>

                    {!canAfford && (
                        <p className="text-center text-sm text-red-500">
                            You need <strong>{reward.cost - userPoints}</strong> more AP to redeem this reward.
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
