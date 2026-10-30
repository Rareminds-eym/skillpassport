-- Preserve responses if the earlier local table name already exists.
DO $$ BEGIN
  IF to_regclass('public.ppt_slide_quiz_answers') IS NOT NULL
     AND to_regclass('public.course_slide_quiz_responses') IS NULL THEN
    ALTER TABLE public.ppt_slide_quiz_answers RENAME TO course_slide_quiz_responses;
  END IF;
END $$;
-- Private learner responses to practice questions; no scoring is stored.
CREATE TABLE IF NOT EXISTS public.course_slide_quiz_responses (
  quiz_id uuid NOT NULL REFERENCES public.ppt_slide_quizzes(quiz_id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  question_version text NOT NULL,
  answers jsonb NOT NULL CHECK (jsonb_typeof(answers) = 'object'),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (quiz_id, user_id)
);
ALTER TABLE public.course_slide_quiz_responses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.course_slide_quiz_responses FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_slide_quiz_responses TO service_role;
