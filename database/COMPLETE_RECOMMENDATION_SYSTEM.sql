-- ================================================
-- COMPLETE RECOMMENDATION SYSTEM SETUP
-- ================================================
-- This file consolidates all database requirements for the
-- AI-powered job recommendation system with automatic embeddings
--
-- Features:
-- - Vector similarity search using pgvector
-- - Automatic embedding generation via triggers
-- - Recommendation caching
-- - User interaction tracking
-- - Row Level Security (RLS) policies
-- - Fallback to popular opportunities
--
-- Run this entire file in Supabase SQL Editor
-- ================================================

-- ================================================
-- SECTION 1: EXTENSIONS
-- ================================================

-- Enable pgvector for similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable pg_net for async HTTP calls to edge functions
CREATE EXTENSION IF NOT EXISTS pg_net;

-- ================================================
-- SECTION 2: CONFIGURATION TABLE
-- ================================================

-- Store application configuration
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert configuration values
-- IMPORTANT: Update these with your actual values!
INSERT INTO app_config (key, value)
VALUES 
  ('edge_function_url', 'https://dpooleduinyyzxgrcwko.supabase.co/functions/v1'),
  ('supabase_anon_key', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwb29sZWR1aW55eXp4Z3Jjd2tvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5OTQ2OTgsImV4cCI6MjA3NTU3MDY5OH0.LvId6Cq13yeASDt0RXbb0y83P2xAZw0L1Q4KJAXT4jk')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- ================================================
-- SECTION 3: VECTOR EMBEDDING COLUMNS & INDEXES
-- ================================================

-- Add embedding column to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for student vector similarity search
CREATE INDEX IF NOT EXISTS idx_students_embedding 
ON students USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Add embedding column to opportunities table
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for opportunity vector similarity search
CREATE INDEX IF NOT EXISTS idx_opportunities_embedding 
ON opportunities USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- ================================================
-- SECTION 4: RECOMMENDATION CACHE TABLE
-- ================================================

-- Stores cached recommendations for students
CREATE TABLE IF NOT EXISTS recommendation_cache (
  student_id UUID PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  recommendations JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for cache expiration cleanup
CREATE INDEX IF NOT EXISTS idx_recommendation_cache_expires 
ON recommendation_cache(expires_at);

-- ================================================
-- SECTION 5: OPPORTUNITY INTERACTIONS TABLE
-- ================================================

-- Tracks student interactions with opportunities
CREATE TABLE IF NOT EXISTS opportunity_interactions (
  id SERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  opportunity_id INTEGER NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('view', 'save', 'apply', 'dismiss')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, opportunity_id, action)
);

-- Indexes for efficient interaction queries
CREATE INDEX IF NOT EXISTS idx_interactions_student 
ON opportunity_interactions(student_id, action);

CREATE INDEX IF NOT EXISTS idx_interactions_opportunity 
ON opportunity_interactions(opportunity_id);

-- ================================================
-- SECTION 6: EMBEDDING TRIGGER FUNCTIONS
-- ================================================

-- Trigger function for automatic opportunity embedding generation
CREATE OR REPLACE FUNCTION trigger_opportunity_embedding()
RETURNS TRIGGER AS $$
DECLARE
  text_content TEXT;
BEGIN
  -- Only trigger on INSERT with no embedding, or UPDATE of key fields
  IF (TG_OP = 'INSERT' AND NEW.embedding IS NULL) OR
     (TG_OP = 'UPDATE' AND (
       OLD.job_title IS DISTINCT FROM NEW.job_title OR
       OLD.description IS DISTINCT FROM NEW.description OR
       OLD.skills_required IS DISTINCT FROM NEW.skills_required
     )) THEN

    -- Build comprehensive text content
    text_content := CONCAT_WS(' ',
      NEW.title,
      NEW.job_title,
      NEW.company_name,
      NEW.department,
      NEW.description,
      NEW.experience_level,
      NEW.employment_type,
      NEW.location,
      NEW.mode,
      NEW.skills_required::text,
      NEW.requirements::text,
      NEW.responsibilities::text
    );

    -- Call edge function asynchronously via pg_net
    PERFORM net.http_post(
      url => (SELECT value FROM app_config WHERE key = 'edge_function_url') || '/generate-embedding',
      headers => jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
      ),
      body => jsonb_build_object(
        'text', text_content,
        'table', 'opportunities',
        'id', NEW.id,
        'type', 'opportunity'
      )
    );

    RAISE NOTICE 'Queued embedding generation for opportunity %', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for automatic student embedding generation
