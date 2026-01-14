-- ============================================================================
-- CURRICULUM CHANGE FUNCTIONS - FINAL PRODUCTION VERSION
-- ============================================================================
-- ALL CRITICAL ISSUES FIXED + Reserved keyword issue resolved
-- ============================================================================

-- FUNCTION 1: Add Pending Change
CREATE OR REPLACE FUNCTION add_pending_change(
    p_curriculum_id UUID,
    p_change_type VARCHAR,
    p_entity_id UUID,
    p_change_data JSONB,
    p_message TEXT
) RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_user_name TEXT;
    v_change_id UUID;
    v_new_change JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Authorization check
    IF NOT EXISTS (
        SELECT 1 FROM college_curriculums c
        JOIN users u ON u."organizationId" = c.college_id
        WHERE c.id = p_curriculum_id AND u.id = v_user_id AND u.role = 'college_admin'
    ) THEN
        RAISE EXCEPTION 'Not authorized to modify this curriculum';
    END IF;
    
    SELECT CONCAT("firstName", ' ', "lastName") INTO v_user_name FROM users WHERE id = v_user_id;
    v_change_id := gen_random_uuid();
    
    v_new_change := jsonb_build_object(
        'id', v_change_id,
        'change_type', p_change_type,
        'entity_id', p_entity_id,
        'timestamp', NOW(),
        'requested_by', v_user_id,
        'requester_name', COALESCE(v_user_name, 'Unknown User'),
        'request_message', p_message,
        'status', 'pending',
        'data', COALESCE(p_change_data, '{}'::jsonb)
    );
    
    UPDATE college_curriculums
    SET pending_changes = COALESCE(pending_changes, '[]'::jsonb) || v_new_change,
        has_pending_changes = TRUE, updated_at = NOW()
    WHERE id = p_curriculum_id;
    
    IF NOT FOUND THEN RAISE EXCEPTION 'Curriculum not found'; END IF;
    RETURN v_new_change;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCTION 2: Get Pending Changes (FIXED: renamed columns to avoid reserved keywords)
CREATE OR REPLACE FUNCTION get_pending_changes(p_curriculum_id UUID)
RETURNS TABLE(
    change_id UUID,
    change_type VARCHAR,
    entity_id UUID,
    change_timestamp TIMESTAMP,
    requested_by UUID,
    requester_name TEXT,
    request_message TEXT,
    change_status VARCHAR,
    change_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (change_obj->>'id')::UUID,
        change_obj->>'change_type',
        (change_obj->>'entity_id')::UUID,
        (change_obj->>'timestamp')::TIMESTAMP,
        (change_obj->>'requested_by')::UUID,
        change_obj->>'requester_name',
        change_obj->>'request_message',
        change_obj->>'status',
        change_obj
    FROM college_curriculums,
         jsonb_array_elements(COALESCE(pending_changes, '[]'::jsonb)) AS change_obj
    WHERE id = p_curriculum_id AND change_obj->>'status' = 'pending'
    ORDER BY (change_obj->>'timestamp')::TIMESTAMP DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCTION 3: Approve Pending Change (FIXED: COUNT > 0)
CREATE OR REPLACE FUNCTION approve_pending_change(
    p_curriculum_id UUID,
    p_change_id UUID,
    p_review_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_user_name TEXT;
    v_change JSONB;
    v_history_entry JSONB;
    v_remaining_count INTEGER;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User not authenticated'; END IF;
    
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = v_user_id AND role = 'university_admin') THEN
        RAISE EXCEPTION 'Only university admins can approve changes';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM college_curriculums c
        JOIN users u ON u."organizationId" = c.university_id
        WHERE c.id = p_curriculum_id AND u.id = v_user_id
    ) THEN
        RAISE EXCEPTION 'Not authorized for this university curriculum';
    END IF;
    
    SELECT CONCAT("firstName", ' ', "lastName") INTO v_user_name FROM users WHERE id = v_user_id;
    
    SELECT change_obj INTO v_change
    FROM college_curriculums, jsonb_array_elements(COALESCE(pending_changes, '[]'::jsonb)) AS change_obj
    WHERE id = p_curriculum_id AND change_obj->>'id' = p_change_id::text;
    
    IF v_change IS NULL THEN RAISE EXCEPTION 'Change request not found'; END IF;
    
    v_history_entry := v_change || jsonb_build_object(
        'reviewed_by', v_user_id, 'reviewer_name', COALESCE(v_user_name, 'Unknown Admin'),
        'review_date', NOW(), 'status', 'approved', 'review_notes', COALESCE(p_review_notes, '')
    );
    
    UPDATE college_curriculums
    SET pending_changes = (
            SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
            FROM jsonb_array_elements(COALESCE(pending_changes, '[]'::jsonb)) AS elem
            WHERE elem->>'id' != p_change_id::text
        ),
        change_history = COALESCE(change_history, '[]'::jsonb) || v_history_entry,
        updated_at = NOW()
    WHERE id = p_curriculum_id;
    
    SELECT COUNT(*) INTO v_remaining_count
    FROM college_curriculums, jsonb_array_elements(COALESCE(pending_changes, '[]'::jsonb)) AS elem
    WHERE id = p_curriculum_id AND elem->>'status' = 'pending';
    
    UPDATE college_curriculums SET has_pending_changes = (v_remaining_count > 0) WHERE id = p_curriculum_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCTION 4: Reject Pending Change (FIXED: COUNT > 0)
