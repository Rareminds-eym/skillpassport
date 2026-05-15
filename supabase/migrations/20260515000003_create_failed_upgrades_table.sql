-- Migration: Create Failed Upgrades Table
-- Description: Tracks failed subscription upgrades for manual intervention
-- Date: 2026-05-15
-- Fixes Issue #33: No Rollback Strategy for Failed Upgrades

-- Create table to log failed upgrade attempts
CREATE TABLE IF NOT EXISTS failed_upgrades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  subscription_id UUID NOT NULL,
  razorpay_order_id TEXT NOT NULL,
  razorpay_payment_id TEXT NOT NULL,
  original_plan_id UUID NOT NULL,
  target_plan_id UUID NOT NULL,
  amount_paid DECIMAL(10, 2) NOT NULL,
  error_message TEXT NOT NULL,
  error_details JSONB,
  support_ticket_id TEXT,
  resolution_status TEXT DEFAULT 'pending' CHECK (resolution_status IN ('pending', 'in_progress', 'resolved', 'refunded')),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for efficient querying
CREATE INDEX idx_failed_upgrades_user_id ON failed_upgrades(user_id);
CREATE INDEX idx_failed_upgrades_subscription_id ON failed_upgrades(subscription_id);
CREATE INDEX idx_failed_upgrades_resolution_status ON failed_upgrades(resolution_status);
CREATE INDEX idx_failed_upgrades_created_at ON failed_upgrades(created_at DESC);

-- Add foreign key constraints
ALTER TABLE failed_upgrades
ADD CONSTRAINT fk_failed_upgrades_subscription
FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE;

-- Add RLS policies
ALTER TABLE failed_upgrades ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
CREATE POLICY "Service role has full access to failed_upgrades"
ON failed_upgrades
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: Users can view their own failed upgrades
CREATE POLICY "Users can view their own failed upgrades"
ON failed_upgrades
FOR SELECT
TO authenticated
USING (auth.uid()::text = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_failed_upgrades_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_failed_upgrades_updated_at
BEFORE UPDATE ON failed_upgrades
FOR EACH ROW
EXECUTE FUNCTION update_failed_upgrades_updated_at();

-- Add comment
COMMENT ON TABLE failed_upgrades IS 
'Tracks failed subscription upgrade attempts where payment was verified but subscription update failed. Used for manual intervention and customer support.';
