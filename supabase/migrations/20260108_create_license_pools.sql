-- ============================================================================
-- MIGRATION: Create License Pools Table
-- Description: Manages available subscription seats for organizations
-- Requirements: 2.1, 2.2, 2.3, 2.4
-- ============================================================================

-- Create license_pools table
CREATE TABLE IF NOT EXISTS license_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organization subscription reference
  organization_subscription_id UUID NOT NULL REFERENCES organization_subscriptions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  organization_type VARCHAR(20) NOT NULL CHECK (organization_type IN ('school', 'college', 'university')),
  
  -- Pool details
  pool_name VARCHAR(100),
  member_type VARCHAR(20) NOT NULL CHECK (member_type IN ('educator', 'student')),
  
  -- Seat allocation
  allocated_seats INTEGER NOT NULL CHECK (allocated_seats > 0),
  assigned_seats INTEGER DEFAULT 0 CHECK (assigned_seats >= 0),
  available_seats INTEGER GENERATED ALWAYS AS (allocated_seats - assigned_seats) STORED,
  
  -- Auto-assignment rules
  auto_assign_new_members BOOLEAN DEFAULT false,
  assignment_criteria JSONB DEFAULT '{}',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Constraints
  CONSTRAINT valid_pool_seats CHECK (assigned_seats <= allocated_seats),
  CONSTRAINT valid_pool_name CHECK (pool_name IS NULL OR LENGTH(pool_name) > 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_license_pools_org_sub ON license_pools(organization_subscription_id);
CREATE INDEX IF NOT EXISTS idx_license_pools_org_id ON license_pools(organization_id);
CREATE INDEX IF NOT EXISTS idx_license_pools_org_type ON license_pools(organization_type);
CREATE INDEX IF NOT EXISTS idx_license_pools_member_type ON license_pools(member_type);
CREATE INDEX IF NOT EXISTS idx_license_pools_is_active ON license_pools(is_active) WHERE is_active = true;

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_license_pools_org_member ON license_pools(organization_id, member_type, is_active);

-- Enable Row-Level Security
ALTER TABLE license_pools ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can view their organization's license pools
CREATE POLICY "Admins can view own organization license pools" ON license_pools
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE (
        (organization_type = 'school' AND school_id = license_pools.organization_id AND role IN ('school_admin', 'super_admin'))
        OR (organization_type = 'college' AND college_id = license_pools.organization_id AND role IN ('college_admin', 'super_admin'))
        OR (organization_type = 'university' AND university_id = license_pools.organization_id AND role IN ('university_admin', 'super_admin'))
      )
    )
  );

-- RLS Policy: Admins can create license pools for their organization
CREATE POLICY "Admins can create license pools" ON license_pools
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE (
        (organization_type = 'school' AND school_id = license_pools.organization_id AND role IN ('school_admin', 'super_admin'))
        OR (organization_type = 'college' AND college_id = license_pools.organization_id AND role IN ('college_admin', 'super_admin'))
        OR (organization_type = 'university' AND university_id = license_pools.organization_id AND role IN ('university_admin', 'super_admin'))
      )
    )
  );

-- RLS Policy: Admins can update their organization's license pools
CREATE POLICY "Admins can update license pools" ON license_pools
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE (
        (organization_type = 'school' AND school_id = license_pools.organization_id AND role IN ('school_admin', 'super_admin'))
        OR (organization_type = 'college' AND college_id = license_pools.organization_id AND role IN ('college_admin', 'super_admin'))
        OR (organization_type = 'university' AND university_id = license_pools.organization_id AND role IN ('university_admin', 'super_admin'))
      )
    )
  );

-- RLS Policy: Admins can delete their organization's license pools
CREATE POLICY "Admins can delete license pools" ON license_pools
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE (
        (organization_type = 'school' AND school_id = license_pools.organization_id AND role IN ('school_admin', 'super_admin'))
        OR (organization_type = 'college' AND college_id = license_pools.organization_id AND role IN ('college_admin', 'super_admin'))
        OR (organization_type = 'university' AND university_id = license_pools.organization_id AND role IN ('university_admin', 'super_admin'))
      )
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_license_pools_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_license_pools_updated_at
  BEFORE UPDATE ON license_pools
  FOR EACH ROW
  EXECUTE FUNCTION update_license_pools_updated_at();

-- Create function to validate pool allocation against subscription seats
CREATE OR REPLACE FUNCTION validate_pool_allocation()
RETURNS TRIGGER AS $$
DECLARE
  total_allocated INTEGER;
  subscription_seats INTEGER;
BEGIN
  -- Get total allocated seats across all pools for this subscription
  SELECT COALESCE(SUM(allocated_seats), 0) INTO total_allocated
  FROM license_pools
  WHERE organization_subscription_id = NEW.organization_subscription_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
  
  -- Get total seats from subscription
  SELECT total_seats INTO subscription_seats
  FROM organization_subscriptions
  WHERE id = NEW.organization_subscription_id;
  
  -- Check if total allocation exceeds subscription seats
  IF (total_allocated + NEW.allocated_seats) > subscription_seats THEN
    RAISE EXCEPTION 'Total pool allocation (%) exceeds subscription seats (%)', 
      (total_allocated + NEW.allocated_seats), subscription_seats;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_pool_allocation
  BEFORE INSERT OR UPDATE ON license_pools
  FOR EACH ROW
  EXECUTE FUNCTION validate_pool_allocation();

-- Add comments for documentation
COMMENT ON TABLE license_pools IS 'Manages available subscription seats for organizations with optional auto-assignment rules';
COMMENT ON COLUMN license_pools.pool_name IS 'Optional name for the pool (e.g., "Computer Science Department", "Grade 10")';
COMMENT ON COLUMN license_pools.available_seats IS 'Automatically calculated as allocated_seats - assigned_seats';
COMMENT ON COLUMN license_pools.assignment_criteria IS 'JSONB field for auto-assignment rules (e.g., {"department": "CS", "grade": "10"})';
COMMENT ON COLUMN license_pools.auto_assign_new_members IS 'If true, new members matching criteria will automatically get assigned';

