-- Check which users tables exist and their structure

-- Check if public.users exists
SELECT 
    'public.users' as table_name,
    COUNT(*) as row_count
FROM public.users;

-- Check if users_shadow exists
SELECT 
    'users_shadow' as table_name,
    COUNT(*) as row_count
FROM public.users_shadow;

-- Check the foreign key constraint on organization_invitations
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'organization_invitations'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'invited_by';

-- Check if the current user exists in public.users
-- Replace with actual user ID from error context
SELECT 
    id,
    email
FROM public.users
WHERE id = 'e74e8fe3-3244-40ae-9055-c5599f30a4d3';

-- Check if user exists in users_shadow
SELECT 
    id,
    email
FROM public.users_shadow
WHERE id = 'e74e8fe3-3244-40ae-9055-c5599f30a4d3';
