-- Create table for saved searches
CREATE TABLE IF NOT EXISTS recruiter_saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id TEXT NOT NULL,
  name TEXT NOT NULL,
  search_criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used TIMESTAMP WITH TIME ZONE,
  use_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_saved_searches_recruiter 
  ON recruiter_saved_searches(recruiter_id);

CREATE INDEX IF NOT EXISTS idx_saved_searches_last_used 
  ON recruiter_saved_searches(last_used DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_saved_searches_created 
  ON recruiter_saved_searches(created_at DESC);

-- Create function to increment search usage
CREATE OR REPLACE FUNCTION increment_search_usage(search_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE recruiter_saved_searches
  SET 
    use_count = use_count + 1,
    last_used = NOW()
  WHERE id = search_id;
END;
$$ LANGUAGE plpgsql;

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE recruiter_saved_searches ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own saved searches
CREATE POLICY "Users can view own saved searches" 
  ON recruiter_saved_searches
  FOR SELECT
  USING (true); -- Adjust based on your auth setup

-- Policy: Users can insert their own saved searches
CREATE POLICY "Users can insert own saved searches"
  ON recruiter_saved_searches
  FOR INSERT
  WITH CHECK (true); -- Adjust based on your auth setup

-- Policy: Users can update their own saved searches
CREATE POLICY "Users can update own saved searches"
  ON recruiter_saved_searches
  FOR UPDATE
  USING (true); -- Adjust based on your auth setup

-- Policy: Users can delete their own saved searches
CREATE POLICY "Users can delete own saved searches"
  ON recruiter_saved_searches
  FOR DELETE
  USING (true); -- Adjust based on your auth setup

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON recruiter_saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some default searches for demo purposes
INSERT INTO recruiter_saved_searches (recruiter_id, name, search_criteria, use_count) 
VALUES 
  ('demo', 'React + Node.js', '{"skills": ["React", "Node.js"]}'::jsonb, 0),
  ('demo', 'Python Developers', '{"skills": ["Python"]}'::jsonb, 0),
  ('demo', 'Data Science + ML', '{"skills": ["Data Science", "Machine Learning"]}'::jsonb, 0),
  ('demo', 'Frontend (React/Angular)', '{"skills": ["React", "Angular"]}'::jsonb, 0),
  ('demo', 'Full Stack Developers', '{"query": "Full Stack Developer"}'::jsonb, 0),
  ('demo', 'DevOps Engineers', '{"skills": ["DevOps", "CI/CD", "Docker", "Kubernetes"]}'::jsonb, 0),
  ('demo', 'Mobile App Developers', '{"skills": ["React Native", "Flutter", "iOS", "Android"]}'::jsonb, 0),
  ('demo', 'UI/UX Designers', '{"query": "UI/UX Designer", "skills": ["Figma", "Adobe XD"]}'::jsonb, 0)
ON CONFLICT DO NOTHING;
