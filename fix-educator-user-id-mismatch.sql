-- Fix user_id mismatch for karthik@rareminds.in
-- The record ID matches the auth user ID, but user_id field has wrong value

-- Current state:
-- Auth user ID: 5d78d3c6-e53e-48df-887f-fd21e1e58db6
-- Record ID: 5d78d3c6-e53e-48df-887f-fd21e1e58db6 (correct)
-- user_id field: 323c133d-6144-43ca-bfd0-aaa0f11c2c26 (wrong)

-- Update the user_id field to match the auth user ID
UPDATE school_educators 
SET user_id = '5d78d3c6-e53e-48df-887f-fd21e1e58db6'
WHERE id = '5d78d3c6-e53e-48df-887f-fd21e1e58db6' 
  AND email = 'karthik@rareminds.in';

-- Verify the fix
SELECT 
  id,
  user_id,
  email,
  first_name,
  last_name,
  school_id,
  role
FROM school_educators 
WHERE email = 'karthik@rareminds.in';