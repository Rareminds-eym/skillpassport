-- Migration: Extend addon_pending_orders table for bulk add-on purchases
-- Description: Add columns to support organization bulk add-on orders
-- Author: System
-- Date: 2026-01-08

-- ============================================================================
-- EXTEND ADDON_PENDING_ORDERS TABLE
-- ============================================================================

-- Add bulk order tracking columns
ALTER TABLE addon_pending_orders
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS target_member_type TEXT CHECK (target_member_type IN ('school_student', 'school_educator', 'college_student', 'college_educator', 'all')),
ADD COLUMN IF NOT EXISTS target_member_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_bulk_order BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Organization bulk orders index
CREATE INDEX IF NOT EXISTS idx_addon_pending_orders_organization 
    ON addon_pending_orders(organization_id) 
    WHERE is_bulk_order = TRUE;

-- Bulk order status tracking index
CREATE INDEX IF NOT EXISTS idx_addon_pending_orders_bulk_status 
    ON addon_pending_orders(is_bulk_order, status, created_at DESC) 
    WHERE is_bulk_order = TRUE;

-- Target member type index
CREATE INDEX IF NOT EXISTS idx_addon_pending_orders_member_type 
    ON addon_pending_orders(organization_id, target_member_type) 
    WHERE is_bulk_order = TRUE;

-- Pending bulk orders index
CREATE INDEX IF NOT EXISTS idx_addon_pending_orders_pending_bulk 
    ON addon_pending_orders(organization_id, status) 
    WHERE is_bulk_order = TRUE AND status = 'pending';

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Ensure bulk orders have organization_id
ALTER TABLE addon_pending_orders
ADD CONSTRAINT check_bulk_order_has_org
CHECK (
    (is_bulk_order = TRUE AND organization_id IS NOT NULL) OR
    (is_bulk_order = FALSE)
);

