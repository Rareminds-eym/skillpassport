-- =====================================================
-- Migration: Add organization_id to opportunities Table
-- =====================================================
-- Phase: 1 of 1 (Single-phase column addition)
-- Breaking: No (column is nullable)
-- Rollback: DROP COLUMN organization_id (safe if no application dependencies)
-- 
-- Context:
--   Adds multi-tenant support to opportunities (job requisitions).
--   Previously, opportunities had no organization scoping, making it
--   impossible to filter by organization in the recruitment module.
--   
--   This enables:
--   - Organization-scoped opportunity views
--   - RLS policies based on organization_id
--   - Proper data isolation between organizations
--   - Recruiter dashboard filtering
--
-- Related ADR: None (feature enhancement)
-- Related Tables:
--   - opportunities (job requisitions)
--   - organizations (foreign key target)
-- Related Features:
--   - Recruiter dashboard
--   - Opportunity management
--   - Multi-tenant recruitment module
--
-- Deployment order:
--   1. Run this migration (adds nullable column + index)
--   2. Deploy application code that sets organization_id on new opportunities
--   3. Backfill organization_id for existing opportunities (separate migration)
--   4. Add RLS policies using organization_id
--   5. Consider making column NOT NULL after backfill (Phase 3 - REQUIRES APPROVAL)
--
-- Data Impact:
--   - Existing rows: organization_id will be NULL
--   - New rows: Should set organization_id from recruiter's organization
--   - Performance: Index created for efficient queries
--   - Storage: Adds 16 bytes (UUID) per row
--
-- Rollback:
--   -- Safe to rollback if no application code deployed yet:
--   ALTER TABLE public.opportunities DROP COLUMN IF EXISTS organization_id;
--   DROP INDEX IF EXISTS idx_opportunities_organization_id;
--   
--   -- WARNING: If application code deployed, dropping column will break queries
-- =====================================================

ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_opportunities_organization_id 
ON public.opportunities(organization_id);

-- Add comment
COMMENT ON COLUMN public.opportunities.organization_id IS 
'Organization that owns this opportunity/requisition. NULL for legacy data.';

-- Note: Existing rows will have NULL organization_id
-- You may want to run a data migration to populate this for existing opportunities
-- based on the recruiter_id or created_by field
