-- =====================================================
-- Organization-Level Recruitment Dashboard
-- Option 3: Cross-Database Architecture (FDW)
-- Migration Script
-- =====================================================
-- 
-- This migration implements multi-tenant recruitment features using
-- Foreign Data Wrapper (FDW) to query SSO-Worker database for membership
-- and role data, avoiding duplication and maintaining single source of truth.
--
-- ARCHITECTURE:
-- - SSO-Worker DB: Contains memberships, roles, membership_roles (auth/authz)
-- - SkillPassport DB: Contains application data, queries SSO-Worker via FDW
-- - Only 1 NEW table: recruitment_role_mapping
-- - Existing tables modified: organizations, requisitions, opportunities, pipeline_candidates
-- - Existing tables reused: organization_invitations, organization_subscriptions
--
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Setup Foreign Data Wrapper (FDW)
-- =====================================================

-- Create postgres_fdw extension if not exists
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- Create foreign server connection to SSO-Worker database
-- NOTE: Replace connection details with actual SSO-Worker database credentials
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_foreign_server WHERE srvname = 'sso_worker_server'
    ) THEN
        CREATE SERVER sso_worker_server
        FOREIGN DATA WRAPPER postgres_fdw
        OPTIONS (
            host 'host.docker.internal',  -- Replace with actual SSO-Worker host
            port '54332',       -- Replace with actual SSO-Worker port
            dbname 'postgres' -- Replace with actual SSO-Worker database name
        );
    END IF;
END $$;

-- Create user mapping for foreign server
-- NOTE: Replace with actual SSO-Worker database credentials
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_user_mappings 
        WHERE srvname = 'sso_worker_server' 
        AND usename = current_user
    ) THEN
        CREATE USER MAPPING FOR current_user
        SERVER sso_worker_server
        OPTIONS (
            user 'postgres',     -- Replace with actual SSO-Worker username
            password 'postgres'  -- Replace with actual SSO-Worker password
        );
    END IF;
END $$;

-- Create schema for foreign tables
CREATE SCHEMA IF NOT EXISTS sso_foreign;

-- =====================================================
-- STEP 2: Import Foreign Tables from SSO-Worker
-- =====================================================

-- Import organizations table from SSO-Worker
DROP FOREIGN TABLE IF EXISTS sso_foreign.organizations CASCADE;
CREATE FOREIGN TABLE sso_foreign.organizations (
    id UUID NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_by UUID,
    metadata JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
)
SERVER sso_worker_server
OPTIONS (schema_name 'public', table_name 'organizations');

-- Import users table from SSO-Worker
DROP FOREIGN TABLE IF EXISTS sso_foreign.users CASCADE;
CREATE FOREIGN TABLE sso_foreign.users (
    id UUID NOT NULL,
    email TEXT NOT NULL,
    password_hash TEXT,
    is_email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    is_blocked BOOLEAN DEFAULT FALSE
)
SERVER sso_worker_server
OPTIONS (schema_name 'public', table_name 'users');

-- Import memberships table from SSO-Worker
DROP FOREIGN TABLE IF EXISTS sso_foreign.memberships CASCADE;
CREATE FOREIGN TABLE sso_foreign.memberships (
    id UUID NOT NULL,
    user_id UUID NOT NULL,
    org_id UUID NOT NULL,
    status TEXT NOT NULL, -- active, inactive, suspended, expired
    created_at TIMESTAMPTZ DEFAULT NOW()
)
SERVER sso_worker_server
OPTIONS (schema_name 'public', table_name 'memberships');

-- Import roles table from SSO-Worker
DROP FOREIGN TABLE IF EXISTS sso_foreign.roles CASCADE;
CREATE FOREIGN TABLE sso_foreign.roles (
    id UUID NOT NULL,
    name TEXT NOT NULL, -- owner, admin, member
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
)
SERVER sso_worker_server
OPTIONS (schema_name 'public', table_name 'roles');

-- Import membership_roles table from SSO-Worker
DROP FOREIGN TABLE IF EXISTS sso_foreign.membership_roles CASCADE;
CREATE FOREIGN TABLE sso_foreign.membership_roles (
    id UUID NOT NULL,
    membership_id UUID NOT NULL,
    role_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
)
SERVER sso_worker_server
OPTIONS (schema_name 'public', table_name 'membership_roles');

-- =====================================================
-- STEP 3: Create NEW Table - recruitment_role_mapping
-- =====================================================

