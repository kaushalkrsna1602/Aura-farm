"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// ============================================================================
// SCHEMAS
// ============================================================================

const rewardSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title too long"),
    cost: z.number().int().positive("Cost must be positive"),
    icon: z.string().max(10).optional(),
    requires_approval: z.boolean().optional().default(false),
});

// ============================================================================
// TYPES
// ============================================================================

export type RewardFormState = {
    errors?: {
        title?: string[];
        cost?: string[];
        icon?: string[];
        requires_approval?: string[];
        form?: string[];
    };
    message?: string;
    success?: boolean;
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Validates that the current user is an admin of the specified group.
 * @returns The user object if admin, null otherwise.
 */
async function validateAdmin(supabase: Awaited<ReturnType<typeof createClient>>, groupId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: member } = await supabase
        .from("members")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();

    return member?.role === "admin" ? user : null;
}

/**
 * Validates that the current user is a member of the specified group.
 * @returns The member record if found, null otherwise.
 */
async function validateMember(supabase: Awaited<ReturnType<typeof createClient>>, groupId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: member } = await supabase
        .from("members")
        .select("*")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .single();

    return member;
}

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Creates a new reward for a group.
 * Only admins can create rewards.
 */
export async function createRewardAction(
    groupId: string,
    formData: { title: string; cost: number; icon?: string; requires_approval?: boolean }
): Promise<RewardFormState> {
    const supabase = await createClient();

    // Validate admin
    const admin = await validateAdmin(supabase, groupId);
    if (!admin) {
        return { message: "Unauthorized. Only admins can create rewards." };
    }

    // Validate input
    const validated = rewardSchema.safeParse(formData);
    if (!validated.success) {
        return {
            errors: validated.error.flatten().fieldErrors,
            message: "Invalid reward data.",
        };
    }

    const { title, cost, icon, requires_approval } = validated.data;

    try {
        const { error } = await supabase
            .from("rewards")
            .insert({
                group_id: groupId,
                title,
                cost,
                icon: icon || "⭐",
                requires_approval: requires_approval || false,
            });

        if (error) {
            console.error("CREATE REWARD ERROR:", error);
            return { message: "Failed to create reward." };
        }

        revalidatePath(`/tribe/${groupId}`);
        return { success: true };
    } catch (e) {
        console.error("UNEXPECTED ERROR:", e);
        return { message: "Unexpected error occurred." };
    }
}

/**
 * Updates an existing reward.
 * Only admins can update rewards.
 */
export async function updateRewardAction(
    rewardId: string,
    formData: { title: string; cost: number; icon?: string; requires_approval?: boolean }
): Promise<RewardFormState> {
    const supabase = await createClient();

    // First, get the reward to find its group_id
    const { data: reward, error: fetchError } = await supabase
        .from("rewards")
        .select("group_id")
        .eq("id", rewardId)
        .single();

    if (fetchError || !reward) {
        console.error("FETCH REWARD ERROR:", fetchError);
        return { message: "Reward not found." };
    }

    // Validate admin
    const admin = await validateAdmin(supabase, reward.group_id);
    if (!admin) {
        return { message: "Unauthorized. Only admins can update rewards." };
    }

    // Validate input
    const validated = rewardSchema.safeParse(formData);
    if (!validated.success) {
        return {
            errors: validated.error.flatten().fieldErrors,
            message: "Invalid reward data.",
        };
    }

    const { title, cost, icon, requires_approval } = validated.data;

    try {
        // Add .select() to verify the update actually happened
        const { data: updatedReward, error } = await supabase
            .from("rewards")
            .update({ title, cost, icon, requires_approval: requires_approval || false })
            .eq("id", rewardId)
            .select()
            .single();

        if (error) {
            console.error("UPDATE REWARD ERROR:", error);
            return { message: "Failed to update reward." };
        }

        // Check if update actually modified a row
        if (!updatedReward) {
            console.error("UPDATE REWARD: No rows updated");
            return { message: "Failed to update reward. Check permissions." };
        }

        revalidatePath(`/group/${reward.group_id}`);
        return { success: true };
    } catch (e) {
        console.error("UNEXPECTED ERROR:", e);
        return { message: "Unexpected error occurred." };
    }
}

