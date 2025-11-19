-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to opportunities table
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create vector index for fast similarity search
CREATE INDEX IF NOT EXISTS opportunities_embedding_idx 
ON opportunities USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create students table if it doesn't exist (for recommendation profiles)
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE,
  name TEXT,
  skills TEXT[],
  interests TEXT[],
  experience_level TEXT, -- 'entry', 'mid', 'senior'
  preferred_locations TEXT[],
  preferred_employment_types TEXT[], -- match opportunities.employment_type
  preferred_departments TEXT[],
  preferred_mode TEXT, -- 'remote', 'hybrid', 'onsite'
  bio TEXT,
  resume_text TEXT,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vector index for students
CREATE INDEX IF NOT EXISTS students_embedding_idx 
ON students USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create opportunity_interactions table for tracking user behavior
CREATE TABLE IF NOT EXISTS opportunity_interactions (
  id SERIAL PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  opportunity_id INTEGER REFERENCES opportunities(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'view', 'save', 'apply', 'dismiss', 'click'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, opportunity_id, action)
);

-- Create indexes for interactions
CREATE INDEX IF NOT EXISTS idx_interactions_student 
ON opportunity_interactions(student_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_interactions_opportunity 
ON opportunity_interactions(opportunity_id, action);

-- Add recommendation cache table
CREATE TABLE IF NOT EXISTS recommendation_cache (
  student_id UUID PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  recommendations JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendation_cache_expires 
ON recommendation_cache(expires_at);

-- Enable RLS on new tables
ALTER TABLE opportunity_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for opportunity_interactions
CREATE POLICY "Users can view own interactions"
  ON opportunity_interactions FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Users can insert own interactions"
  ON opportunity_interactions FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- RLS Policies for recommendation_cache
CREATE POLICY "Users can view own recommendations"
  ON recommendation_cache FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Users can manage own recommendations"
  ON recommendation_cache FOR ALL
  USING (auth.uid() = student_id);

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_recommendations()
RETURNS void AS $$
BEGIN
  DELETE FROM recommendation_cache WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add updated_at trigger for students
CREATE OR REPLACE FUNCTION update_student_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_student_updated_at();

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_views(opp_id INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE opportunities
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = opp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE opportunity_interactions IS 'Tracks student interactions with opportunities for recommendation improvement';
COMMENT ON TABLE recommendation_cache IS 'Caches personalized recommendations to reduce computation';

