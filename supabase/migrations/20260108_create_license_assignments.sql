-- ============================================================================
-- MIGRATION: Create License Assignments Table
-- Description: Tracks which members have been assigned subscription seats
-- Requirements: 2.1, 2.2, 2.5, 7.1, 7.2, 7.3
-- ============================================================================

-- Create license_assignments table
CREATE TABLE IF NOT EXISTS license_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  license_pool_id UUID NOT NULL REFERENCES license_pools(id) ON DELETE CASCADE,
  organization_subscription_id UUID NOT NULL REFERENCES organization_subscriptions(id) ON DELETE CASCADE,
  
  -- Member details
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  member_type VARCHAR(20) NOT NULL CHECK (member_type IN ('educator', 'student')),
  
  -- Assignment lifecycle
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked', 'expired')),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID NOT NULL REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  
  -- Revocation
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES users(id),
  revocation_reason TEXT,
  
  -- Transfer tracking
  transferred_from UUID REFERENCES license_assignments(id),
  transferred_to UUID REFERENCES license_assignments(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_active_assignment UNIQUE (user_id, organization_subscription_id, status) 
    WHERE status = 'active',
  CONSTRAINT valid_revocation CHECK (
    (status = 'revoked' AND revoked_at IS NOT NULL AND revoked_by IS NOT NULL) OR
    (status != 'revoked' AND revoked_at IS NULL)
  ),
  CONSTRAINT valid_expiration CHECK (expires_at IS NULL OR expires_at > assigned_at)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_license_assign_user ON license_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_license_assign_pool ON license_assignments(license_pool_id);
CREATE INDEX IF NOT EXISTS idx_license_assign_status ON license_assignments(status);
CREATE INDEX IF NOT EXISTS idx_license_assign_org_sub ON license_assignments(organization_subscription_id);
CREATE INDEX IF NOT EXISTS idx_license_assign_assigned_by ON license_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_license_assign_expires_at ON license_assignments(expires_at) WHERE expires_at IS NOT NULL;

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_license_assign_user_status ON license_assignments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_license_assign_pool_status ON license_assignments(license_pool_id, status);

-- Enable Row-Level Security
ALTER TABLE license_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can view assignments for their organization
CREATE POLICY "Admins can view organization license assignments" ON license_assignments
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE id IN (
        SELECT assigned_by FROM license_assignments la2 WHERE la2.id = license_assignments.id
      )
      OR id IN (
        SELECT os.purchased_by 
        FROM organization_subscriptions os 
        WHERE os.id = license_assignments.organization_subscription_id
      )
    )
    OR auth.uid() = user_id  -- Users can see their own assignments
  );

-- RLS Policy: Admins can create license assignments
CREATE POLICY "Admins can create license assignments" ON license_assignments
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT os.purchased_by 
      FROM organization_subscriptions os 
      WHERE os.id = license_assignments.organization_subscription_id
    )
    OR auth.uid() IN (
      SELECT lp.created_by 
      FROM license_pools lp 
      WHERE lp.id = license_assignments.license_pool_id
    )
  );

-- RLS Policy: Admins can update license assignments
CREATE POLICY "Admins can update license assignments" ON license_assignments
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT os.purchased_by 
      FROM organization_subscriptions os 
      WHERE os.id = license_assignments.organization_subscription_id
    )
    OR auth.uid() = assigned_by
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_license_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_license_assignments_updated_at
  BEFORE UPDATE ON license_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_license_assignments_updated_at();

-- Create function to update pool assigned_seats count
CREATE OR REPLACE FUNCTION update_pool_assigned_seats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    -- Increment assigned_seats when new active assignment is created
    UPDATE license_pools
    SET assigned_seats = assigned_seats + 1
    WHERE id = NEW.license_pool_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      -- Decrement when assignment becomes inactive
      UPDATE license_pools
      SET assigned_seats = assigned_seats - 1
      WHERE id = NEW.license_pool_id;
      
    ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
      -- Increment when assignment becomes active
      UPDATE license_pools
      SET assigned_seats = assigned_seats + 1
      WHERE id = NEW.license_pool_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    -- Decrement when active assignment is deleted
    UPDATE license_pools
    SET assigned_seats = assigned_seats - 1
    WHERE id = OLD.license_pool_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_pool_assigned_seats
  AFTER INSERT OR UPDATE OR DELETE ON license_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_pool_assigned_seats();

-- Create function to update organization_subscriptions assigned_seats count
CREATE OR REPLACE FUNCTION update_org_sub_assigned_seats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    -- Increment assigned_seats when new active assignment is created
    UPDATE organization_subscriptions
    SET assigned_seats = assigned_seats + 1
    WHERE id = NEW.organization_subscription_id;
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle status changes
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      -- Decrement when assignment becomes inactive
      UPDATE organization_subscriptions
      SET assigned_seats = assigned_seats - 1
      WHERE id = NEW.organization_subscription_id;
      
    ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
      -- Increment when assignment becomes active
      UPDATE organization_subscriptions
      SET assigned_seats = assigned_seats + 1
      WHERE id = NEW.organization_subscription_id;
    END IF;
    
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    -- Decrement when active assignment is deleted
    UPDATE organization_subscriptions
    SET assigned_seats = assigned_seats - 1
    WHERE id = OLD.organization_subscription_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_org_sub_assigned_seats
  AFTER INSERT OR UPDATE OR DELETE ON license_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_org_sub_assigned_seats();

-- Create function to validate seat availability before assignment
CREATE OR REPLACE FUNCTION validate_seat_availability()
RETURNS TRIGGER AS $$
DECLARE
  available INTEGER;
BEGIN
  -- Only validate for new active assignments
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    -- Check if pool has available seats
    SELECT available_seats INTO available
    FROM license_pools
    WHERE id = NEW.license_pool_id;
    
    IF available <= 0 THEN
      RAISE EXCEPTION 'No available seats in license pool. Available: %, Requested: 1', available;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_seat_availability
  BEFORE INSERT ON license_assignments
  FOR EACH ROW
  EXECUTE FUNCTION validate_seat_availability();

-- Add comments for documentation
COMMENT ON TABLE license_assignments IS 'Tracks which members have been assigned subscription seats with full audit trail';
COMMENT ON COLUMN license_assignments.status IS 'active: currently assigned, suspended: temporarily disabled, revoked: permanently removed, expired: past expiration date';
COMMENT ON COLUMN license_assignments.transferred_from IS 'References the assignment this was transferred from (for audit trail)';
COMMENT ON COLUMN license_assignments.transferred_to IS 'References the assignment this was transferred to (for audit trail)';
COMMENT ON COLUMN license_assignments.revocation_reason IS 'Admin-provided reason for revoking access (for compliance and audit)';

