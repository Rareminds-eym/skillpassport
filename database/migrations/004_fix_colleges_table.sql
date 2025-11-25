-- Migration: Fix colleges table schema
-- Add missing audit columns and ensure proper RLS policies

-- Step 1: Add missing columns to colleges table
ALTER TABLE public.colleges 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 2: Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_colleges_created_by ON public.colleges(created_by);
CREATE INDEX IF NOT EXISTS idx_colleges_updated_by ON public.colleges(updated_by);
CREATE INDEX IF NOT EXISTS idx_colleges_code ON public.colleges(code);
CREATE INDEX IF NOT EXISTS idx_colleges_email ON public.colleges(email);

-- Step 3: Enable RLS on colleges table
ALTER TABLE public.colleges ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow college admins to view their own college" ON public.colleges;
DROP POLICY IF EXISTS "Allow college admins to insert their own college" ON public.colleges;
DROP POLICY IF EXISTS "Allow college admins to update their own college" ON public.colleges;
DROP POLICY IF EXISTS "Allow public to read approved colleges" ON public.colleges;
DROP POLICY IF EXISTS "Allow super admins to manage all colleges" ON public.colleges;

-- Step 5: Create RLS policies for colleges table

-- Policy 1: Allow college admins to view their own college
CREATE POLICY "Allow college admins to view their own college"
ON public.colleges
FOR SELECT
USING (
  auth.uid() = created_by
  OR
  auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'super_admin'
  )
);

-- Policy 2: Allow authenticated users to insert college (during signup)
CREATE POLICY "Allow college admins to insert their own college"
ON public.colleges
FOR INSERT
WITH CHECK (
  auth.uid() = created_by
);

-- Policy 3: Allow college admins to update their own college
CREATE POLICY "Allow college admins to update their own college"
ON public.colleges
FOR UPDATE
USING (
  auth.uid() = created_by
  OR
  auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'super_admin'
  )
)
WITH CHECK (
  auth.uid() = created_by
  OR
  auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'super_admin'
  )
);

-- Policy 4: Allow public to read approved colleges (for discovery)
CREATE POLICY "Allow public to read approved colleges"
ON public.colleges
FOR SELECT
USING (
  "approvalStatus" = 'approved'
  AND "accountStatus" = 'active'
);

-- Policy 5: Allow super admins to manage all colleges
CREATE POLICY "Allow super admins to manage all colleges"
ON public.colleges
FOR ALL
USING (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'super_admin'
  )
)
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'super_admin'
  )
);

-- Step 6: Update existing records to set created_by if null
-- This is a one-time data migration for existing records
UPDATE public.colleges
SET created_by = (
  SELECT id FROM auth.users 
  WHERE email = colleges.email 
  LIMIT 1
)
WHERE created_by IS NULL
AND email IS NOT NULL;

-- Step 7: Add comment to table
COMMENT ON TABLE public.colleges IS 'Stores college/institution profiles with admin ownership tracking';
COMMENT ON COLUMN public.colleges.created_by IS 'User ID of the college admin who created this record';
COMMENT ON COLUMN public.colleges.updated_by IS 'User ID of the user who last updated this record';
