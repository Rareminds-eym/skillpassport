-- ==================== DISABLE RLS FOR DEMO MODE ====================
-- Run this in Supabase SQL Editor to allow public access to students table
-- This is needed because your app fetches data by email (profile->>'email')
-- without authenticated Supabase users linked to the students table

-- STEP 1: Disable Row Level Security
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;

-- That's it! Your app should now be able to fetch student data by email.

-- ==================== VERIFY RLS STATUS ====================
-- Run this to check if RLS is disabled:
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename = 'students';
-- Expected result: rowsecurity = false

-- ==================== TEST DATA FETCH ====================
-- Test if you can fetch data from JSONB profile:
-- NOTE: Your imported data has blank emails in profile, so we fetch by name or get all:

-- Get all students to see available data:
-- SELECT 
--   id, 
--   profile->>'name' as name,
--   profile->>'email' as email,
--   profile->>'registration_number' as reg_number,
--   profile->>'course' as course
-- FROM public.students
-- LIMIT 5;

-- Get specific student by registration number:
-- SELECT profile
-- FROM public.students
-- WHERE profile->>'registration_number' = '56122';

-- Get Rakshitha.M's data:
-- SELECT profile
-- FROM public.students
-- WHERE profile->>'name' LIKE '%Rakshitha%';

-- ==================== RE-ENABLE RLS (FOR PRODUCTION LATER) ====================
-- When you're ready to add proper authentication:
-- ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Then create a policy for public read access:
-- CREATE POLICY "Allow public read access"
-- ON public.students FOR SELECT
-- USING (true);

-- Or create a policy for authenticated users only:
-- CREATE POLICY "Students can view own profile"
-- ON public.students FOR SELECT
-- USING (auth.uid() = "userId");
