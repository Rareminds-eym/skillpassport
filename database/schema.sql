-- SQL Schema for Skill Passport Student Database
-- Run this in your Supabase SQL Editor to create all necessary tables

-- ==================== STUDENTS TABLE ====================
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  university TEXT NOT NULL,
  department TEXT NOT NULL,
  photo TEXT,
  verified BOOLEAN DEFAULT false,
  employability_score INTEGER DEFAULT 0,
  cgpa TEXT,
  year_of_passing TEXT,
  passport_id TEXT UNIQUE,
  email TEXT UNIQUE,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==================== EDUCATION TABLE ====================
CREATE TABLE IF NOT EXISTS education (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  degree TEXT NOT NULL,
  department TEXT NOT NULL,
  university TEXT NOT NULL,
  year_of_passing TEXT NOT NULL,
  cgpa TEXT,
  level TEXT, -- 'Bachelor's', 'Master's', 'High School', 'Certificate', etc.
  status TEXT DEFAULT 'completed', -- 'ongoing', 'completed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==================== TRAINING TABLE ====================
CREATE TABLE IF NOT EXISTS training (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course TEXT NOT NULL,
  progress INTEGER DEFAULT 0, -- 0-100
  status TEXT DEFAULT 'ongoing', -- 'ongoing', 'completed'
  start_date DATE,
  end_date DATE,
  certificate_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==================== EXPERIENCE TABLE ====================
CREATE TABLE IF NOT EXISTS experience (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  organization TEXT NOT NULL,
  duration TEXT NOT NULL,
  description TEXT,
  verified BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==================== TECHNICAL SKILLS TABLE ====================
CREATE TABLE IF NOT EXISTS technical_skills (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER DEFAULT 1, -- 1-5 scale
  verified BOOLEAN DEFAULT false,
  icon TEXT, -- emoji or icon identifier
  category TEXT, -- 'Programming', 'Database', 'Framework', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(student_id, name)
);

-- ==================== SOFT SKILLS TABLE ====================
CREATE TABLE IF NOT EXISTS soft_skills (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER DEFAULT 1, -- 1-5 scale
  type TEXT, -- 'language', 'communication', 'leadership', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(student_id, name)
);

-- ==================== OPPORTUNITIES TABLE ====================
CREATE TABLE IF NOT EXISTS opportunities (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  type TEXT NOT NULL, -- 'internship', 'full-time', 'part-time', 'contract'
  deadline DATE,
  description TEXT,
  requirements TEXT,
  location TEXT,
  salary_range TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==================== RECENT UPDATES TABLE ====================
CREATE TABLE IF NOT EXISTS recent_updates (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'achievement', 'notification', 'opportunity'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  is_read BOOLEAN DEFAULT false,
  related_id INTEGER, -- ID of related entity (optional)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==================== SUGGESTIONS TABLE ====================
CREATE TABLE IF NOT EXISTS suggestions (
  id SERIAL PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  priority INTEGER DEFAULT 0, -- Higher = more important
  is_active BOOLEAN DEFAULT true,
  category TEXT, -- 'profile', 'skills', 'training', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==================== INDEXES FOR PERFORMANCE ====================
CREATE INDEX IF NOT EXISTS idx_education_student_id ON education(student_id);
CREATE INDEX IF NOT EXISTS idx_training_student_id ON training(student_id);
CREATE INDEX IF NOT EXISTS idx_experience_student_id ON experience(student_id);
CREATE INDEX IF NOT EXISTS idx_technical_skills_student_id ON technical_skills(student_id);
CREATE INDEX IF NOT EXISTS idx_soft_skills_student_id ON soft_skills(student_id);
CREATE INDEX IF NOT EXISTS idx_recent_updates_student_id ON recent_updates(student_id);
CREATE INDEX IF NOT EXISTS idx_suggestions_student_id ON suggestions(student_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_deadline ON opportunities(deadline);

-- ==================== UPDATED_AT TRIGGER ====================
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at column
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_education_updated_at ON education;
CREATE TRIGGER update_education_updated_at BEFORE UPDATE ON education FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_training_updated_at ON training;
CREATE TRIGGER update_training_updated_at BEFORE UPDATE ON training FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_experience_updated_at ON experience;
CREATE TRIGGER update_experience_updated_at BEFORE UPDATE ON experience FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_technical_skills_updated_at ON technical_skills;
CREATE TRIGGER update_technical_skills_updated_at BEFORE UPDATE ON technical_skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_soft_skills_updated_at ON soft_skills;
CREATE TRIGGER update_soft_skills_updated_at BEFORE UPDATE ON soft_skills FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_opportunities_updated_at ON opportunities;
CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_suggestions_updated_at ON suggestions;
CREATE TRIGGER update_suggestions_updated_at BEFORE UPDATE ON suggestions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== ROW LEVEL SECURITY (RLS) ====================
-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;
ALTER TABLE training ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE technical_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE soft_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Policies for students table (students can read/update their own data)
DROP POLICY IF EXISTS "Students can view their own profile" ON students;
CREATE POLICY "Students can view their own profile" ON students FOR SELECT USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Students can update their own profile" ON students;
CREATE POLICY "Students can update their own profile" ON students FOR UPDATE USING (auth.uid()::text = id);

DROP POLICY IF EXISTS "Students can insert their own profile" ON students;
CREATE POLICY "Students can insert their own profile" ON students FOR INSERT WITH CHECK (auth.uid()::text = id);

-- Policies for education (students can manage their own education)
DROP POLICY IF EXISTS "Students can view their own education" ON education;
CREATE POLICY "Students can view their own education" ON education FOR SELECT USING (auth.uid()::text = student_id);

DROP POLICY IF EXISTS "Students can insert their own education" ON education;
CREATE POLICY "Students can insert their own education" ON education FOR INSERT WITH CHECK (auth.uid()::text = student_id);

DROP POLICY IF EXISTS "Students can update their own education" ON education;
CREATE POLICY "Students can update their own education" ON education FOR UPDATE USING (auth.uid()::text = student_id);

DROP POLICY IF EXISTS "Students can delete their own education" ON education;
CREATE POLICY "Students can delete their own education" ON education FOR DELETE USING (auth.uid()::text = student_id);

-- Similar policies for other tables (training, experience, skills, etc.)
-- Training
DROP POLICY IF EXISTS "Students can view their own training" ON training;
CREATE POLICY "Students can view their own training" ON training FOR SELECT USING (auth.uid()::text = student_id);

DROP POLICY IF EXISTS "Students can manage their own training" ON training;
CREATE POLICY "Students can manage their own training" ON training FOR ALL USING (auth.uid()::text = student_id);

-- Experience
DROP POLICY IF EXISTS "Students can view their own experience" ON experience;
CREATE POLICY "Students can view their own experience" ON experience FOR SELECT USING (auth.uid()::text = student_id);

DROP POLICY IF EXISTS "Students can manage their own experience" ON experience;
CREATE POLICY "Students can manage their own experience" ON experience FOR ALL USING (auth.uid()::text = student_id);

-- Technical Skills
DROP POLICY IF EXISTS "Students can view their own technical skills" ON technical_skills;
CREATE POLICY "Students can view their own technical skills" ON technical_skills FOR SELECT USING (auth.uid()::text = student_id);

DROP POLICY IF EXISTS "Students can manage their own technical skills" ON technical_skills;
CREATE POLICY "Students can manage their own technical skills" ON technical_skills FOR ALL USING (auth.uid()::text = student_id);

-- Soft Skills
DROP POLICY IF EXISTS "Students can view their own soft skills" ON soft_skills;
CREATE POLICY "Students can view their own soft skills" ON soft_skills FOR SELECT USING (auth.uid()::text = student_id);

DROP POLICY IF EXISTS "Students can manage their own soft skills" ON soft_skills;
CREATE POLICY "Students can manage their own soft skills" ON soft_skills FOR ALL USING (auth.uid()::text = student_id);

-- Opportunities (everyone can view, admin can manage)
DROP POLICY IF EXISTS "Anyone can view active opportunities" ON opportunities;
CREATE POLICY "Anyone can view active opportunities" ON opportunities FOR SELECT USING (is_active = true);

-- Recent Updates
DROP POLICY IF EXISTS "Students can view their own updates" ON recent_updates;
CREATE POLICY "Students can view their own updates" ON recent_updates FOR SELECT USING (auth.uid()::text = student_id);

-- Suggestions
DROP POLICY IF EXISTS "Students can view their own suggestions" ON suggestions;
CREATE POLICY "Students can view their own suggestions" ON suggestions FOR SELECT USING (auth.uid()::text = student_id);

-- ==================== COMMENTS ====================
COMMENT ON TABLE students IS 'Main student profile information';
COMMENT ON TABLE education IS 'Student education history and qualifications';
COMMENT ON TABLE training IS 'Student training courses and certifications';
COMMENT ON TABLE experience IS 'Student work experience and achievements';
COMMENT ON TABLE technical_skills IS 'Student technical skills and proficiency levels';
COMMENT ON TABLE soft_skills IS 'Student soft skills including languages and communication';
COMMENT ON TABLE opportunities IS 'Job and internship opportunities';
COMMENT ON TABLE recent_updates IS 'Student activity feed and notifications';
COMMENT ON TABLE suggestions IS 'Personalized suggestions for students';
