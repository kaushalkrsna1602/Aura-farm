"use client";

import { useState } from "react";
import { joinGroupAction } from "@/actions/groups";
import { ClayButton } from "@/components/ui/clay-button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function JoinGroupButton({ groupId }: { groupId: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleJoin = async () => {
        setIsLoading(true);
        const result = await joinGroupAction(groupId);

        if (result?.message) {
            toast.error(result.message);
            if (result.message.includes("logged in")) {
                router.push("/login");
            }
            setIsLoading(false);
        } else {
            toast.success("Joined tribe!");
            router.refresh();
        }
    };

    return (
        <ClayButton
            size="lg"
            variant="primary"
            onClick={handleJoin}
            isLoading={isLoading}
            className="px-12 text-xl"
        >
            Join Tribe
        </ClayButton>
    );
}
