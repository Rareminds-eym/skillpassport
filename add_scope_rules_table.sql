-- Add scope rules table to existing RBAC system
-- Run this if you already have the other tables created

-- 4. College Role Scope Rules Table
CREATE TABLE IF NOT EXISTS college_role_scope_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_type user_role NOT NULL,
  scope_type VARCHAR(20) NOT NULL, -- 'department' or 'program'
  scope_value VARCHAR(100) NOT NULL, -- department/program ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_type, scope_type, scope_value)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_college_role_scope_rules_role ON college_role_scope_rules(role_type);
CREATE INDEX IF NOT EXISTS idx_college_role_scope_rules_scope ON college_role_scope_rules(scope_type, scope_value);

-- Verify table was created
SELECT 'Scope rules table created successfully' as status;