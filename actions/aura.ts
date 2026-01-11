"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function giveAuraAction(groupId: string, targetUserId: string, amount: number = 1, message: string = "Quick Boost") {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { message: "You must be logged in." };
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

        // 2. Atomic Update via RPC
        // @ts-ignore
        const { error: rpcError } = await supabase.rpc('increment_aura', {
            p_group_id: groupId,
            p_user_id: targetUserId,
            p_amount: amount
        });

        if (rpcError) {
            console.error("RPC ERROR:", rpcError);
            // Fallback to manual update if RPC fails (e.g. function not created yet)
            // But for now, let's treat it as critical failure or try manual as backup?
            // Sticking to "Production Candidate" means we expect RPC to work.
            // But to be safe during dev transitions, maybe fetch/update fallback is nice, 
            // BUT the user specifically asked to use RPC. So I will return error.
            return { message: "Failed to update points. Check database functions." };
        }

        revalidatePath(`/tribe/${groupId}`);
        return { success: true };

    } catch (e) {
        console.error("GIVE AURA ERROR:", e);
        return { message: "Unexpected error" };
    }
}
