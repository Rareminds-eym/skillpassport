-- =====================================================
-- EXAMINATION MANAGEMENT - ADDITIONAL TABLES ONLY
-- Only creates tables that don't already exist
-- =====================================================
-- Created: December 2024
-- Purpose: Add missing examination management tables
-- Dependencies: assessments (existing), users, departments, programs
-- Note: Skips assessments, assessment_types, assignments (already exist)
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. GRADING SYSTEMS TABLE (NEW)
-- =====================================================
CREATE TABLE IF NOT EXISTS grading_systems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- System Details
  system_name TEXT NOT NULL,
  system_code TEXT NOT NULL UNIQUE,
  
  -- Grade Details
  grade_label TEXT NOT NULL,
  min_marks DECIMAL(5,2) NOT NULL,
  max_marks DECIMAL(5,2) NOT NULL,
  grade_point DECIMAL(3,2) NOT NULL,
  
  -- Status
  is_pass BOOLEAN DEFAULT TRUE,
  is_distinction BOOLEAN DEFAULT FALSE,
  
  -- Applicability
  applicable_to TEXT DEFAULT 'all' CHECK (applicable_to IN ('all', 'school', 'college', 'university')),
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Display
  display_order INTEGER DEFAULT 0,
  color_code TEXT,
  
  -- Description
  description TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_marks_range CHECK (max_marks > min_marks),
  CONSTRAINT valid_grade_point CHECK (grade_point >= 0 AND grade_point <= 10),
  UNIQUE(system_code, grade_label)
);

CREATE INDEX IF NOT EXISTS idx_grading_systems_code ON grading_systems(system_code);
CREATE INDEX IF NOT EXISTS idx_grading_systems_active ON grading_systems(is_active);
CREATE INDEX IF NOT EXISTS idx_grading_systems_default ON grading_systems(is_default);

-- =====================================================
-- 2. EXAM WINDOWS TABLE (NEW)
-- =====================================================
CREATE TABLE IF NOT EXISTS exam_windows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Window Details
  window_name TEXT NOT NULL,
  window_code TEXT NOT NULL UNIQUE,
  academic_year TEXT NOT NULL,
  semester TEXT NOT NULL CHECK (semester IN ('Odd', 'Even', 'Summer')),
  
  -- Assessment Type
  assessment_type_name TEXT NOT NULL,
  
  -- Date Range
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Registration
  registration_start_date DATE,
  registration_end_date DATE,
  
  -- Applicability
  department_id UUID REFERENCES departments(id),
  program_id UUID REFERENCES programs(id),
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'ongoing', 'completed', 'cancelled')),
  is_published BOOLEAN DEFAULT FALSE,
  
  -- Configuration
  allow_late_registration BOOLEAN DEFAULT FALSE,
  late_fee_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Instructions
  instructions TEXT,
  special_notes TEXT,
  
  -- Audit
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_exam_window_dates CHECK (end_date >= start_date),
  CONSTRAINT valid_registration_dates CHECK (
    registration_start_date IS NULL OR 
    registration_end_date IS NULL OR 
    registration_end_date >= registration_start_date
  )
);

CREATE INDEX IF NOT EXISTS idx_exam_windows_academic_year ON exam_windows(academic_year);
CREATE INDEX IF NOT EXISTS idx_exam_windows_semester ON exam_windows(semester);
CREATE INDEX IF NOT EXISTS idx_exam_windows_status ON exam_windows(status);
CREATE INDEX IF NOT EXISTS idx_exam_windows_dates ON exam_windows(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_exam_windows_department ON exam_windows(department_id);

-- =====================================================
-- 3. EXAM REGISTRATIONS 