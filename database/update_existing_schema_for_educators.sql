-- Update existing schema to support educator profile functionality
-- This works with your existing school_educators table structure

-- ==================== ENSURE USERS TABLE EXISTS ====================
-- Make sure users table has the required fields for profile
DO $$ 
BEGIN
    -- Add full_name if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'full_name') THEN
        ALTER TABLE users ADD COLUMN full_name VARCHAR(255);
    END IF;
    
    -- Add phone if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE users ADD COLUMN phone VARCHAR(20);
    END IF;
END $$;

-- ==================== ENSURE SCHOOLS TABLE EXISTS ====================
-- Create schools table if it doesn't exist (for school_educators foreign key)
CREATE TABLE IF NOT EXISTS schools (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    established_date DATE,
    school_type VARCHAR(50), -- 'primary', 'secondary', 'university', etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    CONSTRAINT schools_pkey PRIMARY KEY (id)
);

-- ==================== ACTIVITIES TABLE FOR EDUCATOR VERIFICATION ====================
-- Table to track student activities that educators need to verify
CREATE TABLE IF NOT EXISTS student_activities (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    educator_id UUID REFERENCES school_educators(user_id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) NOT NULL, -- 'technical', 'soft_skill', 'project', 'achievement', etc.
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    evidence_url TEXT, -- URL to uploaded evidence/documents
    submitted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_date TIMESTAMP WITH TIME ZONE,
    reviewer_notes TEXT,
    skill_tags TEXT[], -- Array of related skills
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT student_activities_pkey PRIMARY KEY (id)
);

-- ==================== STUDENTS TABLE UPDATES ====================
-- Add educator reference to students table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'educator_id') THEN
        ALTER TABLE students ADD COLUMN educator_id UUID REFERENCES school_educators(user_id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_students_educator_id ON students(educator_id);
    END IF;
END $$;

-- ==================== MENTOR NOTES TABLE ====================
-- Table for educators to store private notes about students
CREATE TABLE IF NOT EXISTS mentor_notes (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    educator_id UUID NOT NULL REFERENCES school_educators(user_id) ON DELETE CASCADE,
    student_id UUID NOT NULL,
    note TEXT NOT NULL,
    category VARCHAR(50), -- 'performance', 'behavior', 'progress', 'concern', etc.
    is_private BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT mentor_notes_pkey PRIMARY KEY (id)
);

-- ==================== INDEXES FOR PERFORMANCE ====================
CREATE INDEX IF NOT EXISTS idx_student_activities_student_id ON student_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_student_activities_educator_id ON student_activities(educator_id);
CREATE INDEX IF NOT EXISTS idx_student_activities_status ON student_activities(status);
CREATE INDEX IF NOT EXISTS idx_student_activities_category ON student_activities(category);
CREATE INDEX IF NOT EXISTS idx_mentor_notes_educator_id ON mentor_notes(educator_id);
CREATE INDEX IF NOT EXISTS idx_mentor_notes_student_id ON mentor_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_schools_name ON schools(name);

-- ==================== UPDATED_AT TRIGGERS ====================
-- Create update function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to new tables
DROP TRIGGER IF EXISTS update_student_activities_updated_at ON student_activities;
CREATE TRIGGER update_student_activities_updated_at 
    BEFORE UPDATE ON student_activities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mentor_notes_updated_at ON mentor_notes;
CREATE TRIGGER update_mentor_notes_updated_at 
    BEFORE UPDATE ON mentor_notes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_schools_updated_at ON schools;
CREATE TRIGGER update_schools_updated_at 
    BEFORE UPDATE ON schools 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== ROW LEVEL SECURITY (RLS) ====================
-- Enable RLS on new tables
ALTER TABLE student_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Policies for student_activities
DROP POLICY IF EXISTS "Educators can view activities for their students" ON student_activities;
CREATE POLICY "Educators can view activities for their students" ON student_activities 
FOR SELECT USING (
    educator_id = auth.uid() OR 
    student_id IN (
        SELECT id FROM students 
        WHERE educator_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Educators can update activities for their students" ON student_activities;
CREATE POLICY "Educators can update activities for their students" ON student_activities 
FOR UPDATE USING (
    educator_id = auth.uid() OR 
    student_id IN (
        SELECT id FROM students 
        WHERE educator_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Students can view their own activities" ON student_activities;
CREATE POLICY "Students can view their own activities" ON student_activities 
FOR SELECT USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can insert their own activities" ON student_activities;
CREATE POLICY "Students can insert their own activities" ON student_activities 
FOR INSERT WITH CHECK (student_id = auth.uid());

-- Policies for mentor_notes
DROP POLICY IF EXISTS "Educators can manage notes for their students" ON mentor_notes;
CREATE POLICY "Educators can manage notes for their students" ON mentor_notes 
FOR ALL USING (educator_id = auth.uid());

-- Policies for schools (read-only for most users)
DROP POLICY IF EXISTS "Anyone can view schools" ON schools;
CREATE POLICY "Anyone can view schools" ON schools 
FOR SELECT USING (is_active = true);

-- ==================== SAMPLE DATA ====================
-- Insert a sample school if none exists
INSERT INTO schools (name, address, school_type) 
VALUES ('Sample High School', '123 Education St, Learning City', 'secondary')
ON CONFLICT DO NOTHING;

-- ==================== VIEWS FOR EASIER QUERIES ====================
-- Create a view for educator profile with related data
CREATE OR REPLACE VIEW educator_profiles AS
SELECT 
    se.*,
    u.email,
    u.full_name,
    u.phone,
    s.name as school_name,
    s.address as school_address,
    (SELECT COUNT(*) FROM students WHERE educator_id = se.user_id) as total_students,
    (SELECT COUNT(*) FROM student_activities WHERE educator_id = se.user_id AND status = 'verified') as verified_activities,
    (SELECT COUNT(*) FROM student_activities WHERE educator_id = se.user_id AND status = 'pending') as pending_activities
FROM school_educators se
LEFT JOIN users u ON se.user_id = u.id
LEFT JOIN schools s ON se.school_id = s.id
WHERE se.account_status = 'active';

-- ==================== COMMENTS ====================
COMMENT ON TABLE student_activities IS 'Student activities submitted for educator verification';
COMMENT ON TABLE mentor_notes IS 'Private notes that educators can keep about their students';
COMMENT ON TABLE schools IS 'School information for the education system';
COMMENT ON VIEW educator_profiles IS 'Comprehensive view of educator profiles with related data';

-- ==================== GRANT PERMISSIONS ====================
-- Grant necessary permissions (adjust based on your user roles)
GRANT SELECT ON educator_profiles TO authenticated;
GRANT ALL ON student_activities TO authenticated;
GRANT ALL ON mentor_notes TO authenticated;
GRANT SELECT ON schools TO authenticated;