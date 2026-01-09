"use client";

import { createClient } from "@/utils/supabase/client";
import { ClayButton } from "@/components/ui/clay-button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function SignOutButton() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignOut = async () => {
        setLoading(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    return (
        <ClayButton
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            isLoading={loading}
            leftIcon={<LogOut className="w-4 h-4" />}
            className="text-stone-500 hover:text-stone-700 hover:bg-stone-200/50"
        >
            Log Out
        </ClayButton>
    );
}
