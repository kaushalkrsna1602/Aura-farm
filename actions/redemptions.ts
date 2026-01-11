"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// ============================================================================
// TYPES
// ============================================================================

export type RedemptionFormState = {
    errors?: {
        form?: string[];
    };
    message?: string;
    success?: boolean;
};

// Redemption with reward and user profile info
export type RedemptionWithDetails = {
    id: string;
    reward_id: string;
    group_id: string;
    user_id: string;
    status: "pending" | "approved" | "rejected";
    points_deducted: number;
    approved_by: string | null;
    admin_notes: string | null;
    created_at: string;
    updated_at: string;
    reward: {
        title: string;
        icon: string | null;
    };
    profile: {
        full_name: string | null;
        avatar_url: string | null;
    };
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Validates that the current user is an admin of the specified group.
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

// ============================================================================
// SERVER ACTIONS
// ============================================================================

/**
 * Fetches all pending redemption requests for a group.
 * Only returns pending status for admin view.
 */
export async function getPendingRedemptionsAction(
    groupId: string
): Promise<{ data: RedemptionWithDetails[] | null; error?: string }> {
    const supabase = await createClient();

    // Validate admin
    const admin = await validateAdmin(supabase, groupId);
    if (!admin) {
        return { data: null, error: "Unauthorized. Only admins can view pending redemptions." };
    }

    try {
        const { data, error } = await supabase
            .from("reward_redemptions")
            .select(`
                *,
                reward:reward_id (
                    title,
                    icon
                ),
                profile:user_id (
                    full_name,
                    avatar_url
                )
            `)
            .eq("group_id", groupId)
            .eq("status", "pending")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("GET PENDING REDEMPTIONS ERROR:", error);
            return { data: null, error: "Failed to fetch pending redemptions." };
        }

        // Transform the data to match our expected type
        const formattedData = (data || []).map((item) => ({
            ...item,
            reward: Array.isArray(item.reward) ? item.reward[0] : item.reward,
            profile: Array.isArray(item.profile) ? item.profile[0] : item.profile,
        })) as RedemptionWithDetails[];

        return { data: formattedData };
    } catch (e) {
        console.error("UNEXPECTED ERROR:", e);
        return { data: null, error: "Unexpected error occurred." };
    }
}

/**
 * Approves a pending redemption request.
 * Deducts points from the user and marks the request as approved.
 */
export async function approveRedemptionAction(
    redemptionId: string
): Promise<RedemptionFormState> {
    const supabase = await createClient();

    // Fetch the redemption to get group_id and user_id
    const { data: redemption, error: fetchError } = await supabase
        .from("reward_redemptions")
        .select("*, reward:reward_id (title)")
        .eq("id", redemptionId)
        .single();

    if (fetchError || !redemption) {
        return { message: "Redemption request not found." };
    }

    if (redemption.status !== "pending") {
        return { message: "This request has already been processed." };
    }

    // Validate admin
    const admin = await validateAdmin(supabase, redemption.group_id);
    if (!admin) {
        return { message: "Unauthorized. Only admins can approve redemptions." };
    }

    try {
        // 1. Update redemption status
        const { error: updateError } = await supabase
            .from("reward_redemptions")
            .update({
                status: "approved",
                approved_by: admin.id,
            })
            .eq("id", redemptionId);

        if (updateError) {
            console.error("APPROVE REDEMPTION ERROR:", updateError);
            return { message: "Failed to approve redemption." };
        }

        // 2. Deduct points via RPC
        // @ts-ignore - RPC function exists in database
        const { error: rpcError } = await supabase.rpc("increment_aura", {
            p_group_id: redemption.group_id,
            p_user_id: redemption.user_id,
            p_amount: -redemption.points_deducted,
        });

        if (rpcError) {
            console.error("RPC ERROR:", rpcError);
            // Rollback the status update
            await supabase
                .from("reward_redemptions")
                .update({ status: "pending", approved_by: null })
                .eq("id", redemptionId);
            return { message: "Failed to deduct points." };
        }

        // 3. Create transaction record
        const rewardTitle = Array.isArray(redemption.reward)
            ? redemption.reward[0]?.title
            : redemption.reward?.title;

        const { error: transactionError } = await supabase
            .from("transactions")
            .insert({
                group_id: redemption.group_id,
                from_id: redemption.user_id,
                to_id: null,
                amount: -redemption.points_deducted,
                reason: `Redeemed (Approved): ${rewardTitle}`,
            });

        if (transactionError) {
            console.error("TRANSACTION INSERT ERROR:", transactionError);
            // Non-critical, log but don't fail
        }

        revalidatePath(`/tribe/${redemption.group_id}`);
        return { success: true };
    } catch (e) {
        console.error("APPROVE ERROR:", e);
        return { message: "Unexpected error occurred." };
    }
}

