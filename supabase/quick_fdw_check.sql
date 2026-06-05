-- Quick FDW Connection Check
-- Copy and paste this into Supabase SQL Editor

-- Step 1: Check if FDW extension exists
SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'postgres_fdw'
) as "FDW Extension Installed";

-- Step 2: Check if server exists
SELECT EXISTS (
    SELECT 1 FROM pg_foreign_server WHERE srvname = 'sso_worker_server'
) as "Foreign Server Exists";

-- Step 3: Check if foreign tables exist
SELECT COUNT(*) as "Foreign Tables Count"
FROM information_schema.foreign_tables
WHERE foreign_table_schema = 'sso_foreign';

-- Step 4: Try to query memberships table
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM sso_foreign.memberships LIMIT 1) 
        THEN 'CONNECTED ✅'
        ELSE 'NO DATA ⚠️'
    END as "Connection Status";
