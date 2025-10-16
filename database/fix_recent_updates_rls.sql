-- Fix Recent Updates RLS Policies
-- This allows students to view their recent updates without being authenticated via Supabase Auth

-- First, drop existing policies
DROP POLICY IF EXISTS "Users can view own recent updates" ON public.recent_updates;
DROP POLICY IF EXISTS "Users can update own recent updates" ON public.recent_updates;
DROP POLICY IF EXISTS "Allow insert recent updates" ON public.recent_updates;

-- Enable RLS
ALTER TABLE public.recent_updates ENABLE ROW LEVEL SECURITY;

-- Create new policy that allows public read access
-- This is safe because student_id is just a reference, no sensitive data
CREATE POLICY "Allow public read access to recent_updates"
ON public.recent_updates
FOR SELECT
USING (true);

-- Policy for authenticated users to update their own data
CREATE POLICY "Allow users to update own recent_updates"
ON public.recent_updates
FOR UPDATE
USING (auth.uid() = student_id);

-- Policy for authenticated users to insert their own data
CREATE POLICY "Allow users to insert own recent_updates"
ON public.recent_updates
FOR INSERT
WITH CHECK (auth.uid() = student_id);

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'recent_updates';
