-- Fix RLS policies for school_educators table
-- Copy and paste this into Supabase SQL Editor

-- Step 1: Check current status
SELECT 
  'Current RLS Status' as info,
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'school_educators';

-- Step 2: Temporarily disable RLS to test
ALTER TABLE public.school_educators DISABLE ROW LEVEL SECURITY;

-- Step 3: Verify data exists
SELECT 
  'Data Check' as info,
  COUNT(*) as total_records
FROM public.school_educators;

-- Step 4: Show the specific record
SELECT 
  'Specific Record' as info,
  id,
  email,
  first_name,
  last_name,
  specialization,
  qualification
FROM public.school_educators 
WHERE email = 'karthikeyan@rareminds.in';

-- Step 5: Re-enable RLS with permissive policies
ALTER TABLE public.school_educators ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own educator profile" ON public.school_educators;
DROP POLICY IF EXISTS "Users can update their own educator profile" ON public.school_educators;
DROP POLICY IF EXISTS "School admins can view educators in their school" ON public.school_educators;
DROP POLICY IF EXISTS "School admins can update educators in their school" ON public.school_educators;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.school_educators;
DROP POLICY IF EXISTS "Allow authenticated users to view educators" ON public.school_educators;
DROP POLICY IF EXISTS "Allow authenticated users to insert educators" ON public.school_educators;
DROP POLICY IF EXISTS "Allow authenticated users to update educators" ON public.school_educators;
DROP POLICY IF EXISTS "Allow authenticated users to delete educators" ON public.school_educators;
DROP POLICY IF EXISTS "Allow authenticated read access" ON public.school_educators;
DROP POLICY IF EXISTS "Allow authenticated update access" ON public.school_educators;

-- Step 7: Create simple, permissive policies
CREATE POLICY "public_read_school_educators" 
ON public.school_educators 
FOR SELECT 
USING (true);

CREATE POLICY "public_update_school_educators" 
ON public.school_educators 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "public_insert_school_educators" 
ON public.school_educators 
FOR INSERT 
WITH CHECK (true);

-- Step 8: Verify policies are created
SELECT 
  'Policy Check' as info,
  policyname,
  permissive,
  cmd
FROM pg_policies 
WHERE tablename = 'school_educators'
ORDER BY policyname;

-- Step 9: Test query that should work now
SELECT 
  'Final Test' as info,
  email,
  first_name,
  last_name
FROM public.school_educators 
WHERE email = 'karthikeyan@rareminds.in';