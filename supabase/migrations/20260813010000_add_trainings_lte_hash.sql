-- ============================================================================
-- LTE course sync: fingerprint for delta sync on synced trainings
-- ============================================================================

BEGIN;

-- Content fingerprint (SHA-256) sent by LTE for each course. On refresh we skip
-- courses whose stored fingerprint matches, so an unchanged sync is a no-op.
ALTER TABLE public.trainings
  ADD COLUMN IF NOT EXISTS lte_hash text;

COMMENT ON COLUMN public.trainings.lte_hash IS
  'LTE content fingerprint (SHA-256) used to skip updating unchanged lte-sourced courses';

COMMIT;
