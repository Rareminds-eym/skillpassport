-- Migration: Extend subscriptions table for organization support
-- Description: Add organization-level subscription tracking columns
-- Author: System
-- Date: 2026-01-08

-- ============================================================================
-- EXTEND SUBSCRIPTIONS TABLE
-- ============================================================================

-- Add organization tracking columns
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS organization_type TEXT CHECK (organization_type IN ('school', 'college', 'university', 'company')),
ADD COLUMN IF NOT EXISTS purchased_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS seat_count INTEGER DEFAULT 1 CHECK (seat_count > 0),
ADD COLUMN IF NOT EXISTS is_organization_subscription BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Organization lookup index
CREATE INDEX IF NOT EXISTS idx_subscriptions_organization 
    ON subscriptions(organization_id, organization_type) 
    WHERE is_organization_subscription = TRUE;

-- Purchaser tracking index
CREATE INDEX IF NOT EXISTS idx_subscriptions_purchased_by 
    ON subscriptions(purchased_by, created_at DESC) 
    WHERE is_organization_subscription = TRUE;

-- Organization active subscriptions index
CREATE INDEX IF NOT EXISTS idx_subscriptions_org_active 
    ON subscriptions(organization_id, status, end_date) 
    WHERE is_organization_subscription = TRUE AND status = 'active';

-- Seat count tracking index
CREATE INDEX IF NOT EXISTS idx_subscriptions_seat_count 
    ON subscriptions(organization_id, seat_count) 
    WHERE is_organization_subscription = TRUE;

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Ensure organization subscriptions have organization_id
ALTER TABLE subscriptions
ADD CONSTRAINT check_org_subscription_has_org_id
CHECK (
    (is_organization_subscription = TRUE AND organization_id IS NOT NULL AND organization_type IS NOT NULL) OR
    (is_organization_subscription = FALSE)
);

