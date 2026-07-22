-- =====================================================
-- Migration: Replace FDW with Local organization_members Table
-- =====================================================
-- Phase: 1 of 1 (Single-phase migration - architectural change)
-- Breaking: No (backward compatible - RPCs rewritten but API unchanged)
-- Rollback: Cannot rollback - would require recreating FDW setup
--          Forward-only migration
-- 
-- Context:
--   ARCHITECTURE CHANGE: Abandoning Foreign Data Wrapper (FDW) approach.
--   Moving from cross-database queries to queue-based sync system.
--   
--   Old Architecture (FDW):
--   - SkillPassport DB queries SSO-Worker DB directly via FDW
--   - Tight coupling, performance issues, debugging difficulty
--   
--   New Architecture (Queue Sync):
--   - auth-sync-consumer queue syncs SSO-Worker data to local tables
--   - Loose coupling, better performance, eventual consistency
--
-- Related ADR: ADR-045 (Abandon FDW Cross-Database Architecture) - to be created
-- Related Tables: organization_members (new), organizations (existing)
-- Related Functions: 6 RPCs rewritten to use local tables
--
-- Deployment order:
--   1. Deploy auth-sync-consumer queue consumer first
--   2. Backfill organization_members from SSO-Worker
--   3. Run this migration (creates table, rewrites functions)
--   4. Verify functions work with local data
--   5. Remove FDW configuration (separate cleanup)
--
-- Data Impact:
--   - Creates new organization_members table
--   - Rewrites 6 RPC functions to use local tables
--   - No data loss (FDW tables remain, just unused)
--   - Membership data synced via queue going forward
--
-- Rollback:
--   Cannot rollback - would need to recreate FDW foreign tables
--   Forward-only migration
--   If issues: Fix auth-sync-consumer, manually sync data
--
-- Monitoring:
--   - Track auth-sync-consumer queue lag
--   - Monitor organization_members table growth
--   - Alert if sync lag > 1 minute
-- =====================================================
-- 
-- ARCHITECTURE CHANGE (Updated 2026):
-- We use a queue-based sync system (auth-sync-consumer) to sync data from
-- SSO-Worker database to local Skillpassport tables in real-time.
-- 
-- Data Flow:
-- 1. SSO-Worker creates user/org/membership
-- 2. SSO-Worker publishes events to Cloudflare Queue
-- 3. auth-sync-consumer processes queue messages
-- 4. Data synced to local tables (users, organizations, organization_members)
--
-- This migration:
-- 1. Creates organization_members table (synced via queue)
-- 2. Rewrites all RPC functions to use local table
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
'Local membership table synced from SSO-Worker via queue-based sync (auth-sync-consumer). Stores which users belong to which organizations and their role.';


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
