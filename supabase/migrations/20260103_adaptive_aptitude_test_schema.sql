-- ============================================
-- ADAPTIVE APTITUDE TEST SYSTEM TABLES
-- ============================================
-- This migration creates the database schema for the adaptive aptitude testing system.
-- The test adapts difficulty based on student responses to accurately measure aptitude level.
--
-- Requirements: 7.1, 7.2, 8.1, 8.2, 8.3

-- ============================================
-- CUSTOM TYPES (ENUMS)
-- ============================================

-- Grade level for the test
DO $$ BEGIN
  CREATE TYPE grade_level AS ENUM ('middle_school', 'high_school');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Test phases in the adaptive aptitude test flow
DO $$ BEGIN
  CREATE TYPE test_phase AS ENUM ('diagnostic_screener', 'adaptive_core', 'stability_confirmation');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tier classification based on diagnostic screener performance
DO $$ BEGIN
  CREATE TYPE tier_classification AS ENUM ('L', 'M', 'H');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Confidence tag for final results
DO $$ BEGIN
  CREATE TYPE confidence_tag AS ENUM ('high', 'medium', 'low');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Question subtags for categorizing aptitude areas
DO $$ BEGIN
  CREATE TYPE question_subtag AS ENUM (
    'numerical_reasoning',
    'logical_reasoning',
    'verbal_reasoning',
    'spatial_reasoning',
    'data_interpretation',
    'pattern_recognition'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Session status
DO $$ BEGIN
  CREATE TYPE session_status AS ENUM ('in_progress', 'completed', 'abandoned');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Path classification for analytics
DO $$ BEGIN
  CREATE TYPE path_classification AS ENUM ('ascending', 'descending', 'stable', 'fluctuating');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;


-- ============================================
-- 1. ADAPTIVE APTITUDE SESSIONS TABLE
-- ============================================
-- Tracks active and completed test sessions
-- Requirements: 7.2

CREATE TABLE IF NOT EXISTS adaptive_aptitude_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Student reference
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Test configuration
  grade_level grade_level NOT NULL,
  
  -- Current state
  current_phase test_phase NOT NULL DEFAULT 'diagnostic_screener',
  tier tier_classification,  -- Set after diagnostic screener completes
  current_difficulty SMALLINT NOT NULL DEFAULT 3 CHECK (current_difficulty BETWEEN 1 AND 5),
  
  -- Progress tracking
  difficulty_path SMALLINT[] NOT NULL DEFAULT ARRAY[]::SMALLINT[],
  questions_answered INTEGER NOT NULL DEFAULT 0,
  correct_answers INTEGER NOT NULL DEFAULT 0,
  current_question_index INTEGER NOT NULL DEFAULT 0,
  
  -- Phase-specific data
  current_phase_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  provisional_band SMALLINT CHECK (provisional_band IS NULL OR provisional_band BETWEEN 1 AND 5),
  
  -- Session status
  status session_status NOT NULL DEFAULT 'in_progress',
  
  -- Timestamps
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_questions_answered CHECK (questions_answered >= 0),
  CONSTRAINT valid_correct_answers CHECK (correct_answers >= 0 AND correct_answers <= questions_answered),
  CONSTRAINT valid_question_index CHECK (current_question_index >= 0)
);

-- Indexes for adaptive_aptitude_sessions
CREATE INDEX IF NOT EXISTS idx_adaptive_sessions_student ON adaptive_aptitude_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_sessions_status ON adaptive_aptitude_sessions(status);
CREATE INDEX IF NOT EXISTS idx_adaptive_sessions_grade_level ON adaptive_aptitude_sessions(grade_level);
CREATE INDEX IF NOT EXISTS idx_adaptive_sessions_started_at ON adaptive_aptitude_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_adaptive_sessions_student_status ON adaptive_aptitude_sessions(student_id, status);

-- Comment on table
COMMENT ON TABLE adaptive_aptitude_sessions IS 'Tracks adaptive aptitude test sessions with phase progression and difficulty adaptation';
COMMENT ON COLUMN adaptive_aptitude_sessions.tier IS 'Tier classification (L/M/H) determined after diagnostic screener phase';
COMMENT ON COLUMN adaptive_aptitude_sessions.difficulty_path IS 'Array tracking difficulty level at each question for analytics';
COMMENT ON COLUMN adaptive_aptitude_sessions.provisional_band IS 'Provisional aptitude band updated during adaptive core phase';


