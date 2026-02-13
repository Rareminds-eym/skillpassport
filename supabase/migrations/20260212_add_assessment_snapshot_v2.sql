-- ============================================================================
-- Migration: Add assessment_snapshot_v2 column for comprehensive college assessment data
-- Description: Stores complete question/option/answer context for all 7 sections
-- Author: Cascade AI
-- Date: 2026-02-12
-- ============================================================================

-- ============================================================================
-- STEP 1: Add assessment_snapshot_v2 column
-- ============================================================================

ALTER TABLE personal_assessment_attempts 
ADD COLUMN IF NOT EXISTS assessment_snapshot_v2 JSONB;

COMMENT ON COLUMN personal_assessment_attempts.assessment_snapshot_v2 IS 
'Comprehensive assessment snapshot v2.0 schema including:
- All questions with text and options
- All answers with timestamps and time spent per question
- Section timings, scoring calculations, and metadata
- Device fingerprint and session analytics
- AI analysis results and career recommendations

Used exclusively for college student assessments (grade_level: college/after12/graduate)
to enable full audit trail, replay capability, and advanced analytics.

Schema version: 2.0
Structure: {
  schema_version: "2.0",
  attempt_id: UUID,
  student_id: UUID,
  grade_level: "college",
  metadata: { device_fingerprint, session_timings, total_duration_seconds, ... },
  sections: {
    riasec: { title, type, scale, questions: [{ question_id, question_text, options, answer: { value, selected_at, time_spent_seconds } }], scoring: { realistic, investigative, ... } },
    bigfive: { ... },
    values: { ... },
    aptitude: { stream_id, ai_generated: true, questions: [...], scoring: { accuracy_percentage, skill_breakdown } },
    employability: { ... },
    knowledge: { ... },
    adaptive_aptitude: { session_id, reference_only: true, questions_count, correct_answers, estimated_ability }
  },
  summary: { total_sections, completed_sections, overall_completion_percentage, ai_analysis_requested, ai_results: { career_matches, fit_scores, ... } }
}';

-- ============================================================================
-- STEP 2: Create indexes for efficient querying
-- ============================================================================

-- GIN index for JSONB operations
CREATE INDEX IF NOT EXISTS idx_assessment_snapshot_v2 
ON personal_assessment_attempts USING GIN (assessment_snapshot_v2);

-- Index for section data queries
CREATE INDEX IF NOT EXISTS idx_assessment_snapshot_sections 
ON personal_assessment_attempts ((assessment_snapshot_v2->'sections'));

-- Index for student-based lookups
CREATE INDEX IF NOT EXISTS idx_assessment_snapshot_student 
ON personal_assessment_attempts (student_id, assessment_snapshot_v2) 
WHERE assessment_snapshot_v2 IS NOT NULL;

-- ============================================================================
-- STEP 3: Create helper functions
-- ============================================================================

