-- Debug Adaptive Session Ownership Issue
-- This query helps diagnose the "You do not own this session" error

-- 1. Check the session and its student_id
SELECT 
    'Session Info' as check_type,
    s.id as session_id,
    s.student_id,
    s.status,
    s.grade_level,
    s.started_at
FROM adaptive_aptitude_sessions s
WHERE s.id = 'YOUR_SESSION_ID_HERE'
LIMIT 1;

-- 2. Check if the student_id exists in students table and get their user_id
SELECT 
    'Student Info' as check_type,
    st.id as student_id,
    st.user_id,
    st.name,
    st.email
FROM students st
WHERE st.id = (
    SELECT student_id 
    FROM adaptive_aptitude_sessions 
    WHERE id = 'YOUR_SESSION_ID_HERE'
);

-- 3. Check the authenticated user's ID (from auth.users)
-- Replace 'YOUR_AUTH_USER_ID' with the authenticated user's ID from the JWT token
SELECT 
    'Auth User Check' as check_type,
    u.id as auth_user_id,
    u.email
FROM auth.users u
WHERE u.id = 'YOUR_AUTH_USER_ID_HERE';

-- 4. Full diagnostic: Check if there's a mismatch
SELECT 
    'Ownership Diagnostic' as check_type,
    s.id as session_id,
    s.student_id as session_student_id,
    st.user_id as student_user_id,
    'YOUR_AUTH_USER_ID_HERE' as authenticated_user_id,
    CASE 
        WHEN st.user_id = 'YOUR_AUTH_USER_ID_HERE'::uuid THEN 'MATCH - Should work'
        ELSE 'MISMATCH - This is the problem!'
    END as ownership_status
FROM adaptive_aptitude_sessions s
LEFT JOIN students st ON st.id = s.student_id
WHERE s.id = 'YOUR_SESSION_ID_HERE';
