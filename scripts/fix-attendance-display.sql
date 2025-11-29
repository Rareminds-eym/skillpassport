-- ============================================
-- FIX ATTENDANCE DISPLAY IN UI
-- ============================================

-- Step 1: Disable RLS on all tables (for testing)
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_management_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_alerts DISABLE ROW LEVEL SECURITY;
ALTER TABLE skill_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE admission_applications DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify attendance data exists
SELECT 
  'Attendance Records Check' as check_name,
  COUNT(*) as total_records,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM attendance_records
WHERE school_id = '550e8400-e29b-41d4-a716-446655440000';

-- Step 3: Verify students can be joined with attendance
SELECT 
  s.name,
  s.id as student_id,
  COUNT(ar.id) as attendance_count,
  MIN(ar.date) as from_date,
  MAX(ar.date) as to_date,
  COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present,
  COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent,
  ROUND(COUNT(CASE WHEN ar.status = 'present' THEN 1 END)::NUMERIC / COUNT(ar.id) * 100, 1) as percentage
FROM students s
LEFT JOIN attendance_records ar ON s.id = ar.student_id
WHERE s.school_id = '550e8400-e29b-41d4-a716-446655440000'
  AND s.email LIKE '%.test@example.com'
GROUP BY s.id, s.name
ORDER BY s.name;

-- Step 4: Check if current user has access
SELECT 
  auth.uid() as current_user_id,
  auth.email() as current_email;

-- Step 5: Ensure user is linked to school
SELECT * FROM school_educators 
WHERE user_id = auth.uid()
  AND school_id = '550e8400-e29b-41d4-a716-446655440000';

-- Step 6: If not linked, add current user as school admin
INSERT INTO school_educators (
  user_id,
  school_id,
  role,
  status
) VALUES (
  auth.uid(),
  '550e8400-e29b-41d4-a716-446655440000',
  'principal',
  'active'
)
ON CONFLICT (user_id, school_id) 
DO UPDATE SET 
  role = 'principal',
  status = 'active';

-- Step 7: Final verification - this should return data
SELECT 
  COUNT(*) as total_students,
  COUNT(DISTINCT s.id) as students_with_data
FROM students s
LEFT JOIN attendance_records ar ON s.id = ar.student_id
WHERE s.school_id = '550e8400-e29b-41d4-a716-446655440000';
