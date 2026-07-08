-- Migration: Add document URL columns to organization_recruitment_verification table
-- Stores R2 file URLs for: registration certificate, GST certificate, and business license
-- Timestamp: 2026-07-08

BEGIN;

-- Add three new columns to store document URLs from R2 storage
ALTER TABLE public.organization_recruitment_verification
ADD COLUMN IF NOT EXISTS registration_certificate_url text,
ADD COLUMN IF NOT EXISTS gst_certificate_url text,
ADD COLUMN IF NOT EXISTS business_license_url text;

-- Add column comments
COMMENT ON COLUMN public.organization_recruitment_verification.registration_certificate_url IS 'R2 storage URL for company registration certificate (PDF/JPG/PNG, max 10MB)';
COMMENT ON COLUMN public.organization_recruitment_verification.gst_certificate_url IS 'R2 storage URL for GST registration certificate (PDF/JPG/PNG, max 10MB)';
COMMENT ON COLUMN public.organization_recruitment_verification.business_license_url IS 'R2 storage URL for business license document (PDF/JPG/PNG, max 10MB)';

COMMIT;
