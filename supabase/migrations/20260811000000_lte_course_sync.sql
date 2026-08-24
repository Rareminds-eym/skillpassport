-- ============================================================================
-- LTE course sync support for trainings
-- Adds: source 'lte', resume_url column, lte_course_id sync key (no FK:
-- trainings.course_id has a FK to courses(course_id); LTE capability ids are
-- not rows in courses, so every sync write would fail with 23503), upsert key
-- for synced courses, and not_started / paused statuses.
-- ============================================================================

BEGIN;

-- 1. Allow the 'lte' source (LTE pushes course rows via the internal gateway)
ALTER TABLE public.trainings
  DROP CONSTRAINT IF EXISTS trainings_source_check;

ALTER TABLE public.trainings
  ADD CONSTRAINT trainings_source_check
  CHECK (source IN ('manual', 'internal_course', 'external_course', 'certification', 'mooc', 'lte'));

-- 2. Deep link back into LTE course detail
ALTER TABLE public.trainings
  ADD COLUMN IF NOT EXISTS resume_url text;

-- 3. Dedicated no-FK column as the sync key
ALTER TABLE public.trainings
  ADD COLUMN IF NOT EXISTS lte_course_id uuid;

COMMENT ON COLUMN public.trainings.lte_course_id IS
  'LTE capability id for courses pushed via the LTE sync (no FK: not a courses() row)';

-- 4. Upsert key for synced LTE courses (partial: only 'lte' rows participate)
CREATE UNIQUE INDEX IF NOT EXISTS uq_trainings_lte_course
  ON public.trainings (learner_id, source, lte_course_id)
  WHERE source = 'lte';

-- 5. Allow not_started / paused in trainings.status
ALTER TABLE public.trainings
  DROP CONSTRAINT IF EXISTS trainings_status_check;

ALTER TABLE public.trainings
  ADD CONSTRAINT trainings_status_check
  CHECK (status IN ('ongoing', 'completed', 'not_started', 'paused'));

COMMIT;
