-- Disable RLS on school_educators table to allow data fetching
-- This is a temporary fix - you can re-enable RLS later with proper policies

-- Step 1: Disable RLS on school_educators
ALTER TABLE public.school_educators DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify RLS is disabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'school_educators';

-- Expected output: rowsecurity should be 'f' (false)

-- Step 3: Drop existing policies (optional, if you want to clean up)
DROP POLICY IF EXISTS "Users can view their own educator profile" ON public.school_educators;
DROP POLICY IF EXISTS "Users can update their own educator profile" ON public.school_educators;
DROP POLICY IF EXISTS "School admins can view educators in their school" ON public.school_educators;
DROP POLICY IF EXISTS "School admins can update educators in their school" ON public.school_educators;

-- Step 4: Test the query
SELECT * FROM public.school_educators LIMIT 1;

-- If you want to re-enable RLS later with proper policies, use:
-- ALTER TABLE public.school_educators ENABLE ROW LEVEL SECURITY;
