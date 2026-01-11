import { createClient } from "@/utils/supabase/server";

/**
 * Validates that the current user is an admin of the specified group.
 * @returns The user object if admin, null otherwise.
 */
export async function validateAdmin(supabase: Awaited<ReturnType<typeof createClient>>, groupId: string) {
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
export async function validateMember(supabase: Awaited<ReturnType<typeof createClient>>, groupId: string) {
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
