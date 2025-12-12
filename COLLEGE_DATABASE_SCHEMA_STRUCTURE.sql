-- ============================================================================
-- COLLEGE DASHBOARD - COMPLETE DATABASE SCHEMA
-- ============================================================================
-- Total Tables: 60
-- Created: 14 tables ✅
-- Needed: 46 tables ❌
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 1: CREATED TABLES (14) ✅
-- ============================================================================

-- ============================================================================
-- 1. DEPARTMENTS TABLE ✅
-- ============================================================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  hod_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. PROGRAMS TABLE ✅
-- ============================================================================
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

-- ============================================================================
-- 3. COURSE MAPPINGS TABLE ✅
-- ============================================================================
CREATE TABLE IF NOT EXISTS course_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES programs(id) NOT NULL,
  semester INTEGER NOT NULL,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  type TEXT CHECK (type IN ('core', 'dept_elective', 'open_elective')),
  faculty_id UUID REFERENCES users(id),
  capacity INTEGER,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, semester, course_code)
);

-- ============================================================================
-- 4. CURRICULUM TABLE ✅
-- ============================================================================
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
  created_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. STUDENT ADMISSIONS TABLE ✅
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_admissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
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