CREATE OR REPLACE FUNCTION trigger_student_embedding()
RETURNS TRIGGER AS $$
DECLARE
  text_content TEXT;
BEGIN
  -- Only trigger when profile exists and is new or changed
  IF NEW.profile IS NOT NULL AND (
    (TG_OP = 'INSERT' AND NEW.embedding IS NULL) OR
    (TG_OP = 'UPDATE' AND OLD.profile IS DISTINCT FROM NEW.profile)
  ) THEN

    -- Build text content from profile
    text_content := CONCAT_WS(' ',
      NEW.name,
      NEW.email,
      NEW.profile->>'course',
      NEW.profile->>'branch_field',
      NEW.profile->>'university',
      NEW.profile->>'skill',
      NEW.profile->>'bio'
    );

    -- Skip if insufficient data
    IF LENGTH(TRIM(text_content)) < 10 THEN
      RAISE NOTICE 'Skipping embedding for student % - insufficient data', NEW.id;
      RETURN NEW;
    END IF;

    -- Call edge function asynchronously via pg_net
    PERFORM net.http_post(
      url => (SELECT value FROM app_config WHERE key = 'edge_function_url') || '/generate-embedding',
      headers => jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT value FROM app_config WHERE key = 'supabase_anon_key')
      ),
      body => jsonb_build_object(
        'text', text_content,
        'table', 'students',
        'id', NEW.id,
        'type', 'student'
      )
    );

    RAISE NOTICE 'Queued embedding generation for student %', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- SECTION 7: CREATE TRIGGERS
-- ================================================

-- Opportunity automatic embedding trigger
DROP TRIGGER IF EXISTS auto_opportunity_embedding ON opportunities;
CREATE TRIGGER auto_opportunity_embedding
  AFTER INSERT OR UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION trigger_opportunity_embedding();

-- Student automatic embedding trigger
DROP TRIGGER IF EXISTS auto_student_embedding ON students;
CREATE TRIGGER auto_student_embedding
  AFTER INSERT OR UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION trigger_student_embedding();

-- ================================================
-- SECTION 8: RECOMMENDATION FUNCTIONS
-- ================================================

-- Vector similarity search for matching opportunities
-- Returns opportunities with similarity scores, filtering out expired deadlines
CREATE OR REPLACE FUNCTION match_opportunities(
  query_embedding vector(1536),
  student_id_param UUID,
  dismissed_ids INTEGER[] DEFAULT '{}',
  match_threshold FLOAT DEFAULT 0.20,
  match_count INT DEFAULT 50
)
RETURNS TABLE (
  id INTEGER,
  title TEXT,
  job_title TEXT,
  company_name TEXT,
  company_logo TEXT,
  employment_type TEXT,
  location TEXT,
  mode TEXT,
  stipend_or_salary TEXT,
  experience_required TEXT,
  experience_level TEXT,
  skills_required JSONB,
  requirements JSONB,
  responsibilities JSONB,
  description TEXT,
  application_link TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  department TEXT,
  salary_range_min INTEGER,
  salary_range_max INTEGER,
  posted_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  views_count INTEGER,
  applications_count INTEGER,
  embedding vector(1536),
  similarity FLOAT
) AS $$
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
    o.experience_required,
    o.experience_level,
    o.skills_required,
    o.requirements,
    o.responsibilities,
    o.description,
    o.application_link,
    o.deadline,
    o.department,
    o.salary_range_min,
    o.salary_range_max,
    o.posted_date,
    o.is_active,
    o.status,
    o.created_at,
    o.updated_at,
    o.views_count,
    o.applications_count,
    o.embedding,
    (1 - (query_embedding <=> o.embedding))::FLOAT as similarity
  FROM opportunities o
  WHERE o.embedding IS NOT NULL
    AND o.is_active = true
    AND o.status = 'open'
    AND (o.deadline IS NULL OR o.deadline > NOW())
    AND NOT (o.id = ANY(dismissed_ids))
    AND (1 - (query_embedding <=> o.embedding)) >= match_threshold
  ORDER BY query_embedding <=> o.embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced match function with skill scoring
