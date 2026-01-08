-- Migration: Extend user_entitlements table for organization tracking
-- Description: Add columns to track organization-provided entitlements
-- Author: System
-- Date: 2026-01-08

-- ============================================================================
-- EXTEND USER_ENTITLEMENTS TABLE
-- ============================================================================

-- Add organization tracking columns
ALTER TABLE user_entitlements
ADD COLUMN IF NOT EXISTS granted_by_organization BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS organization_subscription_id UUID REFERENCES organization_subscriptions(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Organization-provided entitlements index
CREATE INDEX IF NOT EXISTS idx_user_entitlements_org_provided 
    ON user_entitlements(user_id, granted_by_organization) 
    WHERE granted_by_organization = TRUE;

-- Organization subscription tracking index
CREATE INDEX IF NOT EXISTS idx_user_entitlements_org_subscription 
    ON user_entitlements(organization_subscription_id, user_id) 
    WHERE organization_subscription_id IS NOT NULL;

-- Granted by tracking index
CREATE INDEX IF NOT EXISTS idx_user_entitlements_granted_by 
    ON user_entitlements(granted_by, created_at DESC) 
    WHERE granted_by IS NOT NULL;

-- Active organization entitlements index
CREATE INDEX IF NOT EXISTS idx_user_entitlements_org_active 
    ON user_entitlements(user_id, status, end_date) 
    WHERE granted_by_organization = TRUE AND status = 'active';

-- ============================================================================
-- CONSTRAINTS
-- ============================================================================

-- Ensure organization entitlements have organization_subscription_id
ALTER TABLE user_entitlements
ADD CONSTRAINT check_org_entitlement_has_subscription
CHECK (
    (granted_by_organization = TRUE AND organization_subscription_id IS NOT NULL) OR
    (granted_by_organization = FALSE)
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Validate organization entitlement data
CREATE OR REPLACE FUNCTION validate_organization_entitlement()
RETURNS TRIGGER AS $$
BEGIN
    -- If this is an organization-provided entitlement
    IF NEW.granted_by_organization = TRUE THEN
        -- Ensure organization_subscription_id is set
        IF NEW.organization_subscription_id IS NULL THEN
            RAISE EXCEPTION 'Organization entitlements must have an organization_subscription_id';
        END IF;
        
        -- Ensure granted_by is set
        IF NEW.granted_by IS NULL THEN
            RAISE EXCEPTION 'Organization entitlements must have a granted_by admin user';
        END IF;
        
        -- Verify the organization subscription exists and is active
        IF NOT EXISTS (
            SELECT 1 FROM organization_subscriptions os
            WHERE os.id = NEW.organization_subscription_id
                AND os.status = 'active'
        ) THEN
            RAISE EXCEPTION 'Organization subscription must be active to grant entitlements';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_organization_entitlement
    BEFORE INSERT OR UPDATE ON user_entitlements
    FOR EACH ROW
    EXECUTE FUNCTION validate_organization_entitlement();

-- Trigger: Sync entitlement dates with organization subscription
CREATE OR REPLACE FUNCTION sync_entitlement_with_org_subscription()
RETURNS TRIGGER AS $$
DECLARE
    v_org_sub_end_date TIMESTAMPTZ;
BEGIN
    -- If this is an organization-provided entitlement
    IF NEW.granted_by_organization = TRUE AND NEW.organization_subscription_id IS NOT NULL THEN
        -- Get the organization subscription end date
        SELECT os.end_date INTO v_org_sub_end_date
        FROM organization_subscriptions os
        WHERE os.id = NEW.organization_subscription_id;
        
        -- Sync the entitlement end date with organization subscription
        IF v_org_sub_end_date IS NOT NULL THEN
            NEW.end_date = v_org_sub_end_date;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_entitlement_dates
    BEFORE INSERT OR UPDATE ON user_entitlements
    FOR EACH ROW
    WHEN (NEW.granted_by_organization = TRUE)
    EXECUTE FUNCTION sync_entitlement_with_org_subscription();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Get user's organization-provided entitlements
CREATE OR REPLACE FUNCTION get_user_organization_entitlements(
    p_user_id UUID
)
RETURNS TABLE (
    entitlement_id UUID,
    feature_name TEXT,
    plan_name TEXT,
    organization_name TEXT,
    granted_by_name TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status TEXT,
    days_until_expiry INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ue.id,
        sp.name AS feature_name,
        sp.name AS plan_name,
        CASE 
            WHEN os.organization_type = 'school' THEN (SELECT name FROM schools WHERE id::TEXT = os.organization_id::TEXT)
            WHEN os.organization_type = 'college' THEN (SELECT name FROM colleges WHERE id::TEXT = os.organization_id::TEXT)
            WHEN os.organization_type = 'university' THEN (SELECT name FROM universities WHERE id::TEXT = os.organization_id::TEXT)
            WHEN os.organization_type = 'company' THEN (SELECT name FROM companies WHERE id::TEXT = os.organization_id::TEXT)
        END AS organization_name,
        u.full_name AS granted_by_name,
        ue.start_date,
        ue.end_date,
        ue.status,
        EXTRACT(DAY FROM (ue.end_date - NOW()))::INTEGER AS days_until_expiry
    FROM user_entitlements ue
    JOIN organization_subscriptions os ON os.id = ue.organization_subscription_id
    JOIN subscription_plans sp ON sp.id = ue.subscription_plan_id
    LEFT JOIN users u ON u.id = ue.granted_by
    WHERE ue.user_id = p_user_id
        AND ue.granted_by_organization = TRUE
    ORDER BY ue.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user's self-purchased entitlements
CREATE OR REPLACE FUNCTION get_user_personal_entitlements(
    p_user_id UUID
)
RETURNS TABLE (
    entitlement_id UUID,
    feature_name TEXT,
    plan_name TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    status TEXT,
    days_until_expiry INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ue.id,
        sp.name AS feature_name,
        sp.name AS plan_name,
        ue.start_date,
        ue.end_date,
        ue.status,
        EXTRACT(DAY FROM (ue.end_date - NOW()))::INTEGER AS days_until_expiry
    FROM user_entitlements ue
    JOIN subscription_plans sp ON sp.id = ue.subscription_plan_id
    WHERE ue.user_id = p_user_id
        AND ue.granted_by_organization = FALSE
    ORDER BY ue.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if user has organization-provided access to feature
CREATE OR REPLACE FUNCTION user_has_org_feature_access(
    p_user_id UUID,
    p_feature_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_access BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM user_entitlements ue
        JOIN subscription_plans sp ON sp.id = ue.subscription_plan_id
        WHERE ue.user_id = p_user_id
            AND ue.granted_by_organization = TRUE
            AND ue.status = 'active'
            AND ue.end_date > NOW()
            AND (
                sp.name = p_feature_name
                OR sp.features @> jsonb_build_array(p_feature_name)
            )
    ) INTO v_has_access;
    
    RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Revoke all organization entitlements for a user
CREATE OR REPLACE FUNCTION revoke_user_organization_entitlements(
    p_user_id UUID,
    p_organization_subscription_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE user_entitlements
    SET 
        status = 'revoked',
        end_date = NOW()
    WHERE user_id = p_user_id
        AND organization_subscription_id = p_organization_subscription_id
        AND granted_by_organization = TRUE
        AND status = 'active'
    RETURNING COUNT(*) INTO v_count;
    
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Bulk grant entitlements to users
CREATE OR REPLACE FUNCTION bulk_grant_organization_entitlements(
    p_user_ids UUID[],
    p_organization_subscription_id UUID,
    p_subscription_plan_id UUID,
    p_granted_by UUID
)
RETURNS INTEGER AS $$
DECLARE
    v_user_id UUID;
    v_count INTEGER := 0;
    v_start_date TIMESTAMPTZ;
    v_end_date TIMESTAMPTZ;
BEGIN
    -- Get subscription dates
    SELECT os.start_date, os.end_date 
    INTO v_start_date, v_end_date
    FROM organization_subscriptions os
    WHERE os.id = p_organization_subscription_id;
    
    -- Grant entitlements to each user
    FOREACH v_user_id IN ARRAY p_user_ids
    LOOP
        INSERT INTO user_entitlements (
            user_id,
            subscription_plan_id,
            granted_by_organization,
            organization_subscription_id,
            granted_by,
            start_date,
            end_date,
            status
        ) VALUES (
            v_user_id,
            p_subscription_plan_id,
            TRUE,
            p_organization_subscription_id,
            p_granted_by,
            v_start_date,
            v_end_date,
            'active'
        )
        ON CONFLICT (user_id, subscription_plan_id, organization_subscription_id) 
        DO UPDATE SET
            status = 'active',
            end_date = EXCLUDED.end_date;
        
        v_count := v_count + 1;
    END LOOP;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- UPDATE RLS POLICIES
-- ============================================================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS user_entitlements_select_own ON user_entitlements;
DROP POLICY IF EXISTS user_entitlements_insert_own ON user_entitlements;

-- Policy: Users can view their own entitlements
CREATE POLICY user_entitlements_select_own ON user_entitlements
    FOR SELECT
    USING (user_id = auth.uid());

-- Policy: Organization admins can view entitlements they granted
CREATE POLICY user_entitlements_select_org_admin ON user_entitlements
    FOR SELECT
    USING (
        granted_by_organization = TRUE
        AND EXISTS (
            SELECT 1 FROM organization_subscriptions os
            JOIN users u ON u.id = auth.uid()
            WHERE os.id = organization_subscription_id
                AND u.role IN ('school_admin', 'college_admin', 'university_admin', 'company_admin')
                AND (
                    (os.organization_type = 'school' AND u.school_id::TEXT = os.organization_id::TEXT) OR
                    (os.organization_type = 'college' AND u.college_id::TEXT = os.organization_id::TEXT) OR
                    (os.organization_type = 'university' AND u.university_id::TEXT = os.organization_id::TEXT) OR
                    (os.organization_type = 'company' AND u.company_id::TEXT = os.organization_id::TEXT)
                )
        )
    );

-- Policy: System can create entitlements (via service role)
CREATE POLICY user_entitlements_insert_system ON user_entitlements
    FOR INSERT
    WITH CHECK (TRUE);

-- Policy: Organization admins can update entitlements they granted
CREATE POLICY user_entitlements_update_org_admin ON user_entitlements
    FOR UPDATE
    USING (
        granted_by_organization = TRUE
        AND granted_by = auth.uid()
    );

-- Policy: Super admins can view all entitlements
CREATE POLICY user_entitlements_super_admin_all ON user_entitlements
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
UPDATE user_entitlements
SET granted_by_organization = FALSE
WHERE granted_by_organization IS NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN user_entitlements.granted_by_organization IS 'Flag indicating if this entitlement was provided by an organization';
COMMENT ON COLUMN user_entitlements.organization_subscription_id IS 'Reference to the organization subscription that granted this entitlement';
COMMENT ON COLUMN user_entitlements.granted_by IS 'Admin user who granted this entitlement on behalf of the organization';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_user_organization_entitlements TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_personal_entitlements TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_org_feature_access TO authenticated;
GRANT EXECUTE ON FUNCTION revoke_user_organization_entitlements TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_grant_organization_entitlements TO service_role;
