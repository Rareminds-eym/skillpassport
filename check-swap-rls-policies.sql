-- Check RLS policies for swap request tables
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
WHERE tablename IN ('class_swap_requests', 'class_swap_history')
ORDER BY tablename, policyname;