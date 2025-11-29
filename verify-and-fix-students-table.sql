-- First, let's see what the current students table looks like
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'students'
ORDER BY ordinal_position;

-- If the table doesn't have user_id column, add it:
-- ALTER TABLE public.students ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- If the table doesn't have universityId column, add it:
-- ALTER TABLE public.students ADD COLUMN IF NOT EXISTS "universityId" text;

-- If the table doesn't have profile column, add it:
-- ALTER TABLE public.students ADD COLUMN IF NOT EXISTS profile jsonb DEFAULT '{}'::jsonb;

-- Make sure email column exists and is unique:
-- ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email text UNIQUE;

-- Check if RLS is blocking inserts (service role should bypass this, but let's check):
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'students';

-- Temporarily disable RLS to test (ONLY FOR TESTING):
-- ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;

-- After testing, re-enable it:
-- ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
