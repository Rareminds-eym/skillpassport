-- Migration: Add product_id to shadow cache tables
-- Phase: 2 of 3 (Expand) — Additive only, no breaking changes
-- Breaking: No
-- Rollback: Safe — DROP the new columns
--
-- Context: Shadow tables (plans_cache, subscription_cache) need product_id
--          to mirror the Auth DB's product classification.
--
-- Deployment order:
--   1. Run this migration
--   2. Update sync-shadow.ts to propagate product_id
--   3. Trigger a sync to backfill

BEGIN;

-- Add product_id to plans_cache (text, matches products.code for simplicity)
ALTER TABLE public.plans_cache
  ADD COLUMN IF NOT EXISTS product_id text;

-- Add product_id to subscription_cache
ALTER TABLE public.subscription_cache
  ADD COLUMN IF NOT EXISTS product_id text;

-- Indexes for product-based queries
CREATE INDEX IF NOT EXISTS idx_plans_cache_product_id
  ON public.plans_cache(product_id);

CREATE INDEX IF NOT EXISTS idx_subscription_cache_product_id
  ON public.subscription_cache(product_id);

COMMIT;
