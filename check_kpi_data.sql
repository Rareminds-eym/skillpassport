-- ============================================================================
-- KPI Dashboard Data Check Script
-- Run this in Supabase SQL Editor to diagnose why KPIs show 0
-- ============================================================================

-- 1. CHECK IF TABLES HAVE ANY DATA
-- ============================================================================
SELECT 
  'students' as table_name,
  COUNT(*) as total_records,
  COUNT(DISTINCT school_id) as unique_schools
FROM students
UNION ALL
SELECT 
  'attendance_records',
  COUNT(*),
  COUNT(DISTINCT school_id)
FROM attendance_records
UNION ALL
SELECT 
  'exams',
  COUNT(*),
  COUNT(DISTINCT school_id)
FROM exams
UNION ALL
SELECT 
  'marks',
  COUNT(*),
  COUNT(DISTINCT school_id)
FROM marks;

-- 2. CHECK STUDENTS DATA
-- ============================================================================
SELECT 
  school_id,
  status,
  COUNT(*) as count
FROM students
GROUP BY school_id, status
ORDER BY school_id, status;

-- 3. CHECK ATTENDANCE FOR TODAY
-- ============================================================================
SELECT 
  school_id,
  status,
  COUNT(*) as count
FROM attendance_records
WHERE date = CURRENT_DATE
GROUP BY school_id, status
ORDER BY school_id, status;

-- 4. CHECK UPCOMING EXAMS
-- ============================================================================
SELECT 
  school_id,
  COUNT(*) as upcoming_exams
FROM exams
WHERE date >= CURRENT_DATE
GROUP BY school_id
ORDER BY school_id;

-- 5. CHECK UNPUBLISHED MARKS
-- ============================================================================
SELECT 
  school_id,
  published,
  COUNT(*) as count
FROM marks
GROUP BY school_id, published
ORDER BY school_id, published;

-- 6. CHECK WHAT SCHOOL_IDS EXIST IN DATA
-- ============================================================================
SELECT DISTINCT school_id FROM students
UNION
SELECT DISTINCT school_id FROM attendance_records
UNION
SELECT DISTINCT school_id FROM exams
UNION
SELECT DISTINCT school_id FROM marks;

-- 7. CHECK USERS TABLE (if exists)
-- ============================================================================
-- Uncomment if you have a users table
-- SELECT email, school_id, role FROM users LIMIT 10;

-- ============================================================================
-- SAMPLE DATA CREATION (if tables are empty)
-- ============================================================================
-- Uncomment and modify school_id to add test data

/*
-- Set your school ID here
DO $$
DECLARE
  my_school_id TEXT := 'my-school-123'; -- CHANGE THIS
  student1_id UUID := gen_random_uuid();
  student2_id UUID := gen_random_uuid();
  student3_id UUID := gen_random_uuid();
  exam1_id UUID := gen_random_uuid();
BEGIN
  -- Add 3 students
  INSERT INTO students (student_id, status, school_id)
  VALUES 
    (student1_id, 'active', my_school_id),
    (student2_id, 'active', my_school_id),
    (student3_id, 'active', my_school_id);
  
  RAISE NOTICE 'Added 3 students';
  
  -- Add attendance for today (2 present, 1 absent)
  INSERT INTO attendance_records (att_id, student_id, school_id, date, status)
  VALUES 
    (gen_random_uuid(), student1_id, my_school_id, CURRENT_DATE, 'present'),
    (gen_random_uuid(), student2_id, my_school_id, CURRENT_DATE, 'present'),
    (gen_random_uuid(), student3_id, my_school_id, CURRENT_DATE, 'absent');
  
  RAISE NOTICE 'Added attendance records';
  
  -- Add 2 upcoming exams
  INSERT INTO exams (exam_id, school_id, name, date)
  VALUES 
    (exam1_id, my_school_id, 'Mid-term Exam', CURRENT_DATE + 7),
    (gen_random_uuid(), my_school_id, 'Final Exam', CURRENT_DATE + 30);
  
  RAISE NOTICE 'Added 2 exams';
  
  -- Add 2 unpublished marks
  INSERT INTO marks (mark_id, exam_id, student_id, school_id, marks_scored, published)
  VALUES 
    (gen_random_uuid(), exam1_id, student1_id, my_school_id, 85, false),
    (gen_random_uuid(), exam1_id, student2_id, my_school_id, 90, false);
  
  RAISE NOTICE 'Added 2 unpublished marks';
  RAISE NOTICE 'Test data created successfully for school: %', my_school_id;
  RAISE NOTICE 'Expected KPI values:';
  RAISE NOTICE '- Total Students: 3';
  RAISE NOTICE '- Attendance Today: 67%% (2 present out of 3)';
  RAISE NOTICE '- Exams Scheduled: 2';
  RAISE NOTICE '- Pending Assessments: 2';
END $$;
*/

-- ============================================================================
-- UPDATE USER SCHOOL_ID (if needed)
-- ============================================================================
-- Uncomment and modify to set your user's school_id

/*
UPDATE users 
SET school_id = 'my-school-123'  -- CHANGE THIS to match your data
WHERE email = 'your-email@example.com';  -- CHANGE THIS to your email
*/
