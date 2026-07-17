-- =====================================================
-- Migration: Remove slug Column from create_local_organization
-- =====================================================
-- Phase: 1 of 1 (Function fix - schema correction)
-- Breaking: No (API unchanged)
-- Rollback: Restore previous function version from 20260702000001
-- 
-- Context:
--   Discovered organizations table in skillpassport doesn't have slug or
--   created_by columns. These are SSO-Worker-specific columns that don't
--   exist in the skillpassport database schema.
--   
--   Changes:
--   - Removed slug generation logic entirely
--   - Changed created_by to admin_id (skillpassport column name)
--   - Changed plan_tier from 'free' to 'starter' (matches CHECK constraint)
--   - Added user existence check before creating membership
--   - Fixed schema mismatch causing runtime errors
--
-- Related ADR: ADR-042 (Allow Null Organization Names During Onboarding)
-- Related Tables:
--   - organizations (id, name, admin_id) - NO slug or created_by columns
--   - organization_members
--   - organization_recruitment_settings
--
-- Deployment order:
--   1. Run this migration (replaces function)
--   2. Test organization creation from SSO sync
--   3. Verify membership creation works correctly
--   4. Confirm no column errors in logs
--
-- Data Impact:
--   - No data changes (function definition only)
--   - Fixes runtime errors from missing columns (slug, created_by)
--   - Future organization syncs won't fail with "column does not exist" error
--
-- Rollback:
--   Restore previous version from 20260702000001_fix_create_local_organization.sql:
--   - Extract previous CREATE OR REPLACE FUNCTION definition
--   - Re-run migration
--   - Safe to rollback (no data loss)
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

    -- Insert or update the organization (only fields that exist in skillpassport schema)
    INSERT INTO public.organizations (
        id,
        name,
        admin_id
    ) VALUES (
        p_organization_id,
        v_unique_name,
        p_created_by_user_id
    )
    ON CONFLICT (id) DO UPDATE SET
        name = CASE 
            WHEN EXCLUDED.name IS NOT NULL THEN EXCLUDED.name 
            ELSE organizations.name 
        END,
        admin_id = COALESCE(EXCLUDED.admin_id, organizations.admin_id),
        updated_at = NOW()
    RETURNING jsonb_build_object(
        'id', id,
        'name', name,
        'admin_id', admin_id,
        'created_at', created_at,
        'updated_at', updated_at
    ) INTO v_result;

    -- Insert membership for the creator user if provided
    -- Only if the user exists in the local users table (they may not be synced yet)
    IF p_created_by_user_id IS NOT NULL THEN
        -- Check if user exists locally first
        IF EXISTS (SELECT 1 FROM public.users WHERE id = p_created_by_user_id) THEN
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
            'starter',  -- Changed from 'free' to 'starter' to match CHECK constraint
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
    'Creates or updates a local organization record synced from SSO. Ensures unique organization names by appending a counter if duplicate. Uses admin_id instead of created_by to match skillpassport schema. Uses plan_tier=starter to match CHECK constraint.';