CREATE TABLE IF NOT EXISTS public.recruitment_role_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sso_role_name TEXT NOT NULL, -- Maps to SSO role name (owner, admin, member)
    recruitment_role TEXT NOT NULL, -- company_admin, recruiter, viewer
    can_manage_team BOOLEAN DEFAULT FALSE,
    can_create_jobs BOOLEAN DEFAULT FALSE,
    can_edit_jobs BOOLEAN DEFAULT FALSE,
    can_delete_jobs BOOLEAN DEFAULT FALSE,
    can_view_candidates BOOLEAN DEFAULT FALSE,
    can_manage_candidates BOOLEAN DEFAULT FALSE,
    can_view_analytics BOOLEAN DEFAULT FALSE,
    permissions JSONB DEFAULT '{}'::JSONB, -- Additional flexible permissions
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT recruitment_role_mapping_sso_role_check 
        CHECK (sso_role_name IN ('owner', 'admin', 'member')),
    CONSTRAINT recruitment_role_mapping_recruitment_role_check 
        CHECK (recruitment_role IN ('company_admin', 'recruiter', 'viewer')),
    CONSTRAINT recruitment_role_mapping_unique_sso_role 
        UNIQUE (sso_role_name)
);

COMMENT ON TABLE public.recruitment_role_mapping IS 
'Maps SSO-Worker roles to recruitment-specific roles and permissions';

-- Insert default role mappings
INSERT INTO public.recruitment_role_mapping 
    (sso_role_name, recruitment_role, can_manage_team, can_create_jobs, can_edit_jobs, 
     can_delete_jobs, can_view_candidates, can_manage_candidates, can_view_analytics, description)
VALUES
    ('owner', 'company_admin', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 
     'Organization owner - full recruitment access'),
    ('admin', 'company_admin', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, 
     'Organization admin - full recruitment access'),
    ('member', 'recruiter', FALSE, TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, 
     'Organization member - recruiter access')
ON CONFLICT (sso_role_name) DO NOTHING;

-- =====================================================
-- STEP 4: Modify Existing Tables - Add Organization Scoping
-- =====================================================

-- Add columns to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS recruitment_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS max_recruiters INTEGER DEFAULT 10;

COMMENT ON COLUMN public.organizations.recruitment_enabled IS 
'Enable/disable recruitment features for this organization';

COMMENT ON COLUMN public.organizations.max_recruiters IS 
'Maximum number of recruiters allowed for this organization';

-- Add columns to requisitions table
ALTER TABLE public.requisitions 
ADD COLUMN IF NOT EXISTS organization_id UUID;

ALTER TABLE public.requisitions 
ADD COLUMN IF NOT EXISTS created_by_uuid UUID;

ALTER TABLE public.requisitions 
ADD COLUMN IF NOT EXISTS assigned_to UUID;

ALTER TABLE public.requisitions 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';

-- Add foreign key constraints for requisitions
ALTER TABLE public.requisitions 
ADD CONSTRAINT requisitions_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.requisitions 
ADD CONSTRAINT requisitions_created_by_uuid_fkey 
FOREIGN KEY (created_by_uuid) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.requisitions 
ADD CONSTRAINT requisitions_assigned_to_fkey 
FOREIGN KEY (assigned_to) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.requisitions 
ADD CONSTRAINT requisitions_approval_status_check 
CHECK (approval_status IN ('pending', 'approved', 'rejected'));

COMMENT ON COLUMN public.requisitions.organization_id IS 
'Organization that owns this job requisition';

COMMENT ON COLUMN public.requisitions.created_by_uuid IS 
'User who created this requisition';

COMMENT ON COLUMN public.requisitions.assigned_to IS 
'Recruiter assigned to this requisition';

COMMENT ON COLUMN public.requisitions.approval_status IS 
'Approval status for requisition';

-- Add columns to opportunities table
ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS organization_id UUID;

ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS created_by_uuid UUID;

-- Add foreign key constraints for opportunities
ALTER TABLE public.opportunities 
ADD CONSTRAINT opportunities_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.opportunities 
ADD CONSTRAINT opportunities_created_by_uuid_fkey 
FOREIGN KEY (created_by_uuid) REFERENCES public.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.opportunities.organization_id IS 
'Organization that posted this opportunity';

COMMENT ON COLUMN public.opportunities.created_by_uuid IS 
'User who created this opportunity';

-- Add columns to pipeline_candidates table
ALTER TABLE public.pipeline_candidates 
ADD COLUMN IF NOT EXISTS organization_id UUID;

ALTER TABLE public.pipeline_candidates 
ADD COLUMN IF NOT EXISTS assigned_to_uuid UUID;

