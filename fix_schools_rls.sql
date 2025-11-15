-- Check current RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'schools';

-- If RLS is enabled, create a policy to allow read access
-- Option 1: Disable RLS (simplest for development)
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;

-- Option 2: Or create a permissive read policy
-- DROP POLICY IF EXISTS "Allow public read access to schools" ON schools;
-- CREATE POLICY "Allow public read access to schools" 
--   ON schools FOR SELECT 
--   USING (true);
