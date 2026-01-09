-- Migration: Create organization_invitations table
-- Description: Manages invitations sent by organization admins to members
-- Author: System
-- Date: 2026-01-08

-- ============================================================================
-- TABLE: organization_invitations
-- ============================================================================
-- Purpose: Track invitations sent to users to join organizations with specific licenses
-- Features:
--   - Email-based invitations with unique tokens
--   - Expiration tracking (default 7 days)
--   - Status tracking (pending, accepted, expired, cancelled)
--   - License type and add-on specifications
--   - Automatic cleanup of expired invitations
--   - Audit trail for invitation lifecycle

CREATE TABLE IF NOT EXISTS organization_invitations (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Organization Reference
    organization_id UUID NOT NULL,
    organization_type TEXT NOT NULL CHECK (organization_type IN ('school', 'college', 'university', 'company')),
    
    -- Inviter Information
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_by_role TEXT NOT NULL CHECK (invited_by_role IN ('school_admin', 'college_admin', 'university_admin', 'company_admin')),
    
    -- Invitee Information
    invitee_email TEXT NOT NULL,
    invitee_name TEXT,
    invitee_role TEXT NOT NULL CHECK (invitee_role IN (
        'school_student', 'school_educator', 'school_admin',
        'college_student', 'college_educator', 'college_admin',
        'university_admin', 'recruiter', 'company_admin'
    )),
    
    -- License Assignment Details
    license_pool_id UUID REFERENCES license_pools(id) ON DELETE SET NULL,
    subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    addon_ids UUID[] DEFAULT '{}',
    
    -- Invitation Token & Security
    invitation_token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    
    -- Status & Lifecycle
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    accepted_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Metadata
    invitation_message TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Audit Trail
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    cancelled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    cancellation_reason TEXT,
    
    -- Constraints
    CONSTRAINT valid_expiration CHECK (expires_at > created_at),
    CONSTRAINT accepted_requires_user CHECK (
        (status = 'accepted' AND accepted_at IS NOT NULL AND accepted_by_user_id IS NOT NULL) OR
        (status != 'accepted')
    ),
    CONSTRAINT cancelled_requires_info CHECK (
        (status = 'cancelled' AND cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL) OR
        (status != 'cancelled')
    )
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Primary lookup indexes
CREATE INDEX idx_org_invitations_organization 
    ON organization_invitations(organization_id, organization_type);

CREATE INDEX idx_org_invitations_email 
    ON organization_invitations(invitee_email) 
    WHERE status = 'pending';

CREATE INDEX idx_org_invitations_token 
    ON organization_invitations(invitation_token) 
    WHERE status = 'pending';

-- Status and lifecycle indexes
CREATE INDEX idx_org_invitations_status 
    ON organization_invitations(status, expires_at);

CREATE INDEX idx_org_invitations_pending_active 
    ON organization_invitations(organization_id, status, expires_at) 
    WHERE status = 'pending' AND expires_at > NOW();

-- Inviter tracking
CREATE INDEX idx_org_invitations_invited_by 
    ON organization_invitations(invited_by, created_at DESC);

-- License pool tracking
CREATE INDEX idx_org_invitations_license_pool 
    ON organization_invitations(license_pool_id) 
    WHERE license_pool_id IS NOT NULL AND status = 'pending';

-- Expiration cleanup index
CREATE INDEX idx_org_invitations_expired 
    ON organization_invitations(expires_at) 
    WHERE status = 'pending' AND expires_at < NOW();

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organization_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_organization_invitations_timestamp
    BEFORE UPDATE ON organization_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_organization_invitations_updated_at();

-- Trigger: Auto-expire invitations
CREATE OR REPLACE FUNCTION auto_expire_invitations()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'pending' AND NEW.expires_at <= NOW() THEN
        NEW.status = 'expired';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_expire_invitations
    BEFORE INSERT OR UPDATE ON organization_invitations
    FOR EACH ROW
    EXECUTE FUNCTION auto_expire_invitations();

-- Trigger: Validate invitation acceptance
CREATE OR REPLACE FUNCTION validate_invitation_acceptance()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if invitation is still valid
    IF NEW.status = 'accepted' THEN
        IF OLD.status != 'pending' THEN
            RAISE EXCEPTION 'Only pending invitations can be accepted';
        END IF;
        
        IF OLD.expires_at <= NOW() THEN
            RAISE EXCEPTION 'Invitation has expired';
        END IF;
        
        -- Set acceptance timestamp if not already set
        IF NEW.accepted_at IS NULL THEN
            NEW.accepted_at = NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_invitation_acceptance
    BEFORE UPDATE ON organization_invitations
    FOR EACH ROW
    WHEN (NEW.status = 'accepted')
    EXECUTE FUNCTION validate_invitation_acceptance();

-- Trigger: Prevent duplicate pending invitations
CREATE OR REPLACE FUNCTION prevent_duplicate_invitations()
RETURNS TRIGGER AS $$
DECLARE
    existing_count INTEGER;
BEGIN
    -- Check for existing pending invitations for same email in same organization
    SELECT COUNT(*) INTO existing_count
    FROM organization_invitations
    WHERE organization_id = NEW.organization_id
        AND organization_type = NEW.organization_type
        AND invitee_email = NEW.invitee_email
        AND status = 'pending'
        AND expires_at > NOW()
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
    
    IF existing_count > 0 THEN
        RAISE EXCEPTION 'An active invitation already exists for this email in this organization';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_duplicate_invitations
    BEFORE INSERT OR UPDATE ON organization_invitations
    FOR EACH ROW
    WHEN (NEW.status = 'pending')
    EXECUTE FUNCTION prevent_duplicate_invitations();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Organization admins can view all invitations for their organization
CREATE POLICY org_invitations_admin_select ON organization_invitations
    FOR SELECT
    USING (
        EXISTS (
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

-- Policy: Organization admins can create invitations for their organization
CREATE POLICY org_invitations_admin_insert ON organization_invitations
    FOR INSERT
    WITH CHECK (
        invited_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
                AND u.role = invited_by_role
                AND (
                    (organization_type = 'school' AND u.school_id::TEXT = organization_id::TEXT) OR
                    (organization_type = 'college' AND u.college_id::TEXT = organization_id::TEXT) OR
                    (organization_type = 'university' AND u.university_id::TEXT = organization_id::TEXT) OR
                    (organization_type = 'company' AND u.company_id::TEXT = organization_id::TEXT)
                )
        )
    );

-- Policy: Organization admins can update invitations they created
CREATE POLICY org_invitations_admin_update ON organization_invitations
    FOR UPDATE
    USING (
        invited_by = auth.uid()
        OR EXISTS (
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

-- Policy: Invitees can view their own pending invitations by email
CREATE POLICY org_invitations_invitee_select ON organization_invitations
    FOR SELECT
    USING (
        status = 'pending'
        AND expires_at > NOW()
        AND EXISTS (
            SELECT 1 FROM auth.users au
            WHERE au.id = auth.uid()
                AND au.email = invitee_email
        )
    );

-- Policy: Invitees can accept their own invitations
CREATE POLICY org_invitations_invitee_accept ON organization_invitations
    FOR UPDATE
    USING (
        status = 'pending'
        AND expires_at > NOW()
        AND EXISTS (
            SELECT 1 FROM auth.users au
            WHERE au.id = auth.uid()
                AND au.email = invitee_email
        )
    )
    WITH CHECK (
        status = 'accepted'
        AND accepted_by_user_id = auth.uid()
    );

-- Policy: Super admins can view all invitations
CREATE POLICY org_invitations_super_admin_all ON organization_invitations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid()
                AND u.role = 'super_admin'
        )
    );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function: Get active invitations for an organization
CREATE OR REPLACE FUNCTION get_active_invitations(
    p_organization_id UUID,
    p_organization_type TEXT
)
RETURNS TABLE (
    invitation_id UUID,
    invitee_email TEXT,
    invitee_name TEXT,
    invitee_role TEXT,
    plan_name TEXT,
    addon_count INTEGER,
    invited_by_name TEXT,
    created_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    days_until_expiry INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        oi.id,
        oi.invitee_email,
        oi.invitee_name,
        oi.invitee_role,
        sp.name,
        COALESCE(array_length(oi.addon_ids, 1), 0),
        u.full_name,
        oi.created_at,
        oi.expires_at,
        EXTRACT(DAY FROM (oi.expires_at - NOW()))::INTEGER
    FROM organization_invitations oi
    JOIN subscription_plans sp ON sp.id = oi.subscription_plan_id
    JOIN users u ON u.id = oi.invited_by
    WHERE oi.organization_id = p_organization_id
        AND oi.organization_type = p_organization_type
        AND oi.status = 'pending'
        AND oi.expires_at > NOW()
    ORDER BY oi.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Cancel invitation
CREATE OR REPLACE FUNCTION cancel_invitation(
    p_invitation_id UUID,
    p_cancelled_by UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    UPDATE organization_invitations
    SET 
        status = 'cancelled',
        cancelled_at = NOW(),
        cancelled_by = p_cancelled_by,
        cancellation_reason = p_reason
    WHERE id = p_invitation_id
        AND status = 'pending'
    RETURNING TRUE INTO v_updated;
    
    RETURN COALESCE(v_updated, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Resend invitation (extends expiration)
CREATE OR REPLACE FUNCTION resend_invitation(
    p_invitation_id UUID,
    p_extension_days INTEGER DEFAULT 7
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    UPDATE organization_invitations
    SET 
        expires_at = NOW() + (p_extension_days || ' days')::INTERVAL,
        invitation_token = encode(gen_random_bytes(32), 'hex')
    WHERE id = p_invitation_id
        AND status = 'pending'
    RETURNING TRUE INTO v_updated;
    
    RETURN COALESCE(v_updated, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SCHEDULED CLEANUP
-- ============================================================================

-- Function: Cleanup expired invitations (run daily via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE organization_invitations
    SET status = 'expired'
    WHERE status = 'pending'
        AND expires_at <= NOW()
    RETURNING COUNT(*) INTO v_count;
    
    RETURN COALESCE(v_count, 0);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE organization_invitations IS 'Manages invitations sent by organization admins to members for license assignment';
COMMENT ON COLUMN organization_invitations.invitation_token IS 'Unique token for accepting invitation via email link';
COMMENT ON COLUMN organization_invitations.expires_at IS 'Invitation expiration timestamp (default 7 days from creation)';
COMMENT ON COLUMN organization_invitations.addon_ids IS 'Array of add-on subscription plan IDs to be assigned with the license';
COMMENT ON COLUMN organization_invitations.metadata IS 'Additional invitation metadata (welcome message, custom fields, etc.)';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant access to authenticated users (RLS policies will control actual access)
GRANT SELECT, INSERT, UPDATE ON organization_invitations TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_invitations TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION resend_invitation TO authenticated;

-- Grant cleanup function to service role only
GRANT EXECUTE ON FUNCTION cleanup_expired_invitations TO service_role;
