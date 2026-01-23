-- QUICK FIX: Add missing columns to colleges table
-- Run this in Supabase SQL Editor immediately

-- Add the missing columns
ALTER TABLE public.colleges 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_colleges_created_by ON public.colleges(created_by);

-- Enable RLS (if not already enabled)
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

-- Allow college admins to insert their own college
DROP POLICY IF EXISTS "Allow college admins to insert their own college" ON public.colleges;
CREATE POLICY "Allow college admins to insert their own college"
ON public.colleges
FOR INSERT
WITH CHECK (auth.uid() = created_by);

-- Allow college admins to view their own college
DROP POLICY IF EXISTS "Allow college admins to view their own college" ON public.colleges;
CREATE POLICY "Allow college admins to view their own college"
ON public.colleges
FOR SELECT
USING (auth.uid() = created_by);

-- Allow college admins to update their own college
DROP POLICY IF EXISTS "Allow college admins to update their own college" ON public.colleges;
CREATE POLICY "Allow college admins to update their own college"
ON public.colleges
FOR UPDATE
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Done! Test college registration now
SELECT 'Quick fix applied successfully! You can now test college registration.' as status;
