-- =====================================================
-- COLLEGE DASHBOARD - PRIORITY 1 CRITICAL TABLES
-- Examination Management & Finance Core Tables
-- =====================================================
-- Created: December 2024
-- Purpose: Core tables for examination and finance modules
-- Dependencies: users, departments, programs, courses
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- EXAMINATION MANAGEMENT TABLES
-- =====================================================

-- 1. ASSESSMENTS TABLE
-- Purpose: Define assessments/exams with syllabus coverage
-- =====================================================
CREATE TABLE IF NOT EXISTS assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic Information
  assessment_code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('IA1', 'IA2', 'IA3', 'end_semester', 'practical', 'viva', 'arrears', 'supplementary')),
  academic_year TEXT NOT NULL,
  
  -- Course & Program Details
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 12),
  course_id UUID NOT NULL, -- References courses or course_mappings
  course_name TEXT NOT NULL,
  course_code TEXT NOT NULL,
  
  -- Assessment Configuration
  duration_minutes INTEGER NOT NULL DEFAULT 180,
  total_marks DECIMAL(5,2) NOT NULL DEFAULT 100,
  pass_marks DECIMAL(5,2) NOT NULL DEFAULT 40,
  weightage DECIMAL(5,2), -- Percentage weightage in final grade
  
  -- Instructions & Coverage
  instructions TEXT,
  syllabus_coverage JSONB DEFAULT '[]', -- Array of covered topics/units
  question_paper_pattern JSONB, -- MCQ, descriptive, etc.
  
  -- Workflow & Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'ongoing', 'completed', 'cancelled')),
  is_published BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  
  -- Audit Fields
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT valid_marks CHECK (pass_marks <= total_marks),
  CONSTRAINT valid_weightage CHECK (weightage IS NULL OR (weightage >= 0 AND weightage <= 100))
);

-- Indexes for assessments
CREATE INDEX idx_assessments_department ON assessments(department_id);
CREATE INDEX idx_assessments_program ON assessments(program_id);
CREATE INDEX idx_assessments_semester ON assessments(semester);
CREATE INDEX idx_assessments_academic_year ON assessments(academic_year);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_type ON assessments(type);

-- =====================================================
-- 2. EXAM TIMETABLE TABLE
-- Purpose: Schedule exams with rooms and invigilators
-- =====================================================
CREATE TABLE IF NOT EXISTS exam_timetable (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Assessment Reference
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  course_id UUID NOT NULL,
  course_name TEXT NOT NULL,
  course_code TEXT NOT NULL,
  
  -- Schedule Details
  exam_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  
  -- Venue & Batch
  room TEXT NOT NULL,
  building TEXT,
  capacity INTEGER,
  batch_section TEXT, -- e.g., "A", "B", "A+B"
  
  -- Invigilators
  invigilators UUID[] DEFAULT '{}', -- Array of user IDs
  chief_invigilator UUID REFERENCES users(id),
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'ongoing', 'completed', 'cancelled', 'rescheduled')),
  
  -- Special Instructions
  special_instructions TEXT,
  seating_arrangement TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_capacity CHECK (capacity IS NULL OR capacity > 0)
);

-- Indexes for exam_timetable
CREATE INDEX idx_exam_timetable_assessment ON exam_timetable(assessment_id);
CREATE INDEX idx_exam_timetable_date ON exam_timetable(exam_date);
CREATE INDEX idx_exam_timetable_status ON exam_timetable(status);
CREATE INDEX idx_exam_timetable_room ON exam_timetable(room);

