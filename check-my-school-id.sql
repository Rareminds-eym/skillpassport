-- Run this in Supabase SQL Editor to check your school association
-- Replace 'your-email@example.com' with your actual email

-- 1. Check public.users table
SELECT 
  id as user_id,
  email,
  role,
  "organizationId" as school_id_from_users,
  "isActive",
  entity_type
FROM public.users 
WHERE email = 'your-email@example.com';

-- 2. Check school_educators table
SELECT 
  teacher_id,
  user_id,
  school_id as school_id_from_educators,
  email,
  first_name,
  last_name,
  role
FROM public.school_educators 
WHERE email = 'your-email@example.com';

-- 3. Check schools table
SELECT 
  id as school_id,
  name as school_name,
  email,
  principal_email
FROM public.schools 
WHERE email = 'your-email@example.com' 
OR principal_email = 'your-email@example.com';

-- 4. List all schools (to find your school ID)
SELECT 
  id as school_id,
  name as school_name,
  email,
  principal_email
FROM public.schools
ORDER BY name;
