-- ==========================================
-- UPDATE DIGITAL PORTFOLIO PERMISSIONS
-- Give Digital Portfolio same permissions as Classroom Management for college_educator
-- ==========================================

-- First, remove existing view-only permission for Digital Portfolio
DELETE FROM college_role_module_permissions 
WHERE role_type = 'college_educator'::user_role 
AND module_id = (SELECT id FROM college_setting_modules WHERE module_name = 'Digital Portfolio')
AND permission_id = (SELECT id FROM college_setting_permissions WHERE permission_name = 'view');

-- Add FULL permissions (view, create, edit) for college_educator to Digital Portfolio module
INSERT INTO college_role_module_permissions (role_type, module_id, permission_id)
SELECT 
  'college_educator'::user_role,
  m.id,
  p.id
FROM college_setting_modules m
CROSS JOIN college_setting_permissions p
WHERE m.module_name = 'Digital Portfolio'
AND p.permission_name IN ('view', 'create', 'edit')
ON CONFLICT (role_type, module_id, permission_id) DO NOTHING;

-- Verify the permissions were added correctly
SELECT 
  m.module_name, 
  p.permission_name,
  rmp.role_type
FROM college_role_module_permissions rmp
JOIN college_setting_modules m ON rmp.module_id = m.id
JOIN college_setting_permissions p ON rmp.permission_id = p.id
WHERE m.module_name = 'Digital Portfolio'
AND rmp.role_type = 'college_educator'
ORDER BY p.permission_name;