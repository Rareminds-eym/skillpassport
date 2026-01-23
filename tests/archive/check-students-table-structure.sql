-- Check if students table exists and its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'students'
ORDER BY ordinal_position;

-- Check RLS policies on students table
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
WHERE schemaname = 'public' 
AND tablename = 'students';

-- Check if table has RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
AND tablename = 'students';

-- Try a test insert to see what error we get
-- (This will fail but show us the error)
-- INSERT INTO public.students (email, profile) 
-- VALUES ('test@example.com', '{"name": "Test"}');
