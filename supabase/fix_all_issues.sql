-- ============================================
-- Comprehensive Fix for All Database Issues
-- ============================================
-- This script fixes:
-- 1. Duplicate function issue
-- 2. Missing table
-- 3. Missing permissions
-- 4. Verifies get_user_org_context exists
-- ============================================

BEGIN;

-- ============================================
-- PART 1: Fix duplicate function issue
-- ============================================

-- Drop all versions of the function (if they exist)
DROP FUNCTION IF EXISTS public.create_organization_recruitment_settings(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_organization_recruitment_settings(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_organization_recruitment_settings CASCADE;

-- Create the table if it doesn't exist
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

-- Drop any existing check constraint on plan_tier
ALTER TABLE public.organization_recruitment_settings 
DROP CONSTRAINT IF EXISTS organization_recruitment_settings_plan_tier_check;

-- Add the correct check constraint for plan_tier
ALTER TABLE public.organization_recruitment_settings
ADD CONSTRAINT organization_recruitment_settings_plan_tier_check
CHECK (plan_tier IN ('free', 'basic', 'pro', 'enterprise'));

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

-- Create the correct function with all parameters
CREATE OR REPLACE FUNCTION public.create_organization_recruitment_settings(
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
    INSERT INTO public.organization_recruitment_settings (
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
    ON CONFLICT (organization_id) DO UPDATE SET
        metadata = public.organization_recruitment_settings.metadata || EXCLUDED.metadata,
        updated_at = NOW()
    RETURNING id INTO v_settings_id;

    RETURN v_settings_id;
END;
$$;

COMMENT ON FUNCTION public.create_organization_recruitment_settings IS 'Creates recruitment settings for a new organization during company signup';

-- ============================================
-- PART 2: Grant permissions
-- ============================================

-- Grant permissions on table
GRANT SELECT, INSERT, UPDATE ON public.organization_recruitment_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.organization_recruitment_settings TO anon;
GRANT ALL ON public.organization_recruitment_settings TO service_role;

-- Grant permissions on function
GRANT EXECUTE ON FUNCTION public.create_organization_recruitment_settings TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_organization_recruitment_settings TO anon;
GRANT EXECUTE ON FUNCTION public.create_organization_recruitment_settings TO service_role;

-- ============================================
-- PART 3: Verify get_user_org_context exists
-- ============================================

-- Check if get_user_org_context function exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_name = 'get_user_org_context'
    ) THEN
        RAISE NOTICE 'WARNING: get_user_org_context function does not exist!';
        RAISE NOTICE 'This function should have been created by migration 20260525000000_org_recruitment_dashboard_option3.sql';
        RAISE NOTICE 'Please run that migration first.';
    ELSE
        RAISE NOTICE 'SUCCESS: get_user_org_context function exists';
    END IF;
END $$;

-- ============================================
-- PART 4: Grant permissions on get_user_org_context
-- ============================================

GRANT EXECUTE ON FUNCTION public.get_user_org_context TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_org_context TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_org_context TO service_role;

-- ============================================
-- PART 5: Verification
-- ============================================

-- Verify table exists
SELECT 
    'organization_recruitment_settings table' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'organization_recruitment_settings'
        ) THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status;

-- Verify function exists
SELECT 
    'create_organization_recruitment_settings function' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND routine_name = 'create_organization_recruitment_settings'
        ) THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status;

-- Verify get_user_org_context exists
SELECT 
    'get_user_org_context function' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND routine_name = 'get_user_org_context'
        ) THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status;

-- Show function signature
SELECT 
    r.routine_name,
    string_agg(
        COALESCE(p.parameter_name, 'RETURN') || ' ' || 
        COALESCE(p.data_type, 'unknown'),
        ', ' ORDER BY p.ordinal_position
    ) as signature
FROM information_schema.routines r
LEFT JOIN information_schema.parameters p ON p.specific_name = r.specific_name
WHERE r.specific_schema = 'public'
AND r.routine_name = 'create_organization_recruitment_settings'
GROUP BY r.routine_name;

COMMIT;

-- ============================================
-- Success message
-- ============================================
SELECT '✓ All fixes applied successfully!' as result;
