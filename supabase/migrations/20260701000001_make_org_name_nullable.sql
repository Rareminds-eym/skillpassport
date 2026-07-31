-- =====================================================
-- Migration: Make organization name nullable
-- =====================================================
-- Phase: 1 of 3 (Expand)
-- Breaking: No
-- Rollback: ALTER TABLE organizations ALTER COLUMN name SET NOT NULL;
--          (Safe only if no rows have NULL names)
-- 
-- Context:
--   Supporting new recruiter onboarding flow where org name is collected
--   in Step 1 of onboarding (after signup, before subscription) instead
--   of during signup. This reduces friction and allows users to search
--   for existing companies during onboarding.
--
-- Related ADR: ADR-042 (Allow Null Org Names During Onboarding)
-- Related Plan: .kiro/plans/2026-07-17_org-name-nullable_migration-plan.md
--
-- Deployment order:
--   1. Run this migration (makes name nullable)
--   2. Deploy application code that handles null org names
--   3. Add monitoring alert for org names null > 24 hours
--   4. Phase 2: Monitoring only (no backfill - nulls are intentional)
--   5. Phase 3: Not planned (nulls serve valid business purpose)
--
-- Data Impact:
--   - Existing rows: No change (all have names)
--   - New rows: May have NULL name for up to 24 hours
--   - Validation: Application code enforces name required in onboarding
--
-- Monitoring:
--   - Track count of orgs with NULL names
--   - Alert if NULL name persists > 24 hours
--   - Track onboarding completion rate
-- =====================================================

-- Make organization name nullable
ALTER TABLE organizations 
ALTER COLUMN name DROP NOT NULL;

-- Add detailed comment explaining nullable name
COMMENT ON COLUMN organizations.name IS 
  'Organization name. Can be NULL temporarily during recruiter onboarding (first 24 hours after creation). Synced from SSO. Must be set during onboarding Step 1. Application code validates and enforces name requirement.';
