-- Check if RLS is enabled on attendance_records table
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'attendance_records';

-- Check RLS policies on attendance_records
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
WHERE tablename = 'attendance_records';

-- Test if we can query the table directly
SELECT COUNT(*) as total_records
FROM attendance_records
WHERE school_id = '550e8400-e29b-41d4-a716-446655440000';
