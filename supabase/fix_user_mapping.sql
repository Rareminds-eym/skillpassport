-- =====================================================
-- Fix User Mapping for FDW
-- This creates user mappings for all necessary users
-- =====================================================

BEGIN;

-- Create user mapping for supabase_admin (the user you're logged in as)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_user_mappings 
        WHERE srvname = 'sso_worker_server' 
        AND usename = 'supabase_admin'
    ) THEN
        CREATE USER MAPPING FOR supabase_admin
        SERVER sso_worker_server
        OPTIONS (
            user 'postgres',
            password 'postgres'
        );
        RAISE NOTICE 'Created user mapping for supabase_admin';
    ELSE
        RAISE NOTICE 'User mapping for supabase_admin already exists';
    END IF;
END $$;

-- Create user mapping for postgres (superuser)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_user_mappings 
        WHERE srvname = 'sso_worker_server' 
        AND usename = 'postgres'
    ) THEN
        CREATE USER MAPPING FOR postgres
        SERVER sso_worker_server
        OPTIONS (
            user 'postgres',
            password 'postgres'
        );
        RAISE NOTICE 'Created user mapping for postgres';
    ELSE
        RAISE NOTICE 'User mapping for postgres already exists';
    END IF;
END $$;

-- Create user mapping for authenticated (for RLS policies)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_user_mappings 
        WHERE srvname = 'sso_worker_server' 
        AND usename = 'authenticated'
    ) THEN
        CREATE USER MAPPING FOR authenticated
        SERVER sso_worker_server
        OPTIONS (
            user 'postgres',
            password 'postgres'
        );
        RAISE NOTICE 'Created user mapping for authenticated';
    ELSE
        RAISE NOTICE 'User mapping for authenticated already exists';
    END IF;
END $$;

-- Create user mapping for anon (for anonymous access)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_user_mappings 
        WHERE srvname = 'sso_worker_server' 
        AND usename = 'anon'
    ) THEN
        CREATE USER MAPPING FOR anon
        SERVER sso_worker_server
        OPTIONS (
            user 'postgres',
            password 'postgres'
        );
        RAISE NOTICE 'Created user mapping for anon';
    ELSE
        RAISE NOTICE 'User mapping for anon already exists';
    END IF;
END $$;

COMMIT;

-- Verify user mappings were created
SELECT 
    usename as "Local User",
    srvname as "Foreign Server"
FROM pg_user_mappings
WHERE srvname = 'sso_worker_server'
ORDER BY usename;

-- Test the connection
SELECT 'Testing connection...' as status;
SELECT COUNT(*) as "Memberships Count" FROM sso_foreign.memberships;

-- =====================================================
-- IMPORTANT NOTES:
-- =====================================================
-- 
-- 1. This script uses hardcoded credentials (postgres/postgres)
--    These should match your SSO-Worker database credentials
-- 
-- 2. If you get "could not connect to server" error after this:
--    - The host/port in the foreign server is wrong
--    - The SSO-Worker database is not running
--    - Network connectivity issue
-- 
-- 3. If you get "password authentication failed":
--    - Update the password in the OPTIONS above
--    - Make sure it matches your SSO-Worker database password
-- 
-- =====================================================
