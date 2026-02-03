-- Debug educator user_id issue
-- Check the school_educators table for karthik@rareminds.in

SELECT 
  id,
  school_id,
  first_name,
  last_name,
  email,
  user_id,
  role,
  created_at
FROM school_educators 
WHERE email = 'karthik@rareminds.in';

-- Also check if there are multiple records
SELECT 
  id,
  school_id,
  first_name,
  last_name,
  email,
  user_id,
  role,
  created_at
FROM school_educators 
WHERE email ILIKE '%karthik%' OR first_name ILIKE '%karthik%';

-- Check what user_id should be based on auth
SELECT 
  id,
  email,
  raw_user_meta_data,
  created_at
FROM auth.users 
WHERE email = 'karthik@rareminds.in';