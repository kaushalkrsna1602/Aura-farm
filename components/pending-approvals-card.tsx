"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ClayCard } from "@/components/ui/clay-card";
import { ClayButton } from "@/components/ui/clay-button";
import { toast } from "sonner";
import { getRewardIcon } from "@/utils/reward-icons";
import { Check, X, Clock, ChevronDown, ChevronUp } from "lucide-react";
import type { RedemptionWithDetails } from "@/actions/redemptions";

// ============================================================================
// TYPES
// ============================================================================

interface PendingApprovalsCardProps {
    groupId: string;
    initialPendingCount?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function PendingApprovalsCard({
    groupId,
    initialPendingCount = 0,
}: PendingApprovalsCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [redemptions, setRedemptions] = useState<RedemptionWithDetails[]>([]);
    const [pendingCount, setPendingCount] = useState(initialPendingCount);
    const router = useRouter();

    // Fetch pending redemptions when expanded
    useEffect(() => {
        if (expanded && redemptions.length === 0) {
            fetchPending();
        }
    }, [expanded]);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const { getPendingRedemptionsAction } = await import("@/actions/redemptions");
            const result = await getPendingRedemptionsAction(groupId);
            if (result.data) {
                setRedemptions(result.data);
                setPendingCount(result.data.length);
            }
        } catch {
            toast.error("Failed to fetch pending requests");
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (redemptionId: string) => {
        setActionLoading(redemptionId);
        try {
            const { approveRedemptionAction } = await import("@/actions/redemptions");
            const result = await approveRedemptionAction(redemptionId);
            if (result.success) {
                toast.success("Redemption approved!");
                setRedemptions((prev) => prev.filter((r) => r.id !== redemptionId));
                setPendingCount((prev) => Math.max(0, prev - 1));
                router.refresh();
            } else {
                toast.error(result.message || "Failed to approve");
            }
        } catch {
            toast.error("Failed to approve redemption");
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (redemptionId: string) => {
        const notes = prompt("Optional: Add a note for the rejection");

        setActionLoading(redemptionId);
        try {
            const { rejectRedemptionAction } = await import("@/actions/redemptions");
            const result = await rejectRedemptionAction(redemptionId, notes || undefined);
            if (result.success) {
                toast.success("Redemption rejected");
                setRedemptions((prev) => prev.filter((r) => r.id !== redemptionId));
                setPendingCount((prev) => Math.max(0, prev - 1));
                router.refresh();
            } else {
                toast.error(result.message || "Failed to reject");
            }
        } catch {
            toast.error("Failed to reject redemption");
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Don't show if no pending approvals
    if (pendingCount === 0 && !expanded) {
        return null;
    }

    return (
        <ClayCard className="bg-amber-50/50 border-amber-200/50">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                        <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-stone-800">Pending Approvals</h3>
                        <p className="text-xs text-stone-500">
                            {pendingCount} request{pendingCount !== 1 ? "s" : ""} awaiting review
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {pendingCount > 0 && (
                        <span className="px-2.5 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
                            {pendingCount}
                        </span>
                    )}
                    {expanded ? (
                        <ChevronUp className="w-5 h-5 text-stone-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-stone-400" />
                    )}
                </div>
            </button>

            {expanded && (
                <div className="mt-4 pt-4 border-t border-amber-200/50 space-y-3">
                    {loading ? (
                        <div className="text-center py-4 text-stone-400">
                            Loading...
                        </div>
                    ) : redemptions.length === 0 ? (
                        <div className="text-center py-4 text-stone-400">
                            <p>No pending requests 🎉</p>
                        </div>
                    ) : (
                        redemptions.map((redemption) => (
                            <div
                                key={redemption.id}
                                className="bg-white rounded-xl p-3 border border-stone-200 flex items-center justify-between gap-3"
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <div className="w-10 h-10 rounded-full bg-stone-100 overflow-hidden shrink-0">
                                        <img
                                            src={
                                                redemption.profile?.avatar_url ||
                                                `https://api.dicebear.com/7.x/notionists/svg?seed=${redemption.user_id}`
                                            }
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-semibold text-stone-700 truncate text-sm">
                                            {redemption.profile?.full_name || "Unknown"}
                                        </p>
                                        <p className="text-xs text-stone-400 flex items-center gap-1">
                                            <span className="text-base">{getRewardIcon(redemption.reward?.icon)}</span>
                                            <span className="truncate">{redemption.reward?.title}</span>
                                            <span className="text-amber-600 font-medium">
                                                ({redemption.points_deducted} AP)
                                            </span>
                                        </p>
                                        <p className="text-[10px] text-stone-400 mt-0.5">
                                            {formatDate(redemption.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1.5 shrink-0">
                                    <ClayButton
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 w-9 p-0 bg-green-50 hover:bg-green-100 text-green-600"
                                        onClick={() => handleApprove(redemption.id)}
                                        disabled={actionLoading === redemption.id}
                                        isLoading={actionLoading === redemption.id}
                                    >
                                        <Check className="w-4 h-4" />
                                    </ClayButton>
                                    <ClayButton
                                        variant="ghost"
                                        size="sm"
                                        className="h-9 w-9 p-0 bg-red-50 hover:bg-red-100 text-red-600"
                                        onClick={() => handleReject(redemption.id)}
                                        disabled={actionLoading === redemption.id}
                                    >
                                        <X className="w-4 h-4" />
                                    </ClayButton>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </ClayCard>
    );
}
