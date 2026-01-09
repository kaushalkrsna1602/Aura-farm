-- Enable RLS on groups table if not already enabled
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Drop existing update policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Admins can update groups" ON groups;
DROP POLICY IF EXISTS "Enable update for users based on email" ON groups; -- Common default template name
DROP POLICY IF EXISTS "Enable update for creators" ON groups;

-- Create a new policy that allows admins to update the group
-- This joins with the members table to check if the current user is an 'admin' for the group
CREATE POLICY "Admins can update groups"
ON groups
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT user_id 
    FROM members 
    WHERE members.group_id = groups.id 
    AND members.role = 'admin'
  )
);

-- Also ensure admins can DELETE groups if needed (optional, but good for management)
DROP POLICY IF EXISTS "Admins can delete groups" ON groups;
CREATE POLICY "Admins can delete groups"
ON groups
FOR DELETE
USING (
  auth.uid() IN (
    SELECT user_id 
    FROM members 
    WHERE members.group_id = groups.id 
    AND members.role = 'admin'
  )
);
