-- =====================================================
-- Migration: Add Offer Template Type to Email Templates
-- =====================================================
-- Phase: 1 of 1 (Single-phase constraint update)
-- Breaking: No (adds new enum value, doesn't modify existing)
-- Rollback: Restore previous CHECK constraint (safe if no 'offer' templates exist)
-- 
-- Context:
--   Extends organization_email_templates table to support offer letter
--   templates. Previously supported: invitation, role_change, welcome.
--   Now adds: offer (for candidate offer letters).
--   
--   Enables organizations to:
--   - Customize offer letter templates
--   - Use merge fields (candidate name, position, salary, etc.)
--   - Maintain brand consistency in offers
--
-- Related ADR: None (feature enhancement)
-- Related Tables:
--   - organization_email_templates (template storage)
-- Related Features:
--   - Offer letter generation
--   - Candidate offer workflow
--   - Email template management UI
--
-- Deployment order:
--   1. Run this migration (updates CHECK constraint)
--   2. Deploy offer template editor UI
--   3. Deploy offer letter generation API
--   4. Deploy merge field processor for offer templates
--   5. Add default offer template (optional)
--
-- Data Impact:
--   - Existing templates unchanged (invitation, role_change, welcome)
--   - No data migration needed
--   - New template type available immediately
--   - Unique constraint still enforced (one 'offer' template per org)
--
-- Rollback:
--   -- Safe to rollback if no 'offer' templates created:
--   ALTER TABLE public.organization_email_templates
--     DROP CONSTRAINT IF EXISTS organization_email_templates_template_type_check;
--   
--   ALTER TABLE public.organization_email_templates
--     ADD CONSTRAINT organization_email_templates_template_type_check CHECK (
--       template_type = ANY (ARRAY[
--         'invitation'::text,
--         'role_change'::text,
--         'welcome'::text
--       ])
--     );
--   
--   -- WARNING: Rollback will FAIL if any rows have template_type='offer'
--   -- Must delete offer templates first:
--   -- DELETE FROM organization_email_templates WHERE template_type = 'offer';
-- =====================================================

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
