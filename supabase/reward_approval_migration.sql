-- ============================================================================
-- REWARD APPROVAL SYSTEM MIGRATION
-- ============================================================================
-- Run this migration to add the reward approval workflow feature.
-- This adds:
-- 1. requires_approval column to rewards table
-- 2. reward_redemptions table for tracking approval requests

-- ============================================================================
-- STEP 1: ALTER REWARDS TABLE
-- ============================================================================

-- Add requires_approval column to rewards table
ALTER TABLE rewards ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- STEP 2: CREATE REWARD_REDEMPTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    points_deducted INTEGER NOT NULL,
    approved_by UUID REFERENCES profiles(id),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_group_status 
ON reward_redemptions(group_id, status);

CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user 
ON reward_redemptions(user_id);

-- ============================================================================
-- STEP 3: RLS POLICIES FOR REWARD_REDEMPTIONS
-- ============================================================================

ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;

-- SELECT: Members can view redemptions in their groups
CREATE POLICY "Users can view redemptions in their groups"
ON reward_redemptions
FOR SELECT
USING (
    auth.uid() IN (
        SELECT user_id FROM members 
        WHERE members.group_id = reward_redemptions.group_id
    )
);

-- INSERT: Members can create redemption requests for themselves
CREATE POLICY "Users can request redemptions"
ON reward_redemptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Only admins can update redemption status (approve/reject)
CREATE POLICY "Admins can update redemptions"
ON reward_redemptions
FOR UPDATE
USING (
    auth.uid() IN (
        SELECT user_id FROM members 
        WHERE members.group_id = reward_redemptions.group_id 
        AND members.role = 'admin'
    )
);

-- DELETE: Admins can delete redemptions, users can delete their own pending ones
CREATE POLICY "Users can delete own pending or admins can delete any"
ON reward_redemptions
FOR DELETE
USING (
    (auth.uid() = user_id AND status = 'pending')
    OR
    auth.uid() IN (
        SELECT user_id FROM members 
        WHERE members.group_id = reward_redemptions.group_id 
        AND members.role = 'admin'
    )
);

-- ============================================================================
-- STEP 4: HELPER FUNCTION FOR UPDATING TIMESTAMPS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS update_reward_redemptions_updated_at ON reward_redemptions;
CREATE TRIGGER update_reward_redemptions_updated_at
    BEFORE UPDATE ON reward_redemptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
