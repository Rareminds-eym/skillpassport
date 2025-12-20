-- Create recommendation cache table
CREATE TABLE IF NOT EXISTS recommendation_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  cached_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
  opportunities_count INTEGER NOT NULL DEFAULT 0,
  student_profile_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(student_id)
);

-- Create index for faster lookups
CREATE INDEX idx_recommendation_cache_student_id ON recommendation_cache(student_id);
CREATE INDEX idx_recommendation_cache_expires_at ON recommendation_cache(expires_at);

-- Add comment
COMMENT ON TABLE recommendation_cache IS 'Caches AI-generated opportunity recommendations for students';
COMMENT ON COLUMN recommendation_cache.student_profile_hash IS 'Hash of student profile to detect changes';
COMMENT ON COLUMN recommendation_cache.opportunities_count IS 'Number of opportunities at time of caching';

-- Function to invalidate cache when opportunities change
CREATE OR REPLACE FUNCTION invalidate_recommendation_cache_on_opportunity_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete all cache entries when opportunities table changes
  DELETE FROM recommendation_cache;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on opportunities table
DROP TRIGGER IF EXISTS trigger_invalidate_cache_on_opportunity_insert ON opportunities;
CREATE TRIGGER trigger_invalidate_cache_on_opportunity_insert
  AFTER INSERT ON opportunities
  FOR EACH STATEMENT
  EXECUTE FUNCTION invalidate_recommendation_cache_on_opportunity_change();

DROP TRIGGER IF EXISTS trigger_invalidate_cache_on_opportunity_update ON opportunities;
CREATE TRIGGER trigger_invalidate_cache_on_opportunity_update
  AFTER UPDATE ON opportunities
  FOR EACH STATEMENT
  EXECUTE FUNCTION invalidate_recommendation_cache_on_opportunity_change();

-- Function to invalidate individual student cache when their profile changes
CREATE OR REPLACE FUNCTION invalidate_student_recommendation_cache()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete cache for this specific student
  DELETE FROM recommendation_cache WHERE student_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on students table for profile changes
DROP TRIGGER IF EXISTS trigger_invalidate_cache_on_student_update ON students;
CREATE TRIGGER trigger_invalidate_cache_on_student_update
  AFTER UPDATE OF skills, interests, bio, resume_text, experience_level, preferred_departments, preferred_employment_types
  ON students
  FOR EACH ROW
  EXECUTE FUNCTION invalidate_student_recommendation_cache();

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_recommendation_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM recommendation_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to clean up expired cache (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-recommendation-cache', '0 * * * *', 'SELECT cleanup_expired_recommendation_cache()');
