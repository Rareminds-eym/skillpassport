-- ============================================================================
-- RBAC System - Demo Data Seed
-- ============================================================================
-- This seed file populates the RBAC system with:
-- 1. Common permissions for student dashboard
-- 2. Demo roles (view-only, basic, premium, restricted)
-- 3. Links roles to permissions
-- ============================================================================

-- ============================================================================
-- 1. INSERT PERMISSIONS
-- ============================================================================

-- Profile Permissions
INSERT INTO rbac_permissions (permission_key, name, description, category, action, subject, icon, sort_order) VALUES
('read:profile', 'View Profile', 'View own profile information', 'profile', 'read', 'Profile', '👤', 1),
('update:profile', 'Update Profile', 'Edit own profile information', 'profile', 'update', 'Profile', '✏️', 2);

-- Dashboard Permissions
INSERT INTO rbac_permissions (permission_key, name, description, category, action, subject, icon, sort_order) VALUES
('read:dashboard', 'View Dashboard', 'Access main dashboard', 'dashboard', 'read', 'Dashboard', '🏠', 10);

-- Applications Permissions
INSERT INTO rbac_permissions (permission_key, name, description, category, action, subject, icon, sort_order) VALUES
('read:applications', 'View Applications', 'View job applications', 'applications', 'read', 'Applications', '📋', 20),
('create:applications', 'Create Applications', 'Apply to jobs', 'applications', 'create', 'Applications', '➕', 21);

-- Messages Permissions
INSERT INTO rbac_permissions (permission_key, name, description, category, action, subject, icon, sort_order) VALUES
('read:messages', 'View Messages', 'View messages', 'messages', 'read', 'Messages', '💬', 30),
('send:messages', 'Send Messages', 'Send messages', 'messages', 'send', 'Messages', '📤', 31);

-- Skills Permissions
INSERT INTO rbac_permissions (permission_key, name, description, category, action, subject, icon, sort_order) VALUES
('read:skills', 'View Skills', 'View skills profile', 'skills', 'read', 'Skills', '🎯', 40),
('update:skills', 'Update Skills', 'Edit skills profile', 'skills', 'update', 'Skills', '✏️', 41);

-- Learning Permissions
INSERT INTO rbac_permissions (permission_key, name, description, category, action, subject, icon, sort_order) VALUES
('read:learning', 'View Learning', 'Access learning materials', 'learning', 'read', 'Learning', '📚', 50),
('read:courses', 'View Courses', 'Browse and view courses', 'learning', 'read', 'Courses', '🎓', 51);

-- Opportunities Permissions
INSERT INTO rbac_permissions (permission_key, name, description, category, action, subject, icon, sort_order) VALUES
('read:opportunities', 'View Opportunities', 'Browse job opportunities', 'opportunities', 'read', 'Opportunities', '🚀', 60),
('read:jobs', 'View Jobs', 'View job listings', 'opportunities', 'read', 'Jobs', '💼', 61);

-- Analytics Permissions
INSERT INTO rbac_permissions (permission_key, name, description, category, action, subject, icon, sort_order) VALUES
('read:analytics', 'View Analytics', 'Access analytics dashboard', 'analytics', 'read', 'Analytics', '📊', 70);

-- Settings Permissions
INSERT INTO rbac_permissions (permission_key, name, description, category, action, subject, icon, sort_order) VALUES
('read:settings', 'View Settings', 'View account settings', 'settings', 'read', 'Settings', '⚙️', 80),
('update:settings', 'Update Settings', 'Modify account settings', 'settings', 'update', 'Settings', '🔧', 81);

-- Assessment Permissions
INSERT INTO rbac_permissions (permission_key, name, description, category, action, subject, icon, sort_order) VALUES
('read:assessment', 'View Assessments', 'Access assessments', 'assessment', 'read', 'Assessment', '📝', 90),
('view:assessment_results', 'View Assessment Results', 'View assessment results', 'assessment', 'view', 'AssessmentResults', '📈', 91);

