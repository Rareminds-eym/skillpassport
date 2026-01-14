-- ============================================================================
-- DEBUG: Why Approved Curriculum Not Showing in College Admin
-- ============================================================================
-- Run this in Supabase SQL Editor to diagnose the issue
-- ============================================================================

-- STEP 1: Check if there are any approved/published curriculums
SELECT 
    id,
    course_id,
    academic_year,
    status,
    college_id,
    university_id,
    created_at,
    updated_at,
    published_date,
    review_date
FROM college_curriculums
WHERE status IN ('approved', 'published')
ORDER BY updated_at DESC
LIMIT 10;

-- STEP 2: Check a specific curriculum by ID (replace with actual ID)
-- SELECT * FROM college_curriculums WHERE id = 'YOUR_CURRICULUM_ID_HERE';

-- STEP 3: Check if RLS policies are blocking college admin access
-- Test as college admin user
SELECT 
    c.id,
    c.status,
    c.college_id,
    o.name as college_name,
    u.email as creator_email
FROM college_curriculums c
LEFT JOIN organizations o ON o.id = c.college_id
LEFT JOIN users u ON u.id = c.created_by
WHERE c.status IN ('approved', 'published')
ORDER BY c.updated_at DESC;

-- STEP 4: Check RLS policies on college_curriculums table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'college_curriculums'
ORDER BY policyname;

-- STEP 5: Check if curriculum was recently updated from pending_approval to approved
SELECT 
    id,
    course_id,
    academic_year,
    status,
    college_id,
    university_id,
    review_date,
    published_date,
    updated_at,
    EXTRACT(EPOCH FROM (NOW() - updated_at)) / 60 as minutes_since_update
FROM college_curriculums
WHERE status IN ('approved', 'published', 'pending_approval')
ORDER BY updated_at DESC
LIMIT 20;

-- STEP 6: Check if there are any curriculums stuck in pending_approval
SELECT 
    COUNT(*) as pending_count,
    college_id,
    university_id
FROM college_curriculums
WHERE status = 'pending_approval'
GROUP BY college_id, university_id;

-- STEP 7: Check the approval workflow - see if review_date is set
SELECT 
    id,
    status,
    review_date,
    review_notes,
    reviewer_id,
    published_date,
    CASE 
        WHEN review_date IS NULL AND status IN ('approved', 'published') THEN 'MISSING REVIEW DATE'
        WHEN published_date IS NULL AND status = 'published' THEN 'MISSING PUBLISHED DATE'
        ELSE 'OK'
    END as data_integrity_check
FROM college_curriculums
WHERE status IN ('approved', 'published', 'pending_approval')
ORDER BY updated_at DESC;

-- STEP 8: Test query that college admin would use
-- This simulates what the frontend does
-- Replace 'YOUR_COLLEGE_ID' with actual college ID
/*
SELECT 
    c.*,
    d.name as department_name,
    p.name as program_name,
    cc.course_code,
    cc.course_name
FROM college_curriculums c
LEFT JOIN departments d ON d.id = c.department_id
LEFT JOIN programs p ON p.id = c.program_id
LEFT JOIN college_courses cc ON cc.id = c.course_id
WHERE c.college_id = 'YOUR_COLLEGE_ID'
AND c.status IN ('draft', 'pending_approval', 'approved', 'published')
ORDER BY c.updated_at DESC;
*/

-- STEP 9: Check if there's a trigger or function that might be interfering
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'college_curriculums';

