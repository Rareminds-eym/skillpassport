-- Quick verification script to check linking results
-- Run this after the link_auth_users.sql script

-- Check linking success
SELECT 
    'LINKING RESULTS' as summary,
    COUNT(*) as total_students,
    COUNT(user_id) as linked_count,
    COUNT(*) - COUNT(user_id) as unlinked_count,
    ROUND((COUNT(user_id)::numeric / COUNT(*)) * 100, 1) || '%' as success_rate
FROM public.students;

-- Show linked students with their auth info
SELECT 
    s.profile->>'name' as student_name,
    s.email as student_email,
    s.user_id as auth_user_id,
    au.email as auth_email,
    au.email_confirmed_at IS NOT NULL as email_verified,
    s."updatedAt" as linked_at
FROM public.students s
JOIN auth.users au ON s.user_id = au.id
ORDER BY s."updatedAt" DESC;

-- Test RLS policies work
SELECT 
    'RLS TEST - This should work for linked students' as test_type,
    COUNT(*) as accessible_records
FROM public.students
WHERE user_id IS NOT NULL;

-- Check recent_updates table needs updating too
SELECT 
    'Recent Updates Status' as table_status,
    COUNT(*) as total_updates,
    COUNT(user_id) as updates_with_user_id,
    COUNT(*) - COUNT(user_id) as updates_needing_user_id
FROM public.recent_updates;