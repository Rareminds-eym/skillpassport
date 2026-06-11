-- Create function to create/update local organization record
-- This bypasses RLS using SECURITY DEFINER

CREATE OR REPLACE FUNCTION public.create_local_organization(
    p_organization_id UUID,
    p_organization_name TEXT,
    p_recruitment_enabled BOOLEAN DEFAULT true,
    p_max_recruiters INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Try to insert the organization
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

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.create_local_organization IS 
'Creates or updates local organization record for recruitment features. Uses SECURITY DEFINER to bypass RLS.';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_local_organization TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_local_organization TO anon;
GRANT EXECUTE ON FUNCTION public.create_local_organization TO service_role;

-- Verify function was created
SELECT 
    'create_local_organization function' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.routines
            WHERE routine_schema = 'public'
            AND routine_name = 'create_local_organization'
        ) THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status;
