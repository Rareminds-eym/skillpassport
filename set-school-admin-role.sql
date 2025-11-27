-- Script to set School Admin role for existing users
-- Run this to give school admin permissions to existing school admin users

-- Option 1: Set role by email
UPDATE school_educators 
SET role = 'school_admin' 
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email = 'your-school-admin@email.com'
);

-- Option 2: Set role for all school_educators who don't have a role yet
UPDATE school_educators 
SET role = 'school_admin' 
WHERE role IS NULL;

-- Option 3: Set role in teachers table by email
UPDATE teachers 
SET role = 'school_admin' 
WHERE email = 'your-school-admin@email.com';

-- Verify the changes
SELECT 
  se.id,
  u.email,
  se.role,
  s.name as school_name
FROM school_educators se
JOIN auth.users u ON u.id = se.user_id
JOIN schools s ON s.id = se.school_id
WHERE se.role = 'school_admin';
