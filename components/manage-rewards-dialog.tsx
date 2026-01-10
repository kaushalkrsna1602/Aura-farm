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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getRewardIcon } from "@/utils/reward-icons";
import type { Reward } from "@/types/database";

// ============================================================================
// CONSTANTS
// ============================================================================

const REWARD_ICONS = ["☕", "🎁", "⭐", "🏆", "🎮", "🍕", "🎬", "💎", "🌟", "🎯"];

// ============================================================================
// TYPES
// ============================================================================

interface ManageRewardsDialogProps {
    trigger: React.ReactNode;
    groupId: string;
    rewards: Reward[];
    isAdmin: boolean;
}

interface RewardFormData {
    title: string;
    cost: string;
    icon: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ManageRewardsDialog({
    trigger,
    groupId,
    rewards,
    isAdmin,
}: ManageRewardsDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<RewardFormData>({
        title: "",
        cost: "",
        icon: "⭐",
    });

    const router = useRouter();

    // Don't render for non-admins
    if (!isAdmin) return null;

    const resetForm = () => {
        setFormData({ title: "", cost: "", icon: "⭐" });
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title.trim() || !formData.cost) {
            toast.error("Please fill in all fields");
            return;
        }

        const costNum = parseInt(formData.cost, 10);
        if (isNaN(costNum) || costNum <= 0) {
            toast.error("Cost must be a positive number");
            return;
        }

        setLoading(true);

        try {
            if (editingId) {
                // Update existing reward
                const { updateRewardAction } = await import("@/actions/rewards");
                const res = await updateRewardAction(editingId, {
                    title: formData.title,
                    cost: costNum,
                    icon: formData.icon,
                });

                if (res.message) {
                    toast.error(res.message);
                } else {
                    toast.success("Reward updated!");
                    resetForm();
                    router.refresh();
                }
            } else {
                // Create new reward
                const { createRewardAction } = await import("@/actions/rewards");
                const res = await createRewardAction(groupId, {
                    title: formData.title,
                    cost: costNum,
                    icon: formData.icon,
                });

                if (res.message) {
                    toast.error(res.message);
                } else {
                    toast.success("Reward created!");
                    resetForm();
                    router.refresh();
                }
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (reward: Reward) => {
        setEditingId(reward.id);
        setFormData({
            title: reward.title,
            cost: reward.cost.toString(),
            icon: reward.icon || "⭐",
        });
    };

    const handleDelete = async (rewardId: string) => {
        if (!confirm("Are you sure you want to delete this reward?")) return;

        setLoading(true);
        try {
            const { deleteRewardAction } = await import("@/actions/rewards");
            const res = await deleteRewardAction(rewardId);

            if (res.message) {
                toast.error(res.message);
            } else {
                toast.success("Reward deleted!");
                router.refresh();
            }
        } catch {
            toast.error("Failed to delete reward");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-lg bg-stone-50 border-stone-200 shadow-clay rounded-3xl max-h-[85vh] overflow-y-auto scrollbar-clay">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-stone-800">
                        Manage Rewards
                    </DialogTitle>
                    <DialogDescription className="text-stone-500">
                        Create rewards for your tribe members to redeem.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    {/* Title Input */}
                    <div className="space-y-2">
                        <Label className="text-stone-700 font-bold">
                            Reward Title
                        </Label>
                        <Input
                            placeholder="e.g., Coffee Break, Extra Day Off"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({ ...formData, title: e.target.value })
                            }
                            className="h-11"
                        />
                    </div>

                    {/* Cost Input */}
                    <div className="space-y-2">
                        <Label className="text-stone-700 font-bold">
                            Cost (Aura Points)
                        </Label>
                        <Input
                            type="number"
                            placeholder="e.g., 50"
                            min="1"
                            value={formData.cost}
                            onChange={(e) =>
                                setFormData({ ...formData, cost: e.target.value })
                            }
                            className="h-11"
                        />
                    </div>

                    {/* Icon Picker */}
                    <div className="space-y-2">
                        <Label className="text-stone-700 font-bold">Icon</Label>
                        <div className="flex flex-wrap gap-2">
                            {REWARD_ICONS.map((icon) => (
                                <button
                                    key={icon}
                                    type="button"
                                    onClick={() =>
                                        setFormData({ ...formData, icon })
                                    }
                                    className={`w-10 h-10 text-xl rounded-xl border-2 transition-all hover:scale-110 ${formData.icon === icon
                                        ? "border-aura-gold bg-aura-gold/20 shadow-md"
                                        : "border-stone-200 bg-white hover:border-stone-300"
                                        }`}
                                >
                                    {icon}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex gap-2 pt-2">
                        <ClayButton
                            type="submit"
                            variant="primary"
                            isLoading={loading}
                            className="flex-1"
                        >
                            {editingId ? "Update Reward" : "Add Reward"}
                        </ClayButton>
                        {editingId && (
                            <ClayButton
                                type="button"
                                variant="ghost"
                                onClick={resetForm}
                            >
                                Cancel
                            </ClayButton>
                        )}
                    </div>
                </form>

                {/* Existing Rewards List */}
                {rewards.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-stone-200">
                        <h4 className="text-sm font-bold text-stone-700 mb-3">
                            Existing Rewards
                        </h4>
                        <div className="space-y-2">
                            {rewards.map((reward) => (
                                <div
                                    key={reward.id}
                                    className={`flex items-center justify-between p-3 bg-white rounded-xl border transition-colors ${editingId === reward.id
                                        ? "border-aura-gold bg-aura-gold/5"
                                        : "border-stone-200"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl">
                                            {getRewardIcon(reward.icon)}
                                        </span>
                                        <div>
                                            <p className="font-semibold text-stone-700">
                                                {reward.title}
                                            </p>
                                            <p className="text-xs text-stone-400">
                                                {reward.cost} AP
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <ClayButton
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(reward)}
                                            className="h-8 w-8 p-0"
                                        >
                                            ✏️
                                        </ClayButton>
                                        <ClayButton
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(reward.id)}
                                            className="h-8 w-8 p-0 hover:bg-red-50"
                                        >
                                            🗑️
                                        </ClayButton>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {rewards.length === 0 && (
                    <div className="mt-6 pt-6 border-t border-stone-200">
                        <div className="text-center py-6 text-stone-400 bg-stone-100/50 rounded-xl border border-dashed border-stone-300">
                            <p className="text-2xl mb-2">🎁</p>
                            <p>No rewards yet. Create your first one!</p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
