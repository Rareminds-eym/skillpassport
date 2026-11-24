BEGIN;

-- Assessments are shared with school exams. Preserve their curriculum_courses
-- reference and give college exams a reference to the existing college catalog.
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS college_course_id uuid
    REFERENCES public.college_courses(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_assessments_college_course
  ON public.assessments(college_course_id);

COMMENT ON COLUMN public.assessments.college_course_id IS
  'College ERP course reference. course_id retains the legacy curriculum_courses reference for school and historical assessments.';

NOTIFY pgrst, 'reload schema';
COMMIT;
