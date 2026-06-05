-- ============================================
-- Create function to initialize recruitment settings
-- ============================================

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

COMMENT ON FUNCTION create_organization_recruitment_settings IS 'Creates recruitment settings for a new organization during company signup';