/**
 * Rejects a pending redemption request.
 * Does NOT deduct points. Optionally adds admin notes.
 */
export async function rejectRedemptionAction(
    redemptionId: string,
    notes?: string
): Promise<RedemptionFormState> {
    const supabase = await createClient();

    // Fetch the redemption to get group_id
    const { data: redemption, error: fetchError } = await supabase
        .from("reward_redemptions")
        .select("group_id, status")
        .eq("id", redemptionId)
        .single();

    if (fetchError || !redemption) {
        return { message: "Redemption request not found." };
    }

    if (redemption.status !== "pending") {
        return { message: "This request has already been processed." };
    }

    // Validate admin
    const admin = await validateAdmin(supabase, redemption.group_id);
    if (!admin) {
        return { message: "Unauthorized. Only admins can reject redemptions." };
    }

    try {
        const { error } = await supabase
            .from("reward_redemptions")
            .update({
                status: "rejected",
                approved_by: admin.id,
                admin_notes: notes || null,
            })
            .eq("id", redemptionId);

        if (error) {
            console.error("REJECT REDEMPTION ERROR:", error);
            return { message: "Failed to reject redemption." };
        }

        revalidatePath(`/tribe/${redemption.group_id}`);
        return { success: true };
    } catch (e) {
        console.error("REJECT ERROR:", e);
        return { message: "Unexpected error occurred." };
    }
}

/**
 * Gets redemption history for a user in a group.
 */
export async function getUserRedemptionsAction(
    groupId: string
): Promise<{ data: RedemptionWithDetails[] | null; error?: string }> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { data: null, error: "Not authenticated." };
    }

    try {
        const { data, error } = await supabase
            .from("reward_redemptions")
            .select(`
                *,
                reward:reward_id (
                    title,
                    icon
                ),
                profile:user_id (
                    full_name,
                    avatar_url
                )
            `)
            .eq("group_id", groupId)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("GET USER REDEMPTIONS ERROR:", error);
            return { data: null, error: "Failed to fetch redemptions." };
        }

        const formattedData = (data || []).map((item) => ({
            ...item,
            reward: Array.isArray(item.reward) ? item.reward[0] : item.reward,
            profile: Array.isArray(item.profile) ? item.profile[0] : item.profile,
        })) as RedemptionWithDetails[];

        return { data: formattedData };
    } catch (e) {
        console.error("UNEXPECTED ERROR:", e);
        return { data: null, error: "Unexpected error occurred." };
    }
}

// ============================================================================
// ALERT TYPE
// ============================================================================

type RedemptionAlert = {
    id: string;
    status: "approved" | "rejected";
    reward_title: string;
    reward_icon: string | null;
    points: number;
    admin_notes: string | null;
    updated_at: string;
};

/**
 * Gets recent redemption status changes (approved/rejected within last 24 hours)
 * for showing toast notifications to users.
 */
export async function getRecentRedemptionAlertsAction(
    groupId: string
): Promise<{ data: RedemptionAlert[] | null; error?: string }> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { data: null, error: "Not authenticated." };
    }

    try {
        // Get redemptions updated in last 24 hours that are approved or rejected
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
            .from("reward_redemptions")
            .select(`
                id,
                status,
                points_deducted,
                admin_notes,
                updated_at,
                reward:reward_id (
                    title,
                    icon
                )
            `)
            .eq("group_id", groupId)
            .eq("user_id", user.id)
            .in("status", ["approved", "rejected"])
            .gte("updated_at", twentyFourHoursAgo)
            .order("updated_at", { ascending: false })
            .limit(5);

        if (error) {
            console.error("GET REDEMPTION ALERTS ERROR:", error);
            return { data: null, error: "Failed to fetch alerts." };
        }

        const alerts: RedemptionAlert[] = (data || []).map((item) => {
            const reward = Array.isArray(item.reward) ? item.reward[0] : item.reward;
            return {
                id: item.id,
                status: item.status as "approved" | "rejected",
                reward_title: reward?.title || "Unknown Reward",
                reward_icon: reward?.icon || null,
                points: item.points_deducted,
                admin_notes: item.admin_notes,
                updated_at: item.updated_at,
            };
        });

        return { data: alerts };
    } catch (e) {
        console.error("UNEXPECTED ERROR:", e);
        return { data: null, error: "Unexpected error occurred." };
    }
}

