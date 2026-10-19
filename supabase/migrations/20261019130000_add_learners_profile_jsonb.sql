-- Migration: add missing learners.profile jsonb column (production parity)
-- Phase: 1 of 1 (Expand)
-- Breaking: No
-- Rollback: ALTER TABLE public.learners DROP COLUMN profile; -- NOT recommended:
--           production already relies on this column.
--
-- Context (schema-drift repair, found during the requisition-page audit):
-- A large part of the application assumes a jsonb `profile` column on
-- public.learners. SQL functions defined in the schema dump itself reference
-- it (e.g. `add_recent_update(learner_email text)` does
-- `WHERE profile->>'email' = learner_email`), as does application code in
-- educator handlers, educator-copilot, analytics, user actions, and the
-- recruiter surface (`get-applications-by-opportunity`,
-- `get-shortlist-candidates`). The column is populated on production but was
-- never captured by any migration — the 20260526 schema dump predates it — so
-- freshly-rebuilt local/dev environments lack it and every endpoint that
-- selects it fails with a masked PostgREST error (PGRST204/42703 → 500).
--
-- Related ADR: requisition-page round-2 audit (2026-10-19).
--
-- Deployment order:
-- 1. Run this migration (safe expand: nullable column with a '{}' default).
-- 2. No backfill required: application code composes profile objects from the
--    authoritative flat columns (name/email/contact_number/…) and only reads
--    the jsonb for enrichment, so rows with '{}' behave correctly.
-- 3. Production already has the column populated: this migration is a no-op
--    there (IF NOT EXISTS).

ALTER TABLE public.learners
  ADD COLUMN IF NOT EXISTS profile jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.learners.profile IS
  'Per-learner profile JSON (name/email/phone/passport/education/etc). Missing from stale schema dumps; application code treats flat learners columns as authoritative and this jsonb as enrichment. Added for prod/local parity — see migration header.';
