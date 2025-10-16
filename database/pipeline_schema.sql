-- SQL Schema for Recruitment Pipeline Management
-- Run this in your Supabase SQL Editor to create the pipeline tables

-- ==================== REQUISITIONS TABLE ====================
CREATE TABLE IF NOT EXISTS requisitions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  job_type TEXT DEFAULT 'Full-time', -- 'Full-time', 'Part-time', 'Contract', 'Internship'
  openings INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active', -- 'active', 'closed', 'on_hold'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  
  -- Job Details
  description TEXT,
  requirements TEXT,
  salary_range TEXT,
  
  -- Ownership & Tracking
  owner TEXT, -- recruiter name or ID
  hiring_manager TEXT,
  created_by TEXT,
  created_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  target_date TIMESTAMP WITH TIME ZONE,
  filled_date TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  tags TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==================== PIPELINE_CANDIDATES TABLE ====================
-- Tracks candidates through the recruitment pipeline stages
CREATE TABLE IF NOT EXISTS pipeline_candidates (
  id SERIAL PRIMARY KEY,
  requisition_id TEXT NOT NULL REFERENCES requisitions(id) ON DELETE CASCADE,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  
  -- Candidate Info (denormalized for performance)
  candidate_name TEXT NOT NULL,
  candidate_email TEXT,
  candidate_phone TEXT,
  
  -- Pipeline Stage
  stage TEXT NOT NULL DEFAULT 'sourced', -- 'sourced', 'screened', 'interview_1', 'interview_2', 'offer', 'hired', 'rejected'
  previous_stage TEXT,
  
  -- Stage Tracking
  stage_changed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  stage_changed_by TEXT, -- recruiter who moved the candidate
  
  -- Status & Actions
  status TEXT DEFAULT 'active', -- 'active', 'rejected', 'withdrawn', 'on_hold'
  rejection_reason TEXT,
  rejection_date TIMESTAMP WITH TIME ZONE,
  
  -- Next Action
  next_action TEXT, -- 'send_email', 'schedule_interview', 'make_offer', 'follow_up', etc.
  next_action_date TIMESTAMP WITH TIME ZONE,
  next_action_notes TEXT,
  
  -- Scoring & Feedback
  recruiter_rating INTEGER, -- 1-5 scale
  recruiter_notes TEXT,
  
  -- Assignment
  assigned_to TEXT, -- interviewer or recruiter assigned
  
  -- Metadata
  source TEXT, -- 'talent_pool', 'direct_application', 'referral', 'sourced'
  added_by TEXT, -- recruiter who added the candidate
  added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Ensure a candidate can only be in one requisition once
  UNIQUE(requisition_id, student_id)
);

