-- ============================================================================
-- CLEANUP OLD REWARDS
-- ============================================================================
-- Run this ONCE to clean up old reward data from before the new implementation.
-- This removes all existing rewards so you can start fresh.

-- Option 1: Delete ALL rewards from ALL tribes
DELETE FROM rewards;

-- Option 2: If you only want to delete from a specific tribe, use this instead:
-- DELETE FROM rewards WHERE group_id = 'your-group-id-here';

-- After running this, create a new tribe and rewards will work correctly.
