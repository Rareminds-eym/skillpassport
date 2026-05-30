-- 1. Check if the foreign schema exists
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'sso_foreign';

-- 2. Check if the foreign server is configured
SELECT * FROM pg_foreign_server WHERE srvname = 'sso_worker_server';

-- 3. Check if foreign tables exist in sso_foreign schema
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'sso_foreign';

-- 4. Check if the memberships foreign table exists specifically
SELECT * FROM information_schema.foreign_tables 
WHERE foreign_table_schema = 'sso_foreign' 
AND foreign_table_name = 'memberships';

-- 5. Try to query the foreign memberships table directly
SELECT * FROM sso_foreign.memberships LIMIT 5;

-- 6. Check the get_user_org_context function definition
SELECT pg_get_functiondef('public.get_user_org_context'::regproc);

-- 7. Check if the SSO database connection is working
SELECT * FROM sso_foreign.organizations LIMIT 5;

-- 8. Check user mappings for the foreign server
SELECT * FROM pg_user_mappings WHERE srvname = 'sso_worker_server';
