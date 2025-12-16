-- Test Project Approval System
-- Run this in Supabase SQL Editor to test the project approval system

-- Test 1: Check project table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('approval_status', 'approval_authority', 'approved_by', 'rejected_by', 'approval_notes')
ORDER BY column_name;

-- Test 2: Check project_notifications table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'project_notifications'
ORDER BY column_name;

-- Test 3: Check if RPC functions exist
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_name IN ('get_pending_school_projects', 'get_pending_college_projects')
ORDER BY routine_name;

-- Test 4: Check if triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers 
WHERE event_object_table = 'projects'
ORDER BY trigger_name;

-- Test 5: Test approval authority routing with sample data
-- (This will show how the trigger works)
SELECT 
    p.id,
    p.title,
    p.organization,
    p.approval_status,
    p.approval_authority,
    s.student_type,
    CASE 
        WHEN s.student_type IN ('school', 'school_student') THEN 'Should route to school_admin if org matches school'
        WHEN s.student_type IN ('college', 'college_student') THEN 'Should route to college_admin if org matches college'
        ELSE 'Should route to rareminds_admin for external orgs'
    END as expected_routing
FROM projects p
JOIN students s ON p.student_id = s.id
WHERE p.created_at > NOW() - INTERVAL '7 days'
ORDER BY p.created_at DESC
LIMIT 10;

-- Test 6: Check recent project notifications
SELECT 
    pn.id,
    pn.recipient_type,
    pn.message,
    pn.is_read,
    pn.created_at,
    p.title as project_title,
    p.organization
FROM project_notifications pn
JOIN projects p ON pn.project_id = p.id
ORDER BY pn.created_at DESC
LIMIT 10;

-- Test 7: Count projects by approval status and authority
SELECT 
    approval_status,
    approval_authority,
    COUNT(*) as count
FROM projects
GROUP BY approval_status, approval_authority
ORDER BY approval_status, approval_authority;