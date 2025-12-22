-- External Assessment Attempts Table
-- Stores all external course assessment attempts with questions, answers, and scores

CREATE TABLE IF NOT EXISTS external_assessment_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  course_id UUID,
  
  -- Assessment metadata
  assessment_level TEXT NOT NULL, -- Beginner, Intermediate, Advanced
  total_questions INTEGER NOT NULL DEFAULT 15,
  
  -- Questions and answers (stored as JSONB for flexibility)
  questions JSONB NOT NULL, -- Array of question objects
  student_answers JSONB NOT NULL, -- Array of student's answers
  
  -- Progress tracking
  current_question_index INTEGER DEFAULT 0, -- Which question they're on
  status TEXT NOT NULL DEFAULT 'in_progress', -- in_progress, completed
  
  -- Scoring
  score INTEGER, -- Percentage score (0-100), NULL until completed
  correct_answers INTEGER, -- NULL until completed
  time_taken INTEGER, -- Total time in seconds
  time_remaining INTEGER, -- Seconds remaining on timer
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional metadata
  difficulty_breakdown JSONB, -- {easy: 3/5, medium: 4/5, hard: 2/5}
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_external_assessment_attempts_student_id ON external_assessment_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_external_assessment_attempts_course_name ON external_assessment_attempts(course_name);
CREATE INDEX IF NOT EXISTS idx_external_assessment_attempts_status ON external_assessment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_external_assessment_attempts_completed_at ON external_assessment_attempts(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_external_assessment_attempts_score ON external_assessment_attempts(score);

-- Unique constraint: One attempt per student per course (including in-progress)
CREATE UNIQUE INDEX IF NOT EXISTS idx_external_assessment_one_per_course 
  ON external_assessment_attempts(student_id, course_name);

-- Enable Row Level Security
ALTER TABLE external_assessment_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Students can only see their own attempts
CREATE POLICY "Students can view own external assessment attempts"
  ON external_assessment_attempts
  FOR SELECT
  USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Students can insert their own attempts
CREATE POLICY "Students can insert own external assessment attempts"
  ON external_assessment_attempts
  FOR INSERT
  WITH CHECK (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- Educators can view attempts of their students
CREATE POLICY "Educators can view student external assessment attempts"
  ON external_assessment_attempts
  FOR SELECT
  USING (
    student_id IN (
      SELECT s.id FROM students s
      JOIN school_educators se ON se.school_id = s.school_id
      WHERE se.user_id = auth.uid()
    )
  );

-- Admins can view all attempts
CREATE POLICY "Admins can view all external assessment attempts"
  ON external_assessment_attempts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('school_admin', 'college_admin', 'university_admin', 'super_admin')
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_external_assessment_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_external_assessment_attempts_timestamp
  BEFORE UPDATE ON external_assessment_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_external_assessment_attempts_updated_at();

-- Comments for documentation
COMMENT ON TABLE external_assessment_attempts IS 'Stores all student external course assessment attempts with questions, answers, and scores';
COMMENT ON COLUMN external_assessment_attempts.questions IS 'JSONB array of question objects with id, text, options, correct_answer, difficulty';
COMMENT ON COLUMN external_assessment_attempts.student_answers IS 'JSONB array of student answers corresponding to questions';
COMMENT ON COLUMN external_assessment_attempts.difficulty_breakdown IS 'JSONB object showing performance by difficulty level';
