-- =====================================================
-- Fix Organization Recruitment Context
-- Creates local table for recruitment settings since
-- public.organizations doesn't exist (only foreign table)
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Create organization_recruitment_settings table
-- =====================================================

CREATE TABLE IF NOT EXISTS public.organization_recruitment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE, -- References sso_foreign.organizations.id
    recruitment_enabled BOOLEAN DEFAULT TRUE,
    max_recruiters INTEGER DEFAULT 10,
    current_recruiters INTEGER DEFAULT 0,
    plan_tier TEXT DEFAULT 'starter', -- starter, pro, premium, enterprise
    features JSONB DEFAULT '{}'::JSONB,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT organization_recruitment_settings_plan_tier_check 
        CHECK (plan_tier IN ('starter', 'pro', 'premium', 'enterprise'))
);

COMMENT ON TABLE public.organization_recruitment_settings IS 
'Recruitment-specific settings for organizations (local table since organizations is foreign)';

CREATE INDEX idx_org_recruitment_settings_org_id 
    ON public.organization_recruitment_settings(organization_id);

CREATE INDEX idx_org_recruitment_settings_enabled 
    ON public.organization_recruitment_settings(recruitment_enabled) 
    WHERE recruitment_enabled = TRUE;

-- =====================================================
-- STEP 2: Update get_user_org_context function
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
        so.id AS org_id,
        so.name AS org_name,
        so.slug AS org_slug,
        m.status AS membership_status,
        r.name AS sso_role_name,
        COALESCE(rrm.recruitment_role, 'viewer') AS recruitment_role,
        COALESCE(ors.recruitment_enabled, TRUE) AS recruitment_enabled
    FROM sso_foreign.memberships m
    JOIN sso_foreign.organizations so ON so.id = m.org_id
    JOIN sso_foreign.membership_roles mr ON mr.membership_id = m.id
    JOIN sso_foreign.roles r ON r.id = mr.role_id
    LEFT JOIN public.recruitment_role_mapping rrm ON rrm.sso_role_name = r.name
    LEFT JOIN public.organization_recruitment_settings ors ON ors.organization_id = m.org_id
    WHERE m.user_id = p_user_id
    AND m.status = 'active';
END;
$$;

COMMENT ON FUNCTION public.get_user_org_context IS 
'Get all organizations user belongs to with their roles and recruitment status (fixed to use organization_recruitment_settings)';

-- =====================================================
-- STEP 3: Create trigger to auto-create settings
-- =====================================================

CREATE OR REPLACE FUNCTION public.auto_create_org_recruitment_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Auto-create recruitment settings when organization is accessed
    INSERT INTO public.organization_recruitment_settings (
        organization_id,
        recruitment_enabled,
        max_recruiters,
        current_recruiters
    )
    VALUES (
        NEW.org_id,
        TRUE,
        10,
        1
    )
    ON CONFLICT (organization_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- Note: We can't create a trigger on foreign table, so settings must be created manually
-- or via application code when organization is first accessed

-- =====================================================
-- STEP 4: Grant permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE ON public.organization_recruitment_settings TO authenticated;

COMMIT;