CREATE OR REPLACE FUNCTION reject_pending_change(
    p_curriculum_id UUID,
    p_change_id UUID,
    p_review_notes TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_user_name TEXT;
    v_change JSONB;
    v_history_entry JSONB;
    v_remaining_count INTEGER;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User not authenticated'; END IF;
    IF p_review_notes IS NULL OR TRIM(p_review_notes) = '' THEN
        RAISE EXCEPTION 'Review notes are required when rejecting a change';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = v_user_id AND role = 'university_admin') THEN
        RAISE EXCEPTION 'Only university admins can reject changes';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM college_curriculums c
        JOIN users u ON u."organizationId" = c.university_id
        WHERE c.id = p_curriculum_id AND u.id = v_user_id
    ) THEN
        RAISE EXCEPTION 'Not authorized for this university curriculum';
    END IF;
    
    SELECT CONCAT("firstName", ' ', "lastName") INTO v_user_name FROM users WHERE id = v_user_id;
    
    SELECT change_obj INTO v_change
    FROM college_curriculums, jsonb_array_elements(COALESCE(pending_changes, '[]'::jsonb)) AS change_obj
    WHERE id = p_curriculum_id AND change_obj->>'id' = p_change_id::text;
    
    IF v_change IS NULL THEN RAISE EXCEPTION 'Change request not found'; END IF;
    
    v_history_entry := v_change || jsonb_build_object(
        'reviewed_by', v_user_id, 'reviewer_name', COALESCE(v_user_name, 'Unknown Admin'),
        'review_date', NOW(), 'status', 'rejected', 'review_notes', p_review_notes
    );
    
    UPDATE college_curriculums
    SET pending_changes = (
            SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
            FROM jsonb_array_elements(COALESCE(pending_changes, '[]'::jsonb)) AS elem
            WHERE elem->>'id' != p_change_id::text
        ),
        change_history = COALESCE(change_history, '[]'::jsonb) || v_history_entry,
        updated_at = NOW()
    WHERE id = p_curriculum_id;
    
    SELECT COUNT(*) INTO v_remaining_count
    FROM college_curriculums, jsonb_array_elements(COALESCE(pending_changes, '[]'::jsonb)) AS elem
    WHERE id = p_curriculum_id AND elem->>'status' = 'pending';
    
    UPDATE college_curriculums SET has_pending_changes = (v_remaining_count > 0) WHERE id = p_curriculum_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCTION 5: Cancel Pending Change (FIXED: COUNT > 0)
