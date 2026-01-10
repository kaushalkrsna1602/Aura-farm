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

// ============================================================================
// TYPES
// ============================================================================

interface JoinTribeDialogProps {
    trigger: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function JoinTribeDialog({ trigger }: JoinTribeDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [inviteInput, setInviteInput] = useState("");
    const router = useRouter();

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!inviteInput.trim()) {
            toast.error("Please enter an invite code or link");
            return;
        }

        setLoading(true);

        try {
            // Extract group ID from invite code or URL
            let groupId: string | null = null;
            const trimmedInput = inviteInput.trim();

            // Check if it's a full URL (contains /group/)
            if (trimmedInput.includes("/group/")) {
                const match = trimmedInput.match(/\/group\/([a-zA-Z0-9-]+)/);
                if (match) {
                    groupId = match[1];
                }
            } else {
                // Assume it's an invite code - we need to look up the group
                const { createClient } = await import("@/utils/supabase/client");
                const supabase = createClient();

                const { data: group } = await supabase
                    .from("groups")
                    .select("id")
                    .eq("invite_code", trimmedInput.toUpperCase())
                    .single();

                if (group) {
                    groupId = group.id;
                }
            }

            if (!groupId) {
                toast.error("Invalid invite code or link. Please check and try again.");
                setLoading(false);
                return;
            }

            // Join the group
            const { joinGroupAction } = await import("@/actions/groups");
            const result = await joinGroupAction(groupId);

            if (result?.message) {
                toast.error(result.message);
                if (result.message.includes("logged in")) {
                    router.push("/login");
                }
            } else {
                toast.success("Welcome to the tribe! 🎉");
                setOpen(false);
                setInviteInput("");
                router.push(`/group/${groupId}`);
                router.refresh();
            }
        } catch (error) {
            console.error("JOIN ERROR:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-md bg-stone-50 border-stone-200 shadow-clay rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black text-stone-800">
                        Join a Tribe
                    </DialogTitle>
                    <DialogDescription className="text-stone-500">
                        Enter an invite code or paste a tribe link to join.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleJoin} className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <Label className="text-stone-700 font-bold">
                            Invite Code or Link
                        </Label>
                        <Input
                            placeholder="e.g., ABC123 or https://..."
                            value={inviteInput}
                            onChange={(e) => setInviteInput(e.target.value)}
                            className="h-12 text-center font-mono text-lg uppercase"
                            autoComplete="off"
                        />
                    </div>

                    <div className="bg-stone-100 p-4 rounded-xl border border-stone-200">
                        <p className="text-sm text-stone-500">
                            💡 <strong>Tip:</strong> Ask your tribe admin for the invite code, or paste the full invite link they shared with you.
                        </p>
                    </div>

                    <ClayButton
                        type="submit"
                        variant="primary"
                        className="w-full h-12 text-base"
                        isLoading={loading}
                    >
                        Join Tribe
                    </ClayButton>
                </form>
            </DialogContent>
        </Dialog>
    );
}
