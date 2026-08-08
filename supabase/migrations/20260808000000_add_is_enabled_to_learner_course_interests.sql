-- Add is_enabled column to learner_course_interests table
-- true  = learner has shown interest, course is ENABLED for this learner
-- false = interest not shown yet or disabled. Default false.
-- Date: 2026-08-08

ALTER TABLE public.learner_course_interests
ADD COLUMN is_enabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.learner_course_interests.is_enabled IS
'true = learner has shown interest and course is enabled for them. false = not yet interested or disabled. Default false.';

-- Backfill: all existing interest rows were recorded by learners who showed interest,
-- so they should all be treated as enabled.
UPDATE public.learner_course_interests SET is_enabled = true WHERE is_enabled = false;
