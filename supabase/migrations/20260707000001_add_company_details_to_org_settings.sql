-- Migration: Add company contact details to organization_recruitment_settings
-- Stores official company email, phone, and HR contact information
-- Timestamp: 2026-07-07

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
