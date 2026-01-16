-- ==========================================
-- UPDATE COLLEGE EDUCATOR PERMISSIONS
-- Add ONLY edit permission for Students module
-- ==========================================

-- Add 'edit' permission for college_educator on Students module
INSERT INTO college_role_module_permissions (role_type, module_id, permission_id)
SELECT 
  'college_educator'::user_role,
  m.id,
  p.id
FROM college_setting_modules m
CROSS JOIN college_setting_permissions p
WHERE m.module_name = 'Students'
AND p.permission_name = 'edit'
AND NOT EXISTS (
  -- Avoid duplicates
  SELECT 1 FROM college_role_module_permissions crmp
  WHERE crmp.role_type = 'college_educator'::user_role
  AND crmp.module_id = m.id
  AND crmp.permission_id = p.id
);

-- ==========================================
-- FUTURE: ADD CREATE PERMISSION (UNCOMMENT WHEN NEEDED)
-- ==========================================

-- UNCOMMENT BELOW TO ADD CREATE PERMISSION IN FUTURE:
/*
INSERT INTO college_role_module_permissions (role_type, module_id, permission_id)
SELECT 
  'college_educator'::user_role,
  m.id,
  p.id
FROM college_setting_modules m
CROSS JOIN college_setting_permissions p
WHERE m.module_name = 'Students'
AND p.permission_name = 'create'
AND NOT EXISTS (
  -- Avoid duplicates
  SELECT 1 FROM college_role_module_permissions crmp
  WHERE crmp.role_type = 'college_educator'::user_role
  AND crmp.module_id = m.id
  AND crmp.permission_id = p.id
);
*/

-- Verify the changes
SELECT 
  m.module_name,
  p.permission_name,
  crmp.role_type
FROM college_role_module_permissions crmp
JOIN college_setting_modules m ON crmp.module_id = m.id
JOIN college_setting_permissions p ON crmp.permission_id = p.id
WHERE crmp.role_type = 'college_educator'
AND m.module_name = 'Students'
ORDER BY p.permission_name;