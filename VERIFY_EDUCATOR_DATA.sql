-- Verify educator data exists in school_educators table
-- Run this in Supabase SQL Editor to check if your educator profile is in the database

-- 1. Check if school_educators table exists and has data
SELECT 
  COUNT(*) as total_educators,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT school_id) as unique_schools
FROM public.school_educators;

-- 2. List all educators with their basic info
SELECT 
  id,
  user_id,
  school_id,
  first_name,
  last_name,
  email,
  specialization,
  qualification,
  experience_years,
  account_status,
  verification_status,
  created_at
FROM public.school_educators
ORDER BY created_at DESC
LIMIT 10;

-- 3. Check if your specific user has an educator record
-- Replace 'YOUR_USER_ID' with the actual user ID from auth.users
SELECT 
  id,
  user_id,
  school_id,
  first_name,
  last_name,
  email,
  phone_number,
  specialization,
  qualification,
  experience_years,
  designation,
  department,
  account_status,
  verification_status,
  created_at,
  updated_at
FROM public.school_educators
WHERE user_id = 'YOUR_USER_ID';

-- 4. Check auth.users to get the correct user ID
SELECT 
  id,
  email,
  created_at
FROM auth.users
WHERE email = 'karthikeyan@rareminds.in'
LIMIT 1;

-- 5. Check if there's a mismatch between auth and school_educators
SELECT 
  au.id as auth_user_id,
  au.email,
  se.id as educator_id,
  se.first_name,
  se.last_name,
  se.email as educator_email
FROM auth.users au
LEFT JOIN public.school_educators se ON au.id = se.user_id
WHERE au.email = 'karthikeyan@rareminds.in';

-- 6. Check RLS policies on school_educators
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'school_educators'
ORDER BY policyname;
