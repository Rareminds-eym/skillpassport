-- Migration: Create Aptitude Question Bank Table
-- This table stores pre-existing aptitude questions (NOT AI-generated)
-- Questions are imported from CSV/JSON question banks

-- Main aptitude questions table
CREATE TABLE IF NOT EXISTS public.aptitude_questions (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  grade TEXT NOT NULL,
  dimension TEXT NOT NULL,
  band TEXT NOT NULL,
  difficulty_rank INTEGER NOT NULL CHECK (difficulty_rank BETWEEN 1 AND 5),
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
  time_target_sec INTEGER,
  solution_type TEXT,
  solution_data TEXT,
  explanation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_aq_batch_id ON public.aptitude_questions(batch_id);
CREATE INDEX IF NOT EXISTS idx_aq_grade ON public.aptitude_questions(grade);
CREATE INDEX IF NOT EXISTS idx_aq_dimension ON public.aptitude_questions(dimension);
CREATE INDEX IF NOT EXISTS idx_aq_band ON public.aptitude_questions(band);
CREATE INDEX IF NOT EXISTS idx_aq_difficulty ON public.aptitude_questions(difficulty_rank);
CREATE INDEX IF NOT EXISTS idx_aq_template ON public.aptitude_questions(template_family);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_aq_grade_dimension_difficulty 
  ON public.aptitude_questions(grade, dimension, difficulty_rank);

CREATE INDEX IF NOT EXISTS idx_aq_grade_difficulty 
  ON public.aptitude_questions(grade, difficulty_rank);

-- Enable Row Level Security
ALTER TABLE public.aptitude_questions ENABLE ROW LEVEL SECURITY;

-- Read access: allow all authenticated users and anon to read questions
CREATE POLICY "Allow read access to aptitude questions" 
  ON public.aptitude_questions FOR SELECT 
  USING (true);

-- Insert/Update: restrict to service role only (import scripts)
CREATE POLICY "Allow service role insert on aptitude questions" 
  ON public.aptitude_questions FOR INSERT 
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow service role update on aptitude questions" 
  ON public.aptitude_questions FOR UPDATE 
  USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role delete on aptitude questions" 
  ON public.aptitude_questions FOR DELETE 
  USING (auth.role() = 'service_role');

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_aptitude_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_aptitude_questions_updated_at ON public.aptitude_questions;
CREATE TRIGGER trigger_update_aptitude_questions_updated_at
  BEFORE UPDATE ON public.aptitude_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_aptitude_questions_updated_at();
