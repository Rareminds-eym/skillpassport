-- Quick Setup Script for College Dashboard
-- Run this in Supabase SQL Editor to create all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  hod_id UUID,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create programs table
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id) NOT NULL,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  duration_semesters INTEGER NOT NULL,
  total_credits_required INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create course_mappings table
CREATE TABLE IF NOT EXISTS course_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) NOT NULL,
  semester INTEGER NOT NULL,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  type TEXT CHECK (type IN ('core', 'dept_elective', 'open_elective')),
  faculty_id UUID,
  capacity INTEGER,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, semester, course_code)
);

-- Create curriculum table
CREATE TABLE IF NOT EXISTS curriculum (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academic_year TEXT NOT NULL,
  department_id UUID REFERENCES departments(id) NOT NULL,
  program_id UUID REFERENCES programs(id) NOT NULL,
  semester INTEGER NOT NULL,
  course_id UUID REFERENCES course_mappings(id) NOT NULL,
  units JSONB NOT NULL DEFAULT '[]',
  outcomes JSONB NOT NULL DEFAULT '[]',
  assessment_mappings JSONB NOT NULL DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'published')),
  version INTEGER DEFAULT 1,
  created_by UUID,
  approved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create student_admissions table
CREATE TABLE IF NOT EXISTS student_admissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_number TEXT UNIQUE NOT NULL,
  user_id UUID,
  program_id UUID REFERENCES programs(id) NOT NULL,
  department_id UUID REFERENCES departments(id) NOT NULL,
  personal_details JSONB NOT NULL DEFAULT '{}',
  category TEXT NOT NULL,
  quota TEXT NOT NULL,
  documents JSONB DEFAULT '[]',
  status TEXT DEFAULT 'applied' CHECK (status IN ('applied', 'verified', 'approved', 'enrolled', 'active', 'graduated', 'alumni')),
  roll_number TEXT UNIQUE,
  current_semester INTEGER,
  cgpa DECIMAL(4,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create assessments table
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('IA', 'end_semester', 'practical', 'viva', 'arrears')),
  academic_year TEXT NOT NULL,
  department_id UUID REFERENCES departments(id) NOT NULL,
  program_id UUID REFERENCES programs(id) NOT NULL,
  semester INTEGER NOT NULL,
  course_id UUID REFERENCES course_mappings(id) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  pass_marks INTEGER NOT NULL,
  instructions TEXT,
  syllabus_coverage JSONB DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'ongoing', 'completed')),
  created_by UUID,
  approved_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create exam_timetable table
CREATE TABLE IF NOT EXISTS exam_timetable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) NOT NULL,
  course_id UUID REFERENCES course_mappings(id) NOT NULL,
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  room TEXT,
  batch_section TEXT,
  invigilators UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create mark_entries table
CREATE TABLE IF NOT EXISTS mark_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID REFERENCES assessments(id) NOT NULL,
  student_id UUID NOT NULL,
  marks_obtained DECIMAL(5,2) NOT NULL,
  is_absent BOOLEAN DEFAULT FALSE,
  is_exempt BOOLEAN DEFAULT FALSE,
  remarks TEXT,
  grade TEXT,
  entered_by UUID NOT NULL,
  entered_at TIMESTAMPTZ DEFAULT NOW(),
  moderated_by UUID,
  moderation_reason TEXT,
  moderated_at TIMESTAMPTZ,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assessment_id, student_id)
);

-- Create transcripts table
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL,
  type TEXT CHECK (type IN ('provisional', 'final')),
  template_id UUID,
  semester_from INTEGER NOT NULL,
  semester_to INTEGER NOT NULL,
  include_qr BOOLEAN DEFAULT TRUE,
  verification_id TEXT UNIQUE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'published')),
  file_url TEXT,
  generated_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create fee_structures table
CREATE TABLE IF NOT EXISTS fee_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) NOT NULL,
  semester INTEGER NOT NULL,
  category TEXT NOT NULL,
  academic_year TEXT NOT NULL,
  fee_heads JSONB NOT NULL DEFAULT '[]',
  due_schedule JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, semester, category, academic_year)
);

-- Create student_ledgers table
CREATE TABLE IF NOT EXISTS student_ledgers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL,
  fee_structure_id UUID REFERENCES fee_structures(id) NOT NULL,
  fee_head_id TEXT NOT NULL,
  due_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) GENERATED ALWAYS AS (due_amount - paid_amount) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ledger_id UUID REFERENCES student_ledgers(id) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('cash', 'upi', 'card', 'cheque', 'bank_transfer')),
  reference_number TEXT,
  receipt_number TEXT UNIQUE NOT NULL,
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  recorded_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create department_budgets table
CREATE TABLE IF NOT EXISTS department_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id) NOT NULL,
  period_from DATE NOT NULL,
  period_to DATE NOT NULL,
  budget_heads JSONB NOT NULL DEFAULT '[]',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved')),
  submitted_at TIMESTAMPTZ,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create expenditures table
CREATE TABLE IF NOT EXISTS expenditures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_id UUID REFERENCES departments(id) NOT NULL,
  budget_id UUID REFERENCES department_budgets(id) NOT NULL,
  budget_head_id TEXT NOT NULL,
  vendor_name TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  invoice_file_id TEXT,
  expenditure_date DATE NOT NULL,
  description TEXT,
  override_reason TEXT,
  recorded_by UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_departments_hod ON departments(hod_id);
CREATE INDEX IF NOT EXISTS idx_programs_department ON programs(department_id);
CREATE INDEX IF NOT EXISTS idx_course_mappings_program ON course_mappings(program_id);
CREATE INDEX IF NOT EXISTS idx_course_mappings_faculty ON course_mappings(faculty_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_course ON curriculum(course_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_status ON curriculum(status);
CREATE INDEX IF NOT EXISTS idx_student_admissions_program ON student_admissions(program_id);
CREATE INDEX IF NOT EXISTS idx_student_admissions_status ON student_admissions(status);
CREATE INDEX IF NOT EXISTS idx_assessments_course ON assessments(course_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_exam_timetable_assessment ON exam_timetable(assessment_id);
CREATE INDEX IF NOT EXISTS idx_mark_entries_assessment ON mark_entries(assessment_id);
CREATE INDEX IF NOT EXISTS idx_mark_entries_student ON mark_entries(student_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_student ON transcripts(student_id);
CREATE INDEX IF NOT EXISTS idx_student_ledgers_student ON student_ledgers(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_ledger ON payments(ledger_id);
CREATE INDEX IF NOT EXISTS idx_expenditures_department ON expenditures(department_id);
CREATE INDEX IF NOT EXISTS idx_expenditures_budget ON expenditures(budget_id);

-- Insert sample data for testing
INSERT INTO departments (name, code, status) VALUES
  ('Computer Science', 'CS', 'active'),
  ('Mechanical Engineering', 'ME', 'active'),
  ('Electronics', 'EC', 'active')
ON CONFLICT (code) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'College Dashboard tables created successfully!';
  RAISE NOTICE 'Sample departments added: Computer Science, Mechanical Engineering, Electronics';
  RAISE NOTICE 'You can now use the User Management page.';
END $$;
