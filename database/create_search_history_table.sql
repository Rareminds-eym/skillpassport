-- Create search_history table
CREATE TABLE IF NOT EXISTS search_history (
  id BIGSERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  search_term TEXT NOT NULL,
  search_count INTEGER DEFAULT 1,
  last_searched_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique combination of student and search term
  UNIQUE(student_id, search_term)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_search_history_student_id ON search_history(student_id);
CREATE INDEX IF NOT EXISTS idx_search_history_last_searched ON search_history(last_searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_search_history_search_count ON search_history(search_count DESC);

-- DISABLE RLS since you're using custom auth
ALTER TABLE search_history DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Students can view own search history" ON search_history;
DROP POLICY IF EXISTS "Students can insert own search history" ON search_history;
DROP POLICY IF EXISTS "Students can update own search history" ON search_history;
DROP POLICY IF EXISTS "Students can delete own search history" ON search_history;

-- Add comments
COMMENT ON TABLE search_history IS 'Stores student job search history with search count tracking';
COMMENT ON COLUMN search_history.search_term IS 'The search term entered by the student';
COMMENT ON COLUMN search_history.search_count IS 'Number of times this term has been searched';
COMMENT ON COLUMN search_history.last_searched_at IS 'Timestamp of the most recent search with this term';