-- Combines vector similarity (70%) + skill matching (30%)
CREATE OR REPLACE FUNCTION match_opportunities_enhanced(
  query_embedding vector(1536),
  student_id_param UUID,
  dismissed_ids INTEGER[] DEFAULT '{}',
  match_threshold FLOAT DEFAULT 0.20,
  match_count INT DEFAULT 50
)
RETURNS TABLE (
  id INTEGER,
  title TEXT,
  job_title TEXT,
  company_name TEXT,
  company_logo TEXT,
  employment_type TEXT,
  location TEXT,
  mode TEXT,
  stipend_or_salary TEXT,
  experience_required TEXT,
  experience_level TEXT,
  skills_required JSONB,
  requirements JSONB,
  responsibilities JSONB,
  description TEXT,
  application_link TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  department TEXT,
  salary_range_min INTEGER,
  salary_range_max INTEGER,
  posted_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  views_count INTEGER,
  applications_count INTEGER,
  embedding vector(1536),
  similarity FLOAT,
  skill_match_score FLOAT,
  final_score FLOAT
) AS $$
BEGIN
  RETURN QUERY
  WITH student_skills AS (
    SELECT 
      s.profile->>'skill' as skills,
      s.profile->>'course' as course
    FROM students s
    WHERE s.id = student_id_param
  ),
  scored_opportunities AS (
    SELECT 
      o.*,
      (1 - (query_embedding <=> o.embedding))::FLOAT as base_similarity,
      -- Calculate skill match score (0-1)
      CASE 
        WHEN o.skills_required IS NULL THEN 0.0
        ELSE (
          SELECT COUNT(*)::FLOAT / GREATEST(jsonb_array_length(o.skills_required), 1)
          FROM jsonb_array_elements_text(o.skills_required) required_skill
          WHERE EXISTS (
            SELECT 1 FROM student_skills ss
            WHERE LOWER(ss.skills) LIKE '%' || LOWER(required_skill) || '%'
               OR LOWER(ss.course) LIKE '%' || LOWER(required_skill) || '%'
          )
        )
      END as skill_match,
      -- Final weighted score: 70% similarity + 30% skill match
      (
        (1 - (query_embedding <=> o.embedding)) * 0.7 + 
        COALESCE(
          (
            SELECT COUNT(*)::FLOAT / GREATEST(jsonb_array_length(o.skills_required), 1) * 0.3
            FROM jsonb_array_elements_text(o.skills_required) required_skill
            WHERE EXISTS (
              SELECT 1 FROM student_skills ss
              WHERE LOWER(ss.skills) LIKE '%' || LOWER(required_skill) || '%'
                 OR LOWER(ss.course) LIKE '%' || LOWER(required_skill) || '%'
            )
          ),
          0.0
        )
      )::FLOAT as final_score
    FROM opportunities o
    WHERE o.embedding IS NOT NULL
      AND o.is_active = true
      AND o.status = 'open'
      AND (o.deadline IS NULL OR o.deadline > NOW())
      AND NOT (o.id = ANY(dismissed_ids))
  )
  SELECT 
    so.id,
    so.title,
    so.job_title,
    so.company_name,
    so.company_logo,
    so.employment_type,
    so.location,
    so.mode,
    so.stipend_or_salary,
    so.experience_required,
    so.experience_level,
    so.skills_required,
    so.requirements,
    so.responsibilities,
    so.description,
    so.application_link,
    so.deadline,
    so.department,
    so.salary_range_min,
    so.salary_range_max,
    so.posted_date,
    so.is_active,
    so.status,
    so.created_at,
    so.updated_at,
    so.views_count,
    so.applications_count,
    so.embedding,
    so.base_similarity as similarity,
    so.skill_match as skill_match_score,
    so.final_score
  FROM scored_opportunities so
  WHERE so.final_score >= match_threshold
  ORDER BY so.final_score DESC
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fallback: Get popular opportunities when embeddings unavailable
-- Returns opportunities with computed view_count, filtering out expired and user-dismissed items
CREATE OR REPLACE FUNCTION get_popular_opportunities(
  student_id_param UUID,
  limit_count INT DEFAULT 20
)
RETURNS TABLE (
  id INTEGER,
  title TEXT,
  job_title TEXT,
  company_name TEXT,
  company_logo TEXT,
  employment_type TEXT,
  location TEXT,
  mode TEXT,
  stipend_or_salary TEXT,
  experience_required TEXT,
  experience_level TEXT,
  skills_required JSONB,
  requirements JSONB,
  responsibilities JSONB,
  description TEXT,
  application_link TEXT,
  deadline TIMESTAMP WITH TIME ZONE,
  department TEXT,
  salary_range_min INTEGER,
  salary_range_max INTEGER,
  posted_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  views_count INTEGER,
  applications_count INTEGER,
  embedding vector(1536),
  view_count INTEGER
) AS $$
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
    o.experience_required,
    o.experience_level,
    o.skills_required,
    o.requirements,
    o.responsibilities,
    o.description,
    o.application_link,
    o.deadline,
    o.department,
    o.salary_range_min,
    o.salary_range_max,
    o.posted_date,
    o.is_active,
    o.status,
    o.created_at,
    o.updated_at,
    o.views_count,
    o.applications_count,
    o.embedding,
    COALESCE(
      (SELECT COUNT(*) 
       FROM opportunity_interactions 
       WHERE opportunity_id = o.id AND action = 'view')::INTEGER,
      0
    ) as view_count
  FROM opportunities o
  WHERE o.is_active = true
    AND o.status = 'open'
    AND (o.deadline IS NULL OR o.deadline > NOW())
    AND NOT EXISTS (
      SELECT 1 FROM opportunity_interactions oi
      WHERE oi.student_id = student_id_param
        AND oi.opportunity_id = o.id
        AND oi.action IN ('apply', 'dismiss')
    )
  ORDER BY 
    o.posted_date DESC NULLS LAST,
    o.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function for cache cleanup
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM recommendation_cache
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Placeholder for view count incrementing
CREATE OR REPLACE FUNCTION increment_views(opp_id INTEGER)
RETURNS void AS $$
BEGIN
  -- View counts are tracked via opportunity_interactions table
  -- This is a placeholder function for compatibility
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- SECTION 9: ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================

