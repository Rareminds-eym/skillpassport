-- =====================================================
-- Migration: Add Verification Document URL Columns
-- =====================================================
-- Phase: 1 of 1 (Single-phase column addition)
-- Breaking: No (columns are nullable)
-- Rollback: DROP COLUMN for each added column (safe)
-- 
-- Context:
--   Adds document storage URLs to organization_recruitment_verification
--   table. Stores R2 (Cloudflare) URLs for uploaded verification documents.
--   
--   Document types:
--   - registration_certificate_url: Company registration certificate
--   - gst_certificate_url: GST registration certificate
--   - business_license_url: Business license document
--   
--   File constraints (enforced at application level):
--   - Formats: PDF, JPG, PNG
--   - Max size: 10MB per file
--
-- Related ADR: None (feature enhancement)
-- Related Tables:
--   - organization_recruitment_verification (verification data + documents)
-- Related Features:
--   - Recruiter onboarding Step 3 (document upload)
--   - Admin verification workflow (document review)
--   - R2 storage integration
--
-- Deployment order:
--   1. Run this migration (adds 3 nullable text columns)
--   2. Deploy R2 upload handler for documents
--   3. Deploy frontend file upload component
--   4. Deploy API endpoints:
--      - POST /api/organizations/:id/verification/documents (upload)
--      - GET /api/organizations/:id/verification/documents/:type (download URL)
--   5. Configure R2 bucket CORS settings
--   6. Set up R2 lifecycle policies (retention)
--
-- Data Impact:
--   - Existing verification records: All URLs will be NULL
--   - New records: URLs populated after document upload
--   - No indexes needed (not used in WHERE clauses)
--   - Storage: ~200 bytes per organization (3 URLs)
--
-- Rollback:
--   -- Safe to rollback if no documents uploaded:
--   ALTER TABLE public.organization_recruitment_verification
--     DROP COLUMN IF EXISTS registration_certificate_url,
--     DROP COLUMN IF EXISTS gst_certificate_url,
--     DROP COLUMN IF EXISTS business_license_url;
--   
--   -- WARNING: Does not delete R2 files (orphaned files remain)
--   -- Manual cleanup required: List and delete files from R2 bucket
-- =====================================================

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
