-- ============================================
-- Create function to initialize recruitment settings
-- ============================================

-- First, create the organization_recruitment_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.organization_recruitment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE,
    recruitment_enabled BOOLEAN DEFAULT true,
    max_recruiters INTEGER DEFAULT 10,
    plan_tier TEXT DEFAULT 'free',
    features JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_org_recruitment_settings_org_id 
    ON public.organization_recruitment_settings(organization_id);

-- Add comments
COMMENT ON TABLE public.organization_recruitment_settings IS 'Stores recruitment-specific settings for organizations';
COMMENT ON COLUMN public.organization_recruitment_settings.organization_id IS 'References organization in SSO-Worker via FDW';
COMMENT ON COLUMN public.organization_recruitment_settings.recruitment_enabled IS 'Whether recruitment features are enabled';
COMMENT ON COLUMN public.organization_recruitment_settings.max_recruiters IS 'Maximum number of recruiters allowed';
COMMENT ON COLUMN public.organization_recruitment_settings.plan_tier IS 'Subscription plan tier (free, basic, pro, enterprise)';
COMMENT ON COLUMN public.organization_recruitment_settings.features IS 'Enabled features for this organization';
COMMENT ON COLUMN public.organization_recruitment_settings.metadata IS 'Additional metadata (industry, company_size, admin info, etc.)';

-- Now create the function
CREATE OR REPLACE FUNCTION create_organization_recruitment_settings(
    p_organization_id UUID,
    p_industry TEXT,
    p_company_size TEXT,
    p_admin_name TEXT,
    p_phone TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_settings_id UUID;
BEGIN
    -- Insert recruitment settings for the organization
    INSERT INTO organization_recruitment_settings (
        organization_id,
        recruitment_enabled,
        max_recruiters,
        plan_tier,
        features,
        metadata
    ) VALUES (
        p_organization_id,
        true, -- Enable recruitment by default
        10, -- Default max recruiters
        'free', -- Default plan tier
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
    RETURNING id INTO v_settings_id;

    RETURN v_settings_id;
END;
$$;

COMMENT ON FUNCTION create_organization_recruitment_settings(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) IS 'Creates recruitment settings for a new organization during company signup';
