-- =====================================================
-- Migration: Fix get_user_org_context Function (JOIN recruitment_settings)
-- =====================================================
-- Phase: 1 of 1 (Function fix - correct JOIN)
-- Breaking: No (API unchanged, fixes bug)
-- Rollback: Restore previous function version from 20260608000001
-- 
-- Context:
--   Fixes get_user_org_context to correctly query recruitment_enabled flag.
--   Previous version assumed recruitment_enabled on organizations table,
--   but it's actually in organization_recruitment_settings table.
--   This caused incorrect values or runtime errors.
--   
--   Changes:
--   - Added LEFT JOIN to organization_recruitment_settings
--   - recruitment_enabled now comes from correct table
--   - Returns FALSE if no recruitment_settings row exists (safe default)
--   - Fixes bug causing incorrect recruitment access
--
-- Related ADR: None (bug fix)
-- Related Tables:
--   - organization_members (primary table)
--   - organizations (basic org info)
--   - recruitment_role_mapping (role translation)
--   - organization_recruitment_settings (recruitment_enabled flag - ADDED)
--
-- Deployment order:
--   1. Run this migration (replaces function)
--   2. No application code changes needed (API unchanged)
--   3. Verify org context returns correct recruitment_enabled value
--   4. Test users with and without recruitment_settings row
--
-- Data Impact:
--   - No data changes (function definition only)
--   - Fixes incorrect recruitment_enabled values in function output
--   - May change return values for orgs without recruitment_settings (now FALSE)
--
-- Rollback:
--   Restore previous version from 20260608000001_replace_fdw_with_organization_members.sql:
--   - Extract previous CREATE OR REPLACE FUNCTION definition
--   - Re-run migration
--   - Safe to rollback (no data loss, but bug returns)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_org_context(p_user_id UUID)
RETURNS TABLE (
    org_id UUID,
    org_name TEXT,
    org_slug TEXT,
    membership_status TEXT,
    sso_role_name TEXT,
    recruitment_role TEXT,
    recruitment_enabled BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        o.id AS org_id,
        o.name::TEXT AS org_name,
        o.name::TEXT AS org_slug,
        m.status::TEXT AS membership_status,
        m.role::TEXT AS sso_role_name,
        rrm.recruitment_role::TEXT,
        COALESCE(ors.recruitment_enabled, FALSE) AS recruitment_enabled
    FROM public.organization_members m
    JOIN public.organizations o ON o.id = m.organization_id
    LEFT JOIN public.recruitment_role_mapping rrm ON rrm.sso_role_name = m.role
    LEFT JOIN public.organization_recruitment_settings ors ON ors.organization_id = o.id
    WHERE m.user_id = p_user_id
    AND m.status = 'active';
END;
$$;

COMMENT ON FUNCTION public.get_user_org_context IS
    'Get organization context for a user. Returns organization details, membership status, and recruitment role mapping. Now correctly joins organization_recruitment_settings table for recruitment_enabled flag.';
