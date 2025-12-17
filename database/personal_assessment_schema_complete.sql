-- ==================================================================================
-- PERSONAL ASSESSMENT SYSTEM - COMPLETE SCHEMA
-- Supports: After 12th (College), High School (Grades 9-12), Middle School (Grades 6-8)
-- ==================================================================================

-- ==================== STREAMS TABLE ====================
-- Defines available educational streams/grade levels
CREATE TABLE IF NOT EXISTS public.personal_assessment_streams (
  id TEXT PRIMARY KEY,  -- 'cs', 'bca', 'bba', 'middle_school', 'high_school', etc.
  name TEXT NOT NULL,
  description TEXT,
  grade_level TEXT NOT NULL CHECK (grade_level IN ('middle', 'highschool', 'after12')),
  -- middle = Grades 6-8, highschool = Grades 9-12, after12 = College/University
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== SECTIONS TABLE ====================
-- Defines assessment sections (Interest Explorer, Strengths & Character, etc.)
CREATE TABLE IF NOT EXISTS public.personal_assessment_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  instruction TEXT,
  color TEXT DEFAULT 'blue',  -- Color theme for UI (rose, amber, blue, purple, etc.)
  icon TEXT,  -- Icon identifier for UI
  grade_level TEXT NOT NULL CHECK (grade_level IN ('middle', 'highschool', 'after12')),
  is_stream_specific BOOLEAN DEFAULT false,  -- True for knowledge section (stream-specific questions)
  is_timed BOOLEAN DEFAULT false,
  time_limit_seconds INTEGER,  -- Time limit in seconds for timed sections
  order_number INTEGER NOT NULL,  -- Display order
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== QUESTIONS TABLE ====================
-- All assessment questions across all sections and grade levels
CREATE TABLE IF NOT EXISTS public.personal_assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.personal_assessment_sections(id) ON DELETE CASCADE,
  stream_id TEXT REFERENCES public.personal_assessment_streams(id),  -- NULL for general questions

  -- Question Content
  text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN (
    'rating',          -- Likert scale (1-5 or 1-4)
    'multiselect',     -- Pick N from options
    'singleselect',    -- Single choice from options
    'mcq',             -- Multiple choice with correct answer
    'text',            -- Open-ended text response
    'sjt'              -- Situational Judgment (best/worst)
  )),

  -- Options (for choice-based questions)
  options JSONB,  -- Array of options: ["option1", "option2", ...]
  max_selections INTEGER,  -- For multiselect: how many to pick

  -- Additional Metadata
  placeholder TEXT,  -- For text inputs
  description TEXT,  -- Additional context or instructions
  category_mapping JSONB,  -- For RIASEC mapping: {"option": "R", "option2": "A", ...}
  strength_type TEXT,  -- For strengths questions: 'Curiosity', 'Perseverance', etc.
  task_type TEXT,  -- For aptitude questions: 'Analytical', 'Creative', 'Technical', 'Social'

  -- Scoring (for MCQ/aptitude)
  correct_answer TEXT,  -- For MCQ questions
  points INTEGER DEFAULT 1,

  -- Ordering
  order_number INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(section_id, order_number)
);

-- ==================== RESPONSE SCALES TABLE ====================
-- Defines rating scales for different sections/grade levels
CREATE TABLE IF NOT EXISTS public.personal_assessment_response_scales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.personal_assessment_sections(id) ON DELETE CASCADE,
  scale_name TEXT NOT NULL,  -- 'middle_school_strengths', 'high_school_strengths', 'aptitude', etc.
  scale_values JSONB NOT NULL,  -- [{"value": 1, "label": "Not like me"}, ...]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== ATTEMPTS TABLE ====================
