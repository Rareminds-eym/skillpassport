-- Check User Management Data

-- 1. Check college_lecturers table
SELECT 
  'college_lecturers' as table_name,
  COUNT(*) as total_count
FROM college_lecturers;

-- 2. Sample college_lecturers data
SELECT 
  id,
  "userId",
  user_id,
  "collegeId",
  "employeeId",
  department,
  "accountStatus"
FROM college_lecturers
LIMIT 5;

-- 3. Check students table
SELECT 
  'students' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN is_deleted = false THEN 1 END) as active_count
FROM students;

-- 4. Sample students data
SELECT 
  id,
  user_id,
  email,
  name,
  student_id,
  college_id,
  grade,
  section,
  is_deleted
FROM students
WHERE is_deleted = false
LIMIT 5;

-- 5. Check users table
SELECT 
  'users' as table_name,
  COUNT(*) as total_count
FROM users;

-- 6. Check if lecturers have matching users
SELECT 
  cl.id as lecturer_id,
  cl."employeeId",
  cl."userId",
  cl.user_id,
  u.id as user_id_from_users,
  u.email,
  u.full_name,
  u.name
FROM college_lecturers cl
LEFT JOIN users u ON u.id = COALESCE(cl."userId", cl.user_id)
LIMIT 5;

-- 7. Check college_id distribution in students
SELECT 
  college_id,
  COUNT(*) as student_count
FROM students
WHERE is_deleted = false
GROUP BY college_id
ORDER BY student_count DESC
LIMIT 10;
