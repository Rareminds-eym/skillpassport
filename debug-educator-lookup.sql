-- Debug educator lookup for karthik@rareminds.in
-- Auth user ID: 5d78d3c6-e53e-48df-887f-fd21e1e58db6

-- 1. Check if there's a record with this user_id
SELECT 
  id,
  user_id,
  email,
  first_name,
  last_name,
  school_id,
  role,
  created_at
FROM school_educators 
WHERE user_id = '5d78d3c6-e53e-48df-887f-fd21e1e58db6';

-- 2. Check if there's a record with this email
SELECT 
  id,
  user_id,
  email,
  first_name,
  last_name,
  school_id,
  role,
  created_at
FROM school_educators 
WHERE email = 'karthik@rareminds.in';

-- 3. Check all records for this email (in case there are duplicates)
SELECT 
  id,
  user_id,
  email,
  first_name,
  last_name,
  school_id,
  role,
  created_at
FROM school_educators 
WHERE email ILIKE '%karthik@rareminds.in%'
ORDER BY created_at DESC;

-- 4. Check if there are any records with the old hardcoded ID
SELECT 
  id,
  user_id,
  email,
  first_name,
  last_name,
  school_id,
  role,
  created_at
FROM school_educators 
WHERE user_id = '323c133d-6144-43ca-bfd0-aaa0f11c2c26';