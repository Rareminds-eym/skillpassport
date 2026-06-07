-- =====================================================
-- Phase 1: Replace FDW with Local organization_members Table
-- =====================================================
-- 
-- ARCHITECTURE CHANGE:
-- Previously, membership data was queried via Foreign Data Wrapper (FDW)
-- from the SSO-Worker database (sso_foreign.memberships, etc.).
-- Since FDW is not set up/not available, we now store membership
-- data locally in public.organization_members.
--
-- This migration:
-- 1. Creates organization_members table
-- 2. Rewrites all RPC functions to use local table instead of sso_foreign.*
-- 3. Updates create_local_organization to accept creator user ID
--
-- Phase: 1 of 1 (no phase 2/3 needed - no old columns to drop)
-- Breaking: No (backward compatible - new table created, RPCs rewritten)

BEGIN;

-- =====================================================
-- STEP 1: Create organization_members table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT organization_members_role_check
        CHECK (role IN ('owner', 'admin', 'member')),
    CONSTRAINT organization_members_status_check
        CHECK (status IN ('active', 'inactive', 'suspended', 'expired')),
    CONSTRAINT organization_members_user_org_unique
        UNIQUE (user_id, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_organization_members_user_id
    ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_organization_id
    ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_members_status
    ON public.organization_members(status);

COMMENT ON TABLE public.organization_members IS
'Local membership table replacing FDW-based sso_foreign.memberships. Stores which users belong to which organizations and their role.';

-- =====================================================
-- STEP 2: Rewrite is_org_member (was FDW-based)
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_org_member(
    p_user_id UUID,
    p_org_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.organization_members m
        WHERE m.user_id = p_user_id
        AND m.organization_id = p_org_id
        AND m.status = 'active'
    );
END;
$$;

COMMENT ON FUNCTION public.is_org_member IS
'Check if user is an active member of organization via local organization_members table';

-- =====================================================
-- STEP 3: Rewrite get_user_recruitment_roles (was FDW-based)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_recruitment_roles(
    p_user_id UUID,
    p_org_id UUID
)
RETURNS TABLE (
    sso_role_name TEXT,
    recruitment_role TEXT,
    can_manage_team BOOLEAN,
    can_create_jobs BOOLEAN,
    can_edit_jobs BOOLEAN,
    can_delete_jobs BOOLEAN,
    can_view_candidates BOOLEAN,
    can_manage_candidates BOOLEAN,
    can_view_analytics BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.role AS sso_role_name,
        rrm.recruitment_role,
        rrm.can_manage_team,
        rrm.can_create_jobs,
        rrm.can_edit_jobs,
        rrm.can_delete_jobs,
        rrm.can_view_candidates,
        rrm.can_manage_candidates,
        rrm.can_view_analytics
    FROM public.organization_members m
    JOIN public.recruitment_role_mapping rrm ON rrm.sso_role_name = m.role
    WHERE m.user_id = p_user_id
    AND m.organization_id = p_org_id
    AND m.status = 'active';
END;
$$;

COMMENT ON FUNCTION public.get_user_recruitment_roles IS
'Get user recruitment roles and permissions for an organization via local organization_members table';

-- =====================================================
-- STEP 4: Rewrite has_recruitment_permission (was FDW-based)
-- =====================================================

CREATE OR REPLACE FUNCTION public.has_recruitment_permission(
    p_user_id UUID,
    p_org_id UUID,
    p_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_has_permission BOOLEAN := FALSE;
BEGIN
    SELECT
        CASE p_permission
            WHEN 'manage_team' THEN rrm.can_manage_team
            WHEN 'create_jobs' THEN rrm.can_create_jobs
            WHEN 'edit_jobs' THEN rrm.can_edit_jobs
            WHEN 'delete_jobs' THEN rrm.can_delete_jobs
            WHEN 'view_candidates' THEN rrm.can_view_candidates
            WHEN 'manage_candidates' THEN rrm.can_manage_candidates
            WHEN 'view_analytics' THEN rrm.can_view_analytics
            ELSE FALSE
        END INTO v_has_permission
    FROM public.organization_members m
    JOIN public.recruitment_role_mapping rrm ON rrm.sso_role_name = m.role
    WHERE m.user_id = p_user_id
    AND m.organization_id = p_org_id
    AND m.status = 'active'
    LIMIT 1;

    RETURN COALESCE(v_has_permission, FALSE);
END;
$$;

COMMENT ON FUNCTION public.has_recruitment_permission IS
'Check if user has specific recruitment permission in organization via local organization_members table';

-- =====================================================
-- STEP 5: Rewrite get_user_org_context (was FDW-based)
-- =====================================================

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
        o.name AS org_name,
        o.name AS org_slug,
        m.status AS membership_status,
        m.role AS sso_role_name,
        rrm.recruitment_role,
        COALESCE(o.recruitment_enabled, FALSE) AS recruitment_enabled
    FROM public.organization_members m
    JOIN public.organizations o ON o.id = m.organization_id
    LEFT JOIN public.recruitment_role_mapping rrm ON rrm.sso_role_name = m.role
    WHERE m.user_id = p_user_id
    AND m.status = 'active';
END;
$$;

COMMENT ON FUNCTION public.get_user_org_context IS
'Get all organizations user belongs to with their roles and recruitment status via local tables';

-- =====================================================
-- STEP 6: Update create_local_organization to accept creator
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_local_organization(
    p_organization_id UUID,
    p_organization_name TEXT,
    p_recruitment_enabled BOOLEAN DEFAULT true,
    p_max_recruiters INTEGER DEFAULT 10,
    p_created_by_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Insert or update the organization
    INSERT INTO public.organizations (
        id,
        name,
        recruitment_enabled,
        max_recruiters
    ) VALUES (
        p_organization_id,
        p_organization_name,
        p_recruitment_enabled,
        p_max_recruiters
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        recruitment_enabled = EXCLUDED.recruitment_enabled,
        max_recruiters = EXCLUDED.max_recruiters,
        updated_at = NOW()
    RETURNING jsonb_build_object(
        'id', id,
        'name', name,
        'recruitment_enabled', recruitment_enabled,
        'max_recruiters', max_recruiters,
        'created_at', created_at,
        'updated_at', updated_at
    ) INTO v_result;

    -- Insert membership for the creator user if provided
    IF p_created_by_user_id IS NOT NULL THEN
        INSERT INTO public.organization_members (
            user_id,
            organization_id,
            role,
            status
        ) VALUES (
            p_created_by_user_id,
            p_organization_id,
            'owner',
            'active'
        )
        ON CONFLICT (user_id, organization_id) DO UPDATE SET
            role = 'owner',
            status = 'active',
            updated_at = NOW();
    END IF;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.create_local_organization IS
'Creates or updates local organization record and optionally adds creator as owner member. Uses SECURITY DEFINER to bypass RLS.';

-- =====================================================
-- STEP 7: Grant permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON public.organization_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO service_role;

GRANT EXECUTE ON FUNCTION public.is_org_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_recruitment_roles TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_recruitment_permission TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_org_context TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_local_organization TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_local_organization TO anon;
GRANT EXECUTE ON FUNCTION public.create_local_organization TO service_role;

COMMIT;