-- Tracks individual assessment attempts
CREATE TABLE IF NOT EXISTS public.personal_assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,  -- References auth.users or students table
  stream_id TEXT NOT NULL REFERENCES public.personal_assessment_streams(id),
  grade_level TEXT NOT NULL CHECK (grade_level IN ('middle', 'highschool', 'after12')),

  -- Progress Tracking
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  current_section_index INTEGER DEFAULT 0,
  current_question_index INTEGER DEFAULT 0,

  -- Timing Data
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  timer_remaining INTEGER,  -- Seconds remaining for timed sections
  elapsed_time INTEGER DEFAULT 0,  -- Total time spent in seconds
  section_timings JSONB DEFAULT '[]'::jsonb,  -- [{sectionIndex, startTime, endTime, timeSpent}]

  -- Results
  raw_scores JSONB,  -- Store calculated scores: {R: 12, I: 15, A: 8, ...}
  analysis_result JSONB,  -- AI-generated analysis from Gemini

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== RESPONSES TABLE ====================
-- Individual question responses
CREATE TABLE IF NOT EXISTS public.personal_assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.personal_assessment_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.personal_assessment_questions(id) ON DELETE CASCADE,

  -- Response Data (polymorphic based on question type)
  response_value JSONB NOT NULL,  -- Can store: number, string, array, object
  -- Examples:
  -- Rating: 4
  -- Multiselect: ["option1", "option2"]
  -- Singleselect: "option3"
  -- Text: "My response text..."
  -- SJT: {"best": "option1", "worst": "option2"}

  is_correct BOOLEAN,  -- For MCQ questions
  time_taken INTEGER,  -- Time taken in seconds

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(attempt_id, question_id)
);

-- ==================== ASSESSMENT RESULTS TABLE ====================
-- Processed and analyzed assessment results
CREATE TABLE IF NOT EXISTS public.personal_assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.personal_assessment_attempts(id) ON DELETE CASCADE UNIQUE,
  student_id TEXT NOT NULL,
  grade_level TEXT NOT NULL CHECK (grade_level IN ('middle', 'highschool', 'after12')),

  -- RIASEC Scores (for all grade levels)
  riasec_scores JSONB NOT NULL,  -- {R: 15, I: 12, A: 8, S: 10, E: 7, C: 5}
  top_interests TEXT[],  -- ['R', 'I', 'S']

  -- Strengths & Character (VIA-style)
  strengths_scores JSONB,  -- {Curiosity: 4, Perseverance: 3, ...}
  top_strengths TEXT[],

  -- Learning Preferences
  learning_styles TEXT[],
  work_preferences TEXT[],

  -- Aptitude (for high school)
  aptitude_scores JSONB,  -- {Analytical: {ease: 3, enjoyment: 4}, Creative: {...}}

  -- Big Five Personality (for after12)
  personality_scores JSONB,  -- {Openness: 4.2, Conscientiousness: 3.8, ...}

  -- Work Values (for after12)
  work_values_scores JSONB,

  -- Employability (for after12)
  employability_score INTEGER,

  -- Knowledge/Aptitude Test Results (for after12)
  knowledge_score INTEGER,
  knowledge_percentage NUMERIC(5,2),
  aptitude_overall_score INTEGER,

  -- AI Analysis
  gemini_analysis JSONB,  -- Full AI-generated insights and recommendations
  career_recommendations TEXT[],  -- Suggested career paths
  skill_gaps TEXT[],  -- Areas for improvement

  -- Report Metadata
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  report_url TEXT,  -- Link to generated PDF report

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================== ASSESSMENT RESTRICTIONS TABLE ====================
-- Prevent too-frequent retakes
CREATE TABLE IF NOT EXISTS public.personal_assessment_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  last_attempt_date TIMESTAMP WITH TIME ZONE NOT NULL,
  next_allowed_date TIMESTAMP WITH TIME ZONE NOT NULL,  -- 90 days after last attempt
  grade_level TEXT NOT NULL CHECK (grade_level IN ('middle', 'highschool', 'after12')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(student_id, grade_level)
);

-- ==================== INDEXES FOR PERFORMANCE ====================
CREATE INDEX IF NOT EXISTS idx_assessment_sections_grade_level ON public.personal_assessment_sections(grade_level, order_number);
CREATE INDEX IF NOT EXISTS idx_assessment_sections_active ON public.personal_assessment_sections(is_active);

