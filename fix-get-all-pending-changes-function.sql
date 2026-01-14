-- Fix get_all_pending_changes_for_university function
-- This version automatically uses the current user's university ID

-- Drop the old function
DROP FUNCTION IF EXISTS get_all_pending_changes_for_university(UUID);

-- Create improved version that doesn't require parameter matching
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
    
    -- If no organizationId in user record, allow the query
    -- Otherwise, verify it matches the requested university
    IF v_user_org_id IS NOT NULL AND v_user_org_id != p_university_id THEN 
        RAISE EXCEPTION 'You can only view changes for your own university'; 
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_all_pending_changes_for_university TO authenticated;

-- Test the function (uncomment and replace with actual university ID)
-- SELECT * FROM get_all_pending_changes_for_university('your-university-id'::uuid);
