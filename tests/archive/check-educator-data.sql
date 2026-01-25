-- Quick SQL queries to check educator data
-- Run these in your Supabase SQL Editor

-- 1. Check if school_educators table exists and has data
SELECT 
  'school_educators' as table_name,
  COUNT(*) as record_count
FROM public.school_educators;

-- 2. Check if educators table exists and has data
SELECT 
  'educators' as table_name,
  COUNT(*) as record_count
FROM public.educators;

-- 3. Show sample data from school_educators (if exists)
SELECT 
  id,
  first_name,
  last_name,
  email,
  specialization,
  school_id,
  user_id,
  verification_status
FROM public.school_educators 
LIMIT 3;

-- 4. Show sample data from educators (if exists)
SELECT 
  id,
  email,
  full_name,
  department,
  position,
  is_active
FROM public.educators 
LIMIT 3;

-- 5. Check auth users
SELECT 
  id,
  email,
  created_at
FROM auth.users 
LIMIT 3;

-- 6. Check for user_id matches between school_educators and auth.users
SELECT 
  se.id as educator_id,
  se.first_name,
  se.last_name,
  se.email as educator_email,
  au.email as auth_email,
  se.user_id,
  CASE 
    WHEN au.id IS NOT NULL THEN 'MATCHED' 
    ELSE 'NO MATCH' 
  END as auth_match_status
FROM public.school_educators se
LEFT JOIN auth.users au ON se.user_id = au.id
LIMIT 5;

-- 7. If you need to create a test educator record, use this:
-- (Replace the UUIDs with actual values from your auth.users table)
/*
INSERT INTO public.school_educators (
  user_id,
  school_id,
  first_name,
  last_name,
  email,
  specialization,
  qualification,
  experience_years,
  designation,
  department,
  account_status,
  verification_status
) VALUES (
  'YOUR_AUTH_USER_ID_HERE',
  'YOUR_SCHOOL_ID_HERE',
  'Test',
  'Educator',
  'test@example.com',
  'Computer Science',
  'M.Tech Computer Science',
  5,
  'Senior Educator',
  'Computer Science Department',
  'active',
  'Verified'
);
*/