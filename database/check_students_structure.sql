-- Script to check current students table structure
-- Run this first to see what columns already exist

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

-- Check constraints
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'students';

-- Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'students';

-- Check current data
SELECT 
    id,
    profile->>'email' as email_from_profile,
    profile->>'name' as name_from_profile,
    profile
FROM public.students 
LIMIT 3;