-- Migration: Fix get_user_org_context to use organization_recruitment_settings table
-- The organizations table doesn't have recruitment_enabled column
-- Date: 2026-07-02

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
