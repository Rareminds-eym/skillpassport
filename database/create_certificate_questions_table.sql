-- Generated External Assessment Master Table
-- Stores generated questions for each certificate (shared across all students)

CREATE TABLE IF NOT EXISTS generated_external_assessment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  certificate_name TEXT NOT NULL UNIQUE,
  course_id UUID,
  
  -- Assessment metadata
  assessment_level TEXT NOT NULL DEFAULT 'Intermediate',
  total_questions INTEGER NOT NULL DEFAULT 15,
  
  -- Questions (stored as JSONB)
  questions JSONB NOT NULL, -- Array of question objects
  
  -- Metadata
  generated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  generated_by TEXT, -- 'claude-ai', 'manual', etc.
  version INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_generated_external_assessment_name ON generated_external_assessment(certificate_name);
CREATE INDEX IF NOT EXISTS idx_generated_external_assessment_course_id ON generated_external_assessment(course_id);

-- Enable RLS
ALTER TABLE generated_external_assessment ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read generated assessments
CREATE POLICY "Anyone can read generated assessments"
  ON generated_external_assessment FOR SELECT
  USING (true);

-- Policy: Only authenticated users can insert (for initial generation)
CREATE POLICY "Authenticated users can insert generated assessments"
  ON generated_external_assessment FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

COMMENT ON TABLE generated_external_assessment IS 'Master questions for each certificate - shared across all students';
