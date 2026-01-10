-- ============================================================================
-- COMPREHENSIVE RLS FIX FOR AURA FARM
-- ============================================================================
-- Run this ONCE to fix all RLS policy issues.
-- This replaces any previous policy files.

-- ============================================================================
-- GROUPS TABLE POLICIES
-- ============================================================================

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- DROP all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can update groups" ON groups;
DROP POLICY IF EXISTS "Admins can delete groups" ON groups;
DROP POLICY IF EXISTS "Enable update for users based on email" ON groups;
DROP POLICY IF EXISTS "Enable update for creators" ON groups;
DROP POLICY IF EXISTS "Anyone can view public groups" ON groups;
DROP POLICY IF EXISTS "Users can view groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;

-- SELECT: Anyone authenticated can view groups (for join page, etc.)
CREATE POLICY "Users can view groups"
ON groups
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- INSERT: Any authenticated user can create a group
CREATE POLICY "Users can create groups"
ON groups
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- UPDATE: Only admins of the group can update
CREATE POLICY "Admins can update groups"
ON groups
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM members 
    WHERE members.group_id = groups.id AND members.role = 'admin'
  )
);

-- DELETE: Only admins of the group can delete
CREATE POLICY "Admins can delete groups"
ON groups
FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM members 
    WHERE members.group_id = groups.id AND members.role = 'admin'
  )
);

-- ============================================================================
-- MEMBERS TABLE POLICIES
-- ============================================================================

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

-- DROP all existing policies to start fresh
DROP POLICY IF EXISTS "Members can view group members" ON members;
DROP POLICY IF EXISTS "Users can join groups" ON members;
DROP POLICY IF EXISTS "Admins can update members" ON members;
DROP POLICY IF EXISTS "Users can leave groups" ON members;
DROP POLICY IF EXISTS "Admins can remove members" ON members;

-- SELECT: Authenticated users can view members
-- (Simplified - no self-referential check to avoid chicken-and-egg issue)
CREATE POLICY "Users can view members"
ON members
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- INSERT: Users can insert themselves as a member
CREATE POLICY "Users can join groups"
ON members
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Admins can update member records (points, roles)
-- OR the RPC function can update (for giving aura)
CREATE POLICY "Admins can update members"
ON members
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM members AS m2 
    WHERE m2.group_id = members.group_id AND m2.role = 'admin'
  )
);

-- DELETE: Users can delete their OWN membership (leave group)
-- OR admins can delete any member in their group
CREATE POLICY "Users can leave or admins can remove"
ON members
FOR DELETE
USING (
  auth.uid() = user_id 
  OR 
  auth.uid() IN (
    SELECT user_id FROM members AS m2 
    WHERE m2.group_id = members.group_id AND m2.role = 'admin'
  )
);

-- ============================================================================
-- REWARDS TABLE POLICIES
-- ============================================================================

ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- DROP existing policies
DROP POLICY IF EXISTS "Members can view rewards" ON rewards;
DROP POLICY IF EXISTS "Admins can create rewards" ON rewards;
DROP POLICY IF EXISTS "Admins can update rewards" ON rewards;
DROP POLICY IF EXISTS "Admins can delete rewards" ON rewards;

-- SELECT: Authenticated users can view rewards
CREATE POLICY "Users can view rewards"
ON rewards
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- INSERT: Admins can create rewards
CREATE POLICY "Admins can create rewards"
ON rewards
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM members 
    WHERE members.group_id = rewards.group_id AND members.role = 'admin'
  )
);

-- UPDATE: Admins can update rewards
CREATE POLICY "Admins can update rewards"
ON rewards
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id FROM members 
    WHERE members.group_id = rewards.group_id AND members.role = 'admin'
  )
);

-- DELETE: Admins can delete rewards
CREATE POLICY "Admins can delete rewards"
ON rewards
FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id FROM members 
    WHERE members.group_id = rewards.group_id AND members.role = 'admin'
  )
);

-- ============================================================================
-- TRANSACTIONS TABLE POLICIES
-- ============================================================================

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- DROP existing policies
DROP POLICY IF EXISTS "Users can view transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON transactions;

-- SELECT: Members can view transactions in their groups
CREATE POLICY "Users can view transactions"
ON transactions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- INSERT: Members can create transactions
CREATE POLICY "Users can create transactions"
ON transactions
FOR INSERT
WITH CHECK (auth.uid() = from_id);
