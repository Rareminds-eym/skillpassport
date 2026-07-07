-- Migration: Add legal_name to organizations table
-- Stores legal company name (display/brand name uses existing 'name' field)
-- Timestamp: 2026-07-07

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
