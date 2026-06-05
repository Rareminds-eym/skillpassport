-- =====================================================
-- Create Organization Recruitment Settings Function
-- Allows creating settings during signup without auth
-- =====================================================

BEGIN;

-- Create function to initialize organization recruitment settings
CREATE OR REPLACE FUNCTION public.create_organization_recruitment_settings(
    p_organization_id UUID,
    p_industry TEXT DEFAULT NULL,
    p_company_size TEXT DEFAULT NULL,
    p_admin_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL
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
        -- Settings already exist, return existing record
        SELECT jsonb_build_object(
            'id', id,
            'organization_id', organization_id,
            'recruitment_enabled', recruitment_enabled,
            'max_recruiters', max_recruiters,
            'current_recruiters', current_recruiters,
            'plan_tier', plan_tier,
            'metadata', metadata,
            'created_at', created_at,
            'updated_at', updated_at,
            'already_exists', true
        ) INTO v_result
        FROM public.organization_recruitment_settings
        WHERE id = v_settings_id;

        RETURN v_result;
    END IF;

    -- Create new settings
    INSERT INTO public.organization_recruitment_settings (
        organization_id,
        recruitment_enabled,
        max_recruiters,
        current_recruiters,
        plan_tier,
        metadata
    )
    VALUES (
        p_organization_id,
        TRUE,
        10,
        1,
        'starter',
        jsonb_build_object(
            'industry', p_industry,
            'company_size', p_company_size,
            'admin_name', p_admin_name,
            'phone', p_phone,
            'email', p_email,
            'recruitment_enabled', true
        )
    )
    RETURNING jsonb_build_object(
        'id', id,
        'organization_id', organization_id,
        'recruitment_enabled', recruitment_enabled,
        'max_recruiters', max_recruiters,
        'current_recruiters', current_recruiters,
        'plan_tier', plan_tier,
        'metadata', metadata,
        'created_at', created_at,
        'updated_at', updated_at,
        'already_exists', false
    ) INTO v_result;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.create_organization_recruitment_settings IS 
'Create recruitment settings for an organization during signup. Uses SECURITY DEFINER to bypass RLS.';

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.create_organization_recruitment_settings TO anon, authenticated;

COMMIT;
