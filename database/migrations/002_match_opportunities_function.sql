-- Main recommendation function with vector similarity and smart scoring
CREATE OR REPLACE FUNCTION match_opportunities(
  query_embedding vector(1536),
  student_id_param uuid,
  dismissed_ids integer[] DEFAULT ARRAY[]::integer[],
  match_threshold float DEFAULT 0.60,
  match_count int DEFAULT 50
)
RETURNS TABLE (
  id integer,
  title text,
  job_title text,
  company_name text,
  company_logo text,
  employment_type text,
  location text,
  mode text,
  stipend_or_salary text,
  experience_required text,
  experience_level text,
  skills_required jsonb,
  description text,
  application_link text,
  deadline timestamp with time zone,
  department text,
  requirements jsonb,
  responsibilities jsonb,
  benefits jsonb,
  created_at timestamp with time zone,
  posted_date timestamp with time zone,
  views_count integer,
  applications_count integer,
  similarity float,
  match_score float,
  match_reasons jsonb
)
LANGUAGE plpgsql
AS $$
DECLARE
  student_rec record;
  has_interactions boolean;
BEGIN
  -- Get student preferences
  SELECT * INTO student_rec 
  FROM students 
  WHERE students.id = student_id_param;
  
  -- Check if student has any interactions
  SELECT EXISTS(
    SELECT 1 FROM opportunity_interactions 
    WHERE student_id = student_id_param
  ) INTO has_interactions;
  
  RETURN QUERY
  SELECT
    o.id,
    o.title,
    o.job_title,
    o.company_name,
    o.company_logo,
    o.employment_type,
    o.location,
    o.mode,
    o.stipend_or_salary,
    o.experience_required,
    o.experience_level,
    o.skills_required,
    o.description,
    o.application_link,
    o.deadline,
    o.department,
    o.requirements,
    o.responsibilities,
    o.benefits,
    o.created_at,
    o.posted_date,
    o.views_count,
    o.applications_count,
    -- Cosine similarity (1 - cosine distance)
    (1 - (o.embedding <=> query_embedding))::float as similarity,
    -- Comprehensive match score
    (
      -- Base semantic similarity (weighted heavily)
      (1 - (o.embedding <=> query_embedding)) * 100 +
      
      -- Employment type match bonus
      CASE 
        WHEN student_rec.preferred_employment_types IS NOT NULL 
          AND o.employment_type = ANY(student_rec.preferred_employment_types) 
        THEN 15
        ELSE 0 
      END +
      
      -- Department match bonus
      CASE 
        WHEN student_rec.preferred_departments IS NOT NULL 
          AND o.department = ANY(student_rec.preferred_departments) 
        THEN 10
        ELSE 0 
      END +
      
      -- Work mode match bonus
      CASE 
        WHEN student_rec.preferred_mode IS NOT NULL 
          AND o.mode = student_rec.preferred_mode 
        THEN 8
        ELSE 0 
      END +
      
      -- Location preference bonus
      CASE 
        WHEN student_rec.preferred_locations IS NOT NULL 
          AND o.location = ANY(student_rec.preferred_locations) 
        THEN 12
        ELSE 0 
      END +
      
      -- Recency boost (jobs posted within 7 days)
      CASE 
        WHEN o.posted_date > NOW() - INTERVAL '7 days' 
        THEN 5
        ELSE 0 
      END +
      
      -- Popular opportunity boost (high view count but not too many applications)
      CASE 
        WHEN o.views_count > 50 AND (o.applications_count < o.views_count * 0.3)
        THEN 3
        ELSE 0 
      END +
      
      -- Interaction history penalty for dismissed jobs
      CASE 
        WHEN EXISTS(
          SELECT 1 FROM opportunity_interactions 
          WHERE student_id = student_id_param 
            AND opportunity_id = o.id 
            AND action = 'dismiss'
        )
        THEN -50
        ELSE 0 
      END +
      
      -- Boost for jobs the student viewed but didn't apply
      CASE 
        WHEN EXISTS(
          SELECT 1 FROM opportunity_interactions 
          WHERE student_id = student_id_param 
            AND opportunity_id = o.id 
            AND action = 'view'
        ) AND NOT EXISTS(
          SELECT 1 FROM opportunity_interactions 
          WHERE student_id = student_id_param 
            AND opportunity_id = o.id 
            AND action = 'apply'
        )
        THEN 4
        ELSE 0 
      END
    )::float as match_score,
    -- Generate match reasons JSON
    jsonb_build_object(
      'semantic_match', (1 - (o.embedding <=> query_embedding)) > 0.75,
      'employment_type_match', 
        student_rec.preferred_employment_types IS NOT NULL 
        AND o.employment_type = ANY(student_rec.preferred_employment_types),
      'location_match', 
        student_rec.preferred_locations IS NOT NULL 
        AND o.location = ANY(student_rec.preferred_locations),
      'mode_match', 
        student_rec.preferred_mode IS NOT NULL 
        AND o.mode = student_rec.preferred_mode,
      'department_match', 
        student_rec.preferred_departments IS NOT NULL 
        AND o.department = ANY(student_rec.preferred_departments),
      'recent_post', o.posted_date > NOW() - INTERVAL '7 days',
      'trending', o.views_count > 50
    ) as match_reasons
  FROM opportunities o
  WHERE 
    o.is_active = true
    AND o.status = 'published'
    AND (o.deadline IS NULL OR o.deadline > NOW())
    AND o.embedding IS NOT NULL
    AND (1 - (o.embedding <=> query_embedding)) > match_threshold
    AND NOT (o.id = ANY(dismissed_ids))
    -- Don't show jobs already applied to
    AND NOT EXISTS(
      SELECT 1 FROM opportunity_interactions 
      WHERE student_id = student_id_param 
        AND opportunity_id = o.id 
        AND action = 'apply'
    )
  ORDER BY 
    -- Primary sort by match score
    match_score DESC,
    -- Secondary sort by recency
    o.posted_date DESC
  LIMIT match_count;
END;
$$;

-- Function to get popular opportunities (cold start fallback)
CREATE OR REPLACE FUNCTION get_popular_opportunities(
  student_id_param uuid,
  limit_count int DEFAULT 20
)
RETURNS TABLE (
  id integer,
  title text,
  job_title text,
  company_name text,
  company_logo text,
  employment_type text,
  location text,
  mode text,
  stipend_or_salary text,
  experience_level text,
  skills_required jsonb,
  description text,
  posted_date timestamp with time zone,
  views_count integer,
  applications_count integer
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.title,
    o.job_title,
    o.company_name,
    o.company_logo,
    o.employment_type,
    o.location,
    o.mode,
    o.stipend_or_salary,
    o.experience_level,
    o.skills_required,
    o.description,
    o.posted_date,
    o.views_count,
    o.applications_count
  FROM opportunities o
  WHERE 
    o.is_active = true
    AND o.status = 'published'
    AND (o.deadline IS NULL OR o.deadline > NOW())
    AND NOT EXISTS(
      SELECT 1 FROM opportunity_interactions 
      WHERE student_id = student_id_param 
        AND opportunity_id = o.id 
        AND action IN ('apply', 'dismiss')
    )
  ORDER BY 
    -- Popularity score: views with good conversion rate
    (o.views_count::float / (COALESCE(o.applications_count, 0) + 1)) DESC,
    o.posted_date DESC
  LIMIT limit_count;
END;
$$;

COMMENT ON FUNCTION match_opportunities IS 'AI-powered opportunity matching using vector similarity and behavioral scoring';
COMMENT ON FUNCTION get_popular_opportunities IS 'Fallback function for cold start - returns trending opportunities';

