-- =====================================================
-- Organization-Level Recruitment Dashboard
-- Option 3: Cross-Database Architecture (FDW)
-- ROLLBACK Migration Script
-- =====================================================

BEGIN;

-- =====================================================
-- STEP 1: Drop RLS Policies
-- =====================================================

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

-- Disable RLS
ALTER TABLE public.requisitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_candidates DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Drop Indexes
-- =====================================================

DROP INDEX IF EXISTS idx_requisitions_organization_id;
DROP INDEX IF EXISTS idx_requisitions_created_by_uuid;
DROP INDEX IF EXISTS idx_requisitions_assigned_to;
DROP INDEX IF EXISTS idx_requisitions_approval_status;

DROP INDEX IF EXISTS idx_opportunities_organization_id;
DROP INDEX IF EXISTS idx_opportunities_created_by_uuid;

DROP INDEX IF EXISTS idx_pipeline_candidates_organization_id;
DROP INDEX IF EXISTS idx_pipeline_candidates_assigned_to_uuid;
DROP INDEX IF EXISTS idx_pipeline_candidates_added_by_uuid;

DROP INDEX IF EXISTS idx_recruitment_role_mapping_sso_role_name;
DROP INDEX IF EXISTS idx_recruitment_role_mapping_recruitment_role;

-- =====================================================
-- STEP 3: Drop Helper Functions
-- =====================================================

DROP FUNCTION IF EXISTS public.get_user_org_context;
DROP FUNCTION IF EXISTS public.has_recruitment_permission;
DROP FUNCTION IF EXISTS public.get_user_recruitment_roles;
DROP FUNCTION IF EXISTS public.is_org_member;

-- =====================================================
-- STEP 4: Remove Columns from Existing Tables
-- =====================================================

-- Remove columns from pipeline_candidates
ALTER TABLE public.pipeline_candidates 
DROP COLUMN IF EXISTS added_by_uuid;

ALTER TABLE public.pipeline_candidates 
DROP COLUMN IF EXISTS assigned_to_uuid;

ALTER TABLE public.pipeline_candidates 
DROP COLUMN IF EXISTS organization_id;

-- Remove columns from opportunities
ALTER TABLE public.opportunities 
DROP COLUMN IF EXISTS created_by_uuid;

ALTER TABLE public.opportunities 
DROP COLUMN IF EXISTS organization_id;

-- Remove columns from requisitions
ALTER TABLE public.requisitions 
DROP COLUMN IF EXISTS approval_status;

ALTER TABLE public.requisitions 
DROP COLUMN IF EXISTS assigned_to;

ALTER TABLE public.requisitions 
DROP COLUMN IF EXISTS created_by_uuid;

ALTER TABLE public.requisitions 
DROP COLUMN IF EXISTS organization_id;

-- Remove columns from organizations
ALTER TABLE public.organizations 
DROP COLUMN IF EXISTS max_recruiters;

ALTER TABLE public.organizations 
DROP COLUMN IF EXISTS recruitment_enabled;

-- =====================================================
-- STEP 5: Drop recruitment_role_mapping Table
-- =====================================================

DROP TABLE IF EXISTS public.recruitment_role_mapping CASCADE;

-- =====================================================
-- STEP 6: Drop Foreign Tables
-- =====================================================

DROP FOREIGN TABLE IF EXISTS sso_foreign.membership_roles CASCADE;
DROP FOREIGN TABLE IF EXISTS sso_foreign.roles CASCADE;
DROP FOREIGN TABLE IF EXISTS sso_foreign.memberships CASCADE;
DROP FOREIGN TABLE IF EXISTS sso_foreign.users CASCADE;
DROP FOREIGN TABLE IF EXISTS sso_foreign.organizations CASCADE;

-- =====================================================
-- STEP 7: Drop Foreign Schema
-- =====================================================

DROP SCHEMA IF EXISTS sso_foreign CASCADE;

-- =====================================================
-- STEP 8: Drop User Mapping and Foreign Server
-- =====================================================

DROP USER MAPPING IF EXISTS FOR current_user SERVER sso_worker_server;
DROP SERVER IF EXISTS sso_worker_server CASCADE;

-- Note: We don't drop the postgres_fdw extension as it might be used elsewhere

COMMIT;

-- =====================================================
-- Rollback Complete
-- =====================================================