-- Career AI Permissions (Premium Feature)
INSERT INTO rbac_permissions (permission_key, name, description, category, action, subject, icon, sort_order) VALUES
('access:career_ai', 'Access Career AI', 'Use Career AI features', 'career', 'access', 'CareerAI', '🤖', 100);

-- ============================================================================
-- 2. INSERT ROLES
-- ============================================================================

INSERT INTO rbac_roles (role_key, name, description, role_type, icon, color, sort_order) VALUES
('demo_view_only', 'View-Only Student', 'Can view all content but cannot make changes', 'demo', '👁️', 'gray', 1),
('demo_basic_student', 'Basic Student', 'Free tier with limited features (no Career AI, no Analytics)', 'demo', '🎓', 'blue', 2),
('demo_premium_student', 'Premium Student', 'Full access including Career AI and Analytics', 'demo', '⭐', 'purple', 3),
('demo_restricted', 'Restricted Student', 'Limited access (suspended account simulation)', 'demo', '🔒', 'red', 4);

-- ============================================================================
-- 3. LINK ROLES TO PERMISSIONS
-- ============================================================================

-- View-Only Student: Can read everything but cannot modify
INSERT INTO rbac_role_permissions (role_id, permission_id, is_granted)
SELECT 
  (SELECT id FROM rbac_roles WHERE role_key = 'demo_view_only'),
  id,
  true
FROM rbac_permissions
WHERE action IN ('read', 'view');

-- Deny all write operations for view-only
INSERT INTO rbac_role_permissions (role_id, permission_id, is_granted)
SELECT 
  (SELECT id FROM rbac_roles WHERE role_key = 'demo_view_only'),
  id,
  false
FROM rbac_permissions
WHERE action IN ('update', 'create', 'send', 'access');

-- Basic Student: All permissions except Career AI and Analytics
INSERT INTO rbac_role_permissions (role_id, permission_id, is_granted)
SELECT 
  (SELECT id FROM rbac_roles WHERE role_key = 'demo_basic_student'),
  id,
  true
FROM rbac_permissions
WHERE permission_key NOT IN ('access:career_ai', 'read:analytics');

-- Deny Career AI and Analytics for basic student
INSERT INTO rbac_role_permissions (role_id, permission_id, is_granted)
SELECT 
  (SELECT id FROM rbac_roles WHERE role_key = 'demo_basic_student'),
  id,
  false
FROM rbac_permissions
WHERE permission_key IN ('access:career_ai', 'read:analytics');

-- Premium Student: All permissions
INSERT INTO rbac_role_permissions (role_id, permission_id, is_granted)
SELECT 
  (SELECT id FROM rbac_roles WHERE role_key = 'demo_premium_student'),
  id,
  true
FROM rbac_permissions;

-- Restricted Student: Only read profile and dashboard
INSERT INTO rbac_role_permissions (role_id, permission_id, is_granted)
SELECT 
  (SELECT id FROM rbac_roles WHERE role_key = 'demo_restricted'),
  id,
  true
FROM rbac_permissions
WHERE permission_key IN ('read:profile', 'read:dashboard');

-- Deny everything else for restricted student
INSERT INTO rbac_role_permissions (role_id, permission_id, is_granted)
SELECT 
  (SELECT id FROM rbac_roles WHERE role_key = 'demo_restricted'),
  id,
  false
FROM rbac_permissions
WHERE permission_key NOT IN ('read:profile', 'read:dashboard');

-- ============================================================================
-- VERIFICATION QUERIES (commented out - uncomment to test)
-- ============================================================================

-- View all permissions
-- SELECT * FROM rbac_permissions ORDER BY sort_order;

-- View all roles
-- SELECT * FROM rbac_roles ORDER BY sort_order;

-- View role permissions for each role
-- SELECT 
--   r.name as role_name,
--   p.permission_key,
--   p.name as permission_name,
--   rp.is_granted
-- FROM rbac_roles r
-- JOIN rbac_role_permissions rp ON r.id = rp.role_id
-- JOIN rbac_permissions p ON rp.permission_id = p.id
-- ORDER BY r.sort_order, p.sort_order;