-- =====================================================
-- 3. MARK ENTRIES TABLE
-- Purpose: Store student marks and grades with moderation
-- =====================================================
CREATE TABLE IF NOT EXISTS mark_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- References
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- Marks & Grade
  marks_obtained DECIMAL(5,2),
  total_marks DECIMAL(5,2) NOT NULL,
  percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN marks_obtained IS NOT NULL AND total_marks > 0 
      THEN (marks_obtained / total_marks * 100)
      ELSE NULL 
    END
  ) STORED,
  grade TEXT, -- A+, A, B+, B, C, D, F
  grade_point DECIMAL(3,2), -- 10.0, 9.0, 8.0, etc.
  
  -- Status Flags
  is_absent BOOLEAN DEFAULT FALSE,
  is_exempt BOOLEAN DEFAULT FALSE,
  is_pass BOOLEAN GENERATED ALWAYS AS (
    CASE 
      WHEN is_absent OR is_exempt THEN NULL
      WHEN marks_obtained IS NOT NULL THEN marks_obtained >= (total_marks * 0.4)
      ELSE NULL
    END
  ) STORED,
  
  -- Remarks & Notes
  remarks TEXT,
  exemption_reason TEXT,
  
  -- Moderation
  original_marks DECIMAL(5,2), -- Before moderation
  moderated_by UUID REFERENCES users(id),
  moderation_reason TEXT,
  moderation_date TIMESTAMPTZ,
  
  -- Entry & Lock
  entered_by UUID NOT NULL REFERENCES users(id),
  entered_at TIMESTAMPTZ DEFAULT NOW(),
  is_locked BOOLEAN DEFAULT FALSE,
  locked_by UUID REFERENCES users(id),
  locked_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(assessment_id, student_id),
  CONSTRAINT valid_marks CHECK (
    marks_obtained IS NULL OR 
    (marks_obtained >= 0 AND marks_obtained <= total_marks)
  ),
  CONSTRAINT valid_grade_point CHECK (
    grade_point IS NULL OR 
    (grade_point >= 0 AND grade_point <= 10)
  ),
  CONSTRAINT absent_or_marks CHECK (
    NOT (is_absent = TRUE AND marks_obtained IS NOT NULL)
  )
);

-- Indexes for mark_entries
CREATE INDEX idx_mark_entries_assessment ON mark_entries(assessment_id);
CREATE INDEX idx_mark_entries_student ON mark_entries(student_id);
CREATE INDEX idx_mark_entries_grade ON mark_entries(grade);
CREATE INDEX idx_mark_entries_locked ON mark_entries(is_locked);
CREATE INDEX idx_mark_entries_absent ON mark_entries(is_absent);

-- =====================================================
-- 4. TRANSCRIPTS TABLE
-- Purpose: Generate and manage student transcripts
-- =====================================================
CREATE TABLE IF NOT EXISTS transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Student Reference
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  program_id UUID REFERENCES programs(id),
  program_name TEXT NOT NULL,
  department_id UUID REFERENCES departments(id),
  
  -- Transcript Details
  type TEXT NOT NULL CHECK (type IN ('provisional', 'final', 'consolidated', 'semester')),
  template_id TEXT, -- Template used for generation
  academic_year TEXT NOT NULL,
  
  -- Semester Range
  semester_from INTEGER NOT NULL CHECK (semester_from >= 1),
  semester_to INTEGER NOT NULL CHECK (semester_to >= semester_from),
  
  -- Academic Performance
  cgpa DECIMAL(4,2),
  sgpa JSONB, -- Semester-wise SGPA: {"1": 8.5, "2": 8.7, ...}
  total_credits_earned INTEGER,
  total_credits_required INTEGER,
  
  -- Verification
  include_qr BOOLEAN DEFAULT TRUE,
  verification_id TEXT UNIQUE,
  qr_code_url TEXT,
  
  -- Status & Workflow
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'issued', 'cancelled')),
  is_published BOOLEAN DEFAULT FALSE,
  
  -- File Management
  file_url TEXT,
  file_size INTEGER,
  generated_at TIMESTAMPTZ,
  
  -- Approval
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  approval_remarks TEXT,
  
  -- Issue Details
  issue_date DATE,
  issue_number TEXT,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_cgpa CHECK (cgpa IS NULL OR (cgpa >= 0 AND cgpa <= 10)),
  CONSTRAINT valid_credits CHECK (
    total_credits_earned IS NULL OR 
    total_credits_required IS NULL OR 
    total_credits_earned <= total_credits_required
  )
);

-- Indexes for transcripts
CREATE INDEX idx_transcripts_student ON transcripts(student_id);
CREATE INDEX idx_transcripts_program ON transcripts(program_id);
CREATE INDEX idx_transcripts_type ON transcripts(type);
CREATE INDEX idx_transcripts_status ON transcripts(status);
CREATE INDEX idx_transcripts_verification ON transcripts(verification_id);
CREATE INDEX idx_transcripts_academic_year ON transcripts(academic_year);

