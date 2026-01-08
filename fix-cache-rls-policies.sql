-- Fix RLS Policies for adaptive_aptitude_questions_cache
-- This script will check and create the necessary policies for the service role to write to the cache

-- 1. Check existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'adaptive_aptitude_questions_cache';

-- 2. Drop existing restrictive policies if they exist (optional - only if needed)
-- DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON adaptive_aptitude_questions_cache;
-- DROP POLICY IF EXISTS "Enable update for authenticated users only" ON adaptive_aptitude_questions_cache;

-- 3. Create policy to allow service_role to manage the cache
-- This is the KEY policy needed for the Cloudflare Worker to write
DROP POLICY IF EXISTS "Service role can manage question cache" ON adaptive_aptitude_questions_cache;

CREATE POLICY "Service role can manage question cache"
ON adaptive_aptitude_questions_cache
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 4. Create policy to allow authenticated users to read from cache
DROP POLICY IF EXISTS "Authenticated users can read question cache" ON adaptive_aptitude_questions_cache;

CREATE POLICY "Authenticated users can read question cache"
ON adaptive_aptitude_questions_cache
FOR SELECT
TO authenticated
USING (is_active = true);

-- 5. Create policy to allow anon users to read from cache (for the worker's read operations)
DROP POLICY IF EXISTS "Anon users can read question cache" ON adaptive_aptitude_questions_cache;

CREATE POLICY "Anon users can read question cache"
ON adaptive_aptitude_questions_cache
FOR SELECT
TO anon
USING (is_active = true);

-- 6. Verify RLS is enabled
ALTER TABLE adaptive_aptitude_questions_cache ENABLE ROW LEVEL SECURITY;

-- 7. Verify the policies were created
SELECT 
    policyname,
    roles,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'adaptive_aptitude_questions_cache'
ORDER BY policyname;

-- Expected output:
-- You should see:
-- 1. "Service role can manage question cache" - FOR ALL - TO service_role
-- 2. "Authenticated users can read question cache" - FOR SELECT - TO authenticated  
-- 3. "Anon users can read question cache" - FOR SELECT - TO anon
