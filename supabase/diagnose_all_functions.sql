-- Comprehensive diagnostic script for all required functions

-- Check if get_user_org_context function exists
SELECT 
    'get_user_org_context' as function_name,
    EXISTS (
        SELECT 1 FROM information_schema.routines
        WHERE routine_schema = 'public'
        AND routine_name = 'get_user_org_context'
    ) as exists;

-- Check if create_organization_recruitment_settings function exists
SELECT 
    'create_organization_recruitment_settings' as function_name,
    COUNT(*) as count,
    string_agg(
        '(' || string_agg(parameter_name || ' ' || data_type, ', ' ORDER BY ordinal_position) || ')',
        ' | '
    ) as signatures
FROM information_schema.routines r
LEFT JOIN information_schema.parameters p ON p.specific_name = r.specific_name
WHERE r.routine_schema = 'public'
AND r.routine_name = 'create_organization_recruitment_settings'
GROUP BY r.routine_name;

-- Check if organization_recruitment_settings table exists
SELECT 
    'organization_recruitment_settings' as table_name,
    EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'organization_recruitment_settings'
    ) as exists;

-- List all functions in public schema
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'get_user_org_context',
    'create_organization_recruitment_settings',
    'is_org_member',
    'get_user_recruitment_roles',
    'has_recruitment_permission'
)
ORDER BY routine_name;

-- Check FDW setup
SELECT 
    'FDW Server' as check_type,
    srvname as name,
    'EXISTS' as status
FROM pg_foreign_server
WHERE srvname = 'sso_worker_server';

-- Check foreign tables
SELECT 
    'Foreign Table' as check_type,
    foreign_table_name as name,
    'EXISTS' as status
FROM information_schema.foreign_tables
WHERE foreign_table_schema = 'sso_foreign'
ORDER BY foreign_table_name;
