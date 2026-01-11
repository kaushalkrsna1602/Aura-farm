"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function giveAuraAction(groupId: string, targetUserId: string, amount: number = 1, message: string = "Quick Boost") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { message: "You must be logged in." };
    }

    // Validate amount (defense in depth - UI should also validate)
    if (amount < 1 || amount > 100) {
        return { message: "Amount must be between 1 and 100." };
    }

    // Validate sender is a member of the group (defense in depth - RLS also protects)
    const { data: member } = await supabase
        .from("members")
        .select("user_id")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();

    if (!member) {
        return { message: "You must be a member of this tribe to give aura." };
    }

    try {
        // 1. Create Transaction
        const { error: transactionError } = await supabase
            .from("transactions")
            .insert({
                group_id: groupId,
                from_id: user.id,
                to_id: targetUserId,
                amount: amount,
                reason: message,
            });

        if (transactionError) {
            console.error("TRANSACTION ERROR:", transactionError);
            return { message: "Failed to give aura." };
        }

        // 2. Atomic Update via RPC (points are generated, not deducted from sender)
        // @ts-ignore
        const { error: rpcError } = await supabase.rpc('increment_aura', {
            p_group_id: groupId,
            p_user_id: targetUserId,
            p_amount: amount
        });

        if (rpcError) {
            console.error("RPC ERROR:", rpcError);
            return { message: "Failed to update points. Check database functions." };
        }

        revalidatePath(`/tribe/${groupId}`);
        return { success: true };

    } catch (e) {
        console.error("GIVE AURA ERROR:", e);
        return { message: "Unexpected error" };
    }
}