-- ============================================
-- 2. ADAPTIVE APTITUDE RESPONSES TABLE
-- ============================================
-- Tracks individual question responses with timing
-- Requirements: 7.2

CREATE TABLE IF NOT EXISTS adaptive_aptitude_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Session reference
  session_id UUID NOT NULL REFERENCES adaptive_aptitude_sessions(id) ON DELETE CASCADE,
  
  -- Question reference
  question_id TEXT NOT NULL,
  
  -- Response data
  selected_answer CHAR(1) NOT NULL CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN NOT NULL,
  
  -- Timing
  response_time_ms INTEGER NOT NULL CHECK (response_time_ms >= 0),
  
  -- Context at time of response
  difficulty_at_time SMALLINT NOT NULL CHECK (difficulty_at_time BETWEEN 1 AND 5),
  subtag question_subtag NOT NULL,
  phase test_phase NOT NULL,
  
  -- Sequence tracking
  sequence_number INTEGER NOT NULL CHECK (sequence_number > 0),
  
  -- Timestamp
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique sequence per session
  CONSTRAINT unique_sequence_per_session UNIQUE (session_id, sequence_number)
);

-- Indexes for adaptive_aptitude_responses
CREATE INDEX IF NOT EXISTS idx_adaptive_responses_session ON adaptive_aptitude_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_responses_question ON adaptive_aptitude_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_responses_phase ON adaptive_aptitude_responses(phase);
CREATE INDEX IF NOT EXISTS idx_adaptive_responses_subtag ON adaptive_aptitude_responses(subtag);
CREATE INDEX IF NOT EXISTS idx_adaptive_responses_difficulty ON adaptive_aptitude_responses(difficulty_at_time);
CREATE INDEX IF NOT EXISTS idx_adaptive_responses_session_sequence ON adaptive_aptitude_responses(session_id, sequence_number);

-- Comment on table
COMMENT ON TABLE adaptive_aptitude_responses IS 'Records individual question responses with timing and context for analytics';
COMMENT ON COLUMN adaptive_aptitude_responses.response_time_ms IS 'Time taken to answer in milliseconds';
COMMENT ON COLUMN adaptive_aptitude_responses.difficulty_at_time IS 'Difficulty level when question was presented';
COMMENT ON COLUMN adaptive_aptitude_responses.sequence_number IS '1-based sequence number within the test session';


-- ============================================
-- 3. ADAPTIVE APTITUDE RESULTS TABLE
-- ============================================
-- Stores final results with analytics data
-- Requirements: 8.1, 8.2, 8.3

