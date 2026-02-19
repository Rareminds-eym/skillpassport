-- ============================================================================
-- RBAC (Role-Based Access Control) System for Student Dashboard
-- ============================================================================
-- This migration creates a flexible, database-driven RBAC system that allows
-- administrators to define roles, permissions, and assign them to users
-- without code changes.
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PERMISSIONS TABLE
-- ============================================================================
-- Defines all available permissions in the system
-- Permissions follow the pattern: action:subject (e.g., read:profile, update:skills)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rbac_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Permission identifier (e.g., "read:profile", "update:skills", "access:career_ai")
  permission_key VARCHAR(100) UNIQUE NOT NULL,
  
  -- Human-readable name
  name VARCHAR(255) NOT NULL,
  
  -- Description of what this permission allows
  description TEXT,
  
  -- Category for grouping (e.g., "profile", "learning", "career", "analytics")
  category VARCHAR(50),
  
  -- Action type (read, create, update, delete, access, manage)
  action VARCHAR(50) NOT NULL,
  
  -- Subject/resource (profile, skills, courses, career_ai, analytics, etc.)
  subject VARCHAR(100) NOT NULL,
  
  -- Optional field-level permission (e.g., "email" for profile.email)
  field VARCHAR(100),
  
  -- Metadata for UI display
  icon VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. ROLES TABLE
-- ============================================================================
-- Defines roles that can be assigned to users
-- Roles are collections of permissions
-- ============================================================================
CREATE TABLE IF NOT EXISTS rbac_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Role identifier (e.g., "demo_view_only", "demo_basic_student", "demo_premium_student")
  role_key VARCHAR(100) UNIQUE NOT NULL,
  
  -- Human-readable name
  name VARCHAR(255) NOT NULL,
  
  -- Description of the role
  description TEXT,
  
  -- Role type (demo, production, custom)
  role_type VARCHAR(50) DEFAULT 'production',
  
  -- Is this role active?
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata for UI display
  icon VARCHAR(50),
  color VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. ROLE PERMISSIONS TABLE (Many-to-Many)
-- ============================================================================
-- Links roles to permissions
-- ============================================================================
CREATE TABLE IF NOT EXISTS rbac_role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  role_id UUID NOT NULL REFERENCES rbac_roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES rbac_permissions(id) ON DELETE CASCADE,
  
  -- Can this permission be granted (true) or denied (false)?
  -- Denials take precedence over grants
  is_granted BOOLEAN DEFAULT true,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique role-permission combinations
  UNIQUE(role_id, permission_id)
);

-- ============================================================================
-- 4. USER ROLES TABLE
-- ============================================================================
-- Assigns roles to users
-- Users can have multiple roles (permissions are merged)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rbac_user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User reference (links to auth.users or your users table)
  user_id UUID NOT NULL,
  
  role_id UUID NOT NULL REFERENCES rbac_roles(id) ON DELETE CASCADE,
  
  -- Is this role assignment active?
  is_active BOOLEAN DEFAULT true,
  
  -- Optional: Role assignment can have expiry
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Who assigned this role?
  assigned_by UUID,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique user-role combinations
  UNIQUE(user_id, role_id)
);

-- ============================================================================
-- 5. USER PERMISSIONS TABLE (Direct Permissions)
-- ============================================================================
-- Allows direct permission assignment to users (bypassing roles)
-- Useful for one-off permissions or overrides
-- ============================================================================
CREATE TABLE IF NOT EXISTS rbac_user_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  user_id UUID NOT NULL,
  permission_id UUID NOT NULL REFERENCES rbac_permissions(id) ON DELETE CASCADE,
  
  -- Grant or deny
  is_granted BOOLEAN DEFAULT true,
  
  -- Is this permission active?
  is_active BOOLEAN DEFAULT true,
  
  -- Optional: Permission can have expiry
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Who assigned this permission?
  assigned_by UUID,
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique user-permission combinations
  UNIQUE(user_id, permission_id)
);

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_rbac_permissions_key ON rbac_permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_rbac_permissions_category ON rbac_permissions(category);
CREATE INDEX IF NOT EXISTS idx_rbac_permissions_action_subject ON rbac_permissions(action, subject);

CREATE INDEX IF NOT EXISTS idx_rbac_roles_key ON rbac_roles(role_key);
CREATE INDEX IF NOT EXISTS idx_rbac_roles_active ON rbac_roles(is_active);

CREATE INDEX IF NOT EXISTS idx_rbac_role_permissions_role ON rbac_role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_rbac_role_permissions_permission ON rbac_role_permissions(permission_id);

