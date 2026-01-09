-- =====================================================
-- Reports & Analytics - Missing Tables Migration
-- =====================================================
-- This migration creates the missing tables needed for
-- fully dynamic Reports & Analytics functionality
-- =====================================================

-- 1. College Attendance Table
-- =====================================================
CREATE TABLE IF NOT EXISTS college_attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  status VARCHAR(20) CHECK (status IN ('present', 'absent', 'late', 'excused')) DEFAULT 'present',
  subject_id UUID,
  class_id UUID,
  session_type VARCHAR(50) CHECK (session_type IN ('lecture', 'lab', 'tutorial', 'seminar')),
  marked_by UUID REFERENCES users(id),
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_college_attendance_student ON college_attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_college_attendance_date ON college_attendance(date);
CREATE INDEX IF NOT EXISTS idx_college_attendance_college ON college_attendance(college_id);
CREATE INDEX IF NOT EXISTS idx_college_attendance_department ON college_attendance(department_id);
CREATE INDEX IF NOT EXISTS idx_college_attendance_status ON college_attendance(status);

-- RLS Policies
ALTER TABLE college_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "College admins can view their college attendance"
  ON college_attendance FOR SELECT
  USING (
    college_id IN (
      SELECT id FROM colleges 
      WHERE created_by = auth.uid() 
      OR deanEmail = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "College admins can insert attendance"
  ON college_attendance FOR INSERT
  WITH CHECK (
    college_id IN (
      SELECT id FROM colleges 
      WHERE created_by = auth.uid()
      OR deanEmail = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "College admins can update attendance"
  ON college_attendance FOR UPDATE
  USING (
    college_id IN (
      SELECT id FROM colleges 
      WHERE created_by = auth.uid()
      OR deanEmail = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- 2. Placement Offers Table
-- =====================================================
CREATE TABLE IF NOT EXISTS placement_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  company_name VARCHAR(255) NOT NULL,
  company_id UUID,
  package_amount DECIMAL(12, 2) NOT NULL,
  package_currency VARCHAR(10) DEFAULT 'INR',
  package_type VARCHAR(50) CHECK (package_type IN ('ctc', 'in-hand', 'stipend')),
  offer_date DATE NOT NULL,
  joining_date DATE,
  offer_type VARCHAR(50) CHECK (offer_type IN ('full-time', 'internship', 'ppo', 'contract')) DEFAULT 'full-time',
  status VARCHAR(50) CHECK (status IN ('offered', 'accepted', 'rejected', 'expired', 'withdrawn')) DEFAULT 'offered',
  offer_letter_url TEXT,
  job_role VARCHAR(255),
  job_location VARCHAR(255),
  bond_duration_months INTEGER,
  remarks TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_placement_offers_student ON placement_offers(student_id);
CREATE INDEX IF NOT EXISTS idx_placement_offers_college ON placement_offers(college_id);
CREATE INDEX IF NOT EXISTS idx_placement_offers_department ON placement_offers(department_id);
CREATE INDEX IF NOT EXISTS idx_placement_offers_date ON placement_offers(offer_date);
CREATE INDEX IF NOT EXISTS idx_placement_offers_status ON placement_offers(status);
CREATE INDEX IF NOT EXISTS idx_placement_offers_company ON placement_offers(company_name);

-- RLS Policies
ALTER TABLE placement_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "College admins can view their college offers"
  ON placement_offers FOR SELECT
  USING (
    college_id IN (
      SELECT id FROM colleges 
      WHERE created_by = auth.uid()
      OR deanEmail = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "College admins can insert offers"
  ON placement_offers FOR INSERT
  WITH CHECK (
    college_id IN (
      SELECT id FROM colleges 
      WHERE created_by = auth.uid()
      OR deanEmail = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "College admins can update offers"
  ON placement_offers FOR UPDATE
  USING (
    college_id IN (
      SELECT id FROM colleges 
      WHERE created_by = auth.uid()
      OR deanEmail = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- 3. Sample Data Generation Functions
-- =====================================================

-- Function to generate sample attendance data
CREATE OR REPLACE FUNCTION generate_sample_attendance(
  p_college_id UUID,
  p_days_back INTEGER DEFAULT 90
) RETURNS void AS $$
DECLARE
  v_student RECORD;
  v_date DATE;
  v_status VARCHAR(20);
BEGIN
  -- For each student in the college
  FOR v_student IN 
    SELECT id, department_id 
    FROM students 
    WHERE college_id = p_college_id 
    LIMIT 100
  LOOP
    -- Generate attendance for past days
    FOR i IN 0..p_days_back LOOP
      v_date := CURRENT_DATE - i;
      
      -- Skip weekends
      IF EXTRACT(DOW FROM v_date) NOT IN (0, 6) THEN
        -- 90% present, 5% absent, 3% late, 2% excused
        v_status := CASE 
          WHEN random() < 0.90 THEN 'present'
          WHEN random() < 0.95 THEN 'absent'
          WHEN random() < 0.98 THEN 'late'
          ELSE 'excused'
        END;
        
        INSERT INTO college_attendance (
          student_id,
          college_id,
          department_id,
          date,
          status,
          session_type
        ) VALUES (
          v_student.id,
          p_college_id,
          v_student.department_id,
          v_date,
          v_status,
          CASE WHEN random() < 0.7 THEN 'lecture' ELSE 'lab' END
        ) ON CONFLICT DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE 'Sample attendance data generated for college %', p_college_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate sample placement offers
CREATE OR REPLACE FUNCTION generate_sample_placement_offers(
  p_college_id UUID,
  p_count INTEGER DEFAULT 50
) RETURNS void AS $$
DECLARE
  v_student RECORD;
  v_companies TEXT[] := ARRAY[
    'TCS', 'Infosys', 'Wipro', 'Cognizant', 'Accenture',
    'Google', 'Microsoft', 'Amazon', 'IBM', 'Oracle',
    'Capgemini', 'HCL', 'Tech Mahindra', 'L&T Infotech', 'Mindtree'
  ];
  v_roles TEXT[] := ARRAY[
    'Software Engineer', 'Data Analyst', 'System Engineer',
    'Full Stack Developer', 'DevOps Engineer', 'QA Engineer',
    'Business Analyst', 'Cloud Engineer', 'ML Engineer'
  ];
  v_locations TEXT[] := ARRAY[
    'Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Mumbai',
    'Delhi NCR', 'Kolkata', 'Ahmedabad'
  ];
BEGIN
  -- Generate offers for random students
  FOR v_student IN 
    SELECT id, department_id 
    FROM students 
    WHERE college_id = p_college_id 
    ORDER BY RANDOM()
    LIMIT p_count
  LOOP
    INSERT INTO placement_offers (
      student_id,
      college_id,
      department_id,
      company_name,
      package_amount,
      package_currency,
      package_type,
      offer_date,
      offer_type,
      status,
      job_role,
      job_location
    ) VALUES (
      v_student.id,
      p_college_id,
      v_student.department_id,
      v_companies[1 + floor(random() * array_length(v_companies, 1))::int],
      300000 + floor(random() * 1500000), -- 3L to 18L
      'INR',
      'ctc',
      CURRENT_DATE - floor(random() * 180)::int, -- Last 6 months
      CASE WHEN random() < 0.9 THEN 'full-time' ELSE 'internship' END,
      CASE 
        WHEN random() < 0.85 THEN 'accepted'
        WHEN random() < 0.95 THEN 'offered'
        ELSE 'rejected'
      END,
      v_roles[1 + floor(random() * array_length(v_roles, 1))::int],
      v_locations[1 + floor(random() * array_length(v_locations, 1))::int]
    );
  END LOOP;
  
  RAISE NOTICE 'Sample placement offers generated for college %', p_college_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Comments for documentation
-- =====================================================
COMMENT ON TABLE college_attendance IS 'Tracks daily attendance for college students';
COMMENT ON TABLE placement_offers IS 'Stores placement offers received by students';
COMMENT ON FUNCTION generate_sample_attendance IS 'Generates sample attendance data for testing';
COMMENT ON FUNCTION generate_sample_placement_offers IS 'Generates sample placement offers for testing';

-- =====================================================
-- Usage Instructions:
-- =====================================================
-- To generate sample data for your college:
-- 
-- 1. Get your college ID:
--    SELECT id FROM colleges WHERE deanEmail = 'your-email@example.com';
--
-- 2. Generate attendance data (90 days):
--    SELECT generate_sample_attendance('your-college-id-here', 90);
--
-- 3. Generate placement offers (50 offers):
--    SELECT generate_sample_placement_offers('your-college-id-here', 50);
-- =====================================================