-- Ensure bulk orders have target specification
ALTER TABLE addon_pending_orders
ADD CONSTRAINT check_bulk_order_has_targets
CHECK (
    (is_bulk_order = TRUE AND (target_member_type IS NOT NULL OR array_length(target_member_ids, 1) > 0)) OR
    (is_bulk_order = FALSE)
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Validate bulk add-on order data
CREATE OR REPLACE FUNCTION validate_bulk_addon_order()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is a bulk order
    IF NEW.is_bulk_order = TRUE THEN
        -- Ensure organization_id is set
        IF NEW.organization_id IS NULL THEN
            RAISE EXCEPTION 'Bulk add-on orders must have an organization_id';
        END IF;
        
        -- Ensure either target_member_type or target_member_ids is specified
        IF NEW.target_member_type IS NULL AND (NEW.target_member_ids IS NULL OR array_length(NEW.target_member_ids, 1) = 0) THEN
            RAISE EXCEPTION 'Bulk add-on orders must specify either target_member_type or target_member_ids';
        END IF;
        
        -- Validate target_member_ids count (max 10,000 members per order)
        IF NEW.target_member_ids IS NOT NULL AND array_length(NEW.target_member_ids, 1) > 10000 THEN
            RAISE EXCEPTION 'Cannot target more than 10,000 members in a single bulk order';
        END IF;
        
        -- Ensure user_id is NULL for bulk orders (they're not tied to a single user)
        IF NEW.user_id IS NOT NULL THEN
            RAISE EXCEPTION 'Bulk add-on orders should not have a user_id';
        END IF;
    ELSE
        -- Individual orders should have user_id
        IF NEW.user_id IS NULL THEN
            RAISE EXCEPTION 'Individual add-on orders must have a user_id';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_bulk_addon_order
    BEFORE INSERT OR UPDATE ON addon_pending_orders
    FOR EACH ROW
    EXECUTE FUNCTION validate_bulk_addon_order();

-- Trigger: Auto-populate target_member_ids based on target_member_type
CREATE OR REPLACE FUNCTION populate_target_member_ids()
RETURNS TRIGGER AS $$
DECLARE
    v_member_ids UUID[];
BEGIN
    -- If target_member_type is specified but target_member_ids is empty
    IF NEW.is_bulk_order = TRUE 
       AND NEW.target_member_type IS NOT NULL 
       AND NEW.target_member_type != 'all'
       AND (NEW.target_member_ids IS NULL OR array_length(NEW.target_member_ids, 1) = 0) THEN
        
        -- Get all active license assignments for this member type
        SELECT ARRAY_AGG(DISTINCT la.user_id) INTO v_member_ids
        FROM license_assignments la
        JOIN license_pools lp ON lp.id = la.license_pool_id
        JOIN organization_subscriptions os ON os.id = lp.organization_subscription_id
        WHERE os.organization_id = NEW.organization_id
            AND lp.member_type = NEW.target_member_type
            AND la.status = 'active';
        
        -- Update target_member_ids
        IF v_member_ids IS NOT NULL AND array_length(v_member_ids, 1) > 0 THEN
            NEW.target_member_ids = v_member_ids;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_populate_target_member_ids
    BEFORE INSERT ON addon_pending_orders
    FOR EACH ROW
    WHEN (NEW.is_bulk_order = TRUE)
    EXECUTE FUNCTION populate_target_member_ids();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Create bulk add-on order for organization
CREATE OR REPLACE FUNCTION create_bulk_addon_order(
    p_organization_id UUID,
    p_addon_plan_ids UUID[],
    p_target_member_type TEXT DEFAULT NULL,
    p_target_member_ids UUID[] DEFAULT NULL,
    p_created_by UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_total_amount DECIMAL := 0;
    v_addon_id UUID;
    v_addon_price DECIMAL;
    v_target_count INTEGER;
BEGIN
    -- Calculate total amount
    FOREACH v_addon_id IN ARRAY p_addon_plan_ids
    LOOP
        SELECT price INTO v_addon_price
        FROM subscription_plans
        WHERE id = v_addon_id;
        
        v_total_amount := v_total_amount + COALESCE(v_addon_price, 0);
    END LOOP;
    
    -- Get target member count
    IF p_target_member_ids IS NOT NULL THEN
        v_target_count := array_length(p_target_member_ids, 1);
    ELSE
        -- Count members of target type
        SELECT COUNT(DISTINCT la.user_id) INTO v_target_count
        FROM license_assignments la
        JOIN license_pools lp ON lp.id = la.license_pool_id
        JOIN organization_subscriptions os ON os.id = lp.organization_subscription_id
        WHERE os.organization_id = p_organization_id
            AND (p_target_member_type IS NULL OR lp.member_type = p_target_member_type)
            AND la.status = 'active';
    END IF;
    
    -- Multiply by target count
    v_total_amount := v_total_amount * v_target_count;
    
    -- Create the order
    INSERT INTO addon_pending_orders (
        organization_id,
        addon_plan_ids,
        target_member_type,
        target_member_ids,
        is_bulk_order,
        amount,
        status,
        created_by
    ) VALUES (
        p_organization_id,
        p_addon_plan_ids,
        p_target_member_type,
        p_target_member_ids,
        TRUE,
        v_total_amount,
        'pending',
        p_created_by
    )
    RETURNING id INTO v_order_id;
    
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get organization bulk add-on orders
CREATE OR REPLACE FUNCTION get_organization_bulk_addon_orders(
    p_organization_id UUID,
    p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
    order_id UUID,
    addon_names TEXT[],
    target_member_type TEXT,
    target_count INTEGER,
    amount DECIMAL,
    status TEXT,
    created_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        apo.id,
        ARRAY_AGG(sp.name) AS addon_names,
        apo.target_member_type,
        COALESCE(array_length(apo.target_member_ids, 1), 0) AS target_count,
        apo.amount,
        apo.status,
        apo.created_at,
        apo.completed_at
    FROM addon_pending_orders apo
    LEFT JOIN LATERAL unnest(apo.addon_plan_ids) AS addon_id ON TRUE
    LEFT JOIN subscription_plans sp ON sp.id = addon_id
    WHERE apo.organization_id = p_organization_id
        AND apo.is_bulk_order = TRUE
        AND (p_status IS NULL OR apo.status = p_status)
    GROUP BY apo.id, apo.target_member_type, apo.amount, apo.status, apo.created_at, apo.completed_at
    ORDER BY apo.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Process bulk add-on order (assign to all targets)
CREATE OR REPLACE FUNCTION process_bulk_addon_order(
    p_order_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_organization_id UUID;
    v_addon_plan_ids UUID[];
    v_target_member_ids UUID[];
    v_user_id UUID;
    v_addon_id UUID;
    v_count INTEGER := 0;
BEGIN
    -- Get order details
    SELECT organization_id, addon_plan_ids, target_member_ids
    INTO v_organization_id, v_addon_plan_ids, v_target_member_ids
    FROM addon_pending_orders
    WHERE id = p_order_id
        AND is_bulk_order = TRUE
        AND status = 'pending';
    
    IF v_organization_id IS NULL THEN
        RAISE EXCEPTION 'Order not found or already processed';
    END IF;
    
    -- Assign add-ons to each target member
    FOREACH v_user_id IN ARRAY v_target_member_ids
    LOOP
        FOREACH v_addon_id IN ARRAY v_addon_plan_ids
        LOOP
            -- Create user entitlement for the add-on
            INSERT INTO user_entitlements (
                user_id,
                subscription_plan_id,
                granted_by_organization,
                start_date,
                end_date,
                status
            ) VALUES (
                v_user_id,
                v_addon_id,
                TRUE,
                NOW(),
                NOW() + INTERVAL '30 days',
                'active'
            )
            ON CONFLICT (user_id, subscription_plan_id) 
            DO UPDATE SET
                status = 'active',
                end_date = GREATEST(user_entitlements.end_date, NOW() + INTERVAL '30 days');
            
            v_count := v_count + 1;
        END LOOP;
    END LOOP;
    
    -- Mark order as completed
    UPDATE addon_pending_orders
    SET 
        status = 'completed',
        completed_at = NOW()
    WHERE id = p_order_id;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Cancel bulk add-on order
CREATE OR REPLACE FUNCTION cancel_bulk_addon_order(
    p_order_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    UPDATE addon_pending_orders
    SET 
        status = 'cancelled',
        metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{cancellation_reason}',
            to_jsonb(p_reason)
        )
    WHERE id = p_order_id
        AND is_bulk_order = TRUE
        AND status = 'pending'
    RETURNING TRUE INTO v_updated;
    
    RETURN COALESCE(v_updated, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATE RLS POLICIES
-- ============================================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS addon_pending_orders_select_own ON addon_pending_orders;
DROP POLICY IF EXISTS addon_pending_orders_insert_own ON addon_pending_orders;

-- Policy: Users can view their own add-on orders
CREATE POLICY addon_pending_orders_select_own ON addon_pending_orders
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR (is_bulk_order = TRUE AND auth.uid() = ANY(target_member_ids))
    );

-- Policy: Organization admins can view organization bulk orders
CREATE POLICY addon_pending_orders_select_org_admin ON addon_pending_orders
    FOR SELECT
    USING (
        is_bulk_order = TRUE
        AND EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
                AND u.role IN ('school_admin', 'college_admin', 'university_admin', 'company_admin')
                AND (
                    (u.school_id::TEXT = organization_id::TEXT) OR
                    (u.college_id::TEXT = organization_id::TEXT) OR
                    (u.university_id::TEXT = organization_id::TEXT) OR
                    (u.company_id::TEXT = organization_id::TEXT)
                )
        )
    );

-- Policy: Users can create their own add-on orders
CREATE POLICY addon_pending_orders_insert_own ON addon_pending_orders
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        OR (is_bulk_order = TRUE AND EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
                AND u.role IN ('school_admin', 'college_admin', 'university_admin', 'company_admin')
        ))
    );

-- Policy: Organization admins can update their bulk orders
CREATE POLICY addon_pending_orders_update_org_admin ON addon_pending_orders
    FOR UPDATE
    USING (
        is_bulk_order = TRUE
        AND EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
                AND u.role IN ('school_admin', 'college_admin', 'university_admin', 'company_admin')
                AND (
                    (u.school_id::TEXT = organization_id::TEXT) OR
                    (u.college_id::TEXT = organization_id::TEXT) OR
                    (u.university_id::TEXT = organization_id::TEXT) OR
                    (u.company_id::TEXT = organization_id::TEXT)
                )
        )
    );

-- Policy: Super admins can view all add-on orders
CREATE POLICY addon_pending_orders_super_admin_all ON addon_pending_orders
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
UPDATE addon_pending_orders
SET is_bulk_order = FALSE
WHERE is_bulk_order IS NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN addon_pending_orders.organization_id IS 'ID of the organization making the bulk add-on purchase';
COMMENT ON COLUMN addon_pending_orders.target_member_type IS 'Type of members to receive the add-ons (school_student, school_educator, etc.)';
COMMENT ON COLUMN addon_pending_orders.target_member_ids IS 'Specific member user IDs to receive the add-ons';
COMMENT ON COLUMN addon_pending_orders.is_bulk_order IS 'Flag indicating if this is an organization bulk add-on order';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION create_bulk_addon_order TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_bulk_addon_orders TO authenticated;
GRANT EXECUTE ON FUNCTION process_bulk_addon_order TO service_role;
GRANT EXECUTE ON FUNCTION cancel_bulk_addon_order TO authenticated;
