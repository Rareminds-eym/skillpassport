-- Student Management Module Schema
-- This extends the existing students table without modifying it

-- Admission Applications Table
CREATE TABLE IF NOT EXISTS public.admission_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_number text UNIQUE NOT NULL,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  
  -- Student Basic Info
  student_name text NOT NULL CHECK (student_name !~ '\d'),
  date_of_birth date NOT NULL CHECK (date_of_birth < CURRENT_DATE),
  gender text CHECK (gender IN ('male', 'female', 'other')),
  aadhar_number text UNIQUE,
  passport_number text UNIQUE,
  email text NOT NULL,
  phone text NOT NULL,
  
  -- Parent Details
  father_name text NOT NULL,
  father_occupation text,
  father_phone text NOT NULL,
  father_email text,
  mother_name text NOT NULL,
  mother_occupation text,
  mother_phone text NOT NULL,
  mother_email text,
  guardian_name text,
  guardian_relation text,
  guardian_phone text,
  
  -- Address
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  
  -- Previous School
  previous_school text,
  previous_class text,
  previous_board text,
  
  -- Documents (stored as JSONB for flexibility)
  documents jsonb DEFAULT '{}'::jsonb,
  
  -- Application Status
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'document_verification', 'fee_payment', 'approved', 'rejected')),
  applied_for text NOT NULL,
  applied_date timestamp with time zone DEFAULT now(),
  verified_by uuid REFERENCES auth.users(id),
  verified_date timestamp with time zone,
  enrollment_number text UNIQUE,
  
  -- Fee Details
  fee_status text DEFAULT 'pending' CHECK (fee_status IN ('pending', 'partial', 'paid')),
  fee_amount numeric(10,2),
  fee_paid numeric(10,2) DEFAULT 0,
  
  remarks text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT check_aadhar_or_passport CHECK (aadhar_number IS NOT NULL OR passport_number IS NOT NULL)
);

-- Student Profiles Extended (links to existing students table)
CREATE TABLE IF NOT EXISTS public.student_profiles_extended (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE UNIQUE,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  enrollment_number text UNIQUE NOT NULL,
  
  -- Academic Info
  class text NOT NULL,
  section text NOT NULL,
  roll_number text NOT NULL,
  admission_date date NOT NULL,
  academic_year text NOT NULL,
  
  -- Medical Information
  blood_group text,
  allergies text[],
  chronic_conditions text[],
  medications text[],
  emergency_contact text NOT NULL,
  emergency_phone text NOT NULL,
  
  -- Career Interest
  primary_interest text,
  secondary_interest text,
  career_skills text[],
  aspirations text,
  
  -- Fee Status
  total_fee numeric(10,2) DEFAULT 0,
  paid_amount numeric(10,2) DEFAULT 0,
  pending_amount numeric(10,2) DEFAULT 0,
  last_payment_date date,
  next_due_date date,
  
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'transferred', 'graduated')),
  photo_url text,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT unique_roll_class_section UNIQUE (school_id, class, section, roll_number)
);

-- Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
  mode text NOT NULL CHECK (mode IN ('manual', 'rfid', 'mobile')),
  time_in time,
  time_out time,
  marked_by uuid REFERENCES auth.users(id),
  remarks text,
  otp_verified boolean DEFAULT false,
  
  created_at timestamp with time zone DEFAULT now(),
  
  CONSTRAINT unique_student_date UNIQUE (student_id, date)
);

-- Attendance Alerts Table
CREATE TABLE IF NOT EXISTS public.attendance_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  alert_type text NOT NULL CHECK (alert_type IN ('consecutive_absent', 'below_75', 'irregular')),
  message text NOT NULL,
  days_absent integer,
  attendance_percentage numeric(5,2),
  parent_notified boolean DEFAULT false,
  notified_date timestamp with time zone,
  
  created_at timestamp with time zone DEFAULT now()
);

-- Skill Assessments Table
CREATE TABLE IF NOT EXISTS public.skill_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  assessment_date date NOT NULL,
  assessment_type text NOT NULL,
  score numeric(5,2) NOT NULL,
  max_score numeric(5,2) DEFAULT 100,
  remarks text,
  assessed_by uuid REFERENCES auth.users(id),
  
  created_at timestamp with time zone DEFAULT now()
);

-- Student Reports Table
CREATE TABLE IF NOT EXISTS public.student_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  report_type text NOT NULL CHECK (report_type IN ('attendance', 'academic', 'behavioral', 'skill_assessment', 'career_readiness')),
  title text NOT NULL,
  generated_date timestamp with time zone DEFAULT now(),
  generated_by uuid REFERENCES auth.users(id),
  academic_year text NOT NULL,
  term text,
  
  -- Report Data (flexible JSONB)
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  
  -- Export Options
  pdf_url text,
  has_school_logo boolean DEFAULT true,
  is_parent_friendly boolean DEFAULT true,
  
  created_at timestamp with time zone DEFAULT now()
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_admission_applications_school ON public.admission_applications(school_id);
CREATE INDEX IF NOT EXISTS idx_admission_applications_status ON public.admission_applications(status);
CREATE INDEX IF NOT EXISTS idx_admission_applications_applied_date ON public.admission_applications(applied_date);

