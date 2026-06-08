-- Migration: Fix duplicate create_organization_recruitment_settings function
-- Phase: N/A (bug fix)
-- Breaking: No
--
-- Problem: Two overloaded versions of the function existed:
--   1. Old (20260528000001): returns UUID, uses plan_tier='free' (violates CHECK)
--   2. New (20260526000011): returns JSONB, uses plan_tier='starter', but missing p_address param
--   Handler passes 7 params including p_address → Postgres picks old version → CHECK violation → 500
--
-- Fix: Drop the old UUID-returning overload, replace the JSONB-returning one
--      with a version that accepts all 7 params (including p_address) and inserts
--      features and plan_tier='starter'.

-- Drop all old overloads (UUID-returning 7-param AND JSONB-returning 6-param)
-- to resolve ambiguity before creating the single correct version.
DROP FUNCTION IF EXISTS public.create_organization_recruitment_settings(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_organization_recruitment_settings(UUID, TEXT, TEXT, TEXT, TEXT, TEXT);

-- Replace remaining function with corrected version
CREATE OR REPLACE FUNCTION public.create_organization_recruitment_settings(
    p_organization_id UUID,
    p_industry TEXT DEFAULT NULL,
    p_company_size TEXT DEFAULT NULL,
    p_admin_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_settings_id UUID;
    v_result JSONB;
BEGIN
    -- Check if settings already exist
    SELECT id INTO v_settings_id
    FROM public.organization_recruitment_settings
    WHERE organization_id = p_organization_id;

    IF v_settings_id IS NOT NULL THEN
        SELECT jsonb_build_object(
            'id', id,
            'organization_id', organization_id,
            'recruitment_enabled', recruitment_enabled,
            'max_recruiters', max_recruiters,
            'current_recruiters', current_recruiters,
            'plan_tier', plan_tier,
            'features', features,
            'metadata', metadata,
            'created_at', created_at,
            'updated_at', updated_at,
            'already_exists', true
        ) INTO v_result
        FROM public.organization_recruitment_settings
        WHERE id = v_settings_id;

        RETURN v_result;
    END IF;

    INSERT INTO public.organization_recruitment_settings (
        organization_id,
        recruitment_enabled,
        max_recruiters,
        current_recruiters,
        plan_tier,
        features,
        metadata
    )
    VALUES (
        p_organization_id,
        TRUE,
        10,
        1,
        'starter',
        jsonb_build_object(
            'can_post_jobs', true,
            'can_manage_candidates', true,
            'can_invite_members', true
        ),
        jsonb_build_object(
            'industry', p_industry,
            'company_size', p_company_size,
            'admin_name', p_admin_name,
            'phone', p_phone,
            'email', p_email,
            'address', p_address,
            'setup_completed_at', NOW()
        )
    )
    RETURNING jsonb_build_object(
        'id', id,
        'organization_id', organization_id,
        'recruitment_enabled', recruitment_enabled,
        'max_recruiters', max_recruiters,
        'current_recruiters', current_recruiters,
        'plan_tier', plan_tier,
        'features', features,
        'metadata', metadata,
        'created_at', created_at,
        'updated_at', updated_at,
        'already_exists', false
    ) INTO v_result;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.create_organization_recruitment_settings IS
'Create recruitment settings for an organization during signup. Returns JSONB with full settings record. Uses SECURITY DEFINER to bypass RLS.';

GRANT EXECUTE ON FUNCTION public.create_organization_recruitment_settings TO anon, authenticated;
