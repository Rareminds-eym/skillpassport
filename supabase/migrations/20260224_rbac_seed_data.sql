-- ============================================================================
-- RBAC SEED DATA - Insert Initial Permissions, Roles, and User Assignments
-- ============================================================================

-- ============================================================================
-- 1. SEED PERMISSIONS
-- ============================================================================

INSERT INTO "public"."rbac_permissions" ("id", "permission_key", "name", "description", "category", "action", "subject", "field", "icon", "sort_order", "created_at", "updated_at") 
VALUES 
  -- Profile Permissions
  ('7f061d1e-56d2-4f3c-bd02-e1b6720d947f', 'read:profile', 'View Profile', 'View own profile information', 'profile', 'read', 'Profile', null, '👤', '1', '2026-02-19 07:00:40.32591+00', '2026-02-19 07:00:40.32591+00'),
  ('ed29806b-88b6-4535-a8e6-900f7a3adb14', 'update:profile', 'Update Profile', 'Edit own profile information', 'profile', 'update', 'Profile', null, '✏️', '2', '2026-02-19 07:00:40.32591+00', '2026-02-19 07:00:40.32591+00'),
  
  -- Dashboard Permissions
  ('aff7a658-3807-465a-a256-48af6f1613c5', 'read:dashboard', 'View Dashboard', 'Access main dashboard', 'dashboard', 'read', 'Dashboard', null, '🏠', '10', '2026-02-19 07:00:40.32591+00', '2026-02-19 07:00:40.32591+00'),
  
  -- Applications Permissions
  ('b6a5fcab-4013-4a2d-8b49-870d1d633dac', 'read:applications', 'View Applications', 'View job applications', 'applications', 'read', 'Applications', null, '📋', '20', '2026-02-19 07:00:40.32591+00', '2026-02-19 07:00:40.32591+00'),
  ('9fc1aa07-4480-401c-a6f1-d468ef998325', 'create:applications', 'Create Applications', 'Apply to jobs', 'applications', 'create', 'Applications', null, '➕', '21', '2026-02-19 07:00:40.32591+00', '2026-02-19 07:00:40.32591+00'),
  
  -- Messages Permissions
  ('15dcfa20-8dc5-4aaf-bd63-b5e13f3baae1', 'read:messages', 'View Messages', 'View messages', 'messages', 'read', 'Messages', null, '💬', '30', '2026-02-19 07:00:40.32591+00', '2026-02-19 07:00:40.32591+00'),
  ('17f99fd0-b53e-40fe-889b-7e23f25d2851', 'send:messages', 'Send Messages', 'Send messages', 'messages', 'send', 'Messages', null, '📤', '31', '2026-02-19 07:00:40.32591+00', '2026-02-19 07:00:40.32591+00'),
  
  -- Skills Permissions
  ('56967348-ead2-4af2-8470-b2d9ce137805', 'read:skills', 'View Skills', 'View skills profile', 'skills', 'read', 'Skills', null, '🎯', '40', '2026-02-19 07:00:40.32591+00', '2026-02-19 07:00:40.32591+00'),
  ('9e72a3bb-8e73-4526-b304-b744567949f4', 'update:skills', 'Update Skills', 'Edit skills profile', 'skills', 'update', 'Skills', null, '✏️', '41', '2026-02-19 07:00:40.32591+00', '2026-02-19 07:00:40.32591+00'),
  
  -- Learning Permissions
  ('b38c7c4b-ee71-4337-942e-224bbf95418f', 'read:learning', 'View Learning', 'Access learning materials', 'learning', 'read', 'Learning', null, '📚', '50', '2026-02-19 07:00:40.32591+00', '2026-02-19 07:00:40.32591+00'),
  ('b1db8169-a55d-4761-beea-8948fde98d32', 'read:courses', 'View Courses', 'Browse and view courses', 'learning', 'read', 'Courses', null, '🎓', '51', '2026-02-19 07:00:40.32591+00', '2026-02-19 07:00:40.32591+00'),
  ('1fdd5a5d-cff9-4979-8d5f-9aa908639f8f', 'start:courses', 'Start Courses', 'Can start/enroll in courses', 'learning', 'start', 'Courses', null, null, '0', '2026-02-19 09:38:24.618554+00', '2026-02-19 09:38:24.618554+00'),
  ('557d55db-1628-4d65-af78-dd3e1f030322', 'view:course_assessment', 'View Course Assessment', 'Can view and take assessments from learning cards', 'learning', 'view', 'CourseAssessment', null, '🎯', '95', '2026-02-20 06:17:31.617496+00', '2026-02-20 06:17:31.617496+00'),
  ('b8d4be73-f8f2-4db0-8041-bac91ecac961', 'manage:learning', 'Manage Learning', 'Add, edit, and delete learning records', 'learning', 'manage', 'Learning', null, 'edit', '102', '2026-02-19 09:12:52.834817+00', '2026-02-19 09:12:52.834817+00'),
  
  -- Opportunities Permissions
  ('0f23a6ad-8ca5-490c-9b95-df0926369344', 'read:opportunities', 'View Opportunities', 'Browse job opportunities', 'opportunities', 'read', 'Opportunities', null, '🚀', '60', '2026-02-19 07:00:40.32591+00', '2026-02-19 07:00:40.32591+00'),
  ('d7dd2ee0-49f0-40fc-ad02-dfb0c0625278', 'read:jobs', 'View Jobs', 'View job listings', 'opportunities', 'read', 'Jobs', null, '💼', '61', '2026-02-19 07:00:40.32591+00', '2026-02-19 07:00:40.32591+00'),
  ('5344a850-7389-4983-a082-c9f01996567f', 'apply:opportunities', 'Apply to Opportunities', 'Apply to job opportunities', 'opportunities', 'apply', 'Opportunities', null, '📝', '62', '2026-02-19 07:20:45.265847+00', '2026-02-19 07:20:45.265847+00'),
  ('c156fdfa-426d-4611-b000-c297f68e06d9', 'save:opportunities', 'Save Job Opportunities', 'Save job opportunities for later', 'opportunities', 'save', 'Opportunities', null, 'bookmark', '101', '2026-02-19 08:56:48.852786+00', '2026-02-19 08:56:48.852786+00'),
  
  -- Analytics Permissions
  ('c5884f7b-3bf8-4121-ae9b-5da4616c0583', 'read:analytics', 'View Analytics', 'Access analytics dashboard', 'analytics', 'read', 'Analytics', null, '📊', '70', '2026-02-19 07:00:40.32591+00', '2026-02-19 07:00:40.32591+00'),
  
  -- Settings Permissions
  ('8fa84faa-7bb1-40b1-a583-463061e9e5f3', 'read:settings', 'View Settings', 'View account settings', 'settings', 'read', 'Settings', null, '⚙️', '80', '2026-02-19 07:00:40.32591+00', '2026-02-19 07:00:40.32591+00'),
  ('2f6f44c7-700b-46b1-8de5-da15453291cc', 'update:settings', 'Update Settings', 'Modify account settings', 'settings', 'update', 'Settings', null, '🔧', '81', '2026-02-19 07:00:40.32591+00', '2026-02-19 07:00:40.32591+00'),
  ('4ff3916b-626e-4f45-afe7-e09e8ee94ed8', 'save:notification_preferences', 'Save Notification Preferences', 'Can save notification settings', 'settings', 'save', 'NotificationPreferences', null, null, '0', '2026-02-19 09:43:26.777694+00', '2026-02-19 09:43:26.777694+00'),
  ('e9ecc8d5-c5e0-461b-b133-99c9fad0367e', 'save:privacy_settings', 'Save Privacy Settings', 'Can save privacy settings', 'settings', 'save', 'PrivacySettings', null, null, '0', '2026-02-19 09:43:26.777694+00', '2026-02-19 09:43:26.777694+00'),
  
  -- Assessment Permissions
  ('fe3e77c7-eb7b-4ac0-a7b4-1271790ce436', 'read:assessment', 'View Assessments', 'Access assessments', 'assessment', 'read', 'Assessment', null, '📝', '90', '2026-02-19 07:00:40.32591+00', '2026-02-19 07:00:40.32591+00'),
  ('46e765cb-be85-4f76-90ca-1197ba78bd49', 'view:assessment_results', 'View Assessment Results', 'View assessment results', 'assessment', 'view', 'AssessmentResults', null, '📈', '91', '2026-02-19 07:00:40.32591+00', '2026-02-19 07:00:40.32591+00'),
  ('c67f96e6-9dfe-4e1d-9bac-8a1c21e68c5b', 'start:assessment', 'Start Assessment', 'Start new assessments', 'assessment', 'start', 'Assessment', null, '▶️', '92', '2026-02-19 07:20:45.265847+00', '2026-02-19 07:20:45.265847+00'),
  ('32827b41-6a6f-4dd3-b371-60948f86fa15', 'continue:assessment', 'Continue Assessment', 'Continue in-progress assessments', 'assessment', 'continue', 'Assessment', null, '⏯️', '93', '2026-02-19 07:20:45.265847+00', '2026-02-19 07:20:45.265847+00'),
  ('85eee835-43ff-4341-8841-a5dbced43b66', 'start:assessment_section', 'Start Assessment Section', 'Can start individual assessment sections', 'assessment', 'start', 'AssessmentSection', null, '▶️', '93', '2026-02-20 06:35:36.960646+00', '2026-02-20 06:35:36.960646+00'),
  ('1d32a238-d982-4c16-8790-b9aaeb996dc6', 'take:adaptive_test', 'Take Adaptive Test', 'Can take the adaptive aptitude test', 'assessment', 'take', 'AdaptiveTest', null, null, '0', '2026-02-19 10:04:37.942501+00', '2026-02-19 10:04:37.942501+00'),
  
  -- Career AI Permissions
  ('8dcadcdb-4c4c-4095-92fd-9790242190c8', 'access:career_ai', 'Access Career AI', 'Use Career AI features', 'career', 'access', 'CareerAI', null, '🤖', '100', '2026-02-19 07:00:40.32591+00', '2026-02-19 07:00:40.32591+00'),
  ('48c3238c-b6cc-417f-abe0-c033a5bb2d1f', 'access:career_ai_tools', 'Access Career AI Tools', 'Use Career AI tools', 'career', 'access', 'CareerAITools', null, '🛠️', '101', '2026-02-19 07:20:45.265847+00', '2026-02-19 07:20:45.265847+00'),
  
  -- Security Permissions
  ('369a7f67-2629-4016-8d39-75d1bdc9a251', 'update:password', 'Update Password', 'Can update account password', 'security', 'update', 'Password', null, null, '0', '2026-02-19 09:43:26.777694+00', '2026-02-19 09:43:26.777694+00'),
  
  -- Subscription Permissions
  ('c7acd133-8daa-46f6-879e-8b1f4415533b', 'browse:addons', 'Browse Add-ons', 'Can browse and purchase add-ons', 'subscription', 'browse', 'Addons', null, null, '0', '2026-02-19 09:43:26.777694+00', '2026-02-19 09:43:26.777694+00'),
  ('d106dd01-6518-454d-a253-afb8247c3d3f', 'manage:subscription', 'Manage Subscription', 'Can manage subscription and billing', 'subscription', 'manage', 'Subscription', null, null, '0', '2026-02-19 09:43:26.777694+00', '2026-02-19 09:43:26.777694+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 2. SEED ROLES
-- ============================================================================

INSERT INTO "public"."rbac_roles" ("id", "role_key", "name", "description", "role_type", "is_active", "icon", "color", "sort_order", "created_at", "updated_at") 
VALUES 
  ('36f80ba7-80d3-44b5-a8d7-38dcf1f39d01', 'demo_admin', 'Demo Admin', 'Full access to all features and buttons', 'production', true, '', '', 0, '2026-02-19 09:50:37.082409+00', '2026-02-19 09:50:37.082409+00'),
  ('f817def3-e3d1-46e0-87c2-f883bf88bfa9', 'demo_view_only', 'View-Only Student', 'Can view all content but cannot make changes', 'demo', true, '👁️', 'gray', 1, '2026-02-19 07:00:40.32591+00', '2026-02-19 07:00:40.32591+00'),
  ('066da942-898c-4517-81c1-838e9c9bc21f', 'demo_basic_student', 'Basic Student', 'Free tier with limited features (no Career AI, no Analytics)', 'demo', true, '🎓', 'blue', 2, '2026-02-19 07:00:40.32591+00', '2026-02-19 07:00:40.32591+00'),
  ('4aecc062-98f0-4f4c-aa34-1185a8f6f69e', 'demo_premium_student', 'Premium Student', 'Full access including Career AI and Analytics', 'demo', true, '⭐', 'purple', 3, '2026-02-19 07:00:40.32591+00', '2026-02-19 07:00:40.32591+00'),
  ('071167a1-d8e4-44b9-afcf-4c29cb8ae7f0', 'demo_restricted', 'Restricted Student', 'Limited access (suspended account simulation)', 'demo', true, '🔒', 'red', 4, '2026-02-19 07:00:40.32591+00', '2026-02-19 07:00:40.32591+00')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 3. SEED USER ROLES (Example Assignment)
-- ============================================================================
-- Note: This is an example assignment. Update user_id with actual user IDs.

INSERT INTO "public"."rbac_user_roles" ("id", "user_id", "role_id", "is_active", "expires_at", "assigned_by", "created_at", "updated_at") 
VALUES 
  ('6d3e57a3-a99f-4efd-8a1e-0716ffdb644b', '0262731f-6214-489d-8f13-e5c4b65e2381', '36f80ba7-80d3-44b5-a8d7-38dcf1f39d01', true, null, null, '2026-02-19 11:21:19.285629+00', '2026-02-21 04:07:39.827286+00')
ON CONFLICT (id) DO NOTHING;
