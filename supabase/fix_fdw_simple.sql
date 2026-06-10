-- Fix FDW User Mapping - Correct the username typo

-- Drop existing mappings
DROP USER MAPPING IF EXISTS FOR supabase_admin SERVER sso_worker_server;
DROP USER MAPPING IF EXISTS FOR postgres SERVER sso_worker_server;
DROP USER MAPPING IF EXISTS FOR authenticated SERVER sso_worker_server;
DROP USER MAPPING IF EXISTS FOR anon SERVER sso_worker_server;

-- Create new mappings with correct username
CREATE USER MAPPING FOR supabase_admin
SERVER sso_worker_server
OPTIONS (user 'postgres', password 'postgres');

CREATE USER MAPPING FOR postgres
SERVER sso_worker_server
OPTIONS (user 'postgres', password 'postgres');

CREATE USER MAPPING FOR authenticated
SERVER sso_worker_server
OPTIONS (user 'postgres', password 'postgres');

CREATE USER MAPPING FOR anon
SERVER sso_worker_server
OPTIONS (user 'postgres', password 'postgres');

-- Test
SELECT COUNT(*) FROM sso_foreign.memberships;
