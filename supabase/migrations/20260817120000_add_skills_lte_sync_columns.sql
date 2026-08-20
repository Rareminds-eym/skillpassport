-- ============================================================================
-- LTE skill sync: dedupe + delta-sync support on the existing `skills` table.
-- Earned LTE skills are pushed into `skills` keyed on (learner_id, lte_skill_id);
-- `lte_hash` is the content fingerprint used to skip unchanged rows (mirrors
-- the trainings lte sync: lte_course_id / lte_hash).
-- ============================================================================

BEGIN;

ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS lte_skill_id uuid;

COMMENT ON COLUMN public.skills.lte_skill_id IS
  'LTE skill id for skills pushed via the LTE skill sync (no FK: LTE owns the skill id)';

-- Upsert key for synced LTE skills (partial: only lte-sourced rows participate)
CREATE UNIQUE INDEX IF NOT EXISTS uq_skills_lte_skill
  ON public.skills (learner_id, lte_skill_id)
  WHERE lte_skill_id IS NOT NULL;

COMMIT;
