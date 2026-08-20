-- ============================================================================
-- LTE course sync: store the per-level progress ladder on synced trainings
-- ============================================================================

BEGIN;

-- Per-level progress ladder (levels -> modules) pushed from LTE for a synced
-- course. JSONB so the MyLearning card can render L1..L5 progress without
-- hitting the LTE gateway again for every card.
ALTER TABLE public.trainings
  ADD COLUMN IF NOT EXISTS lte_levels jsonb;

COMMENT ON COLUMN public.trainings.lte_levels IS
  'LTE per-level progress ladder (code, title, status, completion %, module counts) for lte-sourced courses';

COMMIT;
