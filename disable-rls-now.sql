-- DISABLE RLS FOR SCHOOL_EDUCATORS TABLE
-- Copy and paste this into Supabase SQL Editor and run it

-- Step 1: Disable RLS on school_educators table
ALTER TABLE public.school_educators DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify RLS is disabled
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'school_educators';

-- Step 3: Test data access
SELECT 
  'Data Test' as test_name,
  COUNT(*) as record_count
FROM public.school_educators;

-- Step 4: Show the specific educator record
SELECT 
  id,
  email,
  first_name,
  last_name,
  specialization,
  qualification,
  experience_years,
  designation,
  department,
  school_id,
  user_id,
  account_status,
  verification_status
FROM public.school_educators 
WHERE email = 'karthikeyan@rareminds.in';

-- Step 5: Show all educator records (to verify table has data)
SELECT 
  email,
  first_name,
  last_name,
  specialization
FROM public.school_educators 
ORDER BY created_at DESC
LIMIT 10;