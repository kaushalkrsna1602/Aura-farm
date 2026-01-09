"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function giveAuraAction(groupId: string, targetUserId: string, amount: number = 1) {
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
                reason: "Quick Boost",
            });

        if (transactionError) {
            console.error("TRANSACTION ERROR:", transactionError);
            return { message: "Failed to give aura." };
        }

        // 2. Update Member Aura Points
        // We need to fetch current points first or use atomic increment if possible.
        // Supabase/Postgres doesn't have a simple increment via API without RPC usually, but let's try to fetch and update.
        // Ideally we use an RPC function `increment_aura` but I'll do read-modify-write for MVP.

        const { data: member, error: fetchError } = await supabase
            .from("members")
            .select("aura_points")
            .eq("group_id", groupId)
            .eq("user_id", targetUserId)
            .single();

        if (fetchError || !member) {
            return { message: "Member not found." };
        }

        const newPoints = member.aura_points + amount;

        const { error: updateError } = await supabase
            .from("members")
            .update({ aura_points: newPoints })
            .eq("group_id", groupId)
            .eq("user_id", targetUserId);

        if (updateError) {
            console.error("UPDATE ERROR:", updateError);
            return { message: "Failed to update points." };
        }

        revalidatePath(`/group/${groupId}`);
        return { success: true };

    } catch (e) {
        console.error("GIVE AURA ERROR:", e);
        return { message: "Unexpected error" };
    }
}
