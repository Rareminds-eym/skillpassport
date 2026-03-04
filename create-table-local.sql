-- Run this in Supabase Studio SQL Editor (http://127.0.0.1:54323)

CREATE TABLE IF NOT EXISTS public.adaptive_question_bank (
    id TEXT PRIMARY KEY,
    batch_id TEXT NOT NULL,
    grade INTEGER NOT NULL,
    dimension TEXT NOT NULL,
    band TEXT NOT NULL,
    difficulty_rank INTEGER NOT NULL,
    template_family TEXT NOT NULL,
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    explanation_step_1 TEXT,
    explanation_step_2 TEXT,
    explanation_step_3 TEXT,
    final_answer TEXT,
    time_target_sec INTEGER NOT NULL,
    solution_type TEXT,
    solution_data TEXT,
    explanation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_question_bank_grade ON public.adaptive_question_bank(grade);
CREATE INDEX IF NOT EXISTS idx_question_bank_difficulty ON public.adaptive_question_bank(difficulty_rank);
CREATE INDEX IF NOT EXISTS idx_question_bank_active ON public.adaptive_question_bank(is_active) WHERE is_active = TRUE;

ALTER TABLE public.adaptive_question_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Students can read active questions"
ON public.adaptive_question_bank
FOR SELECT
USING (is_active = TRUE);

-- Also add the responses column
ALTER TABLE public.adaptive_aptitude_sessions
ADD COLUMN IF NOT EXISTS all_responses JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_adaptive_sessions_all_responses 
ON public.adaptive_aptitude_sessions USING gin(all_responses);
