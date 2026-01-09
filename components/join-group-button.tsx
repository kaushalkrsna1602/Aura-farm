"use client";

import { useState } from "react";
import { joinGroupAction } from "@/actions/groups";
import { ClayButton } from "@/components/ui/clay-button";
import { useRouter } from "next/navigation";

export function JoinGroupButton({ groupId }: { groupId: string }) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleJoin = async () => {
        setIsLoading(true);
        const result = await joinGroupAction(groupId);

        if (result?.message) {
            alert(result.message); // Simple alert for now
            setIsLoading(false);
        } else {
            router.refresh();
            // Optionally we could redirect or just let the refresh handle the UI update
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
