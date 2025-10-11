-- ==================== DISABLE RLS FOR DEMO MODE ====================
-- Run this in Supabase SQL Editor to allow direct table access without auth
-- 
-- ⚠️ WARNING: This makes the students table publicly readable!
-- Only use for demo/development. Re-enable RLS for production.

-- Disable RLS on students table
ALTER TABLE students DISABLE ROW LEVEL SECURITY;

-- OR if you want to keep RLS enabled but allow public reads:
-- CREATE POLICY "Allow public read access for demo"
-- ON students FOR SELECT
-- USING (true);

-- To re-enable RLS later (for production):
-- ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow public read access for demo" ON students;
