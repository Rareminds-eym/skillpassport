-- Migration: Fix get_user_org_context type cast
-- Phase: Hotfix
-- Breaking: No
--
-- Context: get_user_org_context RETURNS TABLE with TEXT columns, but SELECT
-- returns varchar(255) from organizations.name. PostgreSQL requires exact type
-- match in RETURNS TABLE functions, causing error 42804.
-- Fix: Add ::TEXT casts to all varchar/text columns in the SELECT.

CREATE OR REPLACE FUNCTION public.get_user_org_context(
    p_user_id UUID
)
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
STABLE
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
        COALESCE(o.recruitment_enabled, FALSE) AS recruitment_enabled
    FROM public.organization_members m
    JOIN public.organizations o ON o.id = m.organization_id
    LEFT JOIN public.recruitment_role_mapping rrm ON rrm.sso_role_name = m.role
    WHERE m.user_id = p_user_id
    AND m.status = 'active';
END;
$$;
