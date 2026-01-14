-- ============================================================================
-- CREATE MISSING FUNCTION: get_my_university_pending_changes
-- ============================================================================
-- This function automatically gets pending changes for the current user's university
-- No parameters needed - uses auth.uid() to determine university
-- ============================================================================

CREATE OR REPLACE FUNCTION get_my_university_pending_changes()
RETURNS TABLE(
    curriculum_id UUID,
    curriculum_name TEXT,
    college_name TEXT,
    change_id UUID,
    change_type TEXT,
    change_timestamp TIMESTAMPTZ,
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
    SELECT role, "organizationId" INTO v_user_role, v_user_org_id
    FROM users
    WHERE id = v_user_id;
    
    -- Check if user is university admin
    IF v_user_role != 'university_admin' THEN
        RAISE EXCEPTION 'Only university admins can view pending changes';
    END IF;
    
    IF v_user_org_id IS NULL THEN
        RAISE EXCEPTION 'University admin must have an organization ID';
    END IF;
    
    -- Return pending changes
    RETURN QUERY
    SELECT 
        c.id::UUID,
        CASE 
            WHEN cc.course_name IS NOT NULL AND cc.course_name != '' 
            THEN CONCAT(cc.course_name, ' ', c.academic_year)::TEXT
            ELSE c.academic_year::TEXT
        END,
        o.name::TEXT,
        (change_obj->>'id')::UUID,
        (change_obj->>'change_type')::TEXT,
        (change_obj->>'timestamp')::TIMESTAMPTZ,
        (change_obj->>'requester_name')::TEXT,
        (change_obj->>'request_message')::TEXT,
        change_obj::JSONB
    FROM college_curriculums c
    LEFT JOIN college_course_mappings cm ON cm.id = c.course_id
    LEFT JOIN college_courses cc ON cc.id = cm.course_id
    LEFT JOIN organizations o ON o.id = c.college_id,
         jsonb_array_elements(COALESCE(c.pending_changes, '[]'::jsonb)) AS change_obj
    WHERE c.university_id = v_user_org_id
      AND c.has_pending_changes = TRUE
      AND (change_obj->>'status')::TEXT = 'pending'
    ORDER BY (change_obj->>'timestamp')::TIMESTAMPTZ DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_my_university_pending_changes TO authenticated;

-- Test the function (will only work when logged in as university admin)
-- SELECT * FROM get_my_university_pending_changes();
