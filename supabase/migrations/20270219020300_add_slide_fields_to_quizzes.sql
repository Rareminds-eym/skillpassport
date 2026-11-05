-- Slide quizzes use the existing quizzes table. Existing lesson quizzes keep NULL slide fields.
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS resource_id uuid REFERENCES public.lesson_resources(resource_id) ON DELETE CASCADE;
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS slide_number integer CHECK (slide_number > 0);
ALTER TABLE public.quizzes ADD CONSTRAINT quizzes_slide_identity_check CHECK ((resource_id IS NULL AND slide_number IS NULL) OR (resource_id IS NOT NULL AND slide_number IS NOT NULL));
CREATE UNIQUE INDEX IF NOT EXISTS quizzes_resource_slide_unique ON public.quizzes(resource_id, slide_number);
-- The existing quizzes table was publicly accessible. Preserve that behavior for
-- lesson quizzes while protecting slide answer keys behind the service API.
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY slide_quiz_privacy ON public.quizzes AS RESTRICTIVE FOR ALL TO anon, authenticated USING (resource_id IS NULL) WITH CHECK (resource_id IS NULL AND slide_number IS NULL);
CREATE POLICY existing_lesson_quizzes_select ON public.quizzes FOR SELECT TO anon, authenticated USING (resource_id IS NULL);
CREATE POLICY existing_lesson_quizzes_insert ON public.quizzes FOR INSERT TO anon, authenticated WITH CHECK (resource_id IS NULL AND slide_number IS NULL);
CREATE POLICY existing_lesson_quizzes_update ON public.quizzes FOR UPDATE TO anon, authenticated USING (resource_id IS NULL) WITH CHECK (resource_id IS NULL AND slide_number IS NULL);
CREATE POLICY existing_lesson_quizzes_delete ON public.quizzes FOR DELETE TO anon, authenticated USING (resource_id IS NULL);
