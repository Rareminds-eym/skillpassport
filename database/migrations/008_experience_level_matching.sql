-- ============================================================================
-- Migration: 008_experience_level_matching.sql
-- Description: Enhanced job matching with experience level filtering
-- - Detects if student is a fresher (no work experience)
-- - Applies penalty to senior-level jobs for freshers
-- - Handles both array and comma-separated string skills_required
-- - Filters out senior jobs (5+ years) completely for freshers
-- ============================================================================

-- ============================================================================
-- HELPER FUNCTION: Determine if a student is a fresher
-- Returns TRUE if student has no work experience
-- ============================================================================
CREATE OR REPLACE FUNCTION is_student_fresher(p_student_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  student_rec RECORD;
  has_work_experience BOOLEAN := FALSE;
BEGIN
  -- Get student info
  SELECT 
    work_experience,
    student_type,
    course_name
  INTO student_rec
  FROM students 
  WHERE id = p_student_id;
  
  -- Check if student has work experience
  IF student_rec.work_experience IS NOT NULL 
     AND TRIM(student_rec.work_experience) != '' 
     AND LOWER(student_rec.work_experience) NOT IN ('none', 'no', 'n/a', 'nil', '0', 'fresher', 'no experience') THEN
    has_work_experience := TRUE;
  END IF;
  
  -- If work_experience is empty, check student_type to determine if fresher
  -- School students, college students, university students are typically freshers
  IF NOT has_work_experience THEN
    IF student_rec.student_type IN ('school', 'school_student', 'school-student', 'college', 'university', 'student', 'direct') THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN NOT has_work_experience;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION is_student_fresher IS 'Determines if a student is a fresher (no work experience) based on work_experience field and student_type';


-- ============================================================================
-- HELPER FUNCTION: Check if job is senior level
-- Returns TRUE if the job requires senior/experienced candidates
-- ============================================================================
CREATE OR REPLACE FUNCTION is_senior_level_job(
  p_title TEXT,
  p_experience_level TEXT,
  p_experience_required TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  title_lower TEXT := LOWER(COALESCE(p_title, ''));
  exp_level_lower TEXT := LOWER(COALESCE(p_experience_level, ''));
  exp_req_lower TEXT := LOWER(COALESCE(p_experience_required, ''));
  years_required INT;
BEGIN
  -- Check experience_level field
  IF exp_level_lower = 'senior' THEN
    RETURN TRUE;
  END IF;
  
  -- Check title for senior keywords
  IF title_lower ~ '(senior|lead|principal|staff|head|director|manager|chief|vp|vice president|architect)' THEN
    RETURN TRUE;
  END IF;
  
  -- Check experience_required for high years (5+ years typically indicates senior)
  -- Extract years from strings like "5 years+", "5-7 years", "5+ years"
  IF exp_req_lower ~ '(\d+)' THEN
    years_required := (regexp_match(exp_req_lower, '(\d+)'))[1]::INT;
    IF years_required >= 5 THEN
      RETURN TRUE;
    END IF;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION is_senior_level_job IS 'Determines if a job is senior level based on title, experience_level, and experience_required fields';


-- ============================================================================
-- FUNCTION: Enhanced opportunity matching V2 with experience level filtering
-- - Applies 30% penalty for senior jobs when student is fresher
-- - Completely excludes senior jobs requiring 5+ years for freshers
-- - Handles both JSONB array and comma-separated string skills_required
-- ============================================================================
CREATE OR REPLACE FUNCTION match_opportunities_enhanced_v2(
  query_embedding vector(1536),
  student_id_param UUID,
  dismissed_ids UUID[] DEFAULT '{}',
  match_threshold FLOAT DEFAULT 0.01,
  match_count INT DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  company_name TEXT,
  employment_type TEXT,
  location TEXT,
  mode TEXT,
  stipend_or_salary TEXT,
  experience_level TEXT,
  skills_required JSONB,
  description TEXT,
  deadline TIMESTAMPTZ,
  similarity FLOAT,
  skill_match_score FLOAT,
  certificate_match_score FLOAT,
  project_match_score FLOAT,
  final_score FLOAT,
  match_percentage INT
) AS $$
DECLARE
  student_is_fresher BOOLEAN;
BEGIN
  student_is_fresher := is_student_fresher(student_id_param);
  
  RETURN QUERY
  WITH base_matches AS (
    -- Step 1: Vector similarity search
    SELECT 
      o.id,
      o.title,
      o.company_name,
      o.employment_type,
      o.location,
      o.mode,
      o.stipend_or_salary,
      o.experience_level,
      o.experience_required,
      o.skills_required,
      o.description,
      o.deadline,
      1 - (query_embedding <=> o.embedding) AS similarity,
      is_senior_level_job(o.title, o.experience_level, o.experience_required) AS is_senior
    FROM opportunities o
    WHERE o.is_active = true
      AND o.status = 'open'
      AND (o.deadline IS NULL OR o.deadline > NOW())
      AND o.embedding IS NOT NULL
      AND o.id != ALL(dismissed_ids)
      AND (1 - (query_embedding <=> o.embedding)) >= match_threshold
    ORDER BY query_embedding <=> o.embedding
    LIMIT match_count * 2
  ),
  certificate_scores AS (
    -- Step 2: Calculate certificate match scores
    SELECT 
      bm.id AS opportunity_id,
      COALESCE(MAX(1 - (c.embedding <=> o.embedding)), 0) AS cert_score
    FROM base_matches bm
    JOIN opportunities o ON o.id = bm.id
    LEFT JOIN certificates c ON c.student_id = student_id_param 
      AND c.enabled = true 
      AND c.embedding IS NOT NULL
    GROUP BY bm.id
  ),
  project_scores AS (
    -- Step 3: Calculate project match scores
    SELECT 
      bm.id AS opportunity_id,
      COALESCE(MAX(1 - (p.embedding <=> o.embedding)), 0) AS proj_score
    FROM base_matches bm
    JOIN opportunities o ON o.id = bm.id
    LEFT JOIN projects p ON p.student_id = student_id_param 
      AND p.enabled = true 
      AND p.embedding IS NOT NULL
    GROUP BY bm.id
  ),
  skill_matches AS (
    -- Step 4: Calculate skill overlap score
    -- Handles both JSONB array and comma-separated string formats
    SELECT 
      bm.id AS opportunity_id,
      CASE 
        -- Handle NULL skills_required
        WHEN o.skills_required IS NULL THEN 0.5
        -- Handle string type skills_required (comma-separated)
        WHEN jsonb_typeof(o.skills_required) = 'string' THEN
          (
            SELECT COALESCE(
              COUNT(DISTINCT s.name)::FLOAT / GREATEST(
                array_length(string_to_array(o.skills_required #>> '{}', ','), 1), 1
              ),
              0
            )
            FROM skills s
            WHERE s.student_id = student_id_param
              AND s.enabled = true
              AND EXISTS (
                SELECT 1 FROM unnest(string_to_array(o.skills_required #>> '{}', ',')) AS req_skill
                WHERE LOWER(TRIM(req_skill)) LIKE '%' || LOWER(s.name) || '%'
                   OR LOWER(s.name) LIKE '%' || LOWER(TRIM(req_skill)) || '%'
              )
          )
        -- Handle empty array
        WHEN jsonb_typeof(o.skills_required) = 'array' AND jsonb_array_length(o.skills_required) = 0 THEN 0.5
        -- Handle array type skills_required
        WHEN jsonb_typeof(o.skills_required) = 'array' THEN
          (
            SELECT COALESCE(
              COUNT(DISTINCT s.name)::FLOAT / GREATEST(jsonb_array_length(o.skills_required), 1),
              0
            )
            FROM skills s
            WHERE s.student_id = student_id_param
              AND s.enabled = true
              AND LOWER(s.name) IN (
                SELECT LOWER(jsonb_array_elements_text(o.skills_required))
              )
          )
        ELSE 0.5
      END AS skill_overlap
    FROM base_matches bm
    JOIN opportunities o ON o.id = bm.id
  ),
  scored_opportunities AS (
    SELECT 
      bm.id,
      bm.title,
      bm.company_name,
      bm.employment_type,
      bm.location,
      bm.mode,
      bm.stipend_or_salary,
      bm.experience_level,
      bm.experience_required,
      bm.skills_required,
      bm.description,
      bm.deadline,
      bm.similarity,
      sm.skill_overlap AS skill_match_score,
      cs.cert_score AS certificate_match_score,
      ps.proj_score AS project_match_score,
      bm.is_senior,
      -- Calculate base score (weighted sum)
      (
        (bm.similarity * 0.40) +           -- 40% profile similarity
        (COALESCE(sm.skill_overlap, 0.5) * 0.25) +  -- 25% skill match
        (cs.cert_score * 0.20) +           -- 20% certificate relevance
        (ps.proj_score * 0.15)             -- 15% project relevance
      ) AS base_score,
      -- Determine if there's an experience mismatch
      (student_is_fresher AND bm.is_senior) AS exp_mismatch
    FROM base_matches bm
    LEFT JOIN certificate_scores cs ON cs.opportunity_id = bm.id
    LEFT JOIN project_scores ps ON ps.opportunity_id = bm.id
    LEFT JOIN skill_matches sm ON sm.opportunity_id = bm.id
  )
  SELECT 
    so.id,
    so.title,
    so.company_name,
    so.employment_type,
    so.location,
    so.mode,
    so.stipend_or_salary,
    so.experience_level,
    so.skills_required,
    so.description,
    so.deadline,
    so.similarity,
    COALESCE(so.skill_match_score, 0.5) AS skill_match_score,
    so.certificate_match_score,
    so.project_match_score,
    -- Apply 30% penalty for experience mismatch (senior jobs for freshers)
    CASE 
      WHEN so.exp_mismatch THEN LEAST(1.0, so.base_score * 0.70)
      ELSE LEAST(1.0, so.base_score)
    END AS final_score,
    -- Match percentage with penalty applied
    CASE 
      WHEN so.exp_mismatch THEN LEAST(100, ROUND(so.base_score * 0.70 * 100))::INT
      ELSE LEAST(100, ROUND(so.base_score * 100))::INT
    END AS match_percentage
  FROM scored_opportunities so
  -- Filter: Completely exclude senior jobs with 5+ years requirement for freshers
  WHERE NOT (
    student_is_fresher 
    AND so.is_senior 
    AND so.experience_level = 'Senior'
    AND (
      COALESCE((SELECT (regexp_match(LOWER(o.experience_required), '(\d+)'))[1]::INT 
                FROM opportunities o WHERE o.id = so.id), 0) >= 5
    )
  )
  ORDER BY final_score DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION match_opportunities_enhanced_v2 IS 'Enhanced job matching V2 with experience level filtering - applies 30% penalty for senior jobs when student is fresher, excludes jobs requiring 5+ years experience, handles both array and string skills_required formats';
