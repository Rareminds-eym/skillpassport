-- Slide quizzes are private to server-side services; learner access will be
-- provided through an authenticated API in a later phase.
CREATE TABLE IF NOT EXISTS public.ppt_slide_quizzes (
  quiz_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES public.lesson_resources(resource_id) ON DELETE CASCADE,
  slide_number integer NOT NULL CHECK (slide_number > 0),
  questions jsonb NOT NULL CHECK (jsonb_typeof(questions) = 'array' AND jsonb_array_length(questions) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (resource_id, slide_number)
);
ALTER TABLE public.ppt_slide_quizzes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ppt_slide_quizzes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ppt_slide_quizzes TO service_role;
