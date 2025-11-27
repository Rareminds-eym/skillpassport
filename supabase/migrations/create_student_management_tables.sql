-- ============================================
-- STUDENT MANAGEMENT SYSTEM TABLES
-- ============================================

-- 1. ADMISSION APPLICATIONS TABLE
CREATE TABLE IF NOT EXISTS admission_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  application_number TEXT NOT NULL UNIQUE,
  
  -- Student Basic Info
  student_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  aadhar_number TEXT,
  passport_number TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Parent Details
  father_name TEXT NOT NULL,
  father_occupation TEXT,
  father_phone TEXT,
  father_email TEXT,
  mother_name TEXT NOT NULL,
  mother_occupation TEXT,
  mother_phone TEXT,
  guardian_name TEXT,
  guardian_relation TEXT,
  guardian_phone TEXT,
  
  -- Address
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL,
  
  -- Previous School
  previous_school TEXT,
  previous_class TEXT,
  previous_board TEXT,
  
  -- Documents (JSONB)
  documents JSONB DEFAULT '{}'::jsonb,
  
  -- Application Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'document_verification', 'fee_payment', 'approved', 'rejected')),
  applied_for TEXT NOT NULL, -- Class applying for
  applied_date TIMESTAMPTZ DEFAULT NOW(),
  verified_by UUID REFERENCES auth.users(id),
  verified_date TIMESTAMPTZ,
  enrollment_number TEXT,
  
  -- Fee Details
  fee_status TEXT DEFAULT 'pending' CHECK (fee_status IN ('pending', 'partial', 'paid')),
  fee_amount DECIMAL(10,2),
  fee_paid DECIMAL(10,2) DEFAULT 0,
  
  remarks TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for admission_applications
CREATE INDEX idx_admission_applications_school ON admission_applications(school_id);
CREATE INDEX idx_admission_applications_status ON admission_applications(status);
CREATE INDEX idx_admission_applications_applied_date ON admission_applications(applied_date);

-- 2. STUDENT MANAGEMENT RECORDS TABLE
CREATE TABLE IF NOT EXISTS student_management_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  -- Academic Info
  enrollment_number TEXT UNIQUE,
  class TEXT,
  section TEXT,
  roll_number TEXT,
  admission_date DATE,
  academic_year TEXT,
  
  -- Medical Info
  blood_group TEXT,
  allergies TEXT[],
  chronic_conditions TEXT[],
  medications TEXT[],
  emergency_contact TEXT,
  emergency_phone TEXT,
  
  -- Career Interests
  primary_interest TEXT,
  secondary_interest TEXT,
  career_skills TEXT[],
  aspirations TEXT,
  
  -- Fee Status
  total_fee DECIMAL(10,2),
  paid_amount DECIMAL(10,2) DEFAULT 0,
  pending_amount DECIMAL(10,2),
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred', 'graduated')),
  photo_url TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(student_id, school_id)
);

-- Indexes for student_management_records
CREATE INDEX idx_student_management_records_student ON student_management_records(student_id);
CREATE INDEX idx_student_management_records_school ON student_management_records(school_id);
CREATE INDEX idx_student_management_records_enrollment ON student_management_records(enrollment_number);

-- 3. ATTENDANCE RECORDS TABLE
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  mode TEXT DEFAULT 'manual' CHECK (mode IN ('manual', 'rfid', 'mobile')),
  
  time_in TIME,
  time_out TIME,
  
  marked_by UUID REFERENCES auth.users(id),
  remarks TEXT,
  otp_verified BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(student_id, date)
);

-- Indexes for attendance_records
CREATE INDEX idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_records_school ON attendance_records(school_id);
CREATE INDEX idx_attendance_records_date ON attendance_records(date);
CREATE INDEX idx_attendance_records_status ON attendance_records(status);

-- 4. ATTENDANCE ALERTS TABLE
CREATE TABLE IF NOT EXISTS attendance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  alert_type TEXT NOT NULL CHECK (alert_type IN ('consecutive_absent', 'below_75', 'irregular')),
  message TEXT NOT NULL,
  
  days_absent INTEGER,
  attendance_percentage DECIMAL(5,2),
  
  parent_notified BOOLEAN DEFAULT FALSE,
  notified_date TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for attendance_alerts
CREATE INDEX idx_attendance_alerts_student ON attendance_alerts(student_id);
CREATE INDEX idx_attendance_alerts_school ON attendance_alerts(school_id);
CREATE INDEX idx_attendance_alerts_notified ON attendance_alerts(parent_notified);

-- 5. STUDENT REPORTS TABLE
CREATE TABLE IF NOT EXISTS student_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  report_type TEXT NOT NULL CHECK (report_type IN ('attendance', 'academic', 'behavioral', 'skill_assessment', 'career_readiness')),
  title TEXT NOT NULL,
  
  generated_date TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES auth.users(id),
  
  academic_year TEXT NOT NULL,
  term TEXT,
  
  -- Report Data (JSONB)
  data JSONB NOT NULL,
  
  -- Export Options
  pdf_url TEXT,
  has_school_logo BOOLEAN DEFAULT TRUE,
  is_parent_friendly BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for student_reports
CREATE INDEX idx_student_reports_student ON student_reports(student_id);
CREATE INDEX idx_student_reports_school ON student_reports(school_id);
CREATE INDEX idx_student_reports_type ON student_reports(report_type);
CREATE INDEX idx_student_reports_date ON student_reports(generated_date);

