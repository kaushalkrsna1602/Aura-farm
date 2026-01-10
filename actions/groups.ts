"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50),
  description: z.string().optional(), // Note: description is not in the DB schema provided, checking if I explicitly need it. The prompt schema for groups ONLY has: id, name, is_public, invite_code, created_by.
  // Wait, the prompt schema for 'groups' is: id, name, is_public, invite_code, created_by.
  // There is NO description column in the provided schema. I will omit it from the DB insert, but maybe keep it in the UI if we want to add it later or if I missed it.
  // Checking prompt again... "Table 2: groups (The Teams) - id, name, is_public, invite_code, created_by".
  // Okay, no description. I will NOT insert description.
  isPublic: z.boolean().default(false),
});

export type CreateGroupState = {
  errors?: {
    name?: string[];
    form?: string[];
  };
  message?: string;
};

// Unused function removed

export async function createGroupAction(prevState: CreateGroupState | null, formData: FormData) {
  const supabase = await createClient();

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { message: "You must be logged in to create a group." };
  }

  // 2. Validate Input
  const validatedFields = createGroupSchema.safeParse({
    name: formData.get("name"),
    isPublic: formData.get("isPublic") === "on",
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Group.",
    };
  }

  const { name, isPublic } = validatedFields.data;
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  let groupId: string | null = null;

  try {
    // 3. Insert Group
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        name,
        is_public: isPublic,
        invite_code: inviteCode,
        created_by: user.id,
      })
      .select()
      .single();

    if (groupError) {
      console.error("GROUPS INSERT ERROR:", groupError);
      return { message: "Failed to create group. Check RLS policies." };
    }

    groupId = group.id;

    // 4. Insert Member
    const { error: memberError } = await supabase
      .from("members")
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: "admin",
        aura_points: 0
      });

    if (memberError) {
      console.error("MEMBERS INSERT ERROR:", memberError);
      return { message: "Failed to join group. Check RLS policies." };
    }

  } catch (e) {
    console.error("UNEXPECTED ERROR:", e);
    return { message: "Unexpected error" };
  }

  revalidatePath("/dashboard");
  redirect(`/group/${groupId}`);
}

export async function joinGroupAction(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { message: "You must be logged in to join a group." };
  }

  try {
    // Check if already a member
    const { data: existingMember } = await supabase
      .from("members")
      .select("group_id")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      return { message: "You are already a member of this tribe." };
    }

    // Insert Member
    const { error: memberError } = await supabase
      .from("members")
      .insert({
        group_id: groupId,
        user_id: user.id,
        role: "member",
        aura_points: 0
      });

    if (memberError) {
      console.error("JOIN MEMBER ERROR:", memberError);
      return { message: "Failed to join group." };
    }

    revalidatePath(`/group/${groupId}`);
    revalidatePath("/dashboard");
    return { success: true };

  } catch (e) {
    console.error("JOIN ERROR:", e);
    return { message: "Unexpected error" };
  }
}

export async function updateGroupAction(groupId: string, newName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { message: "Unauthorized" };

  try {
    // Check if admin
    const { data: member } = await supabase
      .from("members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (member?.role !== 'admin') {
      return { message: "Only admins can update the group." };
    }

    const { data: updatedGroup, error } = await supabase
      .from("groups")
      .update({ name: newName })
      .eq("id", groupId)
      .select();

    if (error) {
      console.error("UPDATE GROUP ERROR:", error);
      return { message: "Failed to update group." };
    }

    if (!updatedGroup || updatedGroup.length === 0) {
      return { message: "Update failed. You may not have permission." };
    }

    revalidatePath(`/group/${groupId}`);
    revalidatePath("/dashboard");
    return { success: true };

  } catch (e) {
    return { message: "Unexpected error" };
  }
}

export async function leaveGroupAction(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { message: "Unauthorized" };

  try {
    // First, check if user is a member and get their role
    const { data: currentMember, error: memberError } = await supabase
      .from("members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !currentMember) {
      return { message: "You are not a member of this tribe." };
    }

    // If user is an admin, check if they are the last admin
    if (currentMember.role === "admin") {
      const { count: adminCount } = await supabase
        .from("members")
        .select("*", { count: "exact", head: true })
        .eq("group_id", groupId)
        .eq("role", "admin");

      if (adminCount !== null && adminCount <= 1) {
        return {
          message: "You are the last admin. Please promote another member to admin before leaving, or delete the tribe."
        };
      }
    }

    // Perform the delete with verification
    const { data: deletedMember, error } = await supabase
      .from("members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("LEAVE GROUP ERROR:", error);
      return { message: "Failed to leave group. Please try again." };
    }

    if (!deletedMember) {
      console.error("LEAVE GROUP: No rows deleted");
      return { message: "Failed to leave group. Check permissions." };
    }

    revalidatePath(`/group/${groupId}`);
    revalidatePath("/dashboard");
    return { success: true };

  } catch (e) {
    console.error("LEAVE GROUP UNEXPECTED ERROR:", e);
    return { message: "Unexpected error" };
  }
}

export async function removeMemberAction(groupId: string, targetUserId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { message: "Unauthorized" };

  try {
    // Check if requester is admin
    const { data: requester } = await supabase
      .from("members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (requester?.role !== 'admin') {
      return { message: "Only admins can remove members." };
    }

    const { error } = await supabase
      .from("members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", targetUserId);

    if (error) {
      console.error("REMOVE MEMBER ERROR:", error);
      return { message: "Failed to remove member." };
    }

    revalidatePath(`/group/${groupId}`);
    return { success: true };

  } catch (e) {
    return { message: "Unexpected error" };
  }
}

export async function deleteGroupAction(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { message: "Unauthorized" };

  try {
    // 1. Verify Requestor is Admin of this Group
    const { data: member } = await supabase
      .from("members")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .single();

    if (member?.role !== 'admin') {
      return { message: "Only admins can delete the tribe." };
    }

    // 2. Perform Delete
    // Note: If ON DELETE CASCADE is set up in Postgres, this single call deletes everything.
    // If not, it will fail or leave orphans. Using the "Senior Dev" approach of explicit cleanup isn't strictly necessary with Supabase cascade,
    // but handling the potential error is key.

    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId);

    if (error) {
      console.error("DELETE GROUP ERROR:", error);
      // If FK violation, we might need manual cleanup, but standard Supabase setups handle this via Cascade usually.
      return { message: "Failed to delete group. Ensure all members are removed or try again." };
    }

    revalidatePath("/dashboard");
    return { success: true };

  } catch (e) {
    console.error("DELETE GROUP EXCEPTION:", e);
    return { message: "Unexpected error during deletion." };
  }
}