CREATE INDEX IF NOT EXISTS idx_assessment_questions_section ON public.personal_assessment_questions(section_id, order_number);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_stream ON public.personal_assessment_questions(stream_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_active ON public.personal_assessment_questions(is_active);

CREATE INDEX IF NOT EXISTS idx_assessment_attempts_student ON public.personal_assessment_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_status ON public.personal_assessment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_grade_level ON public.personal_assessment_attempts(grade_level);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_started ON public.personal_assessment_attempts(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_assessment_responses_attempt ON public.personal_assessment_responses(attempt_id);
CREATE INDEX IF NOT EXISTS idx_assessment_responses_question ON public.personal_assessment_responses(question_id);

CREATE INDEX IF NOT EXISTS idx_assessment_results_student ON public.personal_assessment_results(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_grade_level ON public.personal_assessment_results(grade_level);

CREATE INDEX IF NOT EXISTS idx_assessment_restrictions_student ON public.personal_assessment_restrictions(student_id, grade_level);
CREATE INDEX IF NOT EXISTS idx_assessment_restrictions_next_allowed ON public.personal_assessment_restrictions(next_allowed_date);

-- ==================== TRIGGERS FOR UPDATED_AT ====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_assessment_streams_updated_at ON public.personal_assessment_streams;
CREATE TRIGGER update_assessment_streams_updated_at BEFORE UPDATE ON public.personal_assessment_streams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assessment_sections_updated_at ON public.personal_assessment_sections;
CREATE TRIGGER update_assessment_sections_updated_at BEFORE UPDATE ON public.personal_assessment_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assessment_questions_updated_at ON public.personal_assessment_questions;
CREATE TRIGGER update_assessment_questions_updated_at BEFORE UPDATE ON public.personal_assessment_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assessment_attempts_updated_at ON public.personal_assessment_attempts;
CREATE TRIGGER update_assessment_attempts_updated_at BEFORE UPDATE ON public.personal_assessment_attempts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assessment_responses_updated_at ON public.personal_assessment_responses;
CREATE TRIGGER update_assessment_responses_updated_at BEFORE UPDATE ON public.personal_assessment_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assessment_results_updated_at ON public.personal_assessment_results;
CREATE TRIGGER update_assessment_results_updated_at BEFORE UPDATE ON public.personal_assessment_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== ROW LEVEL SECURITY (RLS) ====================
ALTER TABLE public.personal_assessment_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_assessment_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_assessment_response_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_assessment_restrictions ENABLE ROW LEVEL SECURITY;

-- Streams: Anyone can view active streams
DROP POLICY IF EXISTS "Anyone can view active streams" ON public.personal_assessment_streams;
CREATE POLICY "Anyone can view active streams" ON public.personal_assessment_streams
  FOR SELECT USING (is_active = true);

-- Sections: Anyone can view active sections
DROP POLICY IF EXISTS "Anyone can view active sections" ON public.personal_assessment_sections;
CREATE POLICY "Anyone can view active sections" ON public.personal_assessment_sections
  FOR SELECT USING (is_active = true);

-- Questions: Anyone can view active questions
DROP POLICY IF EXISTS "Anyone can view active questions" ON public.personal_assessment_questions;
CREATE POLICY "Anyone can view active questions" ON public.personal_assessment_questions
  FOR SELECT USING (is_active = true);

-- Response Scales: Anyone can view
DROP POLICY IF EXISTS "Anyone can view response scales" ON public.personal_assessment_response_scales;
CREATE POLICY "Anyone can view response scales" ON public.personal_assessment_response_scales
  FOR SELECT USING (true);

-- Attempts: Students can manage their own attempts
DROP POLICY IF EXISTS "Students can view their own attempts" ON public.personal_assessment_attempts;
CREATE POLICY "Students can view their own attempts" ON public.personal_assessment_attempts
  FOR SELECT USING (auth.uid()::text = student_id);

DROP POLICY IF EXISTS "Students can create their own attempts" ON public.personal_assessment_attempts;
CREATE POLICY "Students can create their own attempts" ON public.personal_assessment_attempts
  FOR INSERT WITH CHECK (auth.uid()::text = student_id);

DROP POLICY IF EXISTS "Students can update their own attempts" ON public.personal_assessment_attempts;
CREATE POLICY "Students can update their own attempts" ON public.personal_assessment_attempts
  FOR UPDATE USING (auth.uid()::text = student_id);

-- Responses: Students can manage their own responses
DROP POLICY IF EXISTS "Students can view their own responses" ON public.personal_assessment_responses;
CREATE POLICY "Students can view their own responses" ON public.personal_assessment_responses
  FOR SELECT USING (
    attempt_id IN (
      SELECT id FROM public.personal_assessment_attempts WHERE student_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Students can create their own responses" ON public.personal_assessment_responses;
CREATE POLICY "Students can create their own responses" ON public.personal_assessment_responses
  FOR INSERT WITH CHECK (
    attempt_id IN (
      SELECT id FROM public.personal_assessment_attempts WHERE student_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Students can update their own responses" ON public.personal_assessment_responses;
CREATE POLICY "Students can update their own responses" ON public.personal_assessment_responses
  FOR UPDATE USING (
    attempt_id IN (
      SELECT id FROM public.personal_assessment_attempts WHERE student_id = auth.uid()::text
    )
  );

-- Results: Students can view their own results
DROP POLICY IF EXISTS "Students can view their own results" ON public.personal_assessment_results;
CREATE POLICY "Students can view their own results" ON public.personal_assessment_results
  FOR SELECT USING (auth.uid()::text = student_id);

DROP POLICY IF EXISTS "Students can insert their own results" ON public.personal_assessment_results;
CREATE POLICY "Students can insert their own results" ON public.personal_assessment_results
  FOR INSERT WITH CHECK (auth.uid()::text = student_id);

-- Restrictions: Students can view their own restrictions
DROP POLICY IF EXISTS "Students can view their own restrictions" ON public.personal_assessment_restrictions;
CREATE POLICY "Students can view their own restrictions" ON public.personal_assessment_restrictions
  FOR SELECT USING (auth.uid()::text = student_id);

-- ==================== HELPER FUNCTIONS ====================

-- Function to check if student can take assessment
CREATE OR REPLACE FUNCTION can_take_assessment(p_student_id TEXT, p_grade_level TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_last_restriction RECORD;
BEGIN
  SELECT * INTO v_last_restriction
  FROM public.personal_assessment_restrictions
  WHERE student_id = p_student_id
    AND grade_level = p_grade_level
  ORDER BY last_attempt_date DESC
  LIMIT 1;

  -- If no restriction exists, can take assessment
  IF v_last_restriction IS NULL THEN
    RETURN true;
  END IF;

  -- Check if enough time has passed (90 days)
  IF NOW() >= v_last_restriction.next_allowed_date THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to create restriction after assessment completion
CREATE OR REPLACE FUNCTION create_assessment_restriction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO public.personal_assessment_restrictions (student_id, last_attempt_date, next_allowed_date, grade_level)
    VALUES (NEW.student_id, NEW.completed_at, NEW.completed_at + INTERVAL '90 days', NEW.grade_level)
    ON CONFLICT (student_id, grade_level)
    DO UPDATE SET
      last_attempt_date = EXCLUDED.last_attempt_date,
      next_allowed_date = EXCLUDED.next_allowed_date;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS assessment_restriction_trigger ON public.personal_assessment_attempts;
CREATE TRIGGER assessment_restriction_trigger
  AFTER UPDATE ON public.personal_assessment_attempts
  FOR EACH ROW
  EXECUTE FUNCTION create_assessment_restriction();

-- ==================== COMMENTS ====================
COMMENT ON TABLE public.personal_assessment_streams IS 'Educational streams and grade levels for assessments';
COMMENT ON TABLE public.personal_assessment_sections IS 'Assessment sections (Interest Explorer, Strengths, etc.) for all grade levels';
COMMENT ON TABLE public.personal_assessment_questions IS 'All assessment questions across all sections and grade levels';
COMMENT ON TABLE public.personal_assessment_response_scales IS 'Rating scales for different sections (1-4, 1-5, etc.)';
COMMENT ON TABLE public.personal_assessment_attempts IS 'Individual student assessment attempts with progress tracking';
COMMENT ON TABLE public.personal_assessment_responses IS 'Student responses to individual questions';
COMMENT ON TABLE public.personal_assessment_results IS 'Processed assessment results with scores and AI analysis';
COMMENT ON TABLE public.personal_assessment_restrictions IS '90-day restriction to prevent frequent retakes';
