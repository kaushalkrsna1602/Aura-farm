"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getRewardIcon } from "@/utils/reward-icons";

interface RedemptionAlert {
    id: string;
    status: "approved" | "rejected";
    reward_title: string;
    reward_icon: string | null;
    points: number;
    admin_notes: string | null;
    updated_at: string;
}

interface RedemptionAlertsProps {
    groupId: string;
}

/**
 * This component checks for recent redemption status changes
 * and shows toast notifications on page load.
 */
export function RedemptionAlerts({ groupId }: RedemptionAlertsProps) {
    const [hasShownAlerts, setHasShownAlerts] = useState(false);

    useEffect(() => {
        if (hasShownAlerts) return;

        const checkForAlerts = async () => {
            try {
                const { getRecentRedemptionAlertsAction } = await import("@/actions/redemptions");
                const result = await getRecentRedemptionAlertsAction(groupId);

                if (result.data && result.data.length > 0) {
                    setHasShownAlerts(true);

                    // Show toast for each recent update (limit to 3)
                    result.data.slice(0, 3).forEach((alert: RedemptionAlert, index: number) => {
                        setTimeout(() => {
                            if (alert.status === "approved") {
                                toast.success(
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{getRewardIcon(alert.reward_icon)}</span>
                                        <div>
                                            <p className="font-semibold">Request Approved!</p>
                                            <p className="text-sm opacity-80">
                                                "{alert.reward_title}" • -{alert.points} AP deducted
                                            </p>
                                        </div>
                                    </div>,
                                    { duration: 6000 }
                                );
                            } else {
                                toast.error(
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{getRewardIcon(alert.reward_icon)}</span>
                                        <div>
                                            <p className="font-semibold">Request Rejected</p>
                                            <p className="text-sm opacity-80">
                                                "{alert.reward_title}"
                                                {alert.admin_notes && ` - ${alert.admin_notes}`}
                                            </p>
                                        </div>
                                    </div>,
                                    { duration: 8000 }
                                );
                            }
                        }, index * 1500); // Stagger the toasts
                    });
                }
            } catch (error) {
                // Silently fail - this is a non-critical feature
                console.error("Failed to check redemption alerts:", error);
            }
        };

        // Small delay to let the page settle
        const timeout = setTimeout(checkForAlerts, 1000);
        return () => clearTimeout(timeout);
    }, [groupId, hasShownAlerts]);

    // This component renders nothing - it just shows toasts
    return null;
}
