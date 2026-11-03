-- Migration: Add-on fulfilment surfaces (job boost & featured job)
-- Description: Visibility windows on opportunities that job_boost_credits and the
-- featured_job_7d add-on actually deliver. Fulfilment logic lives in
-- functions/shared/lib/entitlement-service.ts (service role only).
-- Source: skill_ecosystem_recruiter_subscription_model_final 1.md sections 6 & 7
-- Idempotent: yes
-- Breaking: no
-- Rollback: DROP COLUMN (data loss limited to active visibility windows)

BEGIN;

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS boosted_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;

-- Learner feed sorts by these columns (functions/api/opportunities/index.ts)
CREATE INDEX IF NOT EXISTS idx_opportunities_visibility
  ON public.opportunities (boosted_until DESC NULLS LAST, featured_until DESC NULLS LAST, created_at DESC);

COMMIT;
