-- SQL Schema for Interviews and Interview Reminders
-- Run this in your Supabase SQL Editor to create the interviews tables

-- ==================== INTERVIEWS TABLE ====================
CREATE TABLE IF NOT EXISTS interviews (
  id TEXT PRIMARY KEY,
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  candidate_name TEXT NOT NULL,
  candidate_email TEXT,
  candidate_phone TEXT,
  job_title TEXT NOT NULL,
  interviewer TEXT NOT NULL,
  interviewer_email TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER DEFAULT 60, -- duration in minutes
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'completed', 'cancelled', 'pending'
  type TEXT NOT NULL, -- 'Technical', 'HR', 'Behavioral', 'Final', etc.
  
  -- Meeting details
  meeting_type TEXT, -- 'teams', 'meet', 'zoom', 'phone', 'in-person'
  meeting_link TEXT,
  meeting_notes TEXT,
  
  -- Tracking
  reminders_sent INTEGER DEFAULT 0,
  completed_date TIMESTAMP WITH TIME ZONE,
  
  -- Scorecard (stored as JSONB for flexibility)
  scorecard JSONB,
  
  -- Metadata
  created_by TEXT, -- recruiter user ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==================== INTERVIEW_REMINDERS TABLE ====================
-- Track reminder activities for auditing and analytics
CREATE TABLE IF NOT EXISTS interview_reminders (
  id SERIAL PRIMARY KEY,
  interview_id TEXT NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  sent_to TEXT NOT NULL, -- email addresses or names
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  reminder_type TEXT NOT NULL, -- 'interview_reminder', 'follow_up', 'scorecard_reminder'
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'failed'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==================== INDEXES FOR PERFORMANCE ====================
CREATE INDEX IF NOT EXISTS idx_interviews_student_id ON interviews(student_id);
CREATE INDEX IF NOT EXISTS idx_interviews_date ON interviews(date);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(status);
CREATE INDEX IF NOT EXISTS idx_interviews_created_by ON interviews(created_by);
CREATE INDEX IF NOT EXISTS idx_interview_reminders_interview_id ON interview_reminders(interview_id);
CREATE INDEX IF NOT EXISTS idx_interview_reminders_sent_at ON interview_reminders(sent_at);

-- ==================== UPDATED_AT TRIGGER ====================
DROP TRIGGER IF EXISTS update_interviews_updated_at ON interviews;
CREATE TRIGGER update_interviews_updated_at 
  BEFORE UPDATE ON interviews 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ==================== ROW LEVEL SECURITY (RLS) ====================
-- Enable RLS on all tables
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_reminders ENABLE ROW LEVEL SECURITY;

-- For now, allow all authenticated users to manage interviews
-- You can customize these policies based on your authentication setup

-- Interviews policies
DROP POLICY IF EXISTS "Authenticated users can view interviews" ON interviews;
CREATE POLICY "Authenticated users can view interviews" 
  ON interviews FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create interviews" ON interviews;
CREATE POLICY "Authenticated users can create interviews" 
  ON interviews FOR INSERT 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update interviews" ON interviews;
CREATE POLICY "Authenticated users can update interviews" 
  ON interviews FOR UPDATE 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can delete interviews" ON interviews;
CREATE POLICY "Authenticated users can delete interviews" 
  ON interviews FOR DELETE 
  USING (true);

-- Interview reminders policies
DROP POLICY IF EXISTS "Authenticated users can view reminders" ON interview_reminders;
CREATE POLICY "Authenticated users can view reminders" 
  ON interview_reminders FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can log reminders" ON interview_reminders;
CREATE POLICY "Authenticated users can log reminders" 
  ON interview_reminders FOR INSERT 
  WITH CHECK (true);

-- ==================== COMMENTS ====================
COMMENT ON TABLE interviews IS 'Interview scheduling and tracking for candidates';
COMMENT ON TABLE interview_reminders IS 'Audit log for interview reminder activities';

COMMENT ON COLUMN interviews.scorecard IS 'JSONB object containing interview evaluation: {technical_skills, communication, problem_solving, cultural_fit, overall_rating, notes, recommendation}';
COMMENT ON COLUMN interviews.status IS 'scheduled: Initial state, confirmed: Candidate confirmed, completed: Interview done, cancelled: Interview cancelled, pending: Waiting for confirmation';
COMMENT ON COLUMN interviews.meeting_type IS 'Type of meeting platform: teams, meet, zoom, phone, in-person';

-- ==================== USEFUL VIEWS ====================
-- View to get upcoming interviews
CREATE OR REPLACE VIEW upcoming_interviews AS
SELECT 
  i.*,
  s.name as student_name,
  s.email as student_email,
  s.phone as student_phone,
  s.department,
  s.university
FROM interviews i
LEFT JOIN students s ON i.student_id = s.id
WHERE i.date > NOW()
  AND i.status NOT IN ('completed', 'cancelled')
ORDER BY i.date ASC;

COMMENT ON VIEW upcoming_interviews IS 'Upcoming interviews with student details';

-- View to get interviews requiring scorecards
CREATE OR REPLACE VIEW pending_scorecards AS
SELECT 
  i.*,
  s.name as student_name,
  s.department
FROM interviews i
LEFT JOIN students s ON i.student_id = s.id
WHERE i.status = 'completed'
  AND (i.scorecard IS NULL OR i.scorecard->>'overall_rating' IS NULL)
ORDER BY i.completed_date DESC;

COMMENT ON VIEW pending_scorecards IS 'Completed interviews missing scorecards';

-- ==================== SAMPLE DATA (Optional) ====================
-- Uncomment to insert sample data for testing

/*
INSERT INTO interviews (
  id, 
  student_id, 
  candidate_name, 
  candidate_email,
  job_title, 
  interviewer,
  interviewer_email,
  date, 
  duration,
  status, 
  type,
  meeting_type,
  meeting_link,
  reminders_sent
) VALUES 
(
  'int_' || gen_random_uuid()::text,
  (SELECT id FROM students LIMIT 1), -- Replace with actual student_id
  'John Doe',
  'john.doe@example.com',
  'Software Engineer',
  'Jane Smith',
  'jane.smith@company.com',
  NOW() + INTERVAL '2 days',
  60,
  'scheduled',
  'Technical',
  'meet',
  'https://meet.google.com/abc-defg-hij',
  0
),
(
  'int_' || gen_random_uuid()::text,
  (SELECT id FROM students LIMIT 1 OFFSET 1),
  'Alice Johnson',
  'alice.j@example.com',
  'Frontend Developer',
  'Bob Wilson',
  'bob.w@company.com',
  NOW() + INTERVAL '5 days',
  45,
  'confirmed',
  'Behavioral',
  'zoom',
  'https://zoom.us/j/123456789',
  1
);
*/
