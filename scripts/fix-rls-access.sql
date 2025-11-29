-- ============================================
-- FIX RLS ACCESS FOR SCHOOL ADMIN
-- School ID: 550e8400-e29b-41d4-a716-446655440000
-- ============================================

-- Step 1: Get current user ID
-- Run this first to see your user ID
SELECT 
  auth.uid() as your_user_id,
  auth.email() as your_email;

-- Step 2: Check if you're in school_educators table
SELECT * FROM school_educators 
WHERE user_id = auth.uid();

-- Step 3: If not found, add yourself as school admin
-- Replace 'your-user-id-here' with the ID from Step 1
INSERT INTO school_educators (
  user_id,
  school_id,
  role,
  status
) VALUES (
  auth.uid(),  -- Your current user ID
  '550e8400-e29b-41d4-a716-446655440000',  -- Your school ID
  'principal',  -- Or 'school_admin'
  'active'
)
ON CONFLICT (user_id, school_id) 
DO UPDATE SET 
  role = 'principal',
  status = 'active';

-- Step 4: Verify the insert
SELECT 
  se.id,
  se.user_id,
  se.school_id,
  se.role,
  se.status,
  s.name as school_name
FROM school_educators se
JOIN schools s ON se.school_id = s.id
WHERE se.user_id = auth.uid();

-- Step 5: Now test if you can see students
SELECT 
  COUNT(*) as total_students,
  school_id
FROM students
WHERE school_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY school_id;

-- Step 6: Test student_management_records access
SELECT 
  COUNT(*) as total_records,
  school_id
FROM student_management_records
WHERE school_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY school_id;

-- Step 7: Test attendance_records access
SELECT 
  COUNT(*) as total_attendance,
  school_id
FROM attendance_records
WHERE school_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY school_id;

-- ============================================
-- ALTERNATIVE: Temporarily Disable RLS (For Testing Only)
-- ============================================

-- Uncomment these lines if you want to disable RLS temporarily
-- WARNING: This removes security - only for testing!

-- ALTER TABLE students DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE student_management_records DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE attendance_records DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE attendance_alerts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE skill_assessments DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE admission_applications DISABLE ROW LEVEL SECURITY;

-- To re-enable RLS later:
-- ALTER TABLE students ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE student_management_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE attendance_alerts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE skill_assessments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE admission_applications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all your data
SELECT 
  'students' as table_name,
  COUNT(*) as count
FROM students
WHERE school_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 'student_management_records', COUNT(*)
FROM student_management_records
WHERE school_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 'attendance_records', COUNT(*)
FROM attendance_records
WHERE school_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 'skill_assessments', COUNT(*)
FROM skill_assessments
WHERE school_id = '550e8400-e29b-41d4-a716-446655440000';

-- List all students with their management records
SELECT 
  s.name,
  s.email,
  s.grade,
  s.section,
  s.roll_number,
  smr.enrollment_number,
  smr.status
FROM students s
LEFT JOIN student_management_records smr ON s.id = smr.student_id
WHERE s.school_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY s.grade, s.section, s.roll_number;
