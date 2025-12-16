-- Test Programs & Sections Setup
-- Run these queries to verify and test the setup

-- 1. Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('programs', 'program_sections');

-- 2. Check if view exists
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND table_name = 'program_sections_view';

-- 3. View programs table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'programs'
ORDER BY ordinal_position;

-- 4. View program_sections table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'program_sections'
ORDER BY ordinal_position;

-- 5. Check existing programs
SELECT id, name, code, degree_level, status
FROM programs
ORDER BY name;

-- 6. Check existing sections
SELECT * FROM program_sections_view
ORDER BY department_name, program_name, semester, section;

-- 7. Insert sample program (if departments exist)
INSERT INTO programs (department_id, name, code, description, degree_level, status)
SELECT 
  d.id,
  'Bachelor of Technology in Computer Science',
  'BTECHCSE',
  'Four-year undergraduate program in Computer Science and Engineering',
  'Undergraduate',
  'active'
FROM departments d
WHERE d.status = 'active'
LIMIT 1
ON CONFLICT (department_id, code) DO NOTHING
RETURNING *;

-- 8. Insert sample section
INSERT INTO program_sections (
  department_id, 
  program_id, 
  semester, 
  section, 
  max_students, 
  academic_year, 
  status
)
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
LIMIT 1
ON CONFLICT (program_id, semester, section, academic_year) DO NOTHING
RETURNING *;

-- 9. Test the view
SELECT 
  department_name,
  program_name,
  semester,
  section,
  max_students,
  current_students,
  faculty_name,
  status
FROM program_sections_view;

-- 10. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('programs', 'program_sections');
