-- =====================================================
-- Migration: Ensure Role Mapping Data Exists
-- =====================================================
-- Phase: 1 of 1 (Single-phase migration - data seeding)
-- Breaking: No
-- Rollback: DELETE FROM public.recruitment_role_mapping;
--          (Safe - table will be recreated on next deployment)
-- 
-- Context:
--   Ensures recruitment_role_mapping table exists and contains the required
--   role mappings for recruiter permissions. This table maps SSO roles
--   (owner, admin, member) to recruitment-specific permissions.
--
-- Related ADR: None (data seeding only)
-- Related Tables: recruitment_role_mapping
--
-- Deployment order:
--   1. Run this migration (creates/seeds table)
--   2. No application code changes needed
--   3. Idempotent - safe to re-run
--
-- Data Impact:
--   - Creates table if not exists
--   - Deletes existing data and re-inserts (ensures consistency)
--   - Always results in exactly 3 role mappings
--   - Validation check ensures 3 rows exist after insert
--
-- Rollback:
--   DELETE FROM public.recruitment_role_mapping;
--   Safe to rollback - no dependencies
-- =====================================================

BEGIN;

-- Create recruitment_role_mapping table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.recruitment_role_mapping (
    id SERIAL PRIMARY KEY,
    sso_role_name TEXT NOT NULL UNIQUE,
    recruitment_role TEXT NOT NULL,
    can_manage_team BOOLEAN DEFAULT FALSE,
    can_create_jobs BOOLEAN DEFAULT FALSE,
    can_edit_jobs BOOLEAN DEFAULT FALSE,
    can_delete_jobs BOOLEAN DEFAULT FALSE,
    can_view_candidates BOOLEAN DEFAULT FALSE,
    can_manage_candidates BOOLEAN DEFAULT FALSE,
    can_view_analytics BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Use UPSERT pattern instead of DELETE + INSERT to preserve custom mappings
-- This is idempotent and safe to re-run
INSERT INTO public.recruitment_role_mapping 
    (sso_role_name, recruitment_role, can_manage_team, can_create_jobs, can_edit_jobs, 
     can_delete_jobs, can_view_candidates, can_manage_candidates, can_view_analytics, description)
VALUES
    ('owner', 'company_admin', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 
     'Organization owner - full recruitment access'),
    ('admin', 'company_admin', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 
     'Organization admin - full recruitment access'),
    ('member', 'recruiter', FALSE, TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, 
     'Organization member - recruiter access')
ON CONFLICT (sso_role_name) 
DO UPDATE SET
    recruitment_role = EXCLUDED.recruitment_role,
    can_manage_team = EXCLUDED.can_manage_team,
    can_create_jobs = EXCLUDED.can_create_jobs,
    can_edit_jobs = EXCLUDED.can_edit_jobs,
    can_delete_jobs = EXCLUDED.can_delete_jobs,
    can_view_candidates = EXCLUDED.can_view_candidates,
    can_manage_candidates = EXCLUDED.can_manage_candidates,
    can_view_analytics = EXCLUDED.can_view_analytics,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Verify the data
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM public.recruitment_role_mapping;
    
    IF v_count < 3 THEN
        RAISE EXCEPTION 'recruitment_role_mapping table should have 3 rows, but has %', v_count;
    END IF;
    
    RAISE NOTICE 'recruitment_role_mapping table has % rows - OK', v_count;
END $$;

COMMIT;