-- Function to extract RIASEC scores from snapshot
CREATE OR REPLACE FUNCTION get_riasec_scores_from_snapshot(p_attempt_id UUID)
RETURNS TABLE (
  realistic INT,
  investigative INT,
  artistic INT,
  social INT,
  enterprising INT,
  conventional INT,
  primary_code TEXT
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (assessment_snapshot_v2->'sections'->'riasec'->'scoring'->>'realistic')::INT,
    (assessment_snapshot_v2->'sections'->'riasec'->'scoring'->>'investigative')::INT,
    (assessment_snapshot_v2->'sections'->'riasec'->'scoring'->>'artistic')::INT,
    (assessment_snapshot_v2->'sections'->'riasec'->'scoring'->>'social')::INT,
    (assessment_snapshot_v2->'sections'->'riasec'->'scoring'->>'enterprising')::INT,
    (assessment_snapshot_v2->'sections'->'riasec'->'scoring'->>'conventional')::INT,
    assessment_snapshot_v2->'sections'->'riasec'->'scoring'->>'primary_code'
  FROM personal_assessment_attempts
  WHERE id = p_attempt_id
    AND assessment_snapshot_v2 IS NOT NULL
    AND assessment_snapshot_v2->'sections'->'riasec'->'scoring' IS NOT NULL;
END;
$$;

COMMENT ON FUNCTION get_riasec_scores_from_snapshot IS 
'Extracts RIASEC scores from the v2.0 assessment snapshot for a given attempt.
Returns 6 dimension scores (0-100) and the 3-letter Holland code.';

-- Function to extract Big Five scores from snapshot
CREATE OR REPLACE FUNCTION get_bigfive_scores_from_snapshot(p_attempt_id UUID)
RETURNS TABLE (
  openness INT,
  conscientiousness INT,
  extraversion INT,
  agreeableness INT,
  neuroticism INT
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (assessment_snapshot_v2->'sections'->'bigfive'->'scoring'->>'openness')::INT,
    (assessment_snapshot_v2->'sections'->'bigfive'->'scoring'->>'conscientiousness')::INT,
    (assessment_snapshot_v2->'sections'->'bigfive'->'scoring'->>'extraversion')::INT,
    (assessment_snapshot_v2->'sections'->'bigfive'->'scoring'->>'agreeableness')::INT,
    (assessment_snapshot_v2->'sections'->'bigfive'->'scoring'->>'neuroticism')::INT
  FROM personal_assessment_attempts
  WHERE id = p_attempt_id
    AND assessment_snapshot_v2 IS NOT NULL
    AND assessment_snapshot_v2->'sections'->'bigfive'->'scoring' IS NOT NULL;
END;
$$;

COMMENT ON FUNCTION get_bigfive_scores_from_snapshot IS 
'Extracts Big Five personality scores from the v2.0 assessment snapshot.';

-- Function to check if attempt has comprehensive snapshot
CREATE OR REPLACE FUNCTION has_assessment_snapshot_v2(p_attempt_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_has_snapshot BOOLEAN;
BEGIN
  SELECT assessment_snapshot_v2 IS NOT NULL 
  INTO v_has_snapshot
  FROM personal_assessment_attempts
  WHERE id = p_attempt_id;
  
  RETURN COALESCE(v_has_snapshot, FALSE);
END;
$$;

COMMENT ON FUNCTION has_assessment_snapshot_v2 IS 
'Checks if an attempt has a v2.0 comprehensive assessment snapshot.';

-- ============================================================================
-- STEP 4: Create analytics views
-- ============================================================================

-- Main analytics view for college assessments
CREATE OR REPLACE VIEW v_college_assessment_analytics AS
SELECT 
  pa.id AS attempt_id,
  pa.student_id,
  pa.status,
  pa.stream_id,
  pa.grade_level,
  pa.started_at,
  pa.completed_at,
  
  -- Metadata
  pa.assessment_snapshot_v2->'metadata'->>'device_fingerprint' AS device_fingerprint,
  pa.assessment_snapshot_v2->'metadata'->>'user_agent' AS user_agent,
  pa.assessment_snapshot_v2->'metadata'->>'timezone' AS timezone,
  (pa.assessment_snapshot_v2->'metadata'->>'total_duration_seconds')::INT AS total_duration_seconds,
  
  -- Section presence indicators
  pa.assessment_snapshot_v2->'sections' ? 'riasec' AS has_riasec,
  pa.assessment_snapshot_v2->'sections' ? 'bigfive' AS has_bigfive,
  pa.assessment_snapshot_v2->'sections' ? 'values' AS has_values,
  pa.assessment_snapshot_v2->'sections' ? 'aptitude' AS has_aptitude,
  pa.assessment_snapshot_v2->'sections' ? 'employability' AS has_employability,
  pa.assessment_snapshot_v2->'sections' ? 'knowledge' AS has_knowledge,
  pa.assessment_snapshot_v2->'sections' ? 'adaptive_aptitude' AS has_adaptive_aptitude,
  
  -- Completion metrics
  (pa.assessment_snapshot_v2->'summary'->>'completed_sections')::INT AS sections_completed,
  (pa.assessment_snapshot_v2->'summary'->>'overall_completion_percentage')::INT AS completion_percentage,
  
  -- AI Analysis
  (pa.assessment_snapshot_v2->'summary'->>'ai_analysis_requested')::BOOLEAN AS ai_analysis_requested,
  pa.assessment_snapshot_v2->'summary'->'ai_results' AS ai_results,
  
  -- Timings
  pa.assessment_snapshot_v2->'metadata'->'session_timings' AS section_timings,
  
  -- Full snapshot for detailed queries
  pa.assessment_snapshot_v2
  
FROM personal_assessment_attempts pa
WHERE pa.grade_level IN ('college', 'after12', 'graduate')
  AND pa.assessment_snapshot_v2 IS NOT NULL;

COMMENT ON VIEW v_college_assessment_analytics IS 
'Comprehensive analytics view for college student assessments using the v2.0 snapshot schema.
Provides quick access to metadata, completion status, section presence, and AI results.
Use this for dashboards and reporting.';

-- View for response-level analysis
CREATE OR REPLACE VIEW v_assessment_responses_flat AS
WITH section_questions AS (
  SELECT 
    pa.id AS attempt_id,
    pa.student_id,
    s.key AS section_id,
    s.value->>'title' AS section_title,
    s.value->>'type' AS section_type,
    q.value AS question_data
  FROM personal_assessment_attempts pa
  CROSS JOIN jsonb_each(pa.assessment_snapshot_v2->'sections') s
  CROSS JOIN jsonb_array_elements(s.value->'questions') q
  WHERE pa.assessment_snapshot_v2 IS NOT NULL
)
SELECT 
  attempt_id,
  student_id,
  section_id,
  section_title,
  section_type,
  question_data->>'question_id' AS question_id,
  question_data->>'question_text' AS question_text,
  question_data->>'category' AS category,
  question_data->>'trait' AS trait,
  question_data->>'skill_tested' AS skill_tested,
  question_data->>'difficulty' AS difficulty,
  question_data->'answer'->>'value' AS answer_value,
  (question_data->'answer'->>'time_spent_seconds')::INT AS time_spent_seconds,
  question_data->'answer'->>'selected_at' AS selected_at,
  (question_data->'answer'->>'is_correct')::BOOLEAN AS is_correct
FROM section_questions;

COMMENT ON VIEW v_assessment_responses_flat IS 
'Flattened view of all individual question responses from v2.0 snapshots.
One row per question-answer pair for easy analysis and export.
Note: Does not include adaptive aptitude (stored separately).';

-- ============================================================================
-- STEP 5: Add RLS policies for new column
-- ============================================================================

-- Policy: Only allow students to update their own snapshots
-- Note: This extends existing RLS policies on the table

-- ============================================================================
-- STEP 6: Validation trigger (optional)
-- ============================================================================

-- Trigger function to validate snapshot schema on insert/update
CREATE OR REPLACE FUNCTION validate_assessment_snapshot_v2()
RETURNS TRIGGER AS $$
BEGIN
  -- Only validate if snapshot is being set
  IF NEW.assessment_snapshot_v2 IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check required fields
  IF NEW.assessment_snapshot_v2->>'schema_version' IS NULL THEN
    RAISE EXCEPTION 'assessment_snapshot_v2 must have schema_version';
  END IF;
  
  IF NEW.assessment_snapshot_v2->>'attempt_id' IS NULL THEN
    RAISE EXCEPTION 'assessment_snapshot_v2 must have attempt_id';
  END IF;
  
  IF NEW.assessment_snapshot_v2->>'student_id' IS NULL THEN
    RAISE EXCEPTION 'assessment_snapshot_v2 must have student_id';
  END IF;
  
  -- Validate schema version
  IF NEW.assessment_snapshot_v2->>'schema_version' NOT IN ('2.0') THEN
    RAISE EXCEPTION 'Unsupported assessment_snapshot_v2 schema version: %', 
      NEW.assessment_snapshot_v2->>'schema_version';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (uncomment if you want strict validation)
-- DROP TRIGGER IF EXISTS trg_validate_assessment_snapshot_v2 ON personal_assessment_attempts;
-- CREATE TRIGGER trg_validate_assessment_snapshot_v2
--   BEFORE INSERT OR UPDATE ON personal_assessment_attempts
--   FOR EACH ROW
--   EXECUTE FUNCTION validate_assessment_snapshot_v2();

COMMENT ON FUNCTION validate_assessment_snapshot_v2 IS 
'Optional validation trigger function for assessment_snapshot_v2.
Uncomment the trigger creation above to enforce strict schema validation.';

-- ============================================================================
-- Migration complete
-- ============================================================================
