-- ============================================
-- ADD QUESTION CONTENT TO RESPONSES TABLE
-- ============================================
-- This migration adds columns to store the full question content
-- along with the student's response for complete audit trail.
--
-- This ensures we have a permanent record of:
-- 1. The exact question text shown to the student
-- 2. All answer options (A, B, C, D)
-- 3. The correct answer
-- 4. The student's selected answer
-- 5. Whether they got it right

-- Add new columns to adaptive_aptitude_responses
ALTER TABLE adaptive_aptitude_responses
ADD COLUMN IF NOT EXISTS question_text TEXT,
ADD COLUMN IF NOT EXISTS question_options JSONB,
ADD COLUMN IF NOT EXISTS correct_answer CHAR(1) CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
ADD COLUMN IF NOT EXISTS explanation TEXT;

-- Add comments for documentation
COMMENT ON COLUMN adaptive_aptitude_responses.question_text IS 'The exact question text shown to the student';
COMMENT ON COLUMN adaptive_aptitude_responses.question_options IS 'JSON object with all answer options: { "A": "...", "B": "...", "C": "...", "D": "..." }';
COMMENT ON COLUMN adaptive_aptitude_responses.correct_answer IS 'The correct answer for this question (A/B/C/D)';
COMMENT ON COLUMN adaptive_aptitude_responses.explanation IS 'Explanation of why the correct answer is correct';

-- Create index for question text search (optional, for analytics)
CREATE INDEX IF NOT EXISTS idx_adaptive_responses_correct_answer ON adaptive_aptitude_responses(correct_answer);
