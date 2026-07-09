-- Migration: Create organization_recruitment_verification table
-- Stores CIN/Business Registration, GST, and Tax Identification details
-- Timestamp: 2026-07-07

BEGIN;

CREATE TABLE IF NOT EXISTS public.organization_recruitment_verification (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  cin_business_reg_no character varying(50),
  gst_number character varying(50),
  tax_identification_number character varying(50),
  incorporation_date date,
  verification_status text DEFAULT 'pending'::text,
  verified_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT organization_recruitment_verification_pkey PRIMARY KEY (id),
  CONSTRAINT organization_recruitment_verification_organization_id_fkey FOREIGN KEY (organization_id)
    REFERENCES public.organizations (id) ON DELETE CASCADE,
  CONSTRAINT organization_recruitment_verification_organization_id_key UNIQUE (organization_id),
  CONSTRAINT organization_recruitment_verification_status_check CHECK (
    verification_status = ANY (ARRAY[
      'pending'::text,
      'approved'::text,
      'rejected'::text,
      'under_review'::text
    ])
  )
) TABLESPACE pg_default;

-- Add column comments
COMMENT ON TABLE public.organization_recruitment_verification IS 'Stores verification and compliance details for organizations in recruitment module';
COMMENT ON COLUMN public.organization_recruitment_verification.cin_business_reg_no IS 'Company Registration Number (CIN) or Business Registration Number';
COMMENT ON COLUMN public.organization_recruitment_verification.gst_number IS 'Goods and Services Tax (GST) Number';
COMMENT ON COLUMN public.organization_recruitment_verification.tax_identification_number IS 'Tax Identification Number (TIN)';
COMMENT ON COLUMN public.organization_recruitment_verification.incorporation_date IS 'Date of company incorporation (dd-mm-yyyy)';
COMMENT ON COLUMN public.organization_recruitment_verification.verification_status IS 'Verification status: pending, approved, rejected, or under_review';
COMMENT ON COLUMN public.organization_recruitment_verification.verified_at IS 'Timestamp when verification was completed';
COMMENT ON COLUMN public.organization_recruitment_verification.notes IS 'Additional notes or rejection reason';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_org_recruitment_verification_organization_id
ON public.organization_recruitment_verification (organization_id)
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_org_recruitment_verification_status
ON public.organization_recruitment_verification (verification_status)
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_org_recruitment_verification_cin
ON public.organization_recruitment_verification (cin_business_reg_no)
TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_org_recruitment_verification_gst
ON public.organization_recruitment_verification (gst_number)
TABLESPACE pg_default;

COMMIT;
