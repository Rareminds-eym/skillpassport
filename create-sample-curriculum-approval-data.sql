-- ============================================================================
-- CREATE SAMPLE CURRICULUM APPROVAL DATA
-- ============================================================================
-- Purpose: Create sample data for testing curriculum approval workflow
-- Run this ONLY if debug-curriculum-approval-data.sql shows missing data
-- ============================================================================

-- ============================================================================
-- SECTION 1: CREATE SAMPLE ORGANIZATIONS (if missing)
-- ============================================================================

-- Insert sample university
INSERT INTO organizations (id, name, type, status)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Sample University',
    'university',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample college
INSERT INTO organizations (id, name, type, status)
VALUES (
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    'Sample Engineering College',
    'college',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 2: CREATE UNIVERSITY-COLLEGE AFFILIATION
-- ============================================================================

INSERT INTO university_colleges (
    id,
    university_id,
    college_id,
    account_status,
    affiliation_date
) VALUES (
    'c3d4e5f6-g7h8-9012-cdef-345678901234',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    'active',
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 3: CREATE SAMPLE USERS
-- ============================================================================

-- Insert sample university admin
INSERT INTO users (
    id,
    email,
    "firstName",
    "lastName",
    role,
    "organizationId",
    account_status
) VALUES (
    'd4e5f6g7-h8i9-0123-defg-456789012345',
    'university.admin@sample.edu',
    'University',
    'Admin',
    'university_admin',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample college admin
INSERT INTO users (
    id,
    email,
    "firstName",
    "lastName",
    role,
    "organizationId",
    account_status
) VALUES (
    'e5f6g7h8-i9j0-1234-efgh-567890123456',
    'college.admin@sample.edu',
    'College',
    'Admin',
    'college_admin',
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 4: CREATE SAMPLE DEPARTMENTS AND PROGRAMS
-- ============================================================================

-- Insert sample department
INSERT INTO departments (id, name, code, status, college_id)
VALUES (
    'f6g7h8i9-j0k1-2345-fghi-678901234567',
    'Computer Science',
    'CS',
    'active',
    'b2c3d4e5-f6g7-8901-bcde-f23456789012'
) ON CONFLICT (id) DO NOTHING;

-- Insert sample program
INSERT INTO programs (id, department_id, name, code, status, college_id)
VALUES (
    'g7h8i9j0-k1l2-3456-ghij-789012345678',
    'f6g7h8i9-j0k1-2345-fghi-678901234567',
    'Bachelor of Computer Science',
    'BCS',
    'active',
    'b2c3d4e5-f6g7-8901-bcde-f23456789012'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 5: CREATE SAMPLE COURSES
-- ============================================================================

-- Insert sample course
INSERT INTO college_courses (
    id,
    course_name,
    course_code,
    credits,
    college_id,
    department_id,
    status
) VALUES (
    'h8i9j0k1-l2m3-4567-hijk-890123456789',
    'Data Structures and Algorithms',
    'CS201',
    4,
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    'f6g7h8i9-j0k1-2345-fghi-678901234567',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 6: CREATE SAMPLE COURSE MAPPINGS
-- ============================================================================

-- Insert sample course mapping
INSERT INTO college_course_mappings (
    id,
    program_id,
    course_id,
    semester,
    offering_type,
    capacity
) VALUES (
    'i9j0k1l2-m3n4-5678-ijkl-901234567890',
    'g7h8i9j0-k1l2-3456-ghij-789012345678',
    'h8i9j0k1-l2m3-4567-hijk-890123456789',
    3,
    'core',
    60
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 7: CREATE SAMPLE CURRICULUM RECORDS
-- ============================================================================

-- Insert sample curriculum with pending approval
INSERT INTO college_curriculums (
    id,
    academic_year,
    college_id,
    department_id,
    program_id,
    course_id,
    status,
    requested_by,
    request_date,
    request_message,
    university_id
) VALUES (
    'j0k1l2m3-n4o5-6789-jklm-012345678901',
    '2024-25',
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    'f6g7h8i9-j0k1-2345-fghi-678901234567',
    'g7h8i9j0-k1l2-3456-ghij-789012345678',
    'i9j0k1l2-m3n4-5678-ijkl-901234567890',
    'pending_approval',
    'e5f6g7h8-i9j0-1234-efgh-567890123456',
    NOW() - INTERVAL '2 days',
    'Please review and approve this curriculum for the upcoming academic year.',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
) ON CONFLICT (id) DO NOTHING;

-- Insert another sample curriculum with different status
INSERT INTO college_curriculums (
    id,
    academic_year,
    college_id,
    department_id,
    program_id,
    course_id,
    status,
    requested_by,
    request_date,
    request_message,
    university_id,
    reviewed_by,
    review_date,
    review_notes,
    published_date
) VALUES (
    'k1l2m3n4-o5p6-7890-klmn-123456789012',
    '2024-25',
    'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    'f6g7h8i9-j0k1-2345-fghi-678901234567',
    'g7h8i9j0-k1l2-3456-ghij-789012345678',
    'i9j0k1l2-m3n4-5678-ijkl-901234567890',
    'published',
    'e5f6g7h8-i9j0-1234-efgh-567890123456',
    NOW() - INTERVAL '5 days',
    'Please review this updated curriculum.',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'd4e5f6g7-h8i9-0123-defg-456789012345',
    NOW() - INTERVAL '1 day',
    'Curriculum approved and published.',
    NOW() - INTERVAL '1 day'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 8: VERIFICATION
-- ============================================================================

DO $
BEGIN
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'SAMPLE DATA CREATION COMPLETED';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '- 1 University: Sample University';
    RAISE NOTICE '- 1 College: Sample Engineering College';
    RAISE NOTICE '- 1 University-College affiliation';
    RAISE NOTICE '- 2 Users: University Admin + College Admin';
    RAISE NOTICE '- 1 Department: Computer Science';
    RAISE NOTICE '- 1 Program: Bachelor of Computer Science';
    RAISE NOTICE '- 1 Course: Data Structures and Algorithms';
    RAISE NOTICE '- 1 Course Mapping';
    RAISE NOTICE '- 2 Curriculum records (1 pending, 1 published)';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Now test the curriculum_approval_dashboard view:';
    RAISE NOTICE 'SELECT * FROM curriculum_approval_dashboard;';
    RAISE NOTICE '============================================================================';
END $;

-- Quick verification query
SELECT 
    'Verification' as test_name,
    status,
    COUNT(*) as count
FROM curriculum_approval_dashboard
GROUP BY status;