-- =====================================================
-- FINANCE MANAGEMENT TABLES
-- =====================================================

-- 5. FEE STRUCTURES TABLE
-- Purpose: Define fee structure for programs
-- =====================================================
CREATE TABLE IF NOT EXISTS fee_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Program & Academic Details
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  program_name TEXT NOT NULL,
  semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 12),
  academic_year TEXT NOT NULL,
  
  -- Student Category
  category TEXT NOT NULL CHECK (category IN ('General', 'OBC', 'SC', 'ST', 'EWS', 'Management', 'NRI', 'Foreign')),
  quota TEXT CHECK (quota IN ('Merit', 'Management', 'NRI', 'Sports', 'Defense')),
  
  -- Fee Heads (JSONB)
  -- Format: [{"head": "Tuition Fee", "amount": 50000}, {"head": "Lab Fee", "amount": 5000}, ...]
  fee_heads JSONB NOT NULL DEFAULT '[]',
  
  -- Total Calculation
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Due Schedule (JSONB)
  -- Format: [{"installment": 1, "due_date": "2024-07-15", "amount": 25000}, ...]
  due_schedule JSONB DEFAULT '[]',
  
  -- Concessions
  scholarship_applicable BOOLEAN DEFAULT FALSE,
  scholarship_amount DECIMAL(10,2) DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  effective_from DATE NOT NULL,
  effective_to DATE,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(program_id, semester, category, academic_year),
  CONSTRAINT valid_total CHECK (total_amount >= 0),
  CONSTRAINT valid_scholarship CHECK (scholarship_amount >= 0 AND scholarship_amount <= total_amount),
  CONSTRAINT valid_discount CHECK (discount_percentage >= 0 AND discount_percentage <= 100)
);

-- Indexes for fee_structures
CREATE INDEX idx_fee_structures_program ON fee_structures(program_id);
CREATE INDEX idx_fee_structures_semester ON fee_structures(semester);
CREATE INDEX idx_fee_structures_category ON fee_structures(category);
CREATE INDEX idx_fee_structures_academic_year ON fee_structures(academic_year);
CREATE INDEX idx_fee_structures_active ON fee_structures(is_active);

-- =====================================================
-- 6. STUDENT LEDGERS TABLE
-- Purpose: Track student fee dues and payments
-- =====================================================
CREATE TABLE IF NOT EXISTS student_ledgers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Student & Fee Structure
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  fee_structure_id UUID NOT NULL REFERENCES fee_structures(id) ON DELETE CASCADE,
  
  -- Fee Head Details
  fee_head_id TEXT NOT NULL, -- Reference to fee_heads array index
  fee_head_name TEXT NOT NULL,
  
  -- Amounts
  due_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) GENERATED ALWAYS AS (due_amount - paid_amount) STORED,
  
  -- Due Date
  due_date DATE NOT NULL,
  installment_number INTEGER,
  
  -- Status
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'waived')),
  is_overdue BOOLEAN DEFAULT FALSE,
  
  -- Late Fee
  late_fee_amount DECIMAL(10,2) DEFAULT 0,
  late_fee_waived BOOLEAN DEFAULT FALSE,
  
  -- Waiver
  waiver_amount DECIMAL(10,2) DEFAULT 0,
  waiver_reason TEXT,
  waived_by UUID REFERENCES users(id),
  waived_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_amounts CHECK (
    due_amount >= 0 AND 
    paid_amount >= 0 AND 
    paid_amount <= due_amount AND
    late_fee_amount >= 0 AND
    waiver_amount >= 0 AND
    waiver_amount <= due_amount
  )
);

-- Indexes for student_ledgers
CREATE INDEX idx_student_ledgers_student ON student_ledgers(student_id);
CREATE INDEX idx_student_ledgers_fee_structure ON student_ledgers(fee_structure_id);
CREATE INDEX idx_student_ledgers_status ON student_ledgers(payment_status);
CREATE INDEX idx_student_ledgers_due_date ON student_ledgers(due_date);
CREATE INDEX idx_student_ledgers_overdue ON student_ledgers(is_overdue);