CREATE INDEX IF NOT EXISTS idx_student_profiles_extended_school ON public.student_profiles_extended(school_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_extended_student ON public.student_profiles_extended(student_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_extended_class ON public.student_profiles_extended(class, section);

CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON public.attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_date ON public.attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_school_date ON public.attendance_records(school_id, date);

CREATE INDEX IF NOT EXISTS idx_attendance_alerts_student ON public.attendance_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_alerts_school ON public.attendance_alerts(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_alerts_notified ON public.attendance_alerts(parent_notified);

CREATE INDEX IF NOT EXISTS idx_skill_assessments_student ON public.skill_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_skill_assessments_date ON public.skill_assessments(assessment_date);

CREATE INDEX IF NOT EXISTS idx_student_reports_student ON public.student_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_student_reports_type ON public.student_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_student_reports_school ON public.student_reports(school_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admission_applications_updated_at BEFORE UPDATE ON public.admission_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_profiles_extended_updated_at BEFORE UPDATE ON public.student_profiles_extended
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate enrollment number
CREATE OR REPLACE FUNCTION generate_enrollment_number(p_school_id uuid, p_academic_year text)
RETURNS text AS $$
DECLARE
  v_school_code text;
  v_year_code text;
  v_sequence integer;
  v_enrollment_number text;
BEGIN
  -- Get school code (first 3 letters of school name)
  SELECT UPPER(LEFT(REGEXP_REPLACE(name, '[^a-zA-Z]', '', 'g'), 3))
  INTO v_school_code
  FROM schools
  WHERE id = p_school_id;
  
  -- Get year code (last 2 digits of year)
  v_year_code := RIGHT(p_academic_year, 2);
  
  -- Get next sequence number
  SELECT COALESCE(MAX(CAST(RIGHT(enrollment_number, 4) AS integer)), 0) + 1
  INTO v_sequence
  FROM student_profiles_extended
  WHERE school_id = p_school_id
    AND academic_year = p_academic_year;
  
  -- Format: SCH24-0001
  v_enrollment_number := v_school_code || v_year_code || '-' || LPAD(v_sequence::text, 4, '0');
  
  RETURN v_enrollment_number;
END;
$$ LANGUAGE plpgsql;

-- Function to check attendance and create alerts
CREATE OR REPLACE FUNCTION check_attendance_alerts()
RETURNS void AS $$
DECLARE
  v_student record;
  v_consecutive_absent integer;
  v_attendance_percentage numeric;
  v_total_days integer;
  v_present_days integer;
BEGIN
  FOR v_student IN 
    SELECT DISTINCT student_id, school_id 
    FROM attendance_records 
    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
  LOOP
    -- Check consecutive absences
    SELECT COUNT(*)
    INTO v_consecutive_absent
    FROM (
      SELECT date, status,
        ROW_NUMBER() OVER (ORDER BY date DESC) - 
        ROW_NUMBER() OVER (PARTITION BY status ORDER BY date DESC) as grp
      FROM attendance_records
      WHERE student_id = v_student.student_id
        AND date >= CURRENT_DATE - INTERVAL '10 days'
      ORDER BY date DESC
    ) sub
    WHERE status = 'absent' AND grp = 0;
    
    -- Create alert for 5 consecutive absences
    IF v_consecutive_absent >= 5 THEN
      INSERT INTO attendance_alerts (student_id, school_id, alert_type, message, days_absent)
      VALUES (
        v_student.student_id,
        v_student.school_id,
        'consecutive_absent',
        'Student has been absent for ' || v_consecutive_absent || ' consecutive days',
        v_consecutive_absent
      )
      ON CONFLICT DO NOTHING;
    END IF;
    
    -- Check attendance percentage
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'present') as present
    INTO v_total_days, v_present_days
    FROM attendance_records
    WHERE student_id = v_student.student_id
      AND date >= CURRENT_DATE - INTERVAL '30 days';
    
    IF v_total_days > 0 THEN
      v_attendance_percentage := (v_present_days::numeric / v_total_days::numeric) * 100;
      
      -- Create alert if below 75%
      IF v_attendance_percentage < 75 THEN
        INSERT INTO attendance_alerts (student_id, school_id, alert_type, message, attendance_percentage)
        VALUES (
          v_student.student_id,
          v_student.school_id,
          'below_75',
          'Student attendance is below 75% (' || ROUND(v_attendance_percentage, 2) || '%)',
          v_attendance_percentage
        )
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE public.admission_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies (School admins can access their school's data)
CREATE POLICY "School admins can manage admission applications" ON public.admission_applications
  FOR ALL USING (
    school_id IN (
      SELECT school_id FROM school_educators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "School admins can manage student profiles" ON public.student_profiles_extended
  FOR ALL USING (
    school_id IN (
      SELECT school_id FROM school_educators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "School admins can manage attendance" ON public.attendance_records
  FOR ALL USING (
    school_id IN (
      SELECT school_id FROM school_educators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "School admins can view attendance alerts" ON public.attendance_alerts
  FOR SELECT USING (
    school_id IN (
      SELECT school_id FROM school_educators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "School admins can manage skill assessments" ON public.skill_assessments
  FOR ALL USING (
    school_id IN (
      SELECT school_id FROM school_educators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "School admins can manage student reports" ON public.student_reports
  FOR ALL USING (
    school_id IN (
      SELECT school_id FROM school_educators WHERE user_id = auth.uid()
    )
  );
