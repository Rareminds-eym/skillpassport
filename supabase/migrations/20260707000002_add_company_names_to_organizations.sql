-- =====================================================
-- Migration: Add legal_name to Organizations Table
-- =====================================================
-- Phase: 1 of 1 (Single-phase column addition)
-- Breaking: No (column is nullable)
-- Rollback: DROP COLUMN legal_name (safe)
-- 
-- Context:
--   Adds legal_name field to distinguish between brand name and legal
--   company name for compliance and verification purposes.
--   
--   Use cases:
--   - Display Name (existing 'name'): "TechCorp"
--   - Legal Name (new 'legal_name'): "TechCorp Private Limited"
--   
--   Required for:
--   - Organization verification documents
--   - Tax compliance
--   - Legal contracts and offer letters
--
-- Related ADR: None (compliance requirement)
-- Related Tables:
--   - organizations (company information)
--   - organization_recruitment_verification (uses legal_name for matching)
-- Related Features:
--   - Recruiter onboarding Step 2 (Company Details)
--   - Organization verification workflow
--   - Offer letter generation
--
-- Deployment order:
--   1. Run this migration (adds nullable column + index)
--   2. Deploy frontend form to collect legal_name
--   3. Deploy API endpoint to save legal_name
--   4. No backfill needed (can be populated gradually)
--
-- Data Impact:
--   - Existing organizations: legal_name will be NULL
--   - New organizations: Should populate during onboarding
--   - Index created for efficient searches by legal name
--   - Storage: ~50-255 bytes per organization
--
-- Rollback:
--   -- Safe to rollback if no dependencies:
--   DROP INDEX IF EXISTS idx_organizations_legal_name;
--   ALTER TABLE public.organizations DROP COLUMN IF EXISTS legal_name;
-- =====================================================

BEGIN;

-- Add legal_name column to organizations table
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS legal_name character varying(255);

-- Add column comment
COMMENT ON COLUMN public.organizations.legal_name IS 'Legal Company Name (e.g., TechCorp Private Limited)';

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_organizations_legal_name
ON public.organizations (legal_name)
TABLESPACE pg_default;

COMMIT;
