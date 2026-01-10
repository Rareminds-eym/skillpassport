-- ============================================================================
-- MIGRATION: Create Organization Subscriptions Table
-- Description: Tracks subscriptions purchased by organization admins
-- Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
-- ============================================================================

-- Create organization_subscriptions table
CREATE TABLE IF NOT EXISTS organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organization details
  organization_id UUID NOT NULL,
  organization_type VARCHAR(20) NOT NULL CHECK (organization_type IN ('school', 'college', 'university')),
  
  -- Subscription details
  subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  purchased_by UUID NOT NULL REFERENCES users(id),
  
  -- Seat management
  total_seats INTEGER NOT NULL CHECK (total_seats > 0),
  assigned_seats INTEGER DEFAULT 0 CHECK (assigned_seats >= 0),
  available_seats INTEGER GENERATED ALWAYS AS (total_seats - assigned_seats) STORED,
  
  -- Member targeting
  target_member_type VARCHAR(20) NOT NULL CHECK (target_member_type IN ('educator', 'student', 'both')),
  
  -- Subscription lifecycle
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired', 'grace_period')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  
  -- Pricing
  price_per_seat DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  discount_percentage INTEGER DEFAULT 0,
  final_amount DECIMAL(10,2) NOT NULL,
  
  -- Payment integration
  razorpay_subscription_id VARCHAR(100),
  razorpay_order_id VARCHAR(100),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Constraints
  CONSTRAINT valid_seat_count CHECK (assigned_seats <= total_seats),
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT valid_pricing CHECK (final_amount >= 0 AND total_amount >= 0 AND price_per_seat >= 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_subs_org_id ON organization_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_subs_org_type ON organization_subscriptions(organization_type);
CREATE INDEX IF NOT EXISTS idx_org_subs_status ON organization_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_org_subs_end_date ON organization_subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_org_subs_purchased_by ON organization_subscriptions(purchased_by);
CREATE INDEX IF NOT EXISTS idx_org_subs_plan_id ON organization_subscriptions(subscription_plan_id);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_org_subs_org_status ON organization_subscriptions(organization_id, status);

-- Enable Row-Level Security
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins can view their organization's subscriptions
CREATE POLICY "Admins can view own organization subscriptions" ON organization_subscriptions
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE (
        (organization_type = 'school' AND school_id = organization_subscriptions.organization_id AND role IN ('school_admin', 'super_admin'))
        OR (organization_type = 'college' AND college_id = organization_subscriptions.organization_id AND role IN ('college_admin', 'super_admin'))
        OR (organization_type = 'university' AND university_id = organization_subscriptions.organization_id AND role IN ('university_admin', 'super_admin'))
      )
    )
  );

-- RLS Policy: Admins can insert subscriptions for their organization
CREATE POLICY "Admins can create organization subscriptions" ON organization_subscriptions
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE (
        (organization_type = 'school' AND school_id = organization_subscriptions.organization_id AND role IN ('school_admin', 'super_admin'))
        OR (organization_type = 'college' AND college_id = organization_subscriptions.organization_id AND role IN ('college_admin', 'super_admin'))
        OR (organization_type = 'university' AND university_id = organization_subscriptions.organization_id AND role IN ('university_admin', 'super_admin'))
      )
    )
  );

-- RLS Policy: Admins can update their organization's subscriptions
CREATE POLICY "Admins can update organization subscriptions" ON organization_subscriptions
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM users 
      WHERE (
        (organization_type = 'school' AND school_id = organization_subscriptions.organization_id AND role IN ('school_admin', 'super_admin'))
        OR (organization_type = 'college' AND college_id = organization_subscriptions.organization_id AND role IN ('college_admin', 'super_admin'))
        OR (organization_type = 'university' AND university_id = organization_subscriptions.organization_id AND role IN ('university_admin', 'super_admin'))
      )
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organization_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_organization_subscriptions_updated_at
  BEFORE UPDATE ON organization_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_subscriptions_updated_at();

-- Add comments for documentation
COMMENT ON TABLE organization_subscriptions IS 'Tracks subscriptions purchased by organization admins for their members';
COMMENT ON COLUMN organization_subscriptions.organization_id IS 'References schools.id, colleges.id, or universities.id depending on organization_type';
COMMENT ON COLUMN organization_subscriptions.available_seats IS 'Automatically calculated as total_seats - assigned_seats';
COMMENT ON COLUMN organization_subscriptions.target_member_type IS 'Specifies whether subscription is for educators, students, or both';
COMMENT ON COLUMN organization_subscriptions.discount_percentage IS 'Volume discount percentage applied (0-30%)';

