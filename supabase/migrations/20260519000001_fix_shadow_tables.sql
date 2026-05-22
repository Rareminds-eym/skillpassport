-- Migration: Fix subscription_cache index + add RLS policies
-- Aligns shadow table constraints with auth DB and adds row-level security.

-- 1. Fix unique index to include grace_period (matches auth DB)
DROP INDEX IF EXISTS idx_sub_cache_active_user;
CREATE UNIQUE INDEX idx_sub_cache_active_user
  ON public.subscription_cache(user_id)
  WHERE status IN ('active', 'pending', 'grace_period');

-- 2. Enable RLS on shadow tables
-- The service_role key bypasses RLS, so backend writes still work.
-- This protects against accidental exposure via the anon key.
ALTER TABLE public.subscription_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans_cache ENABLE ROW LEVEL SECURITY;

-- subscription_cache: users can only read their own subscription
CREATE POLICY "Users can read own subscription cache"
  ON public.subscription_cache FOR SELECT
  USING (auth.uid() = user_id);

-- plans_cache: all authenticated users can read plans
CREATE POLICY "Authenticated users can read plans cache"
  ON public.plans_cache FOR SELECT
  USING (auth.role() = 'authenticated');

-- Service role can do everything (write-through sync)
-- Note: service_role bypasses RLS by default, so no explicit policy needed.
-- These are just for documentation clarity.
