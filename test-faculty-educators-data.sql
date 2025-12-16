-- Test Faculty/Educators Data

-- 1. Check if college_lecturers table exists and has data
SELECT 
  'college_lecturers' as table_name,
  COUNT(*) as total_records
FROM college_lecturers;

-- 2. Show sample data from college_lecturers
SELECT 
  id,
  "userId",
  user_id,
  "collegeId",
  "employeeId",
  department,
  specialization,
  "accountStatus",
  metadata->>'first_name' as first_name,
  metadata->>'last_name' as last_name,
  metadata->>'email' as email,
  "createdAt"
FROM college_lecturers
ORDER BY "createdAt" DESC
LIMIT 10;

-- 3. Check colleges table for admin email
SELECT 
  id,
  name,
  email,
  admin_email,
  created_at
FROM colleges
LIMIT 5;

-- 4. Check if there are any lecturers for specific colleges
SELECT 
  c.name as college_name,
  c.id as college_id,
  COUNT(cl.id) as lecturer_count
FROM colleges c
LEFT JOIN college_lecturers cl ON cl."collegeId" = c.id
GROUP BY c.id, c.name
ORDER BY lecturer_count DESC;

-- 5. Check users table for matching user IDs
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.name,
  cl.id as lecturer_id,
  cl."employeeId"
FROM users u
INNER JOIN college_lecturers cl ON cl."userId" = u.id OR cl.user_id = u.id
LIMIT 10;

-- 6. If no data, show what we need to insert
SELECT 
  'To add test lecturer, you need:' as instruction,
  '1. A user ID from users table' as step1,
  '2. A college ID from colleges table' as step2,
  '3. Run the INSERT statement below' as step3;

-- Example INSERT (uncomment and modify with actual IDs):
/*
INSERT INTO college_lecturers (
  "userId",
  "collegeId",
  "employeeId",
  department,
  specialization,
  qualification,
  "experienceYears",
  "dateOfJoining",
  "accountStatus",
  metadata
) VALUES (
  (SELECT id FROM users LIMIT 1),  -- Replace with actual user ID
  (SELECT id FROM colleges LIMIT 1),  -- Replace with actual college ID
  'FAC-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
  'Computer Science',
  'Artificial Intelligence',
  'PhD in Computer Science',
  5,
  CURRENT_DATE - INTERVAL '2 years',
  'active',
  jsonb_build_object(
    'first_name', 'John',
    'last_name', 'Doe',
    'email', 'john.doe@college.edu',
    'phone_number', '+1234567890',
    'role', 'professor',
    'subject_expertise', jsonb_build_array(
      jsonb_build_object(
        'name', 'Machine Learning',
        'proficiency', 'expert',
        'years_experience', 5
      ),
      jsonb_build_object(
        'name', 'Data Science',
        'proficiency', 'advanced',
        'years_experience', 3
      )
    )
  )
);
*/
