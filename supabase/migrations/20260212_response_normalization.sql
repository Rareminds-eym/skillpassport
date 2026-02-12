-- Migration: Response Normalization
-- Purpose: Extract data from all_responses JSONB to properly typed structure
--          and create views for efficient querying

-- ============================================================================
-- STEP 1: Create Function to Parse all_responses and Backfill Missing Data
-- ============================================================================

CREATE OR REPLACE FUNCTION normalize_all_responses()
RETURNS TABLE (
  attempt_id UUID,
  section_id TEXT,
  question_id TEXT,
  response_value JSONB,
  extracted_count INTEGER
) AS $$
DECLARE
  v_attempt RECORD;
  v_key TEXT;
  v_value JSONB;
  v_section_id TEXT;
  v_question_id TEXT;
  v_count INTEGER := 0;
BEGIN
  -- Loop through all attempts that have all_responses
  FOR v_attempt IN 
    SELECT 
      pa.id,
      pa.all_responses,
      pa.grade_level
    FROM personal_assessment_attempts pa
    WHERE pa.all_responses IS NOT NULL
      AND jsonb_typeof(pa.all_responses) = 'object'
  LOOP
    -- Loop through each key in all_responses
    FOR v_key, v_value IN SELECT * FROM jsonb_each(v_attempt.all_responses)
    LOOP
      BEGIN
        -- Parse section_question format
        -- Format: "riasec_r1" or "aptitude_f48f122d-bd34-408f-b45c-948dba1d4701"
        IF v_key LIKE '%_%' THEN
          v_section_id := split_part(v_key, '_', 1);
          v_question_id := substr(v_key, length(v_section_id) + 2);
          
          -- Skip if already exists in personal_assessment_responses
          IF NOT EXISTS (
            SELECT 1 FROM personal_assessment_responses par
            WHERE par.attempt_id = v_attempt.id
            AND par.question_id = v_question_id
          ) THEN
            -- Insert normalized response
            INSERT INTO personal_assessment_responses (
              attempt_id,
              question_id,
              response_value,
              responded_at
            ) VALUES (
              v_attempt.id,
              v_question_id,
              v_value,
              COALESCE(v_attempt.updated_at, v_attempt.started_at, NOW())
            )
            ON CONFLICT (attempt_id, question_id) DO NOTHING;
            
            v_count := v_count + 1;
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        -- Log error but continue processing
        RAISE WARNING 'Error processing key % for attempt %: %', v_key, v_attempt.id, SQLERRM;
      END;
    END LOOP;
    
    attempt_id := v_attempt.id;
    section_id := v_section_id;
    question_id := v_question_id;
    response_value := v_value;
    extracted_count := v_count;
    
    RETURN NEXT;
    v_count := 0;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION normalize_all_responses() IS 
'Backfills personal_assessment_responses table from all_responses JSONB column. 
Returns summary of extracted data. Run this once to migrate historical data.';

-- ============================================================================
-- STEP 2: Create Views for Querying Response Data by Type
-- ============================================================================

-- View: Personality Responses (RIASEC, BigFive)
CREATE OR REPLACE VIEW v_personality_responses AS
SELECT 
  par.id AS response_id,
  par.attempt_id,
  par.question_id,
  CASE 
    WHEN par.question_id LIKE 'riasec_%' THEN 'riasec'
    WHEN par.question_id LIKE 'bigfive_%' THEN 'bigfive'
    ELSE 'unknown'
  END AS section_type,
  split_part(par.question_id, '_', 2) AS question_code,
  par.response_value::text::int AS score,
  pa.student_id,
  pa.grade_level,
  par.responded_at
FROM personal_assessment_responses par
JOIN personal_assessment_attempts pa ON par.attempt_id = pa.id
WHERE par.question_id LIKE 'riasec_%' 
   OR par.question_id LIKE 'bigfive_%';

COMMENT ON VIEW v_personality_responses IS 
'Queryable view of personality assessment responses (RIASEC and Big Five) with numeric scores';

-- View: Work Values Responses
CREATE OR REPLACE VIEW v_work_values_responses AS
SELECT 
  par.id AS response_id,
  par.attempt_id,
  par.question_id,
  split_part(par.question_id, '_', 1) AS value_category,
  split_part(par.question_id, '_', 2) AS question_number,
  par.response_value::text::int AS importance_score,
  pa.student_id,
  pa.grade_level,
  par.responded_at
FROM personal_assessment_responses par
JOIN personal_assessment_attempts pa ON par.attempt_id = pa.id
WHERE par.question_id LIKE 'values_%';

COMMENT ON VIEW v_work_values_responses IS 
'Queryable view of work values responses with importance scores (1-5 scale)';

-- View: MCQ Responses (Aptitude, Knowledge)
CREATE OR REPLACE VIEW v_mcq_responses AS
SELECT 
  par.id AS response_id,
  par.attempt_id,
  par.question_id,
  CASE 
    WHEN par.question_id LIKE 'aptitude_%' THEN 'aptitude'
    WHEN par.question_id LIKE 'knowledge_%' THEN 'knowledge'
    ELSE 'unknown'
  END AS section_type,
  CASE 
    WHEN par.question_id ~ '^[0-9a-f]{8}-' THEN 'ai_generated'
    ELSE split_part(par.question_id, '_', 2)
  END AS question_identifier,
  par.response_value::text AS selected_answer,
  par.is_correct,
  pa.student_id,
  pa.grade_level,
  par.responded_at
