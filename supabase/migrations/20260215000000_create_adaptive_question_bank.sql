-- Create table for adaptive aptitude question bank from CSV
CREATE TABLE IF NOT EXISTS public.adaptive_question_bank (
    id TEXT PRIMARY KEY,  -- e.g., G6_Q1, G6_Q2
    batch_id TEXT NOT NULL,  -- e.g., ADAPT_G6-8_BANK_400
    grade INTEGER NOT NULL,  -- 6, 7, 8, etc.
    dimension TEXT NOT NULL,  -- QR (Quantitative Reasoning), LR (Logical Reasoning), PAR (Pattern Recognition)
    band TEXT NOT NULL,  -- A1, A2, B1, B2, C1, C2
    difficulty_rank INTEGER NOT NULL,  -- 1-8 (maps to difficulty levels)
    template_family TEXT NOT NULL,  -- arith_add, arith_sub, etc.
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

-- Create indexes for efficient querying
CREATE INDEX idx_question_bank_grade ON public.adaptive_question_bank(grade);
CREATE INDEX idx_question_bank_dimension ON public.adaptive_question_bank(dimension);
CREATE INDEX idx_question_bank_band ON public.adaptive_question_bank(band);
CREATE INDEX idx_question_bank_difficulty ON public.adaptive_question_bank(difficulty_rank);
CREATE INDEX idx_question_bank_active ON public.adaptive_question_bank(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_question_bank_grade_difficulty ON public.adaptive_question_bank(grade, difficulty_rank, is_active) WHERE is_active = TRUE;

-- Add comment
COMMENT ON TABLE public.adaptive_question_bank IS 'Question bank for adaptive aptitude tests - imported from CSV';
COMMENT ON COLUMN public.adaptive_question_bank.difficulty_rank IS 'Difficulty ranking 1-8 where 1=easiest, 8=hardest';
COMMENT ON COLUMN public.adaptive_question_bank.dimension IS 'Question dimension: QR=Quantitative Reasoning, LR=Logical Reasoning, PAR=Pattern Recognition';
COMMENT ON COLUMN public.adaptive_question_bank.band IS 'Difficulty band: A1/A2 (easy), B1/B2 (medium), C1/C2 (hard)';

-- Enable RLS
ALTER TABLE public.adaptive_question_bank ENABLE ROW LEVEL SECURITY;

-- Allow students to read questions
CREATE POLICY "Students can read active questions"
ON public.adaptive_question_bank
FOR SELECT
USING (is_active = TRUE);

-- Allow super admins to manage questions
CREATE POLICY "Super admins can manage questions"
ON public.adaptive_question_bank
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.id = auth.uid()
        AND users.role = 'super_admin'
    )
);
