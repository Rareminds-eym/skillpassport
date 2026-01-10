-- Migration: Extend payment_transactions table for organization purchases
-- Description: Add columns to track organization bulk purchases
-- Author: System
-- Date: 2026-01-08

-- ============================================================================
-- EXTEND PAYMENT_TRANSACTIONS TABLE
-- ============================================================================

-- Add organization purchase tracking columns
ALTER TABLE payment_transactions
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS organization_type TEXT CHECK (organization_type IN ('school', 'college', 'university', 'company')),
ADD COLUMN IF NOT EXISTS seat_count INTEGER DEFAULT 1 CHECK (seat_count > 0),
ADD COLUMN IF NOT EXISTS is_bulk_purchase BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Organization purchase tracking index
CREATE INDEX IF NOT EXISTS idx_payment_transactions_organization 
    ON payment_transactions(organization_id, organization_type) 
    WHERE is_bulk_purchase = TRUE;

-- Bulk purchase lookup index
CREATE INDEX IF NOT EXISTS idx_payment_transactions_bulk 
    ON payment_transactions(is_bulk_purchase, created_at DESC) 
    WHERE is_bulk_purchase = TRUE;

-- Organization payment history index
CREATE INDEX IF NOT EXISTS idx_payment_transactions_org_history 
    ON payment_transactions(organization_id, status, created_at DESC) 
    WHERE organization_id IS NOT NULL;

-- Seat count analytics index
CREATE INDEX IF NOT EXISTS idx_payment_transactions_seat_analytics 
    ON payment_transactions(organization_type, seat_count, created_at) 
    WHERE is_bulk_purchase = TRUE AND status = 'completed';

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Ensure bulk purchases have organization info
ALTER TABLE payment_transactions
ADD CONSTRAINT check_bulk_purchase_has_org
CHECK (
    (is_bulk_purchase = TRUE AND organization_id IS NOT NULL AND organization_type IS NOT NULL) OR
    (is_bulk_purchase = FALSE)
);

