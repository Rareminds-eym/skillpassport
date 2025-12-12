-- Programs & Sections Enhancement Migration
-- This migration updates the programs table and creates program_sections table

-- ============================================================================
-- UPDATE PROGRAMS TABLE
-- ============================================================================

-- Drop existing programs table if it exists (backup data first in production!)
-- ALTER TABLE IF EXISTS programs RENAME TO programs_backup;

-- Create enhanced programs table
CREATE TABLE IF NOT EXISTS public.programs (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  college_id UUID NULL,
  department_id UUID NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT NULL,
  degree_level VARCHAR(50) NOT NULL,
  status VARCHAR(50) NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NULL,
  created_by UUID NULL,
  updated_by UUID NULL,
  
  CONSTRAINT programs_pkey PRIMARY KEY (id),
  CONSTRAINT programs_department_id_code_key UNIQUE (department_id, code),
  CONSTRAINT programs_college_id_fkey FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
  CONSTRAINT programs_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT programs_department_id_fkey FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  CONSTRAINT programs_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
) TABLESPACE pg_default;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_programs_college ON public.programs USING btree (college_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_programs_department ON public.programs USING btree (department_id) TABLESPACE pg_default;

-- Create trigger function if not exists
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS set_programs_timestamp ON programs;
CREATE TRIGGER set_programs_timestamp 
  BEFORE UPDATE ON programs 
  FOR EACH ROW 
  EXECUTE FUNCTION set_updated_at_timestamp();

-- ============================================================================
-- CREATE PROGRAM SECTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.program_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  college_id UUID NULL,
  department_id UUID NOT NULL,
  program_id UUID NOT NULL,
  semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 12),
  section VARCHAR(10) NOT NULL,
  max_students INTEGER NOT NULL DEFAULT 60,
  current_students INTEGER NOT NULL DEFAULT 0,
  faculty_id UUID NULL,
  academic_year VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  metadata JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID NULL,
  updated_by UUID NULL,
  
  CONSTRAINT program_sections_pkey PRIMARY KEY (id),
  CONSTRAINT program_sections_unique_key UNIQUE (program_id, semester, section, academic_year),
  CONSTRAINT program_sections_college_fkey FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE,
  CONSTRAINT program_sections_department_fkey FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  CONSTRAINT program_sections_program_fkey FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  CONSTRAINT program_sections_faculty_fkey FOREIGN KEY (faculty_id) REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT program_sections_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT program_sections_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id),
  CONSTRAINT check_current_students CHECK (current_students >= 0 AND current_students <= max_students)
) TABLESPACE pg_default;

-- Create indexes for program_sections
CREATE INDEX IF NOT EXISTS idx_program_sections_college ON public.program_sections USING btree (college_id);
CREATE INDEX IF NOT EXISTS idx_program_sections_department ON public.program_sections USING btree (department_id);
CREATE INDEX IF NOT EXISTS idx_program_sections_program ON public.program_sections USING btree (program_id);
CREATE INDEX IF NOT EXISTS idx_program_sections_faculty ON public.program_sections USING btree (faculty_id);
CREATE INDEX IF NOT EXISTS idx_program_sections_status ON public.program_sections USING btree (status);
CREATE INDEX IF NOT EXISTS idx_program_sections_academic_year ON public.program_sections USING btree (academic_year);

-- Create trigger for program_sections
DROP TRIGGER IF EXISTS set_program_sections_timestamp ON program_sections;
CREATE TRIGGER set_program_sections_timestamp 
  BEFORE UPDATE ON program_sections 
  FOR EACH ROW 
  EXECUTE FUNCTION set_updated_at_timestamp();

-- ============================================================================
-- CREATE VIEW FOR EASY QUERYING
-- ============================================================================

CREATE OR REPLACE VIEW program_sections_view AS
SELECT 
  ps.id,
  ps.department_id,
  d.name as department_name,
  d.code as department_code,
  ps.program_id,
  p.name as program_name,
  p.code as program_code,
  p.degree_level,
  ps.semester,
  ps.section,
  ps.max_students,
  ps.current_students,
  ps.faculty_id,
  u.name as faculty_name,
  u.email as faculty_email,
  ps.academic_year,
  ps.status,
  ps.metadata,
  ps.created_at,
  ps.updated_at
FROM program_sections ps
LEFT JOIN departments d ON ps.department_id = d.id
LEFT JOIN programs p ON ps.program_id = p.id
LEFT JOIN auth.users u ON ps.faculty_id = u.id;

-- ============================================================================
-- ENABLE RLS (Row Level Security)
-- ============================================================================

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for programs
CREATE POLICY "Allow read access to programs" ON programs
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users" ON programs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow update for authenticated users" ON programs
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS Policies for program_sections
CREATE POLICY "Allow read access to program_sections" ON program_sections
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for authenticated users" ON program_sections
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow update for authenticated users" ON program_sections
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- INSERT SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Uncomment to insert sample data
/*
-- Sample programs
INSERT INTO programs (department_id, name, code, description, degree_level, status)
SELECT 
  d.id,
  'Bachelor of Technology in Computer Science',
  'BTECHCSE',
  'Four-year undergraduate program in Computer Science and Engineering',
  'Undergraduate',
  'active'
FROM departments d
WHERE d.code = 'CSE'
ON CONFLICT (department_id, code) DO NOTHING;

-- Sample sections
INSERT INTO program_sections (department_id, program_id, semester, section, max_students, academic_year, status)
SELECT 
  p.department_id,
  p.id,
  1,
  'A',
  60,
  '2024-25',
  'active'
FROM programs p
WHERE p.code = 'BTECHCSE'
ON CONFLICT (program_id, semester, section, academic_year) DO NOTHING;
*/

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE programs IS 'Academic programs offered by departments';
COMMENT ON TABLE program_sections IS 'Sections within programs for organizing students by semester';
COMMENT ON COLUMN programs.degree_level IS 'Degree level: Undergraduate, Postgraduate, Diploma, Certificate';
COMMENT ON COLUMN program_sections.academic_year IS 'Academic year in format YYYY-YY (e.g., 2024-25)';
COMMENT ON COLUMN program_sections.current_students IS 'Number of students currently enrolled in this section';