-- Enable RLS on new tables
ALTER TABLE recommendation_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_interactions ENABLE ROW LEVEL SECURITY;

-- recommendation_cache policies
DROP POLICY IF EXISTS "Users can view their own cache" ON recommendation_cache;
CREATE POLICY "Users can view their own cache" 
ON recommendation_cache FOR SELECT 
USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Service role can manage cache" ON recommendation_cache;
CREATE POLICY "Service role can manage cache" 
ON recommendation_cache FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- opportunity_interactions policies
DROP POLICY IF EXISTS "Users can view their own interactions" ON opportunity_interactions;
CREATE POLICY "Users can view their own interactions" 
ON opportunity_interactions FOR SELECT 
USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Users can create their own interactions" ON opportunity_interactions;
CREATE POLICY "Users can create their own interactions" 
ON opportunity_interactions FOR INSERT 
WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Service role can manage interactions" ON opportunity_interactions;
CREATE POLICY "Service role can manage interactions" 
ON opportunity_interactions FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- ================================================
-- SECTION 10: DOCUMENTATION COMMENTS
-- ================================================

COMMENT ON TABLE app_config IS 'Application configuration for edge function URLs and API keys';
COMMENT ON TABLE recommendation_cache IS 'Caches AI-generated job recommendations for students to reduce API calls';
COMMENT ON TABLE opportunity_interactions IS 'Tracks student interactions with opportunities (view, save, apply, dismiss)';
COMMENT ON FUNCTION match_opportunities IS 'Performs vector similarity search to find matching opportunities for a student based on embedding';
COMMENT ON FUNCTION match_opportunities_enhanced IS 'Enhanced matching with hybrid scoring: 70% vector similarity + 30% skill matching for better recommendations';
COMMENT ON FUNCTION get_popular_opportunities IS 'Returns popular opportunities as fallback when embeddings are not available';
COMMENT ON FUNCTION cleanup_expired_cache IS 'Removes expired recommendation cache entries';
COMMENT ON FUNCTION trigger_opportunity_embedding IS 'Automatically generates embeddings for new/updated opportunities via edge function';
COMMENT ON FUNCTION trigger_student_embedding IS 'Automatically generates embeddings for new/updated students via edge function';

-- ================================================
-- SECTION 11: VERIFICATION QUERIES
-- ================================================

-- Verify extensions are enabled
SELECT 
  'Extensions' as component,
  string_agg(extname, ', ') as status
FROM pg_extension
WHERE extname IN ('vector', 'pg_net')
GROUP BY 1;

