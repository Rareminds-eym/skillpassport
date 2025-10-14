-- SQL Schema for Shortlists and Shortlist-Candidates Junction Table
-- Run this in your Supabase SQL Editor to create the shortlists tables

-- ==================== SHORTLISTS TABLE ====================
CREATE TABLE IF NOT EXISTS shortlists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by TEXT, -- recruiter user ID
  created_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'archived'
  
  -- Sharing settings
  shared BOOLEAN DEFAULT false,
  share_link TEXT,
  share_expiry TIMESTAMP WITH TIME ZONE,
  watermark BOOLEAN DEFAULT false,
  include_pii BOOLEAN DEFAULT false,
  notify_on_access BOOLEAN DEFAULT false,
  
  -- Metadata
  tags TEXT[], -- array of tags
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==================== SHORTLIST_CANDIDATES TABLE (Junction) ====================
-- This table creates a many-to-many relationship between shortlists and students
CREATE TABLE IF NOT EXISTS shortlist_candidates (
  id SERIAL PRIMARY KEY,
  shortlist_id TEXT NOT NULL REFERENCES shortlists(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  
  -- Additional metadata about when/why candidate was added
  added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  added_by TEXT, -- recruiter user ID
  notes TEXT, -- Optional notes about this candidate in this shortlist
  
  -- Ensure a student can only be added once to a shortlist
  UNIQUE(shortlist_id, student_id)
);

-- ==================== EXPORT_ACTIVITIES TABLE ====================
-- Track export activities for analytics and auditing
CREATE TABLE IF NOT EXISTS export_activities (
  id SERIAL PRIMARY KEY,
  shortlist_id TEXT NOT NULL REFERENCES shortlists(id) ON DELETE CASCADE,
  export_format TEXT NOT NULL, -- 'csv', 'pdf'
  export_type TEXT NOT NULL, -- 'mini_profile', 'full_profile'
  exported_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  exported_by TEXT, -- recruiter user ID
  include_pii BOOLEAN DEFAULT false
);

-- ==================== INDEXES FOR PERFORMANCE ====================
CREATE INDEX IF NOT EXISTS idx_shortlists_created_by ON shortlists(created_by);
CREATE INDEX IF NOT EXISTS idx_shortlists_created_date ON shortlists(created_date);
CREATE INDEX IF NOT EXISTS idx_shortlist_candidates_shortlist_id ON shortlist_candidates(shortlist_id);
CREATE INDEX IF NOT EXISTS idx_shortlist_candidates_student_id ON shortlist_candidates(student_id);
CREATE INDEX IF NOT EXISTS idx_export_activities_shortlist_id ON export_activities(shortlist_id);

-- ==================== UPDATED_AT TRIGGER ====================
DROP TRIGGER IF EXISTS update_shortlists_updated_at ON shortlists;
CREATE TRIGGER update_shortlists_updated_at 
  BEFORE UPDATE ON shortlists 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ==================== ROW LEVEL SECURITY (RLS) ====================
-- Enable RLS on all tables
ALTER TABLE shortlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortlist_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_activities ENABLE ROW LEVEL SECURITY;

-- For now, allow all authenticated users to manage shortlists
-- You can customize these policies based on your authentication setup

-- Shortlists policies
DROP POLICY IF EXISTS "Authenticated users can view shortlists" ON shortlists;
CREATE POLICY "Authenticated users can view shortlists" 
  ON shortlists FOR SELECT 
  USING (true); -- Adjust based on your auth requirements

DROP POLICY IF EXISTS "Authenticated users can create shortlists" ON shortlists;
CREATE POLICY "Authenticated users can create shortlists" 
  ON shortlists FOR INSERT 
  WITH CHECK (true); -- Adjust based on your auth requirements

DROP POLICY IF EXISTS "Authenticated users can update shortlists" ON shortlists;
CREATE POLICY "Authenticated users can update shortlists" 
  ON shortlists FOR UPDATE 
  USING (true); -- Adjust based on your auth requirements

DROP POLICY IF EXISTS "Authenticated users can delete shortlists" ON shortlists;
CREATE POLICY "Authenticated users can delete shortlists" 
  ON shortlists FOR DELETE 
  USING (true); -- Adjust based on your auth requirements

-- Shortlist candidates policies
DROP POLICY IF EXISTS "Authenticated users can view shortlist candidates" ON shortlist_candidates;
CREATE POLICY "Authenticated users can view shortlist candidates" 
  ON shortlist_candidates FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage shortlist candidates" ON shortlist_candidates;
CREATE POLICY "Authenticated users can manage shortlist candidates" 
  ON shortlist_candidates FOR ALL 
  USING (true);

-- Export activities policies
DROP POLICY IF EXISTS "Authenticated users can view export activities" ON export_activities;
CREATE POLICY "Authenticated users can view export activities" 
  ON export_activities FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can log export activities" ON export_activities;
CREATE POLICY "Authenticated users can log export activities" 
  ON export_activities FOR INSERT 
  WITH CHECK (true);

-- ==================== COMMENTS ====================
COMMENT ON TABLE shortlists IS 'Shortlists created by recruiters to organize candidates';
COMMENT ON TABLE shortlist_candidates IS 'Junction table linking shortlists to students';
COMMENT ON TABLE export_activities IS 'Audit log for shortlist exports';

-- ==================== USEFUL VIEWS ====================
-- View to get shortlist with candidate count
CREATE OR REPLACE VIEW shortlists_with_counts AS
SELECT 
  s.*,
  COALESCE(COUNT(sc.id), 0) as candidate_count
FROM shortlists s
LEFT JOIN shortlist_candidates sc ON s.id = sc.shortlist_id
GROUP BY s.id;

COMMENT ON VIEW shortlists_with_counts IS 'Shortlists with their candidate counts for efficient querying';
