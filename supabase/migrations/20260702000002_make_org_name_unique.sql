-- =====================================================
-- Migration: Enforce unique organization names
-- =====================================================
-- Phase: 1 of 1 (Single-phase migration)
-- Breaking: Potentially (if duplicates exist in production)
-- Rollback: DROP INDEX IF EXISTS organizations_name_unique_idx;
--          (Safe rollback - no data loss)
-- 
-- Context:
--   Prevent duplicate organization names in the system. This ensures
--   data quality and prevents user confusion when searching for companies.
--   Case-insensitive uniqueness means "Acme Corp" and "acme corp" are
--   considered duplicates.
--
-- Related ADR: ADR-043 (Enforce Unique Organization Names) - to be created
-- Related Verification: .kiro/verifications/2026-07-17_unique-org-names_pre-migration-check.md
--
-- ⚠️ CRITICAL PRE-DEPLOYMENT CHECK REQUIRED:
--   This migration will FAIL if duplicate organization names exist in production.
--   You MUST run the duplicate check query BEFORE deploying this migration.
--
--   Query: SELECT LOWER(name), COUNT(*) FROM organizations WHERE name IS NOT NULL
--          GROUP BY LOWER(name) HAVING COUNT(*) > 1;
--
--   Expected result: 0 rows (no duplicates)
--   If duplicates found: See .kiro/verifications/2026-07-17_unique-org-names_pre-migration-check.md
--                       for cleanup procedures
--
-- Deployment order:
--   1. ⚠️ Run duplicate check query on production (MANDATORY)
--   2. If duplicates found: Execute cleanup plan (with approval)
--   3. Re-verify 0 duplicates
--   4. Deploy to staging and test
--   5. Get production deployment approval
--   6. Deploy this migration during low-traffic window
--   7. Monitor for constraint violation errors
--   8. Update application code to handle unique constraint errors
--
-- Data Impact:
--   - Existing rows: No change (assuming no duplicates)
--   - New rows: Cannot have duplicate names (case-insensitive)
--   - NULL names: Still allowed (partial index excludes NULLs)
--   - Application: Must handle unique constraint errors gracefully
--
-- Rollback:
--   DROP INDEX IF EXISTS organizations_name_unique_idx;
--   Safe to rollback anytime - no data loss
--
-- Monitoring:
--   - Track unique constraint violation errors (PostgreSQL error code 23505)
--   - Monitor application error rate for DUPLICATE_NAME errors
--   - Track user impact on signup flow
-- =====================================================

-- Add unique constraint on organization name (case-insensitive)
-- Uses partial index to allow multiple NULL names (for onboarding flow)
CREATE UNIQUE INDEX IF NOT EXISTS organizations_name_unique_idx 
    ON public.organizations (LOWER(name)) 
    WHERE name IS NOT NULL;

-- Document the constraint
COMMENT ON INDEX organizations_name_unique_idx IS 
    'Ensures organization names are unique (case-insensitive). NULL names are allowed during onboarding (see ADR-042). Uses partial index to exclude NULLs from uniqueness check.';