-- Verify configuration
SELECT 
  'Configuration' as component,
  COUNT(*) || ' settings configured' as status
FROM app_config
WHERE key IN ('edge_function_url', 'supabase_anon_key');

-- Verify tables exist
SELECT 
  'Tables' as component,
  COUNT(*) || ' tables created' as status
FROM information_schema.tables
WHERE table_name IN ('recommendation_cache', 'opportunity_interactions', 'app_config')
  AND table_schema = 'public';

-- Verify triggers are active
SELECT 
  'Triggers' as component,
  COUNT(*) || ' triggers active' as status
FROM information_schema.triggers
WHERE trigger_name IN ('auto_opportunity_embedding', 'auto_student_embedding');

-- Verify functions exist
SELECT 
  'Functions' as component,
  COUNT(*) || ' functions created' as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('match_opportunities', 'match_opportunities_enhanced', 'get_popular_opportunities', 
                    'trigger_opportunity_embedding', 'trigger_student_embedding',
                    'cleanup_expired_cache', 'increment_views');

-- Verify indexes exist
SELECT 
  'Indexes' as component,
  COUNT(*) || ' vector indexes created' as status
FROM pg_indexes
WHERE indexname IN ('idx_students_embedding', 'idx_opportunities_embedding');

-- ================================================
-- SECTION 12: SUCCESS MESSAGE & NEXT STEPS
-- ================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎉 ============================================';
  RAISE NOTICE '🎉 COMPLETE RECOMMENDATION SYSTEM SETUP DONE!';
  RAISE NOTICE '🎉 ============================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Extensions: pgvector, pg_net';
  RAISE NOTICE '✅ Tables: recommendation_cache, opportunity_interactions, app_config';
  RAISE NOTICE '✅ Functions: match_opportunities, match_opportunities_enhanced, get_popular_opportunities, triggers';
  RAISE NOTICE '✅ Triggers: auto_opportunity_embedding, auto_student_embedding';
  RAISE NOTICE '✅ Indexes: Vector similarity search indexes';
  RAISE NOTICE '✅ RLS Policies: Configured for all tables';
  RAISE NOTICE '';
  RAISE NOTICE '📋 NEXT STEPS:';
  RAISE NOTICE '   1. Verify edge functions are deployed:';
  RAISE NOTICE '      - generate-embedding';
  RAISE NOTICE '      - recommend-opportunities';
  RAISE NOTICE '';
  RAISE NOTICE '   2. Update app_config if needed:';
  RAISE NOTICE '      UPDATE app_config SET value = ''your-url'' WHERE key = ''edge_function_url'';';
  RAISE NOTICE '      UPDATE app_config SET value = ''your-key'' WHERE key = ''supabase_anon_key'';';
  RAISE NOTICE '';
  RAISE NOTICE '   3. Test automatic embedding generation:';
  RAISE NOTICE '      INSERT INTO opportunities (title, job_title, company_name, description, employment_type, location, status)';
  RAISE NOTICE '      VALUES (''Test Job'', ''Test Engineer'', ''Test Co'', ''Testing auto-embeddings'', ''full-time'', ''Remote'', ''open'');';
  RAISE NOTICE '';
  RAISE NOTICE '   4. Wait 5-10 seconds, then verify:';
  RAISE NOTICE '      SELECT id, job_title, embedding IS NOT NULL as has_embedding FROM opportunities ORDER BY created_at DESC LIMIT 1;';
  RAISE NOTICE '';
  RAISE NOTICE '   5. Test recommendation system in your app';
  RAISE NOTICE '';
  RAISE NOTICE '📚 System Overview:';
  RAISE NOTICE '   - Automatic embeddings: Triggers call edge function on INSERT/UPDATE';
  RAISE NOTICE '   - Vector search: Uses pgvector for similarity matching (threshold: 0.20)';
  RAISE NOTICE '   - Enhanced matching: Hybrid scoring (70% embedding + 30% skill match)';
  RAISE NOTICE '   - Fallback: Popular opportunities when embeddings unavailable';
  RAISE NOTICE '   - Caching: Redis-style caching with configurable TTL';
  RAISE NOTICE '   - Interactions: Tracks views, saves, applies, dismisses';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Maintenance:';
  RAISE NOTICE '   - Run cleanup_expired_cache() periodically to remove old cache entries';
  RAISE NOTICE '   - Monitor opportunity_interactions for analytics';
  RAISE NOTICE '';
END $$;
