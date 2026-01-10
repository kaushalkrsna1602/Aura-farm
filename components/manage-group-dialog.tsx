"use client";

import { useState, useEffect } from "react";
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

export function ManageGroupDialog({
    trigger,
    group,
}: {
    trigger: React.ReactNode;
    group: { id: string; name: string; invite_code: string | null };
}) {
    const [open, setOpen] = useState(false);
    const [copied, setCopied] = useState(false);
    const [origin, setOrigin] = useState("");

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(group.name);
    const [loading, setLoading] = useState(false);

    const router = useRouter();

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);

    // Sync local state with prop when group updates (e.g. after refresh)
    useEffect(() => {
        setNewName(group.name);
    }, [group.name]);

    const invitePath = `/group/${group.id}`;
    const inviteUrl = origin ? `${origin}${invitePath}` : invitePath;

    const copyToClipboard = () => {
        const fullUrl = `${window.location.origin}${invitePath}`;
        navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Link copied!");
    };

    const handleUpdateName = async () => {
        setLoading(true);
        const { updateGroupAction } = await import("@/actions/groups");
        const res = await updateGroupAction(group.id, newName);
        if (res?.message) {
            toast.error(res.message);
        } else {
            toast.success("Tribe name updated!");
            setIsEditing(false);
            router.refresh();
        }
        setLoading(false);
    };

    const handleLeaveTribe = async () => {
        if (!confirm("Are you sure you want to leave this tribe?")) return;
        setLoading(true);
        const { leaveGroupAction } = await import("@/actions/groups");
        const res = await leaveGroupAction(group.id);
        if (res?.message) {
            toast.error(res.message);
            setLoading(false); // Only stop loading if error, otherwise we redirect
        } else {
            toast.success("Left tribe.");
            router.push("/dashboard");
            router.refresh();
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{trigger}</DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-md bg-stone-50 border-stone-200 shadow-clay rounded-3xl overflow-hidden">
                <div className="overflow-hidden">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black text-stone-800">
                            Manage Tribe
                        </DialogTitle>
                        <DialogDescription className="text-stone-500">
                            Invite friends to join <strong>{group.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                        {/* Invite Link Section */}
                        <div className="space-y-2">
                            <Label className="text-stone-700 font-bold">
                                Invite Link
                            </Label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 overflow-hidden bg-white border border-stone-200 rounded-xl px-4 py-3 shadow-inner">
                                    <p className="truncate text-stone-600 font-mono text-sm">
                                        {inviteUrl}
                                    </p>
                                </div>
                                <ClayButton
                                    variant="primary"
                                    size="sm"
                                    className="h-11 px-4 flex-shrink-0"
                                    onClick={copyToClipboard}
                                    leftIcon={
                                        copied ? (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                        )
                                    }
                                >
                                    {copied ? "Copied" : "Copy"}
                                </ClayButton>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-stone-100 p-4 rounded-xl border border-stone-200">
                            <p className="text-sm text-stone-500">
                                Share this link with anyone you want to join your tribe. They will be able to join instantly.
                            </p>
                        </div>

                        <div className="pt-2">
                            <h4 className="text-sm font-bold text-stone-700 mb-2">Tribe Admin Actions</h4>
                            <div className="grid grid-cols-1 gap-2">
                                {isEditing ? (
                                    <div className="flex gap-2">
                                        <Input
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="h-11 flex-1"
                                        />
                                        <ClayButton variant="primary" onClick={handleUpdateName} isLoading={loading}>Save</ClayButton>
                                        <ClayButton variant="ghost" onClick={() => setIsEditing(false)}>Cancel</ClayButton>
                                    </div>
                                ) : (
                                    <ClayButton
                                        variant="outline"
                                        className="w-full justify-start text-stone-600 hover:text-stone-800"
                                        onClick={() => setIsEditing(true)}
                                        leftIcon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
                                    >
                                        Edit Tribe Name
                                    </ClayButton>
                                )}

                                <ClayButton
                                    variant="danger"
                                    className="w-full justify-start"
                                    onClick={handleLeaveTribe}
                                    isLoading={loading}
                                    leftIcon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>}
                                >
                                    Leave Tribe
                                </ClayButton>
                            </div>
                        </div>

                        {/* Danger Zone - Delete Tribe */}
                        <div className="pt-4 mt-2 border-t border-red-100">
                            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                                <h4 className="text-sm font-bold text-red-800 mb-1 flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                    Danger Zone
                                </h4>
                                <p className="text-xs text-red-600 mb-3 leading-relaxed">
                                    Permanently delete this tribe and all its data. This action cannot be undone.
                                </p>
                                <ClayButton
                                    variant="danger"
                                    className="w-full justify-center bg-red-100/50 hover:bg-red-500 text-red-600 hover:text-white border-red-200 hover:border-red-600 transition-all font-bold text-xs h-9 uppercase tracking-wide"
                                    onClick={async () => {
                                        if (confirm(`Are you absolutely sure you want to delete "${group.name}"? This cannot be undone.`)) {
                                            // Double confirm for safety
                                            const confirmation = prompt(`Type "${group.name}" to confirm deletion:`);
                                            if (confirmation === group.name) {
                                                setLoading(true);
                                                const { deleteGroupAction } = await import("@/actions/groups");
                                                const res = await deleteGroupAction(group.id);

                                                if (res?.message) {
                                                    toast.error(res.message);
                                                    setLoading(false);
                                                } else {
                                                    toast.success("Tribe deleted.");
                                                    router.push("/dashboard");
                                                }
                                            } else if (confirmation !== null) {
                                                toast.error("Tribe name did not match. Deletion cancelled.");
                                            }
                                        }
                                    }}
                                    isLoading={loading}
                                >
                                    Delete Tribe
                                </ClayButton>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
