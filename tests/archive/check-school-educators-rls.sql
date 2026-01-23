-- Check RLS status on school_educators table
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'school_educators';

-- Check existing policies on school_educators
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'school_educators';

-- Check if there are any educators
SELECT 
  id,
  school_id,
  email,
  first_name,
  last_name,
  role,
  onboarding_status
FROM school_educators
ORDER BY created_at DESC;

-- Check schools
SELECT 
  id,
  name,
  code
FROM schools
ORDER BY created_at DESC;
