-- Add index on user_id for better query performance
CREATE INDEX IF NOT EXISTS idx_rbac_user_roles_user_id ON rbac_user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_rbac_user_roles_active ON rbac_user_roles(user_id, is_active) WHERE is_active = true;