CREATE INDEX IF NOT EXISTS idx_rbac_user_roles_user ON rbac_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_rbac_user_roles_role ON rbac_user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_rbac_user_roles_active ON rbac_user_roles(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_rbac_user_permissions_user ON rbac_user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_rbac_user_permissions_permission ON rbac_user_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_rbac_user_permissions_active ON rbac_user_permissions(user_id, is_active);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rbac_permissions_updated_at BEFORE UPDATE ON rbac_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rbac_roles_updated_at BEFORE UPDATE ON rbac_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rbac_user_roles_updated_at BEFORE UPDATE ON rbac_user_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rbac_user_permissions_updated_at BEFORE UPDATE ON rbac_user_permissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTION: Check if user has permission
-- ============================================================================
-- This function checks if a user has a specific permission
-- It considers:
-- 1. Direct user permissions (highest priority)
-- 2. Role-based permissions
-- 3. Denials take precedence over grants
-- ============================================================================
CREATE OR REPLACE FUNCTION rbac_user_has_permission(
  p_user_id UUID,
  p_permission_key VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN := false;
  v_has_denial BOOLEAN := false;
BEGIN
  -- Check for direct denial
  SELECT EXISTS(
    SELECT 1 FROM rbac_user_permissions up
    JOIN rbac_permissions p ON up.permission_id = p.id
    WHERE up.user_id = p_user_id
      AND p.permission_key = p_permission_key
      AND up.is_active = true
      AND up.is_granted = false
      AND (up.expires_at IS NULL OR up.expires_at > NOW())
  ) INTO v_has_denial;
  
  IF v_has_denial THEN
    RETURN false;
  END IF;
  
  -- Check for direct grant
  SELECT EXISTS(
    SELECT 1 FROM rbac_user_permissions up
    JOIN rbac_permissions p ON up.permission_id = p.id
    WHERE up.user_id = p_user_id
      AND p.permission_key = p_permission_key
      AND up.is_active = true
      AND up.is_granted = true
      AND (up.expires_at IS NULL OR up.expires_at > NOW())
  ) INTO v_has_permission;
  
  IF v_has_permission THEN
    RETURN true;
  END IF;
  
  -- Check role-based denial
  SELECT EXISTS(
    SELECT 1 FROM rbac_user_roles ur
    JOIN rbac_role_permissions rp ON ur.role_id = rp.role_id
    JOIN rbac_permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
      AND p.permission_key = p_permission_key
      AND ur.is_active = true
      AND rp.is_granted = false
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ) INTO v_has_denial;
  
  IF v_has_denial THEN
    RETURN false;
  END IF;
  
  -- Check role-based grant
  SELECT EXISTS(
    SELECT 1 FROM rbac_user_roles ur
    JOIN rbac_role_permissions rp ON ur.role_id = rp.role_id
    JOIN rbac_permissions p ON rp.permission_id = p.id
    JOIN rbac_roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND p.permission_key = p_permission_key
      AND ur.is_active = true
      AND r.is_active = true
      AND rp.is_granted = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ) INTO v_has_permission;
  
  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- HELPER FUNCTION: Get all user permissions
-- ============================================================================
-- Returns all permissions for a user (from roles and direct assignments)
-- ============================================================================
CREATE OR REPLACE FUNCTION rbac_get_user_permissions(p_user_id UUID)
RETURNS TABLE(
  permission_key VARCHAR,
  name VARCHAR,
  action VARCHAR,
  subject VARCHAR,
  field VARCHAR,
  is_granted BOOLEAN,
  source VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  -- Direct permissions
  SELECT 
    p.permission_key,
    p.name,
    p.action,
    p.subject,
    p.field,
    up.is_granted,
    'direct'::VARCHAR as source
  FROM rbac_user_permissions up
  JOIN rbac_permissions p ON up.permission_id = p.id
  WHERE up.user_id = p_user_id
    AND up.is_active = true
    AND (up.expires_at IS NULL OR up.expires_at > NOW())
  
  UNION
  
  -- Role-based permissions
  SELECT 
    p.permission_key,
    p.name,
    p.action,
    p.subject,
    p.field,
    rp.is_granted,
    r.role_key::VARCHAR as source
  FROM rbac_user_roles ur
  JOIN rbac_roles r ON ur.role_id = r.id
  JOIN rbac_role_permissions rp ON r.id = rp.role_id
  JOIN rbac_permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = p_user_id
    AND ur.is_active = true
    AND r.is_active = true
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS for Documentation
-- ============================================================================
COMMENT ON TABLE rbac_permissions IS 'Defines all available permissions in the system';
COMMENT ON TABLE rbac_roles IS 'Defines roles that can be assigned to users';
COMMENT ON TABLE rbac_role_permissions IS 'Links roles to permissions (many-to-many)';
COMMENT ON TABLE rbac_user_roles IS 'Assigns roles to users';
COMMENT ON TABLE rbac_user_permissions IS 'Direct permission assignments to users (bypassing roles)';

COMMENT ON FUNCTION rbac_user_has_permission IS 'Checks if a user has a specific permission';
COMMENT ON FUNCTION rbac_get_user_permissions IS 'Returns all permissions for a user';
