-- Migration: Add offer template type to organization_email_templates
-- Adds support for offer letter templates in the existing email templates table
-- Timestamp: 2026-07-08

BEGIN;

-- Update the CHECK constraint to include 'offer' type
ALTER TABLE public.organization_email_templates
DROP CONSTRAINT IF EXISTS organization_email_templates_template_type_check;

ALTER TABLE public.organization_email_templates
ADD CONSTRAINT organization_email_templates_template_type_check CHECK (
  template_type = ANY (ARRAY[
    'invitation'::text,
    'role_change'::text,
    'welcome'::text,
    'offer'::text
  ])
);

-- Add comment about the new template type
COMMENT ON COLUMN public.organization_email_templates.template_type IS 'Email template type: invitation, role_change, welcome, or offer';

COMMIT;
