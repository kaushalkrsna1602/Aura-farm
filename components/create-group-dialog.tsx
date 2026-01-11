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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Check } from "lucide-react";

// ============================================================================
// REWARD TEMPLATES
// ============================================================================

const REWARD_TEMPLATES = [
  { id: "coffee", title: "Coffee Break", cost: 10, icon: "☕", requires_approval: false },
  { id: "snack", title: "Free Snack", cost: 15, icon: "🍕", requires_approval: false },
  { id: "late", title: "Come In Late", cost: 30, icon: "⏰", requires_approval: true },
  { id: "wfh", title: "Work From Home", cost: 50, icon: "🏠", requires_approval: true },
  { id: "dayoff", title: "Extra Day Off", cost: 100, icon: "🎉", requires_approval: true },
];

// ============================================================================
// TYPES
// ============================================================================

type SelectedReward = {
  id: string;
  title: string;
  cost: number;
  icon: string;
  requires_approval: boolean;
};

// ============================================================================
// COMPONENT
// ============================================================================

export function CreateGroupDialog({
  trigger,
}: {
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [tribeName, setTribeName] = useState("");
  const [nameError, setNameError] = useState("");
  const [selectedRewards, setSelectedRewards] = useState<SelectedReward[]>([]);
  const router = useRouter();

  const resetDialog = () => {
    setStep(1);
    setTribeName("");
    setNameError("");
    setSelectedRewards([]);
    setLoading(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetDialog();
    }
  };

  const toggleReward = (template: (typeof REWARD_TEMPLATES)[0]) => {
    setSelectedRewards((prev) => {
      const exists = prev.find((r) => r.id === template.id);
      if (exists) {
        return prev.filter((r) => r.id !== template.id);
      }
      return [...prev, { ...template }];
    });
  };

  const updateRewardApproval = (id: string, requires_approval: boolean) => {
    setSelectedRewards((prev) =>
      prev.map((r) => (r.id === id ? { ...r, requires_approval } : r))
    );
  };

  const handleStep1Submit = () => {
    if (tribeName.trim().length < 3) {
      setNameError("Name must be at least 3 characters");
      return;
    }
    if (tribeName.trim().length > 50) {
      setNameError("Name must be at most 50 characters");
      return;
    }
    setNameError("");
    setStep(2);
  };

  const handleCreateTribe = async () => {
    setLoading(true);
    try {
      // 1. Create the group
      const { createGroupWithRewardsAction } = await import("@/actions/groups");
      const result = await createGroupWithRewardsAction(tribeName, selectedRewards);

      if (result.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      toast.success("Tribe created successfully!");
      setOpen(false);
      resetDialog();

      if (result.groupId) {
        router.push(`/tribe/${result.groupId}`);
      }
    } catch {
      toast.error("Failed to create tribe");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md bg-stone-50 border-stone-200 shadow-clay rounded-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-stone-800">
            {step === 1 ? "Create New Tribe" : "Add Rewards (Optional)"}
          </DialogTitle>
          <DialogDescription className="text-stone-500">
            {step === 1
              ? "Start a new circle for your team, friends, or family."
              : "Choose preset rewards or skip to add them later."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <div className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-stone-700 font-bold">
                Tribe Name
              </Label>
              <Input
                id="name"
                value={tribeName}
                onChange={(e) => setTribeName(e.target.value)}
                placeholder="e.g. The Avengers"
                className="bg-stone-100 border-stone-200 focus-visible:ring-aura-gold/50 rounded-xl h-12 shadow-inner"
              />
              {nameError && (
                <p className="text-sm text-red-500">{nameError}</p>
              )}
            </div>
            <ClayButton
              type="button"
              variant="primary"
              className="w-full"
              onClick={handleStep1Submit}
            >
              Continue
            </ClayButton>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            {/* Reward Templates */}
            <div className="space-y-2">
              {REWARD_TEMPLATES.map((template) => {
                const isSelected = selectedRewards.some((r) => r.id === template.id);
                const selectedReward = selectedRewards.find((r) => r.id === template.id);

                return (
                  <div
                    key={template.id}
                    className={`rounded-xl border-2 transition-all ${isSelected
                        ? "border-aura-gold bg-aura-gold/5"
                        : "border-stone-200 bg-white hover:border-stone-300"
                      }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleReward(template)}
                      className="w-full flex items-center justify-between p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{template.icon}</span>
                        <div className="text-left">
                          <p className="font-semibold text-stone-700">
                            {template.title}
                          </p>
                          <p className="text-xs text-stone-400">{template.cost} AP</p>
                        </div>
                      </div>
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                            ? "border-aura-gold bg-aura-gold text-white"
                            : "border-stone-300"
                          }`}
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                      </div>
                    </button>

                    {/* Approval toggle when selected */}
                    {isSelected && (
                      <div className="px-3 pb-3 pt-0">
                        <div className="flex items-center justify-between p-2 bg-stone-50 rounded-lg">
                          <span className="text-xs text-stone-500">
                            Requires approval
                          </span>
                          <Switch
                            checked={selectedReward?.requires_approval || false}
                            onCheckedChange={(checked) =>
                              updateRewardApproval(template.id, checked)
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected count */}
            {selectedRewards.length > 0 && (
              <p className="text-sm text-stone-500 text-center">
                {selectedRewards.length} reward{selectedRewards.length !== 1 ? "s" : ""} selected
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              <ClayButton
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => setStep(1)}
              >
                Back
              </ClayButton>
              <ClayButton
                type="button"
                variant="primary"
                className="flex-1"
                onClick={handleCreateTribe}
                isLoading={loading}
              >
                {selectedRewards.length > 0 ? "Create Tribe" : "Skip & Create"}
              </ClayButton>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
