-- ============================================================================
-- COMPLETE FIX FOR PENDING CHANGES FUNCTIONS
-- ============================================================================
-- Run this script in Supabase SQL Editor to fix the 400 error
-- ============================================================================

-- STEP 1: Drop existing function
DROP FUNCTION IF EXISTS get_all_pending_changes_for_university(UUID);

-- STEP 2: Create new simpler function (no parameters - uses current user's university)
CREATE OR REPLACE FUNCTION get_my_university_pending_changes()
RETURNS TABLE(
    curriculum_id UUID,
    curriculum_name TEXT,
    college_name TEXT,
    change_id UUID,
    change_type VARCHAR,
    change_timestamp TIMESTAMP,
    requester_name TEXT,
    request_message TEXT,
    change_data JSONB
) AS $$
DECLARE
    v_user_id UUID;
    v_user_role TEXT;
    v_university_id UUID;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN 
        RAISE EXCEPTION 'User not authenticated'; 
    END IF;
    
    -- Get user role and organization (university ID)
    SELECT role, "organizationId" 
    INTO v_user_role, v_university_id 
    FROM users 
    WHERE id = v_user_id;
    
    -- Check if user is university admin
    IF v_user_role != 'university_admin' THEN 
        RAISE EXCEPTION 'Only university admins can view pending changes'; 
    END IF;
    
    -- Check if user has a university assigned
    IF v_university_id IS NULL THEN 
        RAISE EXCEPTION 'No university associated with your account'; 
    END IF;
    
    -- Return pending changes for user's university
    RETURN QUERY
    SELECT 
        c.id,
        CONCAT(cc.course_name, ' - ', c.academic_year) as curriculum_name,
        o.name as college_name,
        (change_obj->>'id')::UUID,
        change_obj->>'change_type',
        (change_obj->>'timestamp')::TIMESTAMP,
        change_obj->>'requester_name',
        change_obj->>'request_message',
        change_obj
    FROM college_curriculums c
    LEFT JOIN college_course_mappings cm ON cm.id = c.course_id
    LEFT JOIN college_courses cc ON cc.id = cm.course_id
    LEFT JOIN organizations o ON o.id = c.college_id,
         jsonb_array_elements(COALESCE(c.pending_changes, '[]'::jsonb)) AS change_obj
    WHERE c.university_id = v_university_id 
    AND c.has_pending_changes = TRUE 
    AND change_obj->>'status' = 'pending'
    ORDER BY (change_obj->>'timestamp')::TIMESTAMP DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: Recreate the parameterized version with better error handling
CREATE OR REPLACE FUNCTION get_all_pending_changes_for_university(
    p_university_id UUID
)
RETURNS TABLE(
    curriculum_id UUID,
    curriculum_name TEXT,
    college_name TEXT,
    change_id UUID,
    change_type VARCHAR,
    change_timestamp TIMESTAMP,
    requester_name TEXT,
    request_message TEXT,
    change_data JSONB
) AS $$
DECLARE
    v_user_id UUID;
    v_user_role TEXT;
    v_user_org_id UUID;
BEGIN
    -- Get current user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN 
        RAISE EXCEPTION 'User not authenticated'; 
    END IF;
    
    -- Get user role and organization
    SELECT role, "organizationId" 
    INTO v_user_role, v_user_org_id 
    FROM users 
    WHERE id = v_user_id;
    
    -- Check if user is university admin
    IF v_user_role != 'university_admin' THEN 
        RAISE EXCEPTION 'Only university admins can view pending changes'; 
    END IF;
    
    -- If user has organizationId, verify it matches
    -- If user doesn't have organizationId, allow the query (for flexibility)
    IF v_user_org_id IS NOT NULL AND v_user_org_id != p_university_id THEN 
        RAISE EXCEPTION 'You can only view changes for your own university (User org: %, Requested: %)', 
            v_user_org_id, p_university_id; 
    END IF;
    
    -- Return pending changes
    RETURN QUERY
    SELECT 
        c.id,
        CONCAT(cc.course_name, ' - ', c.academic_year) as curriculum_name,
        o.name as college_name,
        (change_obj->>'id')::UUID,
        change_obj->>'change_type',
        (change_obj->>'timestamp')::TIMESTAMP,
        change_obj->>'requester_name',
        change_obj->>'request_message',
        change_obj
    FROM college_curriculums c
    LEFT JOIN college_course_mappings cm ON cm.id = c.course_id
    LEFT JOIN college_courses cc ON cc.id = cm.course_id
    LEFT JOIN organizations o ON o.id = c.college_id,
         jsonb_array_elements(COALESCE(c.pending_changes, '[]'::jsonb)) AS change_obj
    WHERE c.university_id = p_university_id 
    AND c.has_pending_changes = TRUE 
    AND change_obj->>'status' = 'pending'
    ORDER BY (change_obj->>'timestamp')::TIMESTAMP DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 4: Grant permissions
GRANT EXECUTE ON FUNCTION get_my_university_pending_changes TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_pending_changes_for_university TO authenticated;

-- STEP 5: Verify functions exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_my_university_pending_changes') THEN
        RAISE NOTICE '✅ get_my_university_pending_changes() created successfully';
    ELSE
        RAISE NOTICE '❌ get_my_university_pending_changes() NOT created';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_all_pending_changes_for_university') THEN
        RAISE NOTICE '✅ get_all_pending_changes_for_university() created successfully';
    ELSE
        RAISE NOTICE '❌ get_all_pending_changes_for_university() NOT created';
    END IF;
END $$;

-- STEP 6: Test query (optional - uncomment to test)
-- SELECT * FROM get_my_university_pending_changes();
