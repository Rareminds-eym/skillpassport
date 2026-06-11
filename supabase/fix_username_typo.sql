-- =====================================================
-- Fix Username Typo in User Mappings
-- Changes 'postgress' to 'postgres'
-- =====================================================

BEGIN;

-- Drop all existing user mappings with the typo
DROP USER MAPPING IF EXISTS FOR supabase_admin SERVER sso_worker_server;
DROP USER MAPPING IF EXISTS FOR postgres SERVER sso_worker_server;
DROP USER MAPPING IF EXISTS FOR authenticated SERVER sso_worker_server;
DROP USER MAPPING IF EXISTS FOR anon SERVER sso_worker_server;
DROP USER MAPPING IF EXISTS FOR current_user SERVER sso_worker_server;

-- Recreate user mappings with correct username 'postgres' (not 'postgress')
CREATE USER MAPPING FOR supabase_admin
SERVER sso_worker_server
OPTIONS (
    user 'postgres',
    password 'postgres'
);

CREATE USER MAPPING FOR postgres
SERVER sso_worker_server
OPTIONS (
    user 'postgres',
    password 'postgres'
);

CREATE USER MAPPING FOR authenticated
SERVER sso_worker_server
OPTIONS (
    user 'postgres',
    password 'postgres'
);

CREATE USER MAPPING FOR anon
SERVER sso_worker_server
OPTIONS (
    user 'postgres',
    password 'postgres'
);

COMMIT;

-- Verify user mappings
SELECT 
    usename as "Local User",
    srvname as "Foreign Server"
FROM pg_user_mappings
WHERE srvname = 'sso_worker_server'
ORDER BY usename;

-- Test the connection
SELECT 'Testing connection with correct username...' as status;
SELECT COUNT(*) as "Memberships Count" FROM sso_foreign.memberships;

-- Test the get_user_org_context function
SELECT 'Testing get_user_org_context function...' as status;
SELECT * FROM get_user_org_context('e74e8fe3-3244-40ae-9055-c5599f30a4d3');