FROM personal_assessment_responses par
JOIN personal_assessment_attempts pa ON par.attempt_id = pa.id
WHERE par.question_id LIKE 'aptitude_%' 
   OR par.question_id LIKE 'knowledge_%'
   OR par.question_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-';  -- UUID format for AI questions

COMMENT ON VIEW v_mcq_responses IS 
'Queryable view of multiple choice question responses with correctness flags';

-- View: Employability Skills Responses
CREATE OR REPLACE VIEW v_employability_responses AS
SELECT 
  par.id AS response_id,
  par.attempt_id,
  par.question_id,
  CASE 
    WHEN par.question_id LIKE 'employability_sjt%' THEN 'situational_judgment'
    ELSE 'likert_scale'
  END AS question_type,
  split_part(par.question_id, '_', 2) AS skill_code,
  par.response_value,
  CASE 
    WHEN jsonb_typeof(par.response_value) = 'object' THEN 'json'
    ELSE 'scalar'
  END AS value_type,
  pa.student_id,
  pa.grade_level,
  par.responded_at
FROM personal_assessment_responses par
JOIN personal_assessment_attempts pa ON par.attempt_id = pa.id
WHERE par.question_id LIKE 'employability_%';

COMMENT ON VIEW v_employability_responses IS 
'Queryable view of employability skills responses including SJT and Likert questions';

-- ============================================================================
-- STEP 3: Create Comprehensive Response Summary View
-- ============================================================================

CREATE OR REPLACE VIEW v_assessment_response_summary AS
SELECT 
  pa.id AS attempt_id,
  pa.student_id,
  pa.grade_level,
  pa.status,
  pa.started_at,
  pa.completed_at,
  
  -- Response counts by section
  COUNT(CASE WHEN par.question_id LIKE 'riasec_%' THEN 1 END) AS riasec_responses,
  COUNT(CASE WHEN par.question_id LIKE 'bigfive_%' THEN 1 END) AS bigfive_responses,
  COUNT(CASE WHEN par.question_id LIKE 'values_%' THEN 1 END) AS values_responses,
  COUNT(CASE WHEN par.question_id LIKE 'employability_%' THEN 1 END) AS employability_responses,
  COUNT(CASE WHEN par.question_id LIKE 'aptitude_%' OR par.question_id ~ '^[0-9a-f]{8}-' THEN 1 END) AS aptitude_responses,
  COUNT(CASE WHEN par.question_id LIKE 'knowledge_%' THEN 1 END) AS knowledge_responses,
  
  -- Total responses
  COUNT(par.id) AS total_individual_responses,
  
  -- Has all_responses JSONB (backward compatibility)
  CASE WHEN pa.all_responses IS NOT NULL THEN TRUE ELSE FALSE END AS has_legacy_responses,
  
  -- Data quality check
  CASE 
    WHEN pa.status = 'completed' AND COUNT(par.id) = 0 THEN 'MISSING_INDIVIDUAL_RESPONSES'
    WHEN pa.status = 'completed' AND COUNT(par.id) < 10 THEN 'INCOMPLETE_RESPONSES'
    ELSE 'OK'
  END AS data_quality_status

FROM personal_assessment_attempts pa
LEFT JOIN personal_assessment_responses par ON pa.id = par.attempt_id
GROUP BY pa.id, pa.student_id, pa.grade_level, pa.status, pa.started_at, pa.completed_at, pa.all_responses;

COMMENT ON VIEW v_assessment_response_summary IS 
'Summary view showing response counts by section and data quality status for each attempt';

-- ============================================================================
-- STEP 4: Create Indexes for New Views
-- ============================================================================

-- Index for personality responses
CREATE INDEX IF NOT EXISTS idx_responses_personality 
ON personal_assessment_responses(question_id) 
WHERE question_id LIKE 'riasec_%' OR question_id LIKE 'bigfive_%';

-- Index for MCQ responses  
CREATE INDEX IF NOT EXISTS idx_responses_mcq
ON personal_assessment_responses(question_id, is_correct)
WHERE question_id LIKE 'aptitude_%' OR question_id LIKE 'knowledge_%';

-- ============================================================================
-- STEP 5: Add Deprecation Notice Function
-- ============================================================================

CREATE OR REPLACE FUNCTION check_legacy_response_usage()
RETURNS TABLE (
  usage_count BIGINT,
  last_usage TIMESTAMP WITH TIME ZONE,
  recommendation TEXT
) AS $$
DECLARE
  v_count BIGINT;
BEGIN
  -- Count attempts using all_responses (legacy)
  SELECT COUNT(*) INTO v_count
  FROM personal_assessment_attempts
  WHERE all_responses IS NOT NULL;
  
  usage_count := v_count;
  last_usage := NOW();  -- Updated whenever function is called
  recommendation := 'Migrate to personal_assessment_responses table. Run normalize_all_responses() for historical data.';
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION check_legacy_response_usage() IS 
'Monitors usage of legacy all_responses column. Returns count and migration recommendation.';

-- ============================================================================
-- Migration Complete
-- ============================================================================
