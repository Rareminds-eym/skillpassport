-- ============================================================================
-- Migration: Reconcile Recruitment Schema & Clean Up Legacy FDW
-- Date: 2026-08-30
-- Purpose:
--   1. Standardize recruitment_role_mapping.id to UUID.
--   2. Ensure multi-tenancy columns and indexes exist on opportunities, requisitions, pipeline_candidates.
--   3. Decommission legacy FDW artifacts (sso_foreign, sso_worker_server, student_id_seq).
--   4. Enable RLS and establish org-isolation policies across recruitment tables.
-- ============================================================================

BEGIN;

-- 1. Standardize recruitment_role_mapping.id to UUID if needed
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'recruitment_role_mapping' AND column_name = 'id' AND udt_name = 'int4'
    ) THEN
        ALTER TABLE public.recruitment_role_mapping ALTER COLUMN id DROP DEFAULT;
        ALTER TABLE public.recruitment_role_mapping ALTER COLUMN id SET DATA TYPE UUID USING gen_random_uuid();
        ALTER TABLE public.recruitment_role_mapping ALTER COLUMN id SET DEFAULT gen_random_uuid();
        DROP SEQUENCE IF EXISTS public.recruitment_role_mapping_id_seq;
    END IF;
END $$;

ALTER TABLE public.recruitment_role_mapping ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;

-- 2. Multi-tenancy and audit columns on opportunities, requisitions, pipeline_candidates
ALTER TABLE public.opportunities 
    ADD COLUMN IF NOT EXISTS created_by_uuid UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.requisitions 
    ADD COLUMN IF NOT EXISTS created_by_uuid UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

ALTER TABLE public.pipeline_candidates 
    ADD COLUMN IF NOT EXISTS added_by_uuid UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS assigned_to_uuid UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 3. Indexes for multi-tenancy lookups
CREATE INDEX IF NOT EXISTS idx_opportunities_created_by_uuid ON public.opportunities(created_by_uuid);
CREATE INDEX IF NOT EXISTS idx_requisitions_created_by_uuid ON public.requisitions(created_by_uuid);
CREATE INDEX IF NOT EXISTS idx_requisitions_assigned_to ON public.requisitions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_requisitions_organization_id ON public.requisitions(organization_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_candidates_added_by_uuid ON public.pipeline_candidates(added_by_uuid);
CREATE INDEX IF NOT EXISTS idx_pipeline_candidates_assigned_to_uuid ON public.pipeline_candidates(assigned_to_uuid);
CREATE INDEX IF NOT EXISTS idx_pipeline_candidates_organization_id ON public.pipeline_candidates(organization_id);

-- 4. Clean up legacy FDW artifacts
DROP SCHEMA IF EXISTS sso_foreign CASCADE;
DROP SERVER IF EXISTS sso_worker_server CASCADE;
DROP SEQUENCE IF EXISTS public.student_id_seq;

-- 5. Enable RLS on opportunities, requisitions, and pipeline_candidates
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_candidates ENABLE ROW LEVEL SECURITY;

-- 6. Org-Isolation and Role Policies
DO $$
BEGIN
    -- Opportunities Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'opportunities' AND policyname = 'opportunities_org_isolation') THEN
        CREATE POLICY opportunities_org_isolation ON public.opportunities FOR SELECT USING (organization_id IS NULL OR public.is_org_member(auth.uid(), organization_id));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'opportunities' AND policyname = 'opportunities_insert_policy') THEN
        CREATE POLICY opportunities_insert_policy ON public.opportunities FOR INSERT WITH CHECK (organization_id IS NULL OR public.has_recruitment_permission(auth.uid(), organization_id, 'create_jobs'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'opportunities' AND policyname = 'opportunities_update_policy') THEN
        CREATE POLICY opportunities_update_policy ON public.opportunities FOR UPDATE USING (organization_id IS NULL OR public.has_recruitment_permission(auth.uid(), organization_id, 'edit_jobs'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'opportunities' AND policyname = 'opportunities_delete_policy') THEN
        CREATE POLICY opportunities_delete_policy ON public.opportunities FOR DELETE USING (organization_id IS NULL OR public.has_recruitment_permission(auth.uid(), organization_id, 'delete_jobs'));
    END IF;

    -- Requisitions Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'requisitions' AND policyname = 'requisitions_org_isolation') THEN
        CREATE POLICY requisitions_org_isolation ON public.requisitions FOR SELECT USING (organization_id IS NULL OR public.is_org_member(auth.uid(), organization_id));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'requisitions' AND policyname = 'requisitions_insert_policy') THEN
        CREATE POLICY requisitions_insert_policy ON public.requisitions FOR INSERT WITH CHECK (organization_id IS NULL OR public.has_recruitment_permission(auth.uid(), organization_id, 'create_jobs'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'requisitions' AND policyname = 'requisitions_update_policy') THEN
        CREATE POLICY requisitions_update_policy ON public.requisitions FOR UPDATE USING (organization_id IS NULL OR public.has_recruitment_permission(auth.uid(), organization_id, 'edit_jobs'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'requisitions' AND policyname = 'requisitions_delete_policy') THEN
        CREATE POLICY requisitions_delete_policy ON public.requisitions FOR DELETE USING (organization_id IS NULL OR public.has_recruitment_permission(auth.uid(), organization_id, 'delete_jobs'));
    END IF;

    -- Pipeline Candidates Policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pipeline_candidates' AND policyname = 'pipeline_candidates_org_isolation') THEN
        CREATE POLICY pipeline_candidates_org_isolation ON public.pipeline_candidates FOR SELECT USING (organization_id IS NULL OR public.has_recruitment_permission(auth.uid(), organization_id, 'view_candidates'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pipeline_candidates' AND policyname = 'pipeline_candidates_insert_policy') THEN
        CREATE POLICY pipeline_candidates_insert_policy ON public.pipeline_candidates FOR INSERT WITH CHECK (organization_id IS NULL OR public.has_recruitment_permission(auth.uid(), organization_id, 'manage_candidates'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pipeline_candidates' AND policyname = 'pipeline_candidates_update_policy') THEN
        CREATE POLICY pipeline_candidates_update_policy ON public.pipeline_candidates FOR UPDATE USING (organization_id IS NULL OR public.has_recruitment_permission(auth.uid(), organization_id, 'manage_candidates'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'pipeline_candidates' AND policyname = 'pipeline_candidates_delete_policy') THEN
        CREATE POLICY pipeline_candidates_delete_policy ON public.pipeline_candidates FOR DELETE USING (organization_id IS NULL OR public.has_recruitment_permission(auth.uid(), organization_id, 'manage_candidates'));
    END IF;
END $$;

COMMIT;
