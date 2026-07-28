-- Add interest tracking to learner_course_recommendations
-- Records that a learner clicked "Start Learning" on an AI-recommended course
-- in the Career Track flow, so we can report how many learners expressed
-- interest in each recommended course.
--
-- NULL means the learner has not clicked. A timestamp records the first click;
-- repeat clicks do not overwrite it.
--
-- Backward compatible (Expand phase): the column is nullable with no default,
-- so existing rows and current application code are unaffected.

ALTER TABLE public.learner_course_recommendations
  ADD COLUMN IF NOT EXISTS interested_at timestamp with time zone;

-- Add comments for documentation
COMMENT ON COLUMN public.learner_course_recommendations.interested_at IS 'Timestamp of the first "Start Learning" click by this learner on this recommendation. NULL means never clicked.';

-- Partial index for interest reporting. Only clicked rows are ever scanned, so
-- the index stays proportional to the number of clicks rather than to the
-- whole table. course_id leads because reports group by course; learner_id is
-- included so learner counts are served from the index.
CREATE INDEX IF NOT EXISTS idx_recommendations_interested
  ON public.learner_course_recommendations (course_id, learner_id)
  WHERE interested_at IS NOT NULL;
