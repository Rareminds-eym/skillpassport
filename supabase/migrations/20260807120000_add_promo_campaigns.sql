-- Migration: Add promo_campaigns table
-- Replaces hardcoded RAREMINDS2026 constants with DB-driven campaign config.
-- See docs/LINK_BASED_SUBSCRIPTION_PRICING_README.md §6.1

CREATE TABLE IF NOT EXISTS public.promo_campaigns (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code               text UNIQUE NOT NULL,            -- normalized UPPERCASE referral code
  name               text,                            -- admin label
  applicable_role    text DEFAULT 'all',              -- segment this campaign targets: 'all' / learner / college_admin / school_admin / educator / recruiter / admin
  locked_plan_codes  text[] DEFAULT '{}',              -- plans to force disabled/hidden
  price_overrides    jsonb DEFAULT '{}',               -- { "<plan_code>": { "yearly": 2999 } } — yearly-only
  is_active          boolean DEFAULT true,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

COMMENT ON TABLE public.promo_campaigns IS 'Configurable promo/referral campaigns with plan locking and price overrides. Replaces hardcoded RAREMINDS2026 constants.';

-- Index for the hot path: lookup by code
CREATE INDEX IF NOT EXISTS idx_promo_campaigns_code ON public.promo_campaigns (code) WHERE is_active = true;

-- RLS: service_role only (backend reads via service client)
ALTER TABLE public.promo_campaigns ENABLE ROW LEVEL SECURITY;

-- Seed: the live college-learner campaign (mirrors production as of 2026-08-08).
-- Install CREATE campaigns, NO code-deploy needed to change prices/locks.
INSERT INTO public.promo_campaigns (code, name, applicable_role, locked_plan_codes, price_overrides, is_active)
VALUES (
  'TEST',
  'College Learner Promo 2026',
  'all',
  ARRAY['career_builder', 'discover'],
  '{"skill_starter": {"yearly": 9934}, "career_accelerator": {"yearly": 10000}}'::jsonb,
  true
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  applicable_role = EXCLUDED.applicable_role,
  locked_plan_codes = EXCLUDED.locked_plan_codes,
  price_overrides = EXCLUDED.price_overrides,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Legacy hardcoded code: keep the row so old links resolve to a campaign row
-- (fail-closed, no locks/prices), but deactivate it — old links stop applying
-- rules instead of erroring.
INSERT INTO public.promo_campaigns (code, name, applicable_role, locked_plan_codes, price_overrides, is_active)
VALUES (
  'RAREMINDS2026',
  'Legacy promo (superseded by TEST)',
  'all',
  '{}'::text[],
  '{}'::jsonb,
  false
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  applicable_role = EXCLUDED.applicable_role,
  locked_plan_codes = EXCLUDED.locked_plan_codes,
  price_overrides = EXCLUDED.price_overrides,
  is_active = EXCLUDED.is_active,
  updated_at = now();