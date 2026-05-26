-- Migration: Add unique constraint for active subscriptions per user
-- This prevents race conditions where multiple concurrent requests could create duplicate subscriptions
-- Issue #1 from code review

-- Drop existing index if it exists (in case it was created differently)
DROP INDEX IF EXISTS public.idx_subscriptions_user_active;

-- Create unique index on user_id where status = 'active'
-- This ensures only one active subscription per user at database level
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_active 
ON public.subscriptions(user_id) 
WHERE status = 'active';

-- Add comment explaining the constraint
COMMENT ON INDEX public.idx_subscriptions_user_active IS 
'Ensures only one active subscription per user. Prevents race conditions in subscription creation.';