-- Ensure organization subscriptions have seat_count > 1
ALTER TABLE subscriptions
ADD CONSTRAINT check_org_subscription_seat_count
CHECK (
    (is_organization_subscription = TRUE AND seat_count > 1) OR
    (is_organization_subscription = FALSE AND seat_count = 1)
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Validate organization subscription data
CREATE OR REPLACE FUNCTION validate_organization_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is an organization subscription
    IF NEW.is_organization_subscription = TRUE THEN
        -- Ensure purchased_by is set
        IF NEW.purchased_by IS NULL THEN
            RAISE EXCEPTION 'Organization subscriptions must have a purchaser (purchased_by)';
        END IF;
        
        -- Ensure seat_count is reasonable (max 10,000 seats per subscription)
        IF NEW.seat_count > 10000 THEN
            RAISE EXCEPTION 'Seat count cannot exceed 10,000 per subscription';
        END IF;
        
        -- Ensure user_id is NULL for organization subscriptions (they're not tied to a single user)
        IF NEW.user_id IS NOT NULL THEN
            RAISE EXCEPTION 'Organization subscriptions should not have a user_id (use license_assignments instead)';
        END IF;
    ELSE
        -- Individual subscriptions should have user_id
        IF NEW.user_id IS NULL THEN
            RAISE EXCEPTION 'Individual subscriptions must have a user_id';
        END IF;
        
        -- Individual subscriptions should have seat_count = 1
        IF NEW.seat_count != 1 THEN
            NEW.seat_count = 1;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_organization_subscription
    BEFORE INSERT OR UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION validate_organization_subscription();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Get organization subscriptions summary
CREATE OR REPLACE FUNCTION get_organization_subscriptions_summary(
    p_organization_id UUID,
    p_organization_type TEXT
)
RETURNS TABLE (
    subscription_id UUID,
    plan_name TEXT,
    status TEXT,
    seat_count INTEGER,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    monthly_cost DECIMAL,
    purchased_by_name TEXT,
    days_until_expiry INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        sp.name,
        s.status,
        s.seat_count,
        s.start_date,
        s.end_date,
        s.amount,
        u.full_name,
        EXTRACT(DAY FROM (s.end_date - NOW()))::INTEGER
    FROM subscriptions s
    JOIN subscription_plans sp ON sp.id = s.subscription_plan_id
    LEFT JOIN users u ON u.id = s.purchased_by
    WHERE s.organization_id = p_organization_id
        AND s.organization_type = p_organization_type
        AND s.is_organization_subscription = TRUE
    ORDER BY s.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get total seats purchased by organization
CREATE OR REPLACE FUNCTION get_organization_total_seats(
    p_organization_id UUID,
    p_organization_type TEXT
)
RETURNS INTEGER AS $$
DECLARE
    v_total_seats INTEGER;
BEGIN
    SELECT COALESCE(SUM(seat_count), 0) INTO v_total_seats
    FROM subscriptions
    WHERE organization_id = p_organization_id
        AND organization_type = p_organization_type
        AND is_organization_subscription = TRUE
        AND status = 'active';
    
    RETURN v_total_seats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if organization has active subscription for plan
CREATE OR REPLACE FUNCTION organization_has_active_plan(
    p_organization_id UUID,
    p_organization_type TEXT,
    p_plan_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM subscriptions
        WHERE organization_id = p_organization_id
            AND organization_type = p_organization_type
            AND subscription_plan_id = p_plan_id
            AND is_organization_subscription = TRUE
            AND status = 'active'
            AND end_date > NOW()
    ) INTO v_exists;
    
    RETURN v_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATE RLS POLICIES
-- ============================================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS subscriptions_select_own ON subscriptions;
DROP POLICY IF EXISTS subscriptions_insert_own ON subscriptions;
DROP POLICY IF EXISTS subscriptions_update_own ON subscriptions;

-- Policy: Users can view their own subscriptions
CREATE POLICY subscriptions_select_own ON subscriptions
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM license_assignments la
            WHERE la.user_id = auth.uid()
                AND la.organization_subscription_id IN (
                    SELECT id FROM organization_subscriptions os
                    WHERE os.subscription_id = subscriptions.id
                )
                AND la.status = 'active'
        )
    );

-- Policy: Organization admins can view organization subscriptions
CREATE POLICY subscriptions_select_org_admin ON subscriptions
    FOR SELECT
    USING (
        is_organization_subscription = TRUE
        AND EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
                AND u.role IN ('school_admin', 'college_admin', 'university_admin', 'company_admin')
                AND (
                    (organization_type = 'school' AND u.school_id::TEXT = organization_id::TEXT) OR
                    (organization_type = 'college' AND u.college_id::TEXT = organization_id::TEXT) OR
                    (organization_type = 'university' AND u.university_id::TEXT = organization_id::TEXT) OR
                    (organization_type = 'company' AND u.company_id::TEXT = organization_id::TEXT)
                )
        )
    );

-- Policy: Users can create their own subscriptions
CREATE POLICY subscriptions_insert_own ON subscriptions
    FOR INSERT
    WITH CHECK (
        (is_organization_subscription = FALSE AND user_id = auth.uid())
        OR (is_organization_subscription = TRUE AND purchased_by = auth.uid())
    );

-- Policy: Users can update their own subscriptions
CREATE POLICY subscriptions_update_own ON subscriptions
    FOR UPDATE
    USING (
        user_id = auth.uid()
        OR (is_organization_subscription = TRUE AND purchased_by = auth.uid())
    );

-- Policy: Super admins can view all subscriptions
CREATE POLICY subscriptions_super_admin_all ON subscriptions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
                AND u.role = 'super_admin'
        )
    );

-- ============================================================================
-- DATA MIGRATION
-- ============================================================================

-- Set default values for existing records
UPDATE subscriptions
SET 
    is_organization_subscription = FALSE,
    seat_count = 1
WHERE is_organization_subscription IS NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN subscriptions.organization_id IS 'ID of the organization (school_id, college_id, university_id, or company_id)';
COMMENT ON COLUMN subscriptions.organization_type IS 'Type of organization (school, college, university, company)';
COMMENT ON COLUMN subscriptions.purchased_by IS 'Admin user who purchased the subscription for the organization';
COMMENT ON COLUMN subscriptions.seat_count IS 'Number of seats/licenses purchased (1 for individual, >1 for organization)';
COMMENT ON COLUMN subscriptions.is_organization_subscription IS 'Flag to distinguish organization subscriptions from individual subscriptions';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_organization_subscriptions_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_total_seats TO authenticated;
GRANT EXECUTE ON FUNCTION organization_has_active_plan TO authenticated;
