-- Enable RLS on rewards table if not already enabled
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SELECT POLICIES
-- ============================================================================

-- All authenticated users can view rewards for groups they are members of
DROP POLICY IF EXISTS "Members can view rewards" ON rewards;
CREATE POLICY "Members can view rewards"
ON rewards
FOR SELECT
USING (
  auth.uid() IN (
    SELECT user_id 
    FROM members 
    WHERE members.group_id = rewards.group_id
  )
);

-- ============================================================================
-- INSERT POLICIES
-- ============================================================================

-- Only admins can create rewards for their groups
DROP POLICY IF EXISTS "Admins can create rewards" ON rewards;
CREATE POLICY "Admins can create rewards"
ON rewards
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT user_id 
    FROM members 
    WHERE members.group_id = rewards.group_id 
    AND members.role = 'admin'
  )
);

-- ============================================================================
-- UPDATE POLICIES
-- ============================================================================

-- Only admins can update rewards for their groups
DROP POLICY IF EXISTS "Admins can update rewards" ON rewards;
CREATE POLICY "Admins can update rewards"
ON rewards
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id 
    FROM members 
    WHERE members.group_id = rewards.group_id 
    AND members.role = 'admin'
  )
);

-- ============================================================================
-- DELETE POLICIES
-- ============================================================================

-- Only admins can delete rewards for their groups
DROP POLICY IF EXISTS "Admins can delete rewards" ON rewards;
CREATE POLICY "Admins can delete rewards"
ON rewards
FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id 
    FROM members 
    WHERE members.group_id = rewards.group_id 
    AND members.role = 'admin'
  )
);