ALTER TABLE public.pipeline_candidates 
ADD COLUMN IF NOT EXISTS added_by_uuid UUID;

-- Add foreign key constraints for pipeline_candidates
ALTER TABLE public.pipeline_candidates 
ADD CONSTRAINT pipeline_candidates_organization_id_fkey 
FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.pipeline_candidates 
ADD CONSTRAINT pipeline_candidates_assigned_to_uuid_fkey 
FOREIGN KEY (assigned_to_uuid) REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.pipeline_candidates 
ADD CONSTRAINT pipeline_candidates_added_by_uuid_fkey 
FOREIGN KEY (added_by_uuid) REFERENCES public.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.pipeline_candidates.organization_id IS 
'Organization managing this candidate';

COMMENT ON COLUMN public.pipeline_candidates.assigned_to_uuid IS 
'Recruiter assigned to this candidate';

COMMENT ON COLUMN public.pipeline_candidates.added_by_uuid IS 
'User who added this candidate to pipeline';

-- =====================================================
-- STEP 5: Create Helper Functions for FDW Queries
-- =====================================================

-- Function: Check if user is member of organization
CREATE OR REPLACE FUNCTION public.is_org_member(
    p_user_id UUID,
    p_org_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM sso_foreign.memberships m
        WHERE m.user_id = p_user_id
        AND m.org_id = p_org_id
        AND m.status = 'active'
    );
END;
$$;

COMMENT ON FUNCTION public.is_org_member IS 
'Check if user is an active member of organization via SSO-Worker FDW';