/**
 * Deletes a reward.
 * Only admins can delete rewards.
 */
export async function deleteRewardAction(rewardId: string): Promise<RewardFormState> {
    const supabase = await createClient();

    // First, get the reward to find its group_id
    const { data: reward, error: fetchError } = await supabase
        .from("rewards")
        .select("group_id")
        .eq("id", rewardId)
        .single();

    if (fetchError || !reward) {
        return { message: "Reward not found." };
    }

    // Validate admin
    const admin = await validateAdmin(supabase, reward.group_id);
    if (!admin) {
        return { message: "Unauthorized. Only admins can delete rewards." };
    }

    try {
        const { error } = await supabase
            .from("rewards")
            .delete()
            .eq("id", rewardId);

        if (error) {
            console.error("DELETE REWARD ERROR:", error);
            return { message: "Failed to delete reward." };
        }

        revalidatePath(`/group/${reward.group_id}`);
        return { success: true };
    } catch (e) {
        console.error("UNEXPECTED ERROR:", e);
        return { message: "Unexpected error occurred." };
    }
}

/**
 * Redeems a reward, deducting points from the user's balance.
 * Creates a transaction record for audit trail.
 */
export async function redeemRewardAction(
    groupId: string,
    rewardId: string
): Promise<RewardFormState> {
    const supabase = await createClient();

    // Get the reward details
    const { data: reward, error: rewardError } = await supabase
        .from("rewards")
        .select("*")
        .eq("id", rewardId)
        .eq("group_id", groupId)
        .single();

    if (rewardError || !reward) {
        return { message: "Reward not found." };
    }

    // Validate member
    const member = await validateMember(supabase, groupId);
    if (!member) {
        return { message: "You must be a member of this tribe." };
    }

    // Check sufficient points
    if (member.aura_points < reward.cost) {
        return {
            message: `Insufficient points. You need ${reward.cost} AP but have ${member.aura_points} AP.`
        };
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { message: "Not authenticated." };
    }

    try {
        // Check if reward requires approval
        if (reward.requires_approval) {
            // Check if user already has a pending request for this reward
            const { data: existingPending } = await supabase
                .from("reward_redemptions")
                .select("id")
                .eq("reward_id", rewardId)
                .eq("user_id", user.id)
                .eq("status", "pending")
                .single();

            if (existingPending) {
                return {
                    message: "You already have a pending request for this reward. Please wait for admin approval."
                };
            }

            // Create pending redemption request (don't deduct points yet)
            const { error: redemptionError } = await supabase
                .from("reward_redemptions")
                .insert({
                    reward_id: rewardId,
                    group_id: groupId,
                    user_id: user.id,
                    status: "pending",
                    points_deducted: reward.cost,
                });

            if (redemptionError) {
                console.error("REDEMPTION REQUEST ERROR:", redemptionError);
                return { message: "Failed to submit redemption request." };
            }

            revalidatePath(`/tribe/${groupId}`);
            return { success: true, message: "Redemption request submitted. Awaiting admin approval." };
        }

        // Instant redemption (no approval required)
        // 1. Create redemption transaction (negative amount, to_id is null for redemptions)
        const { error: transactionError } = await supabase
            .from("transactions")
            .insert({
                group_id: groupId,
                from_id: user.id,
                to_id: null,
                amount: -reward.cost,
                reason: `Redeemed: ${reward.title}`,
            });

        if (transactionError) {
            console.error("REDEMPTION TRANSACTION ERROR:", transactionError);
            return { message: "Failed to record redemption." };
        }

        // 2. Deduct points atomically via RPC
        // @ts-ignore - RPC function exists in database
        const { error: rpcError } = await supabase.rpc("increment_aura", {
            p_group_id: groupId,
            p_user_id: user.id,
            p_amount: -reward.cost,
        });

        if (rpcError) {
            console.error("RPC ERROR:", rpcError);
            return { message: "Failed to deduct points." };
        }

        revalidatePath(`/tribe/${groupId}`);
        return { success: true };
    } catch (e) {
        console.error("REDEMPTION ERROR:", e);
        return { message: "Unexpected error occurred." };
    }
}
