-- ============================================================================
-- LTE course sync: store capability detail fields on synced trainings so the
-- MyLearning LTE card can show code badge and level position
-- without a second round-trip to the LTE gateway.
-- ============================================================================

BEGIN;

ALTER TABLE public.trainings
  ADD COLUMN IF NOT EXISTS lte_course_code text;

ALTER TABLE public.trainings
  ADD COLUMN IF NOT EXISTS lte_current_level integer;

ALTER TABLE public.trainings
  ADD COLUMN IF NOT EXISTS lte_total_levels integer;

COMMENT ON COLUMN public.trainings.lte_course_code IS
  'LTE capability code (e.g. BCP-CAP-CM-002) for lte-sourced courses';

COMMENT ON COLUMN public.trainings.lte_current_level IS
  'Number of completed levels, as reported by LTE (mirrors LTE currentLevel)';

COMMENT ON COLUMN public.trainings.lte_total_levels IS
  'Total published levels for the capability, as reported by LTE';

COMMIT;