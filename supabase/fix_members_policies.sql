-- ============================================================================
-- MEMBERS TABLE - Row Level Security Policies
-- ============================================================================
-- This file sets up RLS policies for the members table.
-- Members can leave groups, admins can remove members, etc.

-- Enable RLS on members table if not already enabled
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT POLICIES
-- ============================================================================

-- All authenticated users can view members of groups they belong to
DROP POLICY IF EXISTS "Members can view group members" ON members;
CREATE POLICY "Members can view group members"
ON members
FOR SELECT
USING (
  -- User can view members of groups they are also a member of
  auth.uid() IN (
    SELECT user_id 
    FROM members AS m2 
    WHERE m2.group_id = members.group_id
  )
);

-- ============================================================================
-- INSERT POLICIES
-- ============================================================================

-- Any authenticated user can join a group (insert themselves as a member)
DROP POLICY IF EXISTS "Users can join groups" ON members;
CREATE POLICY "Users can join groups"
ON members
FOR INSERT
WITH CHECK (
  -- Users can only insert themselves as a member
  auth.uid() = user_id
);

-- ============================================================================
-- UPDATE POLICIES
-- ============================================================================

-- Admins can update member records (e.g., change roles, update points)
DROP POLICY IF EXISTS "Admins can update members" ON members;
CREATE POLICY "Admins can update members"
ON members
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id 
    FROM members AS m2 
    WHERE m2.group_id = members.group_id 
    AND m2.role = 'admin'
  )
);

-- ============================================================================
-- DELETE POLICIES
-- ============================================================================

-- Users can leave groups (delete their own membership)
DROP POLICY IF EXISTS "Users can leave groups" ON members;
CREATE POLICY "Users can leave groups"
ON members
FOR DELETE
USING (
  -- Users can delete their own membership
  auth.uid() = user_id
);

-- Admins can remove other members from groups
DROP POLICY IF EXISTS "Admins can remove members" ON members;
CREATE POLICY "Admins can remove members"
ON members
FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id 
    FROM members AS m2 
    WHERE m2.group_id = members.group_id 
    AND m2.role = 'admin'
  )
);