-- Ensure bulk purchases have seat_count > 1
ALTER TABLE payment_transactions
ADD CONSTRAINT check_bulk_purchase_seat_count
CHECK (
    (is_bulk_purchase = TRUE AND seat_count > 1) OR
    (is_bulk_purchase = FALSE AND seat_count = 1)
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Validate bulk purchase data
CREATE OR REPLACE FUNCTION validate_bulk_purchase_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a bulk purchase
    IF NEW.is_bulk_purchase = TRUE THEN
        -- Ensure organization_id and type are set
        IF NEW.organization_id IS NULL OR NEW.organization_type IS NULL THEN
            RAISE EXCEPTION 'Bulk purchases must have organization_id and organization_type';
        END IF;
        
        -- Ensure seat_count is reasonable (max 10,000 seats per transaction)
        IF NEW.seat_count > 10000 THEN
            RAISE EXCEPTION 'Seat count cannot exceed 10,000 per transaction';
        END IF;
        
        -- Ensure amount is reasonable for seat count
        IF NEW.amount < (NEW.seat_count * 100) THEN
            RAISE WARNING 'Transaction amount seems low for seat count: % seats for ₹%', NEW.seat_count, NEW.amount;
        END IF;
    ELSE
        -- Individual purchases should have seat_count = 1
        IF NEW.seat_count != 1 THEN
            NEW.seat_count = 1;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_bulk_purchase_transaction
    BEFORE INSERT OR UPDATE ON payment_transactions
    FOR EACH ROW
    EXECUTE FUNCTION validate_bulk_purchase_transaction();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Get organization payment history
CREATE OR REPLACE FUNCTION get_organization_payment_history(
    p_organization_id UUID,
    p_organization_type TEXT,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    transaction_id UUID,
    amount DECIMAL,
    currency TEXT,
    status TEXT,
    payment_method TEXT,
    seat_count INTEGER,
    plan_name TEXT,
    transaction_date TIMESTAMPTZ,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pt.id,
        pt.amount,
        pt.currency,
        pt.status,
        pt.payment_method,
        pt.seat_count,
        sp.name AS plan_name,
        pt.created_at,
        pt.razorpay_order_id,
        pt.razorpay_payment_id
    FROM payment_transactions pt
    LEFT JOIN subscription_plans sp ON sp.id = pt.subscription_plan_id
    WHERE pt.organization_id = p_organization_id
        AND pt.organization_type = p_organization_type
    ORDER BY pt.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Calculate organization total spend
CREATE OR REPLACE FUNCTION get_organization_total_spend(
    p_organization_id UUID,
    p_organization_type TEXT,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    total_amount DECIMAL,
    total_transactions INTEGER,
    total_seats_purchased INTEGER,
    average_transaction_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(pt.amount), 0) AS total_amount,
        COUNT(*)::INTEGER AS total_transactions,
        COALESCE(SUM(pt.seat_count), 0)::INTEGER AS total_seats_purchased,
        COALESCE(AVG(pt.amount), 0) AS average_transaction_amount
    FROM payment_transactions pt
    WHERE pt.organization_id = p_organization_id
        AND pt.organization_type = p_organization_type
        AND pt.status = 'completed'
        AND (p_start_date IS NULL OR pt.created_at >= p_start_date)
        AND (p_end_date IS NULL OR pt.created_at <= p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get bulk purchase analytics
CREATE OR REPLACE FUNCTION get_bulk_purchase_analytics(
    p_start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    organization_type TEXT,
    total_purchases INTEGER,
    total_seats_sold INTEGER,
    total_revenue DECIMAL,
    average_seats_per_purchase DECIMAL,
    average_revenue_per_purchase DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pt.organization_type,
        COUNT(*)::INTEGER AS total_purchases,
        COALESCE(SUM(pt.seat_count), 0)::INTEGER AS total_seats_sold,
        COALESCE(SUM(pt.amount), 0) AS total_revenue,
        COALESCE(AVG(pt.seat_count), 0) AS average_seats_per_purchase,
        COALESCE(AVG(pt.amount), 0) AS average_revenue_per_purchase
    FROM payment_transactions pt
    WHERE pt.is_bulk_purchase = TRUE
        AND pt.status = 'completed'
        AND pt.created_at >= p_start_date
        AND pt.created_at <= p_end_date
    GROUP BY pt.organization_type
    ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get monthly revenue breakdown
CREATE OR REPLACE FUNCTION get_monthly_revenue_breakdown(
    p_organization_id UUID,
    p_organization_type TEXT,
    p_months INTEGER DEFAULT 12
)
RETURNS TABLE (
    month TEXT,
    total_amount DECIMAL,
    transaction_count INTEGER,
    seats_purchased INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(pt.created_at, 'YYYY-MM') AS month,
        COALESCE(SUM(pt.amount), 0) AS total_amount,
        COUNT(*)::INTEGER AS transaction_count,
        COALESCE(SUM(pt.seat_count), 0)::INTEGER AS seats_purchased
    FROM payment_transactions pt
    WHERE pt.organization_id = p_organization_id
        AND pt.organization_type = p_organization_type
        AND pt.status = 'completed'
        AND pt.created_at >= NOW() - (p_months || ' months')::INTERVAL
    GROUP BY TO_CHAR(pt.created_at, 'YYYY-MM')
    ORDER BY month DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get failed bulk purchases for retry
CREATE OR REPLACE FUNCTION get_failed_bulk_purchases(
    p_organization_id UUID,
    p_organization_type TEXT
)
RETURNS TABLE (
    transaction_id UUID,
    amount DECIMAL,
    seat_count INTEGER,
    plan_name TEXT,
    failure_reason TEXT,
    created_at TIMESTAMPTZ,
    razorpay_order_id TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pt.id,
        pt.amount,
        pt.seat_count,
        sp.name AS plan_name,
        pt.metadata->>'failure_reason' AS failure_reason,
        pt.created_at,
        pt.razorpay_order_id
    FROM payment_transactions pt
    LEFT JOIN subscription_plans sp ON sp.id = pt.subscription_plan_id
    WHERE pt.organization_id = p_organization_id
        AND pt.organization_type = p_organization_type
        AND pt.is_bulk_purchase = TRUE
        AND pt.status IN ('failed', 'pending')
        AND pt.created_at >= NOW() - INTERVAL '7 days'
    ORDER BY pt.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATE RLS POLICIES
-- ============================================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS payment_transactions_select_own ON payment_transactions;
DROP POLICY IF EXISTS payment_transactions_insert_own ON payment_transactions;

-- Policy: Users can view their own payment transactions
CREATE POLICY payment_transactions_select_own ON payment_transactions
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy: Organization admins can view organization payment transactions
CREATE POLICY payment_transactions_select_org_admin ON payment_transactions
    FOR SELECT
    USING (
        is_bulk_purchase = TRUE
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

-- Policy: Users can create their own payment transactions
CREATE POLICY payment_transactions_insert_own ON payment_transactions
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        OR (is_bulk_purchase = TRUE AND EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
                AND u.role IN ('school_admin', 'college_admin', 'university_admin', 'company_admin')
        ))
    );

-- Policy: Super admins can view all payment transactions
CREATE POLICY payment_transactions_super_admin_all ON payment_transactions
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
UPDATE payment_transactions
SET 
    is_bulk_purchase = FALSE,
    seat_count = 1
WHERE is_bulk_purchase IS NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN payment_transactions.organization_id IS 'ID of the organization making the bulk purchase';
COMMENT ON COLUMN payment_transactions.organization_type IS 'Type of organization (school, college, university, company)';
COMMENT ON COLUMN payment_transactions.seat_count IS 'Number of seats/licenses purchased in this transaction';
COMMENT ON COLUMN payment_transactions.is_bulk_purchase IS 'Flag indicating if this is an organization bulk purchase';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_organization_payment_history TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_total_spend TO authenticated;
GRANT EXECUTE ON FUNCTION get_bulk_purchase_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION get_monthly_revenue_breakdown TO authenticated;
GRANT EXECUTE ON FUNCTION get_failed_bulk_purchases TO authenticated;
