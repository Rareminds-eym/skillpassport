-- Fix RLS and Permissions for school_educators table

-- Step 1: Disable RLS temporarily to allow operations
ALTER TABLE public.school_educators DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own educator profile" ON public.school_educators;
DROP POLICY IF EXISTS "Users can update their own educator profile" ON public.school_educators;
DROP POLICY IF EXISTS "School admins can view educators in their school" ON public.school_educators;
DROP POLICY IF EXISTS "School admins can update educators in their school" ON public.school_educators;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.school_educators;

-- Step 3: Enable RLS
ALTER TABLE public.school_educators ENABLE ROW LEVEL SECURITY;

-- Step 4: Create permissive policies for authenticated users
-- Allow authenticated users to view all educators
CREATE POLICY "Allow authenticated users to view educators"
ON public.school_educators
FOR SELECT
USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert educators
CREATE POLICY "Allow authenticated users to insert educators"
ON public.school_educators
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update educators
CREATE POLICY "Allow authenticated users to update educators"
ON public.school_educators
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete educators
CREATE POLICY "Allow authenticated users to delete educators"
ON public.school_educators
FOR DELETE
USING (auth.role() = 'authenticated');

-- Step 5: Verify the setup
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  (SELECT count(*) FROM pg_policies WHERE tablename = 'school_educators') as policy_count
FROM pg_tables
WHERE tablename = 'school_educators';

-- Step 6: List all policies
SELECT policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'school_educators'
ORDER BY policyname;