-- ==================== PIPELINE_ACTIVITY LOG ====================
-- Track all stage changes and activities
CREATE TABLE IF NOT EXISTS pipeline_activities (
  id SERIAL PRIMARY KEY,
  pipeline_candidate_id INTEGER NOT NULL REFERENCES pipeline_candidates(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'stage_change', 'email_sent', 'call_made', 'note_added', 'rating_changed'
  from_stage TEXT,
  to_stage TEXT,
  activity_details JSONB, -- Flexible storage for activity metadata
  performed_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==================== INDEXES FOR PERFORMANCE ====================
CREATE INDEX IF NOT EXISTS idx_requisitions_status ON requisitions(status);
CREATE INDEX IF NOT EXISTS idx_requisitions_created_by ON requisitions(created_by);
CREATE INDEX IF NOT EXISTS idx_requisitions_created_date ON requisitions(created_date);

CREATE INDEX IF NOT EXISTS idx_pipeline_candidates_requisition_id ON pipeline_candidates(requisition_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_candidates_student_id ON pipeline_candidates(student_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_candidates_stage ON pipeline_candidates(stage);
CREATE INDEX IF NOT EXISTS idx_pipeline_candidates_status ON pipeline_candidates(status);
CREATE INDEX IF NOT EXISTS idx_pipeline_candidates_next_action_date ON pipeline_candidates(next_action_date);

CREATE INDEX IF NOT EXISTS idx_pipeline_activities_pipeline_candidate_id ON pipeline_activities(pipeline_candidate_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_activities_created_at ON pipeline_activities(created_at);

-- ==================== UPDATED_AT TRIGGERS ====================
DROP TRIGGER IF EXISTS update_requisitions_updated_at ON requisitions;
CREATE TRIGGER update_requisitions_updated_at 
  BEFORE UPDATE ON requisitions 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pipeline_candidates_updated_at ON pipeline_candidates;
CREATE TRIGGER update_pipeline_candidates_updated_at 
  BEFORE UPDATE ON pipeline_candidates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ==================== ROW LEVEL SECURITY (RLS) ====================
ALTER TABLE requisitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_activities ENABLE ROW LEVEL SECURITY;

-- Requisitions policies
DROP POLICY IF EXISTS "Authenticated users can view requisitions" ON requisitions;
CREATE POLICY "Authenticated users can view requisitions" 
  ON requisitions FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage requisitions" ON requisitions;
CREATE POLICY "Authenticated users can manage requisitions" 
  ON requisitions FOR ALL 
  USING (true);

-- Pipeline candidates policies
DROP POLICY IF EXISTS "Authenticated users can view pipeline candidates" ON pipeline_candidates;
CREATE POLICY "Authenticated users can view pipeline candidates" 
  ON pipeline_candidates FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage pipeline candidates" ON pipeline_candidates;
CREATE POLICY "Authenticated users can manage pipeline candidates" 
  ON pipeline_candidates FOR ALL 
  USING (true);

-- Pipeline activities policies
DROP POLICY IF EXISTS "Authenticated users can view activities" ON pipeline_activities;
CREATE POLICY "Authenticated users can view activities" 
  ON pipeline_activities FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can log activities" ON pipeline_activities;
CREATE POLICY "Authenticated users can log activities" 
  ON pipeline_activities FOR INSERT 
  WITH CHECK (true);

-- ==================== COMMENTS ====================
COMMENT ON TABLE requisitions IS 'Job requisitions/openings for recruitment';
COMMENT ON TABLE pipeline_candidates IS 'Candidates in recruitment pipeline with stage tracking';
COMMENT ON TABLE pipeline_activities IS 'Audit log for all pipeline activities and stage changes';

COMMENT ON COLUMN pipeline_candidates.stage IS 'Current stage: sourced, screened, interview_1, interview_2, offer, hired, rejected';
COMMENT ON COLUMN pipeline_candidates.next_action IS 'Next scheduled action for this candidate';
COMMENT ON COLUMN pipeline_candidates.source IS 'How the candidate was added to pipeline';

-- ==================== USEFUL VIEWS ====================

-- View to get pipeline candidates with full student details
CREATE OR REPLACE VIEW pipeline_candidates_detailed AS
SELECT 
  pc.*,
  s.name as student_name,
  s.email as student_email,
  s.phone as student_phone,
  s.department,
  s.university,
  s.cgpa,
  s.employability_score,
  s.verified,
  r.title as job_title,
  r.location as job_location,
  r.status as requisition_status
FROM pipeline_candidates pc
LEFT JOIN students s ON pc.student_id = s.id
LEFT JOIN requisitions r ON pc.requisition_id = r.id
WHERE pc.status = 'active';

COMMENT ON VIEW pipeline_candidates_detailed IS 'Pipeline candidates with full student and requisition details';

-- View to get active requisitions with candidate counts per stage
CREATE OR REPLACE VIEW requisitions_with_pipeline_stats AS
SELECT 
  r.*,
  COUNT(DISTINCT pc.id) as total_candidates,
  COUNT(DISTINCT CASE WHEN pc.stage = 'sourced' THEN pc.id END) as sourced_count,
  COUNT(DISTINCT CASE WHEN pc.stage = 'screened' THEN pc.id END) as screened_count,
  COUNT(DISTINCT CASE WHEN pc.stage = 'interview_1' THEN pc.id END) as interview_1_count,
  COUNT(DISTINCT CASE WHEN pc.stage = 'interview_2' THEN pc.id END) as interview_2_count,
  COUNT(DISTINCT CASE WHEN pc.stage = 'offer' THEN pc.id END) as offer_count,
  COUNT(DISTINCT CASE WHEN pc.stage = 'hired' THEN pc.id END) as hired_count
FROM requisitions r
LEFT JOIN pipeline_candidates pc ON r.id = pc.requisition_id AND pc.status = 'active'
GROUP BY r.id;

COMMENT ON VIEW requisitions_with_pipeline_stats IS 'Requisitions with candidate counts per pipeline stage';

-- ==================== SAMPLE DATA (Optional) ====================
-- Uncomment to insert sample requisitions for testing

/*
INSERT INTO requisitions (
  id, title, department, location, job_type, openings, status, priority, owner, created_date
) VALUES 
(
  'req_' || gen_random_uuid()::text,
  'Software Engineer',
  'Engineering',
  'Remote',
  'Full-time',
  3,
  'active',
  'high',
  'Sarah Johnson',
  NOW()
),
(
  'req_' || gen_random_uuid()::text,
  'Product Manager',
  'Product',
  'San Francisco, CA',
  'Full-time',
  2,
  'active',
  'high',
  'Mike Chen',
  NOW()
),
(
  'req_' || gen_random_uuid()::text,
  'Data Analyst',
  'Analytics',
  'New York, NY',
  'Full-time',
  1,
  'active',
  'medium',
  'Emily Rodriguez',
  NOW()
);
*/
