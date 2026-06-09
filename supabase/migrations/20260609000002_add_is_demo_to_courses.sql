-- Add an is_demo flag to public.courses so demo/seed courses can be identified
-- and bulk-removed. Deleting a course already cascades to course_modules →
-- lessons and to course_classes (ON DELETE CASCADE), so a single flag on
-- courses is enough to clean up an entire demo dataset:
--
--   DELETE FROM public.courses WHERE is_demo = true;
--
-- Backward compatible (Expand phase): nullable-safe with a NOT NULL default of
-- false, so existing rows and current application code are unaffected.

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;

-- Partial index to make demo lookups/cleanup cheap without bloating the index
-- for the common (non-demo) rows.
CREATE INDEX IF NOT EXISTS idx_courses_is_demo
  ON public.courses (is_demo)
  WHERE is_demo = true;
