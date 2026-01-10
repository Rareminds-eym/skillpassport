-- ==========================================
-- COLLEGE SETTINGS ROLE-BASED ACCESS CONTROL
-- Database Schema Setup
-- ==========================================

-- 1. College Settings Modules Table
CREATE TABLE college_setting_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. College Settings Permissions Table
CREATE TABLE college_setting_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  permission_name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. College Role Module Permissions Table
CREATE TABLE college_role_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_type user_role NOT NULL,
  module_id UUID REFERENCES college_setting_modules(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES college_setting_permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_type, module_id, permission_id)
);

-- 4. College Role Scope Rules Table
CREATE TABLE college_role_scope_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_type user_role NOT NULL,
  scope_type VARCHAR(20) NOT NULL, -- 'department' or 'program'
  scope_value VARCHAR(100) NOT NULL, -- department/program ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_type, scope_type, scope_value)
);

-- Performance Indexes
CREATE INDEX idx_college_setting_modules_active ON college_setting_modules(is_active);
CREATE INDEX idx_college_setting_modules_name ON college_setting_modules(module_name);
CREATE INDEX idx_college_role_module_permissions_role ON college_role_module_permissions(role_type);
CREATE INDEX idx_college_role_module_permissions_module ON college_role_module_permissions(module_id);
CREATE INDEX idx_college_role_scope_rules_role ON college_role_scope_rules(role_type);
CREATE INDEX idx_college_role_scope_rules_scope ON college_role_scope_rules(scope_type, scope_value);

-- ==========================================
-- INITIAL DATA INSERTION
-- ==========================================

-- Insert Permissions
INSERT INTO college_setting_permissions (permission_name, description) VALUES
('view', 'View/Read access to module'),
('create', 'Create new records in module'),
('edit', 'Edit existing records in module'),
('approve', 'Approve/Authorize actions in module'),
('publish', 'Publish/Make content public');

-- Insert College Admin Modules
INSERT INTO college_setting_modules (module_name, description) VALUES
('Dashboard', 'Main dashboard and overview'),
('Students', 'Student management and records'),
('Departments & Faculty', 'Department and faculty management'),
('Academics', 'Academic programs and curriculum'),
('Examinations', 'Examination management'),
('Placements & Skills', 'Placement and skill development'),
('Operations', 'Operational management'),
('Administration', 'System administration'),
('Settings', 'System settings and configuration');

-- Insert Educator Modules
INSERT INTO college_setting_modules (module_name, description) VALUES
('Teaching Intelligence', 'AI-powered teaching tools'),
('Courses', 'Course browsing and management'),
('Classroom Management', 'Classroom and student management'),
('Learning & Evaluation', 'Learning assessment and evaluation'),
('Skill & Co-Curriculm', 'Co-curricular activities'),
('Digital Portfolio', 'Personal portfolio management'),
('Analytics', 'Performance analytics'),
('Reports', 'Report generation'),
('Media Manager', 'Media file management'),
('Communication', 'Communication tools');

-- ==========================================
-- COLLEGE ADMIN PERMISSIONS (Full Access)
-- ==========================================

-- College Admin gets full access to their modules
INSERT INTO college_role_module_permissions (role_type, module_id, permission_id)
SELECT 
  'college_admin'::user_role,
  m.id,
  p.id
FROM college_setting_modules m
CROSS JOIN college_setting_permissions p
WHERE m.module_name IN (
  'Dashboard', 'Students', 'Departments & Faculty', 'Academics', 
  'Examinations', 'Placements & Skills', 'Operations', 'Administration', 'Settings'
);

-- ==========================================
-- EDUCATOR PERMISSIONS (Limited Access)
-- ==========================================

-- Educator gets full access to teaching-related modules
INSERT INTO college_role_module_permissions (role_type, module_id, permission_id)
SELECT 
  'college_educator'::user_role,
  m.id,
  p.id
FROM college_setting_modules m
CROSS JOIN college_setting_permissions p
WHERE m.module_name IN ('Dashboard', 'Teaching Intelligence', 'Classroom Management', 'Learning & Evaluation')
AND p.permission_name IN ('view', 'create', 'edit');

-- Educator gets view-only access to some modules
INSERT INTO college_role_module_permissions (role_type, module_id, permission_id)
SELECT 
  'college_educator'::user_role,
  m.id,
  p.id
FROM college_setting_modules m
CROSS JOIN college_setting_permissions p
WHERE m.module_name IN ('Courses', 'Students', 'Digital Portfolio', 'Communication', 'Settings')
AND p.permission_name = 'view';

-- Educator gets limited access to co-curricular activities
INSERT INTO college_role_module_permissions (role_type, module_id, permission_id)
SELECT 
  'college_educator'::user_role,
  m.id,
  p.id
FROM college_setting_modules m
CROSS JOIN college_setting_permissions p
WHERE m.module_name IN ('Skill & Co-Curriculm', 'Analytics', 'Reports', 'Media Manager')
AND p.permission_name IN ('view', 'create');

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Check modules
-- SELECT * FROM college_setting_modules ORDER BY module_name;

-- Check permissions
-- SELECT * FROM college_setting_permissions ORDER BY permission_name;

-- Check college admin permissions
-- SELECT m.module_name, p.permission_name 
-- FROM college_role_module_permissions rmp
-- JOIN college_setting_modules m ON rmp.module_id = m.id
-- JOIN college_setting_permissions p ON rmp.permission_id = p.id
-- WHERE rmp.role_type = 'college_admin'
-- ORDER BY m.module_name, p.permission_name;

-- Check educator permissions
-- SELECT m.module_name, p.permission_name 
-- FROM college_role_module_permissions rmp
-- JOIN college_setting_modules m ON rmp.module_id = m.id
-- JOIN college_setting_permissions p ON rmp.permission_id = p.id
-- WHERE rmp.role_type = 'college_educator'
-- ORDER BY m.module_name, p.permission_name;