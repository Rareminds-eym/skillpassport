-- =====================================================
-- Migration: Add Company Contact Details to Organization Settings
-- =====================================================
-- Phase: 1 of 1 (Single-phase column addition)
-- Breaking: No (columns are nullable)
-- Rollback: DROP COLUMN for each added column (safe)
-- 
-- Context:
--   Adds company contact information to organization_recruitment_settings
--   for the recruiter onboarding flow Step 2 (Company Details).
--   
--   Required fields:
--   - official_company_email: Primary company email (e.g., info@company.com)
--   - company_phone_number: Main contact number
--   - hr_contact_phone_number: HR direct line
--   - hr_support_email: HR support email
--
-- Related ADR: None (feature enhancement)
-- Related Tables:
--   - organization_recruitment_settings (company configuration)
-- Related Features:
--   - Recruiter admin onboarding Step 2
--   - Company profile management
--   - Contact information display
--
-- Deployment order:
--   1. Run this migration (adds 4 nullable text columns + 2 indexes)
--   2. Deploy frontend form for Step 2 company details
--   3. Deploy API endpoint to save company details
--   4. No data backfill needed (new feature)
--
-- Data Impact:
--   - Existing rows: All new columns will be NULL
--   - New organizations: Will populate during onboarding Step 2
--   - Performance: Two indexes created for email lookups
--   - Storage: ~100 bytes per organization
--
-- Rollback:
--   -- Safe to rollback if no dependencies:
--   DROP INDEX IF EXISTS idx_org_settings_official_company_email;
--   DROP INDEX IF EXISTS idx_org_settings_hr_support_email;
--   ALTER TABLE public.organization_recruitment_settings
--     DROP COLUMN IF EXISTS official_company_email,
--     DROP COLUMN IF EXISTS company_phone_number,
--     DROP COLUMN IF EXISTS hr_contact_phone_number,
--     DROP COLUMN IF EXISTS hr_support_email;
-- =====================================================

BEGIN;

-- Add contact columns to organization_recruitment_settings
ALTER TABLE public.organization_recruitment_settings
ADD COLUMN IF NOT EXISTS official_company_email text,
ADD COLUMN IF NOT EXISTS company_phone_number text,
ADD COLUMN IF NOT EXISTS hr_contact_phone_number text,
ADD COLUMN IF NOT EXISTS hr_support_email text;

-- Add column comments
COMMENT ON COLUMN public.organization_recruitment_settings.official_company_email IS 'Primary email for company correspondence (e.g., info@company.com)';
COMMENT ON COLUMN public.organization_recruitment_settings.company_phone_number IS 'Main contact number for your organization (e.g., +91 1234567890)';
COMMENT ON COLUMN public.organization_recruitment_settings.hr_contact_phone_number IS 'Direct line for HR-related inquiries (e.g., +91 9876543210)';
COMMENT ON COLUMN public.organization_recruitment_settings.hr_support_email IS 'HR/Support email address';

-- Create indexes for contact columns
CREATE INDEX IF NOT EXISTS idx_org_settings_official_company_email
ON public.organization_recruitment_settings (official_company_email)
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_org_settings_hr_support_email
ON public.organization_recruitment_settings (hr_support_email)
TABLESPACE pg_default;

COMMIT;
