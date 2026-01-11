"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const createGroupSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").max(50),
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
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Group.",
    };
  }

  const { name } = validatedFields.data;
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  let groupId: string | null = null;

  try {
    // 3. Insert Group
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        name,
        is_public: false, // Enforce private always
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

  revalidatePath("/farm");
  redirect(`/tribe/${groupId}`);
}

// ============================================================================
// CREATE GROUP WITH REWARDS
// ============================================================================

type RewardTemplate = {
  id: string;
  title: string;
  cost: number;
  icon: string;
  requires_approval: boolean;
};

type CreateGroupWithRewardsResult = {
  groupId?: string;
  error?: string;
};

/**
 * Creates a new group with optional preset rewards.
 * Used by the multi-step create group dialog.
 */
export async function createGroupWithRewardsAction(
  name: string,
  rewards: RewardTemplate[]
): Promise<CreateGroupWithRewardsResult> {
  const supabase = await createClient();

  // 1. Auth Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { error: "You must be logged in to create a group." };
  }

  // 2. Validate Name
  const validatedFields = createGroupSchema.safeParse({ name });
  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    return { error: errors.name?.[0] || "Invalid name." };
  }

  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  try {
    // 3. Insert Group
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({
        name: validatedFields.data.name,
        is_public: false,
        invite_code: inviteCode,
        created_by: user.id,
      })
      .select()
      .single();

    if (groupError || !group) {
      console.error("GROUPS INSERT ERROR:", groupError);
      return { error: "Failed to create group." };
    }

    // 4. Insert Member as Admin
    const { error: memberError } = await supabase
      .from("members")
      .insert({
        group_id: group.id,
        user_id: user.id,
        role: "admin",
        aura_points: 0,
      });

    if (memberError) {
      console.error("MEMBERS INSERT ERROR:", memberError);
      // Cleanup: delete the group we just created
      await supabase.from("groups").delete().eq("id", group.id);
      return { error: "Failed to join group." };
    }

    // 5. Insert Rewards (if any selected)
    if (rewards.length > 0) {
      const rewardsToInsert = rewards.map((r) => ({
        group_id: group.id,
        title: r.title,
        cost: r.cost,
        icon: r.icon,
        requires_approval: r.requires_approval,
      }));

      const { error: rewardsError } = await supabase
        .from("rewards")
        .insert(rewardsToInsert);

      if (rewardsError) {
        console.error("REWARDS INSERT ERROR:", rewardsError);
        // Non-critical - group is still created, just log and continue
      }
    }

    revalidatePath("/farm");
    return { groupId: group.id };

  } catch (e) {
    console.error("UNEXPECTED ERROR:", e);
    return { error: "Unexpected error occurred." };
  }
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

    revalidatePath(`/tribe/${groupId}`);
    revalidatePath("/farm");
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

    revalidatePath(`/tribe/${groupId}`);
    revalidatePath("/farm");
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

    revalidatePath(`/tribe/${groupId}`);
    revalidatePath("/farm");
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

    revalidatePath(`/tribe/${groupId}`);
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

    revalidatePath("/farm");
    return { success: true };

  } catch (e) {
    console.error("DELETE GROUP EXCEPTION:", e);
    return { message: "Unexpected error during deletion." };
  }
}