-- =====================================================
-- 7. PAYMENTS TABLE (Enhanced)
-- Purpose: Record fee payments with detailed tracking
-- =====================================================
CREATE TABLE IF NOT EXISTS fee_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Ledger Reference
  ledger_id UUID NOT NULL REFERENCES student_ledgers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id),
  
  -- Payment Details
  amount DECIMAL(10,2) NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('cash', 'upi', 'card', 'cheque', 'bank_transfer', 'dd', 'online')),
  
  -- Transaction Details
  reference_number TEXT,
  transaction_id TEXT,
  bank_name TEXT,
  cheque_number TEXT,
  cheque_date DATE,
  dd_number TEXT,
  
  -- Receipt
  receipt_number TEXT UNIQUE NOT NULL,
  receipt_url TEXT,
  
  -- Payment Date & Time
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  
  -- Reconciliation
  is_reconciled BOOLEAN DEFAULT FALSE,
  reconciled_by UUID REFERENCES users(id),
  reconciled_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  
  -- Remarks
  remarks TEXT,
  
  -- Recorded By
  recorded_by UUID NOT NULL REFERENCES users(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_payment_amount CHECK (amount > 0)
);

-- Indexes for fee_payments
CREATE INDEX idx_fee_payments_ledger ON fee_payments(ledger_id);
CREATE INDEX idx_fee_payments_student ON fee_payments(student_id);
CREATE INDEX idx_fee_payments_receipt ON fee_payments(receipt_number);
CREATE INDEX idx_fee_payments_date ON fee_payments(payment_date);
CREATE INDEX idx_fee_payments_mode ON fee_payments(mode);
CREATE INDEX idx_fee_payments_status ON fee_payments(status);
CREATE INDEX idx_fee_payments_verified ON fee_payments(is_verified);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables
CREATE TRIGGER update_assessments_updated_at BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exam_timetable_updated_at BEFORE UPDATE ON exam_timetable
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mark_entries_updated_at BEFORE UPDATE ON mark_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transcripts_updated_at BEFORE UPDATE ON transcripts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fee_structures_updated_at BEFORE UPDATE ON fee_structures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_ledgers_updated_at BEFORE UPDATE ON student_ledgers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fee_payments_updated_at BEFORE UPDATE ON fee_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRIGGER: Update is_overdue status
-- =====================================================

-- Function to update is_overdue status
CREATE OR REPLACE FUNCTION update_ledger_overdue_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update is_overdue based on current conditions
  IF NEW.payment_status IN ('paid', 'waived') THEN
    NEW.is_overdue := FALSE;
  ELSIF NEW.due_date < CURRENT_DATE AND (NEW.due_amount - NEW.paid_amount) > 0 THEN
    NEW.is_overdue := TRUE;
  ELSE
    NEW.is_overdue := FALSE;
  END IF;
  
  -- Auto-update payment_status based on amounts
  IF NEW.paid_amount >= NEW.due_amount THEN
    NEW.payment_status := 'paid';
  ELSIF NEW.paid_amount > 0 AND NEW.paid_amount < NEW.due_amount THEN
    NEW.payment_status := 'partial';
  ELSIF NEW.due_date < CURRENT_DATE AND NEW.paid_amount < NEW.due_amount THEN
    NEW.payment_status := 'overdue';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to student_ledgers
CREATE TRIGGER trigger_update_ledger_overdue
  BEFORE INSERT OR UPDATE ON student_ledgers
  FOR EACH ROW
  EXECUTE FUNCTION update_ledger_overdue_status();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE assessments IS 'Stores assessment/exam definitions with syllabus coverage and workflow';
COMMENT ON TABLE exam_timetable IS 'Exam scheduling with room allocation and invigilator assignment';
COMMENT ON TABLE mark_entries IS 'Student marks with grade calculation and moderation support';
COMMENT ON TABLE transcripts IS 'Student transcript generation and management with verification';
COMMENT ON TABLE fee_structures IS 'Program-wise fee structure with category-based fees';
COMMENT ON TABLE student_ledgers IS 'Student fee tracking with automatic balance calculation';
COMMENT ON TABLE fee_payments IS 'Fee payment records with receipt generation and reconciliation';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