-- Function: Get user's recruitment roles in organization
CREATE OR REPLACE FUNCTION public.get_user_recruitment_roles(
    p_user_id UUID,
    p_org_id UUID
)
RETURNS TABLE (
    sso_role_name TEXT,
    recruitment_role TEXT,
    can_manage_team BOOLEAN,
    can_create_jobs BOOLEAN,
    can_edit_jobs BOOLEAN,
    can_delete_jobs BOOLEAN,
    can_view_candidates BOOLEAN,
    can_manage_candidates BOOLEAN,
    can_view_analytics BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.name AS sso_role_name,
        rrm.recruitment_role,
        rrm.can_manage_team,
        rrm.can_create_jobs,
        rrm.can_edit_jobs,
        rrm.can_delete_jobs,
        rrm.can_view_candidates,
        rrm.can_manage_candidates,
        rrm.can_view_analytics
    FROM sso_foreign.memberships m
    JOIN sso_foreign.membership_roles mr ON mr.membership_id = m.id
    JOIN sso_foreign.roles r ON r.id = mr.role_id
    JOIN public.recruitment_role_mapping rrm ON rrm.sso_role_name = r.name
    WHERE m.user_id = p_user_id
    AND m.org_id = p_org_id
    AND m.status = 'active';
END;
$$;

COMMENT ON FUNCTION public.get_user_recruitment_roles IS 
'Get user recruitment roles and permissions for an organization via SSO-Worker FDW';

-- Function: Check if user has specific recruitment permission
CREATE OR REPLACE FUNCTION public.has_recruitment_permission(
    p_user_id UUID,
    p_org_id UUID,
    p_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    v_has_permission BOOLEAN := FALSE;
BEGIN
    -- Check permission based on role mapping
    SELECT 
        CASE p_permission
            WHEN 'manage_team' THEN rrm.can_manage_team
            WHEN 'create_jobs' THEN rrm.can_create_jobs
            WHEN 'edit_jobs' THEN rrm.can_edit_jobs
            WHEN 'delete_jobs' THEN rrm.can_delete_jobs
            WHEN 'view_candidates' THEN rrm.can_view_candidates
            WHEN 'manage_candidates' THEN rrm.can_manage_candidates
            WHEN 'view_analytics' THEN rrm.can_view_analytics
            ELSE FALSE
        END INTO v_has_permission
    FROM sso_foreign.memberships m
    JOIN sso_foreign.membership_roles mr ON mr.membership_id = m.id
    JOIN sso_foreign.roles r ON r.id = mr.role_id
    JOIN public.recruitment_role_mapping rrm ON rrm.sso_role_name = r.name
    WHERE m.user_id = p_user_id
    AND m.org_id = p_org_id
    AND m.status = 'active'
    LIMIT 1;
    
    RETURN COALESCE(v_has_permission, FALSE);
END;
$$;

COMMENT ON FUNCTION public.has_recruitment_permission IS 
'Check if user has specific recruitment permission in organization';

-- Function: Get user's organization context
CREATE OR REPLACE FUNCTION public.get_user_org_context(
    p_user_id UUID
)
RETURNS TABLE (
    org_id UUID,
    org_name TEXT,
    org_slug TEXT,
    membership_status TEXT,
    sso_role_name TEXT,
    recruitment_role TEXT,
    recruitment_enabled BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id AS org_id,
        so.name AS org_name,
        so.slug AS org_slug,
        m.status AS membership_status,
        r.name AS sso_role_name,
        rrm.recruitment_role,
        o.recruitment_enabled
    FROM sso_foreign.memberships m
    JOIN sso_foreign.organizations so ON so.id = m.org_id
    JOIN public.organizations o ON o.id = m.org_id
    JOIN sso_foreign.membership_roles mr ON mr.membership_id = m.id
    JOIN sso_foreign.roles r ON r.id = mr.role_id
    LEFT JOIN public.recruitment_role_mapping rrm ON rrm.sso_role_name = r.name
    WHERE m.user_id = p_user_id
    AND m.status = 'active';
END;
$$;

COMMENT ON FUNCTION public.get_user_org_context IS 
'Get all organizations user belongs to with their roles and recruitment status';

-- =====================================================
-- STEP 6: Create RLS Policies for Multi-Tenancy
-- =====================================================

-- Enable RLS on tables
ALTER TABLE public.requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_candidates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS requisitions_org_isolation ON public.requisitions;
DROP POLICY IF EXISTS requisitions_insert_policy ON public.requisitions;
DROP POLICY IF EXISTS requisitions_update_policy ON public.requisitions;
DROP POLICY IF EXISTS requisitions_delete_policy ON public.requisitions;

DROP POLICY IF EXISTS opportunities_org_isolation ON public.opportunities;
DROP POLICY IF EXISTS opportunities_insert_policy ON public.opportunities;
DROP POLICY IF EXISTS opportunities_update_policy ON public.opportunities;
DROP POLICY IF EXISTS opportunities_delete_policy ON public.opportunities;

DROP POLICY IF EXISTS pipeline_candidates_org_isolation ON public.pipeline_candidates;
DROP POLICY IF EXISTS pipeline_candidates_insert_policy ON public.pipeline_candidates;
DROP POLICY IF EXISTS pipeline_candidates_update_policy ON public.pipeline_candidates;
DROP POLICY IF EXISTS pipeline_candidates_delete_policy ON public.pipeline_candidates;

-- RLS Policies for requisitions
CREATE POLICY requisitions_org_isolation ON public.requisitions
    FOR SELECT
    USING (
        organization_id IS NULL -- Allow access to non-org requisitions (backward compatibility)
        OR public.is_org_member(auth.uid(), organization_id)
    );

CREATE POLICY requisitions_insert_policy ON public.requisitions
    FOR INSERT
    WITH CHECK (
        organization_id IS NULL -- Allow creating non-org requisitions
        OR public.has_recruitment_permission(auth.uid(), organization_id, 'create_jobs')
    );

CREATE POLICY requisitions_update_policy ON public.requisitions
    FOR UPDATE
    USING (
        organization_id IS NULL
        OR public.has_recruitment_permission(auth.uid(), organization_id, 'edit_jobs')
    );

CREATE POLICY requisitions_delete_policy ON public.requisitions
    FOR DELETE
    USING (
        organization_id IS NULL
        OR public.has_recruitment_permission(auth.uid(), organization_id, 'delete_jobs')
    );

-- RLS Policies for opportunities
CREATE POLICY opportunities_org_isolation ON public.opportunities
    FOR SELECT
    USING (
        organization_id IS NULL
        OR public.is_org_member(auth.uid(), organization_id)
    );

CREATE POLICY opportunities_insert_policy ON public.opportunities
    FOR INSERT
    WITH CHECK (
        organization_id IS NULL
        OR public.has_recruitment_permission(auth.uid(), organization_id, 'create_jobs')
    );

CREATE POLICY opportunities_update_policy ON public.opportunities
    FOR UPDATE
    USING (
        organization_id IS NULL
        OR public.has_recruitment_permission(auth.uid(), organization_id, 'edit_jobs')
    );

CREATE POLICY opportunities_delete_policy ON public.opportunities
    FOR DELETE
    USING (
        organization_id IS NULL
        OR public.has_recruitment_permission(auth.uid(), organization_id, 'delete_jobs')
    );

-- RLS Policies for pipeline_candidates
CREATE POLICY pipeline_candidates_org_isolation ON public.pipeline_candidates
    FOR SELECT
    USING (
        organization_id IS NULL
        OR public.has_recruitment_permission(auth.uid(), organization_id, 'view_candidates')
    );

CREATE POLICY pipeline_candidates_insert_policy ON public.pipeline_candidates
    FOR INSERT
    WITH CHECK (
        organization_id IS NULL
        OR public.has_recruitment_permission(auth.uid(), organization_id, 'manage_candidates')
    );

CREATE POLICY pipeline_candidates_update_policy ON public.pipeline_candidates
    FOR UPDATE
    USING (
        organization_id IS NULL
        OR public.has_recruitment_permission(auth.uid(), organization_id, 'manage_candidates')
    );

CREATE POLICY pipeline_candidates_delete_policy ON public.pipeline_candidates
    FOR DELETE
    USING (
        organization_id IS NULL
        OR public.has_recruitment_permission(auth.uid(), organization_id, 'manage_candidates')
    );

-- =====================================================
-- STEP 7: Create Indexes for Performance
-- =====================================================

-- Indexes for requisitions
CREATE INDEX IF NOT EXISTS idx_requisitions_organization_id 
    ON public.requisitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_requisitions_created_by_uuid 
    ON public.requisitions(created_by_uuid);
CREATE INDEX IF NOT EXISTS idx_requisitions_assigned_to 
    ON public.requisitions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_requisitions_status 
    ON public.requisitions(status);
CREATE INDEX IF NOT EXISTS idx_requisitions_approval_status 
    ON public.requisitions(approval_status);

-- Indexes for opportunities
CREATE INDEX IF NOT EXISTS idx_opportunities_organization_id 
    ON public.opportunities(organization_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_by_uuid 
    ON public.opportunities(created_by_uuid);
CREATE INDEX IF NOT EXISTS idx_opportunities_requisition_id_uuid 
    ON public.opportunities(requisition_id_uuid);
CREATE INDEX IF NOT EXISTS idx_opportunities_status 
    ON public.opportunities(status);

-- Indexes for pipeline_candidates
CREATE INDEX IF NOT EXISTS idx_pipeline_candidates_organization_id 
    ON public.pipeline_candidates(organization_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_candidates_assigned_to_uuid 
    ON public.pipeline_candidates(assigned_to_uuid);
CREATE INDEX IF NOT EXISTS idx_pipeline_candidates_added_by_uuid 
    ON public.pipeline_candidates(added_by_uuid);
CREATE INDEX IF NOT EXISTS idx_pipeline_candidates_learner_id 
    ON public.pipeline_candidates(learner_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_candidates_stage 
    ON public.pipeline_candidates(stage);
CREATE INDEX IF NOT EXISTS idx_pipeline_candidates_status 
    ON public.pipeline_candidates(status);

-- Indexes for recruitment_role_mapping
CREATE INDEX IF NOT EXISTS idx_recruitment_role_mapping_sso_role_name 
    ON public.recruitment_role_mapping(sso_role_name);
CREATE INDEX IF NOT EXISTS idx_recruitment_role_mapping_recruitment_role 
    ON public.recruitment_role_mapping(recruitment_role);

-- =====================================================
-- STEP 8: Create Triggers for Updated_at Timestamps
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger for recruitment_role_mapping
DROP TRIGGER IF EXISTS update_recruitment_role_mapping_updated_at ON public.recruitment_role_mapping;
CREATE TRIGGER update_recruitment_role_mapping_updated_at
    BEFORE UPDATE ON public.recruitment_role_mapping
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- STEP 9: Grant Permissions
-- =====================================================

-- Grant usage on foreign schema
GRANT USAGE ON SCHEMA sso_foreign TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA sso_foreign TO authenticated;

-- Grant permissions on recruitment_role_mapping
GRANT SELECT ON public.recruitment_role_mapping TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.recruitment_role_mapping TO service_role;

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION public.is_org_member TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_recruitment_roles TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_recruitment_permission TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_org_context TO authenticated;

COMMIT;

-- =====================================================
-- Migration Complete
-- =====================================================
-- 
-- NEXT STEPS:
-- 1. Update FDW connection details (host, port, dbname, user, password)
-- 2. Verify foreign tables are accessible
-- 3. Test helper functions with actual user/org data
-- 4. Run test suite to verify RLS policies
-- 5. Update frontend to use new organization context
-- 6. Migrate existing data to add organization_id where needed
--
-- =====================================================
