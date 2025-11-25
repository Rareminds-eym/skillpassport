-- Migration: Remove redundant user_role column from subscriptions table
-- The entity_type in users table is more accurate and specific

-- Step 1: Drop the constraint that validates user_role
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS check_school_role_valid;

-- Step 2: Drop the user_role column
ALTER TABLE public.subscriptions 
DROP COLUMN IF EXISTS user_role;

-- Note: This is safe because:
-- 1. The entity_type in users table provides more accurate information
-- 2. We're already fetching entity_type from users table in the application
-- 3. The user_role was just a mapped/derived value, not source of truth