-- 6. SKILL ASSESSMENTS TABLE
CREATE TABLE IF NOT EXISTS skill_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  
  assessment_type TEXT NOT NULL,
  assessment_date DATE NOT NULL,
  score DECIMAL(5,2) NOT NULL,
  max_score DECIMAL(5,2) DEFAULT 100,
  
  subject TEXT,
  topic TEXT,
  
  remarks TEXT,
  assessed_by UUID REFERENCES auth.users(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for skill_assessments
CREATE INDEX idx_skill_assessments_student ON skill_assessments(student_id);
CREATE INDEX idx_skill_assessments_school ON skill_assessments(school_id);
CREATE INDEX idx_skill_assessments_type ON skill_assessments(assessment_type);
CREATE INDEX idx_skill_assessments_date ON skill_assessments(assessment_date);

-- ============================================
-- DATABASE FUNCTIONS
-- ============================================

-- Function to generate enrollment number
CREATE OR REPLACE FUNCTION generate_enrollment_number(
  p_school_id UUID,
  p_academic_year TEXT
)
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
  v_enrollment_number TEXT;
BEGIN
  -- Count existing enrollments for this school and year
  SELECT COUNT(*) INTO v_count
  FROM student_management_records
  WHERE school_id = p_school_id
    AND academic_year = p_academic_year;
  
  -- Generate enrollment number: YEAR-SCHOOLID-SEQUENCE
  v_enrollment_number := p_academic_year || '-' || 
                         SUBSTRING(p_school_id::TEXT, 1, 8) || '-' || 
                         LPAD((v_count + 1)::TEXT, 4, '0');
  
  RETURN v_enrollment_number;
END;
$$ LANGUAGE plpgsql;

-- Function to check attendance alerts
CREATE OR REPLACE FUNCTION check_attendance_alerts()
RETURNS void AS $$
DECLARE
  v_student RECORD;
  v_total_days INTEGER;
  v_present_days INTEGER;
  v_absent_days INTEGER;
  v_percentage DECIMAL(5,2);
  v_consecutive_absent INTEGER;
BEGIN
  -- Loop through all active students
  FOR v_student IN 
    SELECT DISTINCT s.id, s.school_id
    FROM students s
    INNER JOIN student_management_records spe ON s.id = spe.student_id
    WHERE spe.status = 'active'
  LOOP
    -- Calculate attendance for last 30 days
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'present') as present,
      COUNT(*) FILTER (WHERE status = 'absent') as absent
    INTO v_total_days, v_present_days, v_absent_days
    FROM attendance_records
    WHERE student_id = v_student.id
      AND date >= CURRENT_DATE - INTERVAL '30 days';
    
    -- Calculate percentage
    IF v_total_days > 0 THEN
      v_percentage := (v_present_days::DECIMAL / v_total_days) * 100;
      
      -- Check if below 75%
      IF v_percentage < 75 THEN
        INSERT INTO attendance_alerts (student_id, school_id, alert_type, message, attendance_percentage)
        VALUES (
          v_student.id,
          v_student.school_id,
          'below_75',
          'Attendance has fallen below 75%',
          v_percentage
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
    
    -- Check consecutive absences
    SELECT COUNT(*) INTO v_consecutive_absent
    FROM (
      SELECT date, status,
             date - ROW_NUMBER() OVER (ORDER BY date)::INTEGER * INTERVAL '1 day' as grp
      FROM attendance_records
      WHERE student_id = v_student.id
        AND status = 'absent'
        AND date >= CURRENT_DATE - INTERVAL '7 days'
    ) sub
    GROUP BY grp
    ORDER BY COUNT(*) DESC
    LIMIT 1;
    
    -- Alert if 3+ consecutive absences
    IF v_consecutive_absent >= 3 THEN
      INSERT INTO attendance_alerts (student_id, school_id, alert_type, message, days_absent)
      VALUES (
        v_student.id,
        v_student.school_id,
        'consecutive_absent',
        'Student has been absent for ' || v_consecutive_absent || ' consecutive days',
        v_consecutive_absent
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE admission_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_management_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admission_applications
CREATE POLICY "School admins can view their school's applications"
  ON admission_applications FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM school_educators 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "School admins can insert applications"
  ON admission_applications FOR INSERT
  WITH CHECK (
    school_id IN (
      SELECT school_id FROM school_educators 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "School admins can update their school's applications"
  ON admission_applications FOR UPDATE
  USING (
    school_id IN (
      SELECT school_id FROM school_educators 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for student_management_records
CREATE POLICY "School staff can view their school's student records"
  ON student_management_records FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM school_educators 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "School staff can manage student records"
  ON student_management_records FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM school_educators 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for attendance_records
CREATE POLICY "School staff can view attendance"
  ON attendance_records FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM school_educators 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "School staff can manage attendance"
  ON attendance_records FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM school_educators 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for attendance_alerts
CREATE POLICY "School staff can view alerts"
  ON attendance_alerts FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM school_educators 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "School staff can manage alerts"
  ON attendance_alerts FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM school_educators 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for student_reports
CREATE POLICY "School staff can view reports"
  ON student_reports FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM school_educators 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "School staff can manage reports"
  ON student_reports FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM school_educators 
      WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for skill_assessments
CREATE POLICY "School staff can view assessments"
  ON skill_assessments FOR SELECT
  USING (
    school_id IN (
      SELECT school_id FROM school_educators 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "School staff can manage assessments"
  ON skill_assessments FOR ALL
  USING (
    school_id IN (
      SELECT school_id FROM school_educators 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- STORAGE BUCKET
-- ============================================

-- Create storage bucket for admission documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('admission-documents', 'admission-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "School staff can upload admission documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'admission-documents' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "School staff can view admission documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'admission-documents' AND
    auth.role() = 'authenticated'
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admission_applications_updated_at
  BEFORE UPDATE ON admission_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_management_records_updated_at
  BEFORE UPDATE ON student_management_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_skill_assessments_updated_at
  BEFORE UPDATE ON skill_assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
