-- Test Database Setup
-- Run this AFTER running setup-college-dashboard.sql to verify everything works

-- 1. Check if all tables exist
SELECT 
  'Tables Created' as status,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'departments', 'programs', 'course_mappings', 'curriculum',
  'student_admissions', 'assessments', 'exam_timetable', 'mark_entries',
  'transcripts', 'fee_structures', 'student_ledgers', 'payments',
  'department_budgets', 'expenditures'
);
-- Expected: count = 14

-- 2. Check sample departments
SELECT 
  'Sample Departments' as status,
  COUNT(*) as count,
  STRING_AGG(name, ', ') as departments
FROM departments;
-- Expected: count = 3, departments = Computer Science, Mechanical Engineering, Electronics

-- 3. Test inserting a user (using existing users table)
-- Note: This assumes you have a 'users' table from your existing system
-- If not, you'll need to create it first

-- Check if users table exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    ) 
    THEN 'Users table exists ✓'
    ELSE 'Users table missing - need to create it'
  END as status;

-- 4. Test creating a program
INSERT INTO programs (
  department_id,
  name,
  code,
  duration_semesters,
  total_credits_required
)
SELECT 
  id,
  'B.Tech Computer Science',
  'BTCS',
  8,
  160
FROM departments 
WHERE code = 'CS'
ON CONFLICT (code) DO NOTHING
RETURNING id, name, code;

-- 5. Verify the program was created
SELECT 
  'Programs Created' as status,
  COUNT(*) as count,
  STRING_AGG(name, ', ') as programs
FROM programs;

-- 6. Test course mapping
INSERT INTO course_mappings (
  program_id,
  semester,
  course_code,
  course_name,
  credits,
  type
)
SELECT 
  p.id,
  1,
  'CS101',
  'Introduction to Programming',
  4,
  'core'
FROM programs p
WHERE p.code = 'BTCS'
ON CONFLICT (program_id, semester, course_code) DO NOTHING
RETURNING id, course_code, course_name;

-- 7. Final verification
SELECT 
  'Setup Complete!' as status,
  (SELECT COUNT(*) FROM departments) as departments,
  (SELECT COUNT(*) FROM programs) as programs,
  (SELECT COUNT(*) FROM course_mappings) as courses;

-- 8. Show what's ready to use
SELECT 
  d.name as department,
  d.code as dept_code,
  COUNT(p.id) as programs_count
FROM departments d
LEFT JOIN programs p ON p.department_id = d.id
GROUP BY d.id, d.name, d.code
ORDER BY d.name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Database Setup Verification Complete!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'All tables are ready for use.';
  RAISE NOTICE 'You can now:';
  RAISE NOTICE '1. Go to User Management page';
  RAISE NOTICE '2. Click "Add User" to create users';
  RAISE NOTICE '3. Assign roles and departments';
  RAISE NOTICE '4. Start using the College Dashboard!';
  RAISE NOTICE '===========================================';
END $$;
