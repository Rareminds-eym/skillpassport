-- Temporarily disable RLS to test data access
-- Run this in Supabase SQL Editor

-- Check current RLS status
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled,
  (SELECT count(*) FROM pg_policies WHERE tablename = 'school_educators') as policy_count
FROM pg_tables 
WHERE tablename = 'school_educators';

-- Temporarily disable RLS for testing
ALTER TABLE public.school_educators DISABLE ROW LEVEL SECURITY;

-- Verify data exists
SELECT 
  id,
  email,
  first_name,
  last_name,
  specialization,
  qualification,
  school_id,
  user_id,
  created_at
FROM public.school_educators 
WHERE email = 'karthikeyan@rareminds.in';

-- Count total records
SELECT COUNT(*) as total_educators FROM public.school_educators;

-- Show all educator emails (to verify data exists)
SELECT email, first_name, last_name FROM public.school_educators LIMIT 10;

-- Re-enable RLS after testing (uncomment when ready)
-- ALTER TABLE public.school_educators ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all authenticated users to read
CREATE POLICY IF NOT EXISTS "Allow authenticated read access" 
ON public.school_educators 
FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create a simple policy that allows all authenticated users to update
CREATE POLICY IF NOT EXISTS "Allow authenticated update access" 
ON public.school_educators 
FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');