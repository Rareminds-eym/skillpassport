-- =====================================================
-- FDW Connection Diagnostic Script
-- Run this in your SkillPassport database to check FDW setup
-- =====================================================

-- 1. Check if postgres_fdw extension is installed
SELECT 
    extname as "Extension Name",
    extversion as "Version"
FROM pg_extension 
WHERE extname = 'postgres_fdw';

-- 2. Check if foreign server exists
SELECT 
    srvname as "Server Name",
    srvoptions as "Server Options"
FROM pg_foreign_server 
WHERE srvname = 'sso_worker_server';

-- 3. Check user mappings
SELECT 
    um.umuser::regrole as "Local User",
    s.srvname as "Foreign Server",
    um.umoptions as "User Options"
FROM pg_user_mappings um
JOIN pg_foreign_server s ON s.oid = um.umserver
WHERE s.srvname = 'sso_worker_server';

-- 4. Check if sso_foreign schema exists
SELECT 
    schema_name
FROM information_schema.schemata 
WHERE schema_name = 'sso_foreign';

-- 5. List all foreign tables in sso_foreign schema
SELECT 
    foreign_table_schema as "Schema",
    foreign_table_name as "Table Name",
    foreign_server_name as "Server"
FROM information_schema.foreign_tables
WHERE foreign_table_schema = 'sso_foreign'
ORDER BY foreign_table_name;

-- 6. Test connection by querying a foreign table
-- This will fail if connection is not working
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    BEGIN
        SELECT COUNT(*) INTO v_count FROM sso_foreign.memberships;
        RAISE NOTICE 'SUCCESS: Connected to sso_foreign.memberships. Row count: %', v_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: Cannot connect to sso_foreign.memberships';
        RAISE NOTICE 'Error message: %', SQLERRM;
    END;
END $$;

-- 7. Test other foreign tables
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    BEGIN
        SELECT COUNT(*) INTO v_count FROM sso_foreign.organizations;
        RAISE NOTICE 'SUCCESS: Connected to sso_foreign.organizations. Row count: %', v_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'ERROR: Cannot connect to sso_foreign.organizations';
        RAISE NOTICE 'Error message: %', SQLERRM;
    END;
END $$;

-- 8. Check if helper functions exist
SELECT 
    routine_name as "Function Name",
    routine_type as "Type"
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'is_org_member',
    'get_user_recruitment_roles',
    'has_recruitment_permission',
    'get_user_org_context'
)
ORDER BY routine_name;

-- 9. Check recruitment_role_mapping table
SELECT 
    sso_role_name,
    recruitment_role,
    can_manage_team,
    can_create_jobs,
    can_view_candidates
FROM public.recruitment_role_mapping
ORDER BY sso_role_name;

-- 10. Check organization_recruitment_settings table
SELECT 
    COUNT(*) as "Total Org Settings"
FROM public.organization_recruitment_settings;

-- =====================================================
-- INTERPRETATION OF RESULTS:
-- =====================================================
-- 
-- If you see:
-- ✅ Extension installed: postgres_fdw exists
-- ✅ Server exists: sso_worker_server is configured
-- ✅ User mapping exists: Credentials are set
-- ✅ Schema exists: sso_foreign schema is created
-- ✅ Foreign tables listed: Tables are imported
-- ✅ SUCCESS messages: Connection is working
-- 
-- If you see errors:
-- ❌ "relation does not exist": Foreign tables not created
-- ❌ "could not connect to server": Network/credentials issue
-- ❌ "password authentication failed": Wrong credentials
-- ❌ No foreign tables listed: Import failed
-- 
-- =====================================================
