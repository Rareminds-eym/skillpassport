-- ============================================================
-- Migration: Create demo_course_access table
-- Purpose:   Learner-level course visibility control for demo/testing.
--            Only learners with is_enabled = TRUE for a specific
--            course_id will be able to see that course in the
--            learner dashboard. All others see a blocked state.
--
-- References:
--   learner_id → public.learners.id        (UUID, PK of learners table)
--   course_id  → public.courses.course_id  (UUID, PK of courses table)
--
-- Temporary Feature: Drop this table when full course content is
-- published and normal visibility is restored for all learners.
-- ============================================================

BEGIN;

-- ── 1. Create table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.demo_course_access (

    -- References learners.id (primary key of the learners table)
    learner_id UUID NOT NULL
        REFERENCES public.learners(id)
        ON DELETE CASCADE,

    -- References courses.course_id (primary key of the courses table)
    course_id UUID NOT NULL
        REFERENCES public.courses(course_id)
        ON DELETE CASCADE,

    -- TRUE  = this learner can see this course
    -- FALSE = this learner cannot see this course (default)
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Composite PK: one row per learner-course pair
    PRIMARY KEY (learner_id, course_id)
);

-- ── 2. Comments ──────────────────────────────────────────────
COMMENT ON TABLE public.demo_course_access IS
    'Temporary demo feature: controls which learners can see which courses. Drop this table when full content is published.';

COMMENT ON COLUMN public.demo_course_access.learner_id IS
    'FK → public.learners.id — the internal UUID primary key of the learners table';

COMMENT ON COLUMN public.demo_course_access.course_id IS
    'FK → public.courses.course_id — the UUID primary key of the courses table';

COMMENT ON COLUMN public.demo_course_access.is_enabled IS
    'TRUE = learner can see this course. FALSE = blocked. Default is FALSE.';

-- ── 3. Updated_at trigger ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_demo_course_access_updated_at
    ON public.demo_course_access;

CREATE TRIGGER trg_demo_course_access_updated_at
BEFORE UPDATE ON public.demo_course_access
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

COMMIT;


-- ============================================================
-- USAGE EXAMPLES (run in Supabase SQL Editor as needed)
-- ============================================================

-- Step 1: Find learner.id by email
-- SELECT id, email, name FROM public.learners WHERE email = 'learner@example.com';

-- Step 2: Find course_id by course title or code
-- SELECT course_id, title, code FROM public.courses WHERE title ILIKE '%course name%';

-- Step 3: Enable a specific course for a specific learner
-- INSERT INTO public.demo_course_access (learner_id, course_id, is_enabled)
-- VALUES ('learner-uuid-here', 'course-uuid-here', TRUE)
-- ON CONFLICT (learner_id, course_id)
-- DO UPDATE SET is_enabled = TRUE, updated_at = NOW();

-- Step 4: Enable multiple courses for one learner
-- INSERT INTO public.demo_course_access (learner_id, course_id, is_enabled)
-- VALUES
--     ('learner-uuid', 'course-uuid-1', TRUE),
--     ('learner-uuid', 'course-uuid-2', TRUE),
--     ('learner-uuid', 'course-uuid-3', TRUE)
-- ON CONFLICT (learner_id, course_id)
-- DO UPDATE SET is_enabled = TRUE, updated_at = NOW();

-- Step 5: Disable a course for a learner
-- UPDATE public.demo_course_access
-- SET is_enabled = FALSE
-- WHERE learner_id = 'learner-uuid' AND course_id = 'course-uuid';

-- Step 6: Check all enabled courses for a learner
-- SELECT c.course_id, c.title, c.code, dca.is_enabled, dca.updated_at
-- FROM public.demo_course_access dca
-- JOIN public.courses c ON c.course_id = dca.course_id
-- WHERE dca.learner_id = 'learner-uuid' AND dca.is_enabled = TRUE;

-- Step 7: List all learners who have access to a specific course
-- SELECT l.id, l.email, l.name, dca.is_enabled
-- FROM public.demo_course_access dca
-- JOIN public.learners l ON l.id = dca.learner_id
-- WHERE dca.course_id = 'course-uuid' AND dca.is_enabled = TRUE;


-- ============================================================
-- ROLLBACK (run only when retiring this feature)
-- ============================================================

-- BEGIN;
-- DROP TABLE IF EXISTS public.demo_course_access;
-- -- Only drop if set_updated_at() is not used by any other table
-- -- DROP FUNCTION IF EXISTS public.set_updated_at();
-- COMMIT;