CREATE OR REPLACE FUNCTION cancel_pending_change(
    p_curriculum_id UUID,
    p_change_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_change JSONB;
    v_curriculum RECORD;
    v_remaining_count INTEGER;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User not authenticated'; END IF;
    
    SELECT * INTO v_curriculum FROM college_curriculums WHERE id = p_curriculum_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Curriculum not found'; END IF;
    
    SELECT change_obj INTO v_change
    FROM jsonb_array_elements(COALESCE(v_curriculum.pending_changes, '[]'::jsonb)) AS change_obj
    WHERE change_obj->>'id' = p_change_id::text;
    
    IF v_change IS NULL THEN RAISE EXCEPTION 'Change request not found'; END IF;
    
    IF NOT (
        EXISTS (SELECT 1 FROM users WHERE id = v_user_id AND "organizationId" = v_curriculum.college_id AND role = 'college_admin')
        OR (v_change->>'requested_by')::UUID = v_user_id
    ) THEN
        RAISE EXCEPTION 'Not authorized to cancel this change request';
    END IF;
    
    UPDATE college_curriculums
    SET pending_changes = (
            SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
            FROM jsonb_array_elements(COALESCE(pending_changes, '[]'::jsonb)) AS elem
            WHERE elem->>'id' != p_change_id::text
        ),
        updated_at = NOW()
    WHERE id = p_curriculum_id;
    
    SELECT COUNT(*) INTO v_remaining_count
    FROM college_curriculums, jsonb_array_elements(COALESCE(pending_changes, '[]'::jsonb)) AS elem
    WHERE id = p_curriculum_id AND elem->>'status' = 'pending';
    
    UPDATE college_curriculums SET has_pending_changes = (v_remaining_count > 0) WHERE id = p_curriculum_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- FUNCTION 6: Get All Pending Changes for University
CREATE OR REPLACE FUNCTION get_all_pending_changes_for_university(p_university_id UUID)
RETURNS TABLE(
    curriculum_id UUID, curriculum_name TEXT, college_name TEXT,
    change_id UUID, change_type VARCHAR, change_timestamp TIMESTAMP,
    requester_name TEXT, request_message TEXT, change_data JSONB
) AS $$
DECLARE
    v_user_id UUID;
    v_user_org_id UUID;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'User not authenticated'; END IF;
    
    SELECT "organizationId" INTO v_user_org_id FROM users WHERE id = v_user_id AND role = 'university_admin';
    IF v_user_org_id IS NULL THEN RAISE EXCEPTION 'Only university admins can view pending changes'; END IF;
    IF v_user_org_id != p_university_id THEN RAISE EXCEPTION 'You can only view changes for your own university'; END IF;
    
    RETURN QUERY
    SELECT c.id, CONCAT(cc.course_name, ' - ', c.academic_year), o.name,
           (change_obj->>'id')::UUID, change_obj->>'change_type', (change_obj->>'timestamp')::TIMESTAMP,
           change_obj->>'requester_name', change_obj->>'request_message', change_obj
    FROM college_curriculums c
    LEFT JOIN college_course_mappings cm ON cm.id = c.course_id
    LEFT JOIN college_courses cc ON cc.id = cm.course_id
    LEFT JOIN organizations o ON o.id = c.college_id,
         jsonb_array_elements(COALESCE(c.pending_changes, '[]'::jsonb)) AS change_obj
    WHERE c.university_id = p_university_id AND c.has_pending_changes = TRUE AND change_obj->>'status' = 'pending'
    ORDER BY (change_obj->>'timestamp')::TIMESTAMP DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION add_pending_change TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_changes TO authenticated;
GRANT EXECUTE ON FUNCTION approve_pending_change TO authenticated;
GRANT EXECUTE ON FUNCTION reject_pending_change TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_pending_change TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_pending_changes_for_university TO authenticated;
