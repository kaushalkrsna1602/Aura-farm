"use client";

import { useState, useEffect } from "react";
import { ClayCard } from "@/components/ui/clay-card";
import { ClayButton } from "@/components/ui/clay-button";
import { getRewardIcon } from "@/utils/reward-icons";
import { Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, History } from "lucide-react";
import type { RedemptionWithDetails } from "@/actions/redemptions";

// ============================================================================
// TYPES
// ============================================================================

interface MyRedemptionsCardProps {
    groupId: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MyRedemptionsCard({ groupId }: MyRedemptionsCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [redemptions, setRedemptions] = useState<RedemptionWithDetails[]>([]);
    const [hasNewUpdates, setHasNewUpdates] = useState(false);

    // Fetch redemptions when expanded
    useEffect(() => {
        if (expanded && redemptions.length === 0) {
            fetchRedemptions();
        }
    }, [expanded]);

    const fetchRedemptions = async () => {
        setLoading(true);
        try {
            const { getUserRedemptionsAction } = await import("@/actions/redemptions");
            const result = await getUserRedemptionsAction(groupId);
            if (result.data) {
                setRedemptions(result.data);
                // Check for any recently approved/rejected (within last 24 hours)
                const recentUpdates = result.data.filter((r) => {
                    if (r.status === "pending") return false;
                    const updatedAt = new Date(r.updated_at);
                    const now = new Date();
                    const hoursDiff = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);
                    return hoursDiff < 24;
                });
                setHasNewUpdates(recentUpdates.length > 0);
            }
        } catch {
            console.error("Failed to fetch redemptions");
        } finally {
            setLoading(false);
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "approved":
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case "rejected":
                return <XCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Clock className="w-4 h-4 text-amber-500" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "approved":
                return "Approved";
            case "rejected":
                return "Rejected";
            default:
                return "Pending";
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "approved":
                return "bg-green-50 text-green-700 border-green-200";
            case "rejected":
                return "bg-red-50 text-red-700 border-red-200";
            default:
                return "bg-amber-50 text-amber-700 border-amber-200";
        }
    };

    return (
        <ClayCard className="bg-white border-stone-200">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center">
                        <History className="w-5 h-5 text-stone-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-stone-800">My Redemptions</h3>
                        <p className="text-xs text-stone-500">
                            Track your reward requests
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {hasNewUpdates && !expanded && (
                        <span className="px-2 py-1 bg-green-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                            NEW
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
                <div className="mt-4 pt-4 border-t border-stone-200 space-y-3">
                    {loading ? (
                        <div className="text-center py-4 text-stone-400">
                            Loading...
                        </div>
                    ) : redemptions.length === 0 ? (
                        <div className="text-center py-4 text-stone-400">
                            <p>No redemption requests yet.</p>
                            <p className="text-xs mt-1">Visit the Rewards Shop to redeem!</p>
                        </div>
                    ) : (
                        redemptions.slice(0, 10).map((redemption) => (
                            <div
                                key={redemption.id}
                                className={`rounded-xl p-3 border ${redemption.status === "approved"
                                        ? "bg-green-50/50 border-green-100"
                                        : redemption.status === "rejected"
                                            ? "bg-red-50/50 border-red-100"
                                            : "bg-white border-stone-200"
                                    }`}
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <span className="text-xl">
                                            {getRewardIcon(redemption.reward?.icon)}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-stone-700 text-sm truncate">
                                                {redemption.reward?.title}
                                            </p>
                                            <p className="text-[10px] text-stone-400">
                                                {formatDate(redemption.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(redemption.status)}`}>
                                        {getStatusIcon(redemption.status)}
                                        <span>{getStatusText(redemption.status)}</span>
                                    </div>
                                </div>

                                {/* Show admin notes if rejected */}
                                {redemption.status === "rejected" && redemption.admin_notes && (
                                    <div className="mt-2 p-2 bg-red-100/50 rounded-lg">
                                        <p className="text-xs text-red-600">
                                            <strong>Note:</strong> {redemption.admin_notes}
                                        </p>
                                    </div>
                                )}

                                {/* Show success message if approved */}
                                {redemption.status === "approved" && (
                                    <div className="mt-2 p-2 bg-green-100/50 rounded-lg">
                                        <p className="text-xs text-green-600">
                                            ✓ {redemption.points_deducted} AP deducted from your balance
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}

                    {redemptions.length > 10 && (
                        <p className="text-xs text-stone-400 text-center">
                            Showing last 10 requests
                        </p>
                    )}
                </div>
            )}
        </ClayCard>
    );
}
