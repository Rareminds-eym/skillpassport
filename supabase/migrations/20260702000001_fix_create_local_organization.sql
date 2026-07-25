-- =====================================================
-- Migration: Fix create_local_organization Function (Schema Alignment)
-- =====================================================
-- Phase: 1 of 1 (Function fix - schema alignment)
-- Breaking: No (API unchanged, implementation fixed)
-- Rollback: Restore previous function version from migration 20260608000001
-- 
-- Context:
--   Fixes create_local_organization to match actual skillpassport schema.
--   Previous migration assumed organizations table had recruitment_enabled
--   and max_recruiters columns, but these are in organization_recruitment_settings.
--   
--   Changes:
--   - Generates unique slug with random suffix
--   - Handles NULL names (onboarding flow)
--   - Creates organization_recruitment_settings entry separately
--   - Adds unique name conflict resolution (appends counter)
--
-- Related ADR: ADR-042 (Allow Null Organization Names During Onboarding)
-- Related Tables:
--   - organizations (id, name, slug, created_by)
--   - organization_members (user_id, organization_id, role, status)
--   - organization_recruitment_settings (recruitment_enabled, max_recruiters)
--
-- Deployment order:
--   1. Run this migration (replaces function)
--   2. No application code changes needed (API unchanged)
--   3. Test with NULL and non-NULL org names
--   4. Verify organization_recruitment_settings created correctly
--
-- Data Impact:
--   - No data changes (function definition only)
--   - Future organization creations use new logic
--   - Handles duplicate names by appending counter (e.g., "Acme 1", "Acme 2")
--   - Supports NULL names temporarily (recruiter onboarding)
--
-- Rollback:
--   Restore previous version from 20260608000001_replace_fdw_with_organization_members.sql:
--   - Extract previous CREATE OR REPLACE FUNCTION definition
--   - Re-run with original parameters
--   - Safe to rollback (no data loss, only function definition)
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
    v_slug TEXT;
    v_unique_name TEXT;
    v_counter INTEGER;
BEGIN
    -- Generate unique name if provided name already exists
    v_unique_name := p_organization_name;
    IF p_organization_name IS NOT NULL THEN
        v_counter := 1;
        WHILE EXISTS (
            SELECT 1 FROM public.organizations 
            WHERE LOWER(name) = LOWER(v_unique_name) 
            AND id != p_organization_id
        ) LOOP
            v_unique_name := p_organization_name || ' ' || v_counter;
            v_counter := v_counter + 1;
        END LOOP;
    END IF;

    -- Generate slug from name or use a random one if name is NULL
    IF v_unique_name IS NOT NULL THEN
        v_slug := lower(regexp_replace(v_unique_name, '[^a-zA-Z0-9]+', '-', 'g'));
        v_slug := regexp_replace(v_slug, '^-+|-+$', '', 'g'); -- Remove leading/trailing hyphens
        -- Add random suffix to ensure uniqueness
        v_slug := v_slug || '-' || substring(gen_random_uuid()::text from 1 for 8);
    ELSE
        -- If name is NULL, generate a temporary slug
        v_slug := 'org-' || substring(gen_random_uuid()::text from 1 for 12);
    END IF;

    -- Insert or update the organization (only basic fields that actually exist)
    INSERT INTO public.organizations (
        id,
        name,
        slug,
        created_by
    ) VALUES (
        p_organization_id,
        v_unique_name,
        v_slug,
        p_created_by_user_id
    )
    ON CONFLICT (id) DO UPDATE SET
        name = COALESCE(EXCLUDED.name, organizations.name), -- Only update if new name is not NULL
        slug = CASE 
            WHEN EXCLUDED.name IS NOT NULL THEN EXCLUDED.slug 
            ELSE organizations.slug 
        END,
        updated_at = NOW()
    RETURNING jsonb_build_object(
        'id', id,
        'name', name,
        'slug', slug,
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

    -- Create recruitment settings if recruitment is enabled
    IF p_recruitment_enabled THEN
        INSERT INTO public.organization_recruitment_settings (
            organization_id,
            recruitment_enabled,
            max_recruiters,
            plan_tier,
            features,
            metadata
        ) VALUES (
            p_organization_id,
            true,
            p_max_recruiters,
            'free',
            jsonb_build_object(
                'can_post_jobs', true,
                'can_manage_candidates', true,
                'can_invite_members', true
            ),
            jsonb_build_object()
        )
        ON CONFLICT (organization_id) DO UPDATE SET
            recruitment_enabled = EXCLUDED.recruitment_enabled,
            max_recruiters = EXCLUDED.max_recruiters,
            updated_at = NOW();
    END IF;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.create_local_organization IS
    'Creates or updates a local organization record synced from SSO. Ensures unique organization names by appending a counter if duplicate. Creates organization_members entry for creator and organization_recruitment_settings if needed.';
