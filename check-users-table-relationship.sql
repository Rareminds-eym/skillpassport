-- Check the relationship between users table and school_educators table
-- for karthik@rareminds.in

-- 1. Check users table for both IDs
SELECT 
  id,
  email,
  name,
  created_at,
  'users_table' as source
FROM users 
WHERE id IN ('5d78d3c6-e53e-48df-887f-fd21e1e58db6', '323c133d-6144-43ca-bfd0-aaa0f11c2c26')
   OR email = 'karthik@rareminds.in'
ORDER BY created_at;

-- 2. Check school_educators table
SELECT 
  id,
  user_id,
  email,
  first_name,
  last_name,
  school_id,
  role,
  created_at,
  'school_educators_table' as source
FROM school_educators 
WHERE email = 'karthik@rareminds.in'
   OR user_id IN ('5d78d3c6-e53e-48df-887f-fd21e1e58db6', '323c133d-6144-43ca-bfd0-aaa0f11c2c26')
   OR id IN ('5d78d3c6-e53e-48df-887f-fd21e1e58db6', '323c133d-6144-43ca-bfd0-aaa0f11c2c26')
ORDER BY created_at;

-- 3. Check if there are multiple user records for this email
SELECT 
  id,
  email,
  name,
  created_at
FROM users 
WHERE email = 'karthik@rareminds.in'
ORDER BY created_at;

-- 4. Join to see the relationship
SELECT 
  u.id as user_table_id,
  u.email as user_email,
  u.name as user_name,
  se.id as educator_record_id,
  se.user_id as educator_user_id_field,
  se.email as educator_email,
  se.first_name,
  se.last_name,
  se.role,
  CASE 
    WHEN u.id = se.user_id THEN 'MATCH'
    ELSE 'MISMATCH'
  END as id_relationship
FROM users u
FULL OUTER JOIN school_educators se ON u.email = se.email
WHERE u.email = 'karthik@rareminds.in' 
   OR se.email = 'karthik@rareminds.in';