-- SQL Schema for Educators Table
-- Run this in your Supabase SQL Editor to create the educators table

-- ==================== EDUCATORS TABLE ====================
CREATE TABLE IF NOT EXISTS educators (
  id TEXT PRIMARY KEY, -- This will match auth.users.id
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  department TEXT,
  position TEXT,
  bio TEXT,
  avatar_url TEXT,
  specializations TEXT[], -- Array of specialization areas
  date_joined TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==================== ACTIVITIES TABLE ====================
-- Table to track student activities that educators need to verify
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  educator_id TEXT REFERENCES educators(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'technical', 'soft_skill', 'project', 'achievement', etc.
  status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  evidence_url TEXT, -- URL to uploaded evidence/documents
  submitted_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  reviewed_date TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT,
  skill_tags TEXT[], -- Array of related skills
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==================== EDUCATOR-STUDENT RELATIONSHIPS ====================
-- Table to manage which students are assigned to which educators
CREATE TABLE IF NOT EXISTS educator_students (
  id SERIAL PRIMARY KEY,
  educator_id TEXT NOT NULL REFERENCES educators(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(educator_id, student_id)
);

-- ==================== MENTOR NOTES TABLE ====================
-- Table for educators to store private notes about students
CREATE TABLE IF NOT EXISTS mentor_notes (
  id SERIAL PRIMARY KEY,
  educator_id TEXT NOT NULL REFERENCES educators(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  category TEXT, -- 'performance', 'behavior', 'progress', 'concern', etc.
  is_private BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==================== INDEXES FOR PERFORMANCE ====================
CREATE INDEX IF NOT EXISTS idx_educators_email ON educators(email);
CREATE INDEX IF NOT EXISTS idx_educators_department ON educators(department);
CREATE INDEX IF NOT EXISTS idx_activities_student_id ON activities(student_id);
CREATE INDEX IF NOT EXISTS idx_activities_educator_id ON activities(educator_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
CREATE INDEX IF NOT EXISTS idx_educator_students_educator_id ON educator_students(educator_id);
CREATE INDEX IF NOT EXISTS idx_educator_students_student_id ON educator_students(student_id);
CREATE INDEX IF NOT EXISTS idx_mentor_notes_educator_id ON mentor_notes(educator_id);
CREATE INDEX IF NOT EXISTS idx_mentor_notes_student_id ON mentor_notes(student_id);

-- ==================== UPDATED_AT TRIGGERS ====================
-- Apply trigger to educators table
DROP TRIGGER IF EXISTS update_educators_updated_at ON educators;
CREATE TRIGGER update_educators_updated_at BEFORE UPDATE ON educators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to activities table
DROP TRIGGER IF EXISTS update_activities_updated_at ON activities;
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to mentor_notes table
DROP TRIGGER IF EXISTS update_mentor_notes_updated_at ON mentor_notes;
CREATE TRIGGER update_mentor_notes_updated_at BEFORE UPDATE ON mentor_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== ROW LEVEL SECURITY (RLS) ====================
-- Enable RLS on all new tables
ALTER TABLE educators ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE educator_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_notes ENABLE ROW LEVEL SECURITY;

-- Policies for educators table (educators can read/update their own data)
DROP POLICY IF EXISTS "Educators can view their own profile" ON educators;
CREATE POLICY "Educators can view their own profile" ON educators FOR SELECT USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Educators can update their own profile" ON educators;
CREATE POLICY "Educators can update their own profile" ON educators FOR UPDATE USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Educators can insert their own profile" ON educators;
CREATE POLICY "Educators can insert their own profile" ON educators FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Policies for activities (educators can view activities for their students)
DROP POLICY IF EXISTS "Educators can view activities for their students" ON activities;
CREATE POLICY "Educators can view activities for their students" ON activities FOR SELECT USING (
  educator_id = auth.uid()::text OR 
  student_id IN (
    SELECT student_id FROM educator_students 
    WHERE educator_id = auth.uid()::text AND is_active = true
  )
);

DROP POLICY IF EXISTS "Educators can update activities for their students" ON activities;
CREATE POLICY "Educators can update activities for their students" ON activities FOR UPDATE USING (
  educator_id = auth.uid()::text OR 
  student_id IN (
    SELECT student_id FROM educator_students 
    WHERE educator_id = auth.uid()::text AND is_active = true
  )
);

DROP POLICY IF EXISTS "Students can view their own activities" ON activities;
CREATE POLICY "Students can view their own activities" ON activities FOR SELECT USING (auth.uid()::text = student_id);

DROP POLICY IF EXISTS "Students can insert their own activities" ON activities;
CREATE POLICY "Students can insert their own activities" ON activities FOR INSERT WITH CHECK (auth.uid()::text = student_id);

-- Policies for educator_students (educators can view their assigned students)
DROP POLICY IF EXISTS "Educators can view their assigned students" ON educator_students;
CREATE POLICY "Educators can view their assigned students" ON educator_students FOR SELECT USING (auth.uid()::text = educator_id);

-- Policies for mentor_notes (educators can manage notes for their students)
DROP POLICY IF EXISTS "Educators can manage notes for their students" ON mentor_notes;
CREATE POLICY "Educators can manage notes for their students" ON mentor_notes FOR ALL USING (auth.uid()::text = educator_id);

-- ==================== SAMPLE DATA ====================
-- Insert sample educator (you can modify this with real data)
INSERT INTO educators (id, email, full_name, department, position, bio) VALUES 
('sample-educator-id', 'educator@example.com', 'Dr. Jane Smith', 'Computer Science', 'Senior Lecturer', 'Experienced educator specializing in software development and student mentorship.')
ON CONFLICT (id) DO NOTHING;

-- ==================== COMMENTS ====================
COMMENT ON TABLE educators IS 'Educator profile information and credentials';
COMMENT ON TABLE activities IS 'Student activities submitted for educator verification';
COMMENT ON TABLE educator_students IS 'Mapping between educators and their assigned students';
COMMENT ON TABLE mentor_notes IS 'Private notes that educators can keep about their students';