CREATE TABLE IF NOT EXISTS adaptive_aptitude_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  session_id UUID NOT NULL UNIQUE REFERENCES adaptive_aptitude_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Final results
  aptitude_level SMALLINT NOT NULL CHECK (aptitude_level BETWEEN 1 AND 5),
  confidence_tag confidence_tag NOT NULL,
  tier tier_classification NOT NULL,
  
  -- Summary statistics
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  total_correct INTEGER NOT NULL CHECK (total_correct >= 0 AND total_correct <= total_questions),
  overall_accuracy DECIMAL(5,2) NOT NULL CHECK (overall_accuracy >= 0 AND overall_accuracy <= 100),
  
  -- Analytics data (JSONB for flexibility)
  -- Format: { "1": { "correct": 2, "total": 3, "accuracy": 66.67 }, ... }
  accuracy_by_difficulty JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Format: { "numerical_reasoning": { "correct": 2, "total": 4, "accuracy": 50.0 }, ... }
  accuracy_by_subtag JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Difficulty path through the test
  difficulty_path SMALLINT[] NOT NULL,
  
  -- Path classification for analytics
  path_classification path_classification NOT NULL,
  
  -- Timing
  average_response_time_ms INTEGER NOT NULL CHECK (average_response_time_ms >= 0),
  
  -- Test configuration
  grade_level grade_level NOT NULL,
  
  -- Timestamp
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one result per student per grade level (optional - can be removed if retakes allowed)
  -- CONSTRAINT unique_student_grade_result UNIQUE (student_id, grade_level)
  
  -- Index for looking up latest result
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for adaptive_aptitude_results
CREATE INDEX IF NOT EXISTS idx_adaptive_results_session ON adaptive_aptitude_results(session_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_results_student ON adaptive_aptitude_results(student_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_results_aptitude_level ON adaptive_aptitude_results(aptitude_level);
CREATE INDEX IF NOT EXISTS idx_adaptive_results_confidence ON adaptive_aptitude_results(confidence_tag);
CREATE INDEX IF NOT EXISTS idx_adaptive_results_grade_level ON adaptive_aptitude_results(grade_level);
CREATE INDEX IF NOT EXISTS idx_adaptive_results_completed_at ON adaptive_aptitude_results(completed_at);
CREATE INDEX IF NOT EXISTS idx_adaptive_results_student_completed ON adaptive_aptitude_results(student_id, completed_at DESC);

-- GIN index for JSONB analytics queries
CREATE INDEX IF NOT EXISTS idx_adaptive_results_accuracy_difficulty_gin ON adaptive_aptitude_results USING gin(accuracy_by_difficulty);
CREATE INDEX IF NOT EXISTS idx_adaptive_results_accuracy_subtag_gin ON adaptive_aptitude_results USING gin(accuracy_by_subtag);

-- Comment on table
COMMENT ON TABLE adaptive_aptitude_results IS 'Stores final adaptive aptitude test results with comprehensive analytics';
COMMENT ON COLUMN adaptive_aptitude_results.aptitude_level IS 'Final aptitude level (1-5) determined by the adaptive algorithm';
COMMENT ON COLUMN adaptive_aptitude_results.accuracy_by_difficulty IS 'JSON object with accuracy breakdown by difficulty level (1-5)';
COMMENT ON COLUMN adaptive_aptitude_results.accuracy_by_subtag IS 'JSON object with accuracy breakdown by question subtag';
COMMENT ON COLUMN adaptive_aptitude_results.path_classification IS 'Classification of difficulty path: ascending, descending, stable, or fluctuating';


-- ============================================
-- 4. ADAPTIVE APTITUDE QUESTIONS CACHE TABLE
-- ============================================
-- Cache generated questions by grade level and phase
-- Requirements: 7.1

CREATE TABLE IF NOT EXISTS adaptive_aptitude_questions_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Question identification
  question_id TEXT NOT NULL UNIQUE,
  
  -- Question content
  text TEXT NOT NULL,
  options JSONB NOT NULL,  -- { "A": "...", "B": "...", "C": "...", "D": "..." }
  correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  
  -- Classification
  difficulty SMALLINT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  subtag question_subtag NOT NULL,
  grade_level grade_level NOT NULL,
  phase test_phase NOT NULL,
  
  -- Optional explanation
  explanation TEXT,
  
  -- Cache metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  usage_count INTEGER NOT NULL DEFAULT 0,
  
  -- Quality tracking
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Validation
  CONSTRAINT valid_options CHECK (
    options ? 'A' AND options ? 'B' AND options ? 'C' AND options ? 'D'
  )
);

-- Indexes for adaptive_aptitude_questions_cache
CREATE INDEX IF NOT EXISTS idx_questions_cache_question_id ON adaptive_aptitude_questions_cache(question_id);
CREATE INDEX IF NOT EXISTS idx_questions_cache_grade_level ON adaptive_aptitude_questions_cache(grade_level);
CREATE INDEX IF NOT EXISTS idx_questions_cache_phase ON adaptive_aptitude_questions_cache(phase);
CREATE INDEX IF NOT EXISTS idx_questions_cache_difficulty ON adaptive_aptitude_questions_cache(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_cache_subtag ON adaptive_aptitude_questions_cache(subtag);
CREATE INDEX IF NOT EXISTS idx_questions_cache_active ON adaptive_aptitude_questions_cache(is_active);

-- Composite index for common query pattern: find questions by grade, phase, difficulty
CREATE INDEX IF NOT EXISTS idx_questions_cache_lookup ON adaptive_aptitude_questions_cache(grade_level, phase, difficulty, subtag) WHERE is_active = TRUE;

-- GIN index for options JSONB
CREATE INDEX IF NOT EXISTS idx_questions_cache_options_gin ON adaptive_aptitude_questions_cache USING gin(options);

-- Comment on table
COMMENT ON TABLE adaptive_aptitude_questions_cache IS 'Caches AI-generated questions for reuse across test sessions';
COMMENT ON COLUMN adaptive_aptitude_questions_cache.question_id IS 'Unique identifier for the question, used for deduplication';
COMMENT ON COLUMN adaptive_aptitude_questions_cache.options IS 'JSON object with answer options A, B, C, D';
COMMENT ON COLUMN adaptive_aptitude_questions_cache.usage_count IS 'Number of times this question has been used in tests';
COMMENT ON COLUMN adaptive_aptitude_questions_cache.is_active IS 'Whether this question is available for use (can be deactivated if quality issues found)';


-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================

-- Reuse existing function if available, otherwise create
CREATE OR REPLACE FUNCTION update_adaptive_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sessions table
DROP TRIGGER IF EXISTS update_adaptive_sessions_updated_at ON adaptive_aptitude_sessions;
CREATE TRIGGER update_adaptive_sessions_updated_at
  BEFORE UPDATE ON adaptive_aptitude_sessions
  FOR EACH ROW EXECUTE FUNCTION update_adaptive_updated_at();


-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE adaptive_aptitude_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE adaptive_aptitude_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE adaptive_aptitude_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE adaptive_aptitude_questions_cache ENABLE ROW LEVEL SECURITY;

-- Sessions: Students can only access their own sessions
CREATE POLICY "Students can view own sessions"
  ON adaptive_aptitude_sessions FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Students can create own sessions"
  ON adaptive_aptitude_sessions FOR INSERT
  WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Students can update own sessions"
  ON adaptive_aptitude_sessions FOR UPDATE
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));


