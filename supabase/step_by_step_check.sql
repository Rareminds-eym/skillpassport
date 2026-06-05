-- =====================================================
-- Step-by-Step FDW Connection Check
-- Run each query ONE AT A TIME to diagnose the issue
-- =====================================================

-- STEP 1: Check if postgres_fdw extension is installed
-- Expected: Should return 1 row with postgres_fdw
SELECT extname, extversion 
FROM pg_extension 
WHERE extname = 'postgres_fdw';
-- ✅ If you see postgres_fdw: Extension is installed
-- ❌ If empty: Run "CREATE EXTENSION postgres_fdw;"


-- STEP 2: Check if foreign server exists
-- Expected: Should return 1 row with sso_worker_server
SELECT srvname, srvoptions 
FROM pg_foreign_server 
WHERE srvname = 'sso_worker_server';
-- ✅ If you see sso_worker_server: Server is configured
-- ❌ If empty: Server was not created, migration didn't run properly


-- STEP 3: Check if sso_foreign schema exists
-- Expected: Should return 1 row with sso_foreign
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'sso_foreign';
-- ✅ If you see sso_foreign: Schema exists
-- ❌ If empty: Schema was not created


-- STEP 4: List all foreign tables
-- Expected: Should return 5 tables (memberships, organizations, users, roles, membership_roles)
SELECT 
    foreign_table_name as "Table Name",
    foreign_server_name as "Server"
FROM information_schema.foreign_tables
WHERE foreign_table_schema = 'sso_foreign'
ORDER BY foreign_table_name;
-- ✅ If you see 5 tables: Foreign tables are created
-- ❌ If empty or less than 5: Foreign tables were not created properly


-- STEP 5: Try to query memberships table (THIS WILL SHOW THE ACTUAL ERROR)
-- Expected: Either returns data or shows connection error
SELECT COUNT(*) FROM sso_foreign.memberships;
-- ✅ If you get a number: Connection is working!
-- ❌ If error "relation does not exist": Foreign table not created
-- ❌ If error "could not connect": Network/connection issue
-- ❌ If error "password authentication failed": Wrong credentials


-- STEP 6: Check if helper functions exist
-- Expected: Should return 4 functions
SELECT routine_name 
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'is_org_member',
    'get_user_recruitment_roles',
    'has_recruitment_permission',
    'get_user_org_context'
)
ORDER BY routine_name;
-- ✅ If you see 4 functions: Helper functions are created
-- ❌ If less than 4: Some functions are missing


-- STEP 7: Check recruitment_role_mapping data
-- Expected: Should return 3 rows (owner, admin, member)
SELECT sso_role_name, recruitment_role 
FROM public.recruitment_role_mapping
ORDER BY sso_role_name;
-- ✅ If you see 3 rows: Role mapping is set up
-- ❌ If empty or error: Table doesn't exist or no data


-- =====================================================
-- WHAT THE RESULTS MEAN:
-- =====================================================
-- 
-- If STEP 1-4 pass but STEP 5 fails:
--   → FDW is configured but cannot connect to SSO-Worker database
--   → The SSO-Worker database is not running or not accessible
--   → Solution: Either fix the connection or use local tables instead
-- 
-- If STEP 1-2 pass but STEP 3-4 fail:
--   → Foreign tables were not created
--   → Solution: Re-run the migration
-- 
-- If STEP 1 fails:
--   → Extension not installed
--   → Solution: Run "CREATE EXTENSION postgres_fdw;"
-- 
-- If STEP 2 fails:
--   → Server not configured
--   → Solution: Re-run the migration from the beginning
-- 
-- =====================================================