-- Responses: Students can only access responses for their own sessions
CREATE POLICY "Students can view own responses"
  ON adaptive_aptitude_responses FOR SELECT
  USING (session_id IN (
    SELECT id FROM adaptive_aptitude_sessions 
    WHERE student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  ));

CREATE POLICY "Students can create responses for own sessions"
  ON adaptive_aptitude_responses FOR INSERT
  WITH CHECK (session_id IN (
    SELECT id FROM adaptive_aptitude_sessions 
    WHERE student_id IN (SELECT id FROM students WHERE user_id = auth.uid())
  ));


-- Results: Students can only view their own results
CREATE POLICY "Students can view own results"
  ON adaptive_aptitude_results FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

CREATE POLICY "Students can create own results"
  ON adaptive_aptitude_results FOR INSERT
  WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- Questions cache: All authenticated users can read (questions are shared)
CREATE POLICY "Authenticated users can read questions"
  ON adaptive_aptitude_questions_cache FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = TRUE);

-- Allow authenticated users to insert questions (for AI generation from frontend)
CREATE POLICY "Authenticated users can insert questions"
  ON adaptive_aptitude_questions_cache FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update questions (for usage tracking)
CREATE POLICY "Authenticated users can update questions"
  ON adaptive_aptitude_questions_cache FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Service role can manage all questions
CREATE POLICY "Service role can manage questions"
  ON adaptive_aptitude_questions_cache FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update question usage statistics
CREATE OR REPLACE FUNCTION update_question_usage(p_question_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE adaptive_aptitude_questions_cache
  SET 
    usage_count = usage_count + 1,
    last_used_at = NOW()
  WHERE question_id = p_question_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get available questions for a test
CREATE OR REPLACE FUNCTION get_available_questions(
  p_grade_level grade_level,
  p_phase test_phase,
  p_difficulty SMALLINT DEFAULT NULL,
  p_subtag question_subtag DEFAULT NULL,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  question_id TEXT,
  text TEXT,
  options JSONB,
  correct_answer CHAR(1),
  difficulty SMALLINT,
  subtag question_subtag,
  explanation TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.id,
    q.question_id,
    q.text,
    q.options,
    q.correct_answer,
    q.difficulty,
    q.subtag,
    q.explanation
  FROM adaptive_aptitude_questions_cache q
  WHERE q.grade_level = p_grade_level
    AND q.phase = p_phase
    AND q.is_active = TRUE
    AND (p_difficulty IS NULL OR q.difficulty = p_difficulty)
    AND (p_subtag IS NULL OR q.subtag = p_subtag)
  ORDER BY q.usage_count ASC, RANDOM()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Function to calculate session statistics
CREATE OR REPLACE FUNCTION calculate_session_stats(p_session_id UUID)
RETURNS TABLE (
  total_questions INTEGER,
  total_correct INTEGER,
  overall_accuracy DECIMAL(5,2),
  avg_response_time_ms INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_questions,
    COUNT(*) FILTER (WHERE is_correct)::INTEGER as total_correct,
    ROUND((COUNT(*) FILTER (WHERE is_correct)::DECIMAL / NULLIF(COUNT(*), 0)) * 100, 2) as overall_accuracy,
    ROUND(AVG(response_time_ms))::INTEGER as avg_response_time_ms
  FROM adaptive_aptitude_responses
  WHERE session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_question_usage(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_questions(grade_level, test_phase, SMALLINT, question_subtag, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_session_stats(UUID) TO authenticated;

