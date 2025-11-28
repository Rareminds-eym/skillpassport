-- ============================================
-- COMPLETE STUDENT DATA WITH AUTH CHAIN
-- auth.users → users → students → student_management_records
-- School ID: 550e8400-e29b-41d4-a716-446655440000
-- ============================================

-- Temporarily disable RLS
ALTER TABLE student_management_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE admission_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE skill_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STUDENT 1: Rahul Kumar (Class 10A)
-- ============================================

-- Step 1: Create auth user (using Supabase admin function)
-- Note: In production, use Supabase Auth API or Dashboard
-- For testing, we'll create users table entry directly

-- Step 2: Insert into users table
INSERT INTO users (
  id,
  email,
  role,
  created_at
) VALUES (
  'u1111111-1111-1111-1111-111111111111',
  'rahul.kumar@example.com',
  'student',
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Step 3: Insert into students table
INSERT INTO students (
  id,
  user_id,
  school_id,
  name,
  email,
  "contactNumber",
  "dateOfBirth",
  gender,
  "bloodGroup",
  "enrollmentNumber",
  "enrollmentDate",
  grade,
  section,
  roll_number,
  admission_number,
  address,
  city,
  state,
  pincode,
  "guardianName",
  "guardianPhone",
  "guardianEmail",
  "guardianRelation",
  student_type,
  approval_status,
  "createdAt"
) VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'u1111111-1111-1111-1111-111111111111',
  '550e8400-e29b-41d4-a716-446655440000',
  'Rahul Kumar',
  'rahul.kumar@example.com',
  '9876543210',
  '2008-05-15',
  'male',
  'O+',
  '2024-550e8400-0001',
  '2024-04-01',
  'Class 10',
  'A',
  '15',
  'ADM2400001',
  '123 MG Road',
  'Mumbai',
  'Maharashtra',
  '400001',
  'Rajesh Kumar',
  '9876543211',
  'rajesh.kumar@example.com',
  'Father',
  'direct',
  'approved',
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Step 4: Insert admission application
INSERT INTO admission_applications (
  school_id,
  application_number,
  student_name,
  date_of_birth,
  gender,
  email,
  phone,
  father_name,
  father_occupation,
  father_phone,
  mother_name,
  mother_occupation,
  mother_phone,
  address,
  city,
  state,
  pincode,
  applied_for,
  status,
  fee_amount,
  fee_paid,
  fee_status,
  enrollment_number
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'APP2400001',
  'Rahul Kumar',
  '2008-05-15',
  'male',
  'rahul.parent@example.com',
  '9876543210',
  'Rajesh Kumar',
  'Software Engineer',
  '9876543211',
  'Priya Kumar',
  'Teacher',
  '9876543212',
  '123 MG Road',
  'Mumbai',
  'Maharashtra',
  '400001',
  'Class 10',
  'approved',
  50000,
  50000,
  'paid',
  '2024-550e8400-0001'
);

-- Step 5: Insert student management record
INSERT INTO student_management_records (
  student_id,
  school_id,
  enrollment_number,
  class,
  section,
  roll_number,
  admission_date,
  academic_year,
  blood_group,
  emergency_contact,
  emergency_phone,
  primary_interest,
  secondary_interest,
  career_skills,
  total_fee,
  paid_amount,
  pending_amount,
  status
) VALUES (
  'a1111111-1111-1111-1111-111111111111',
  '550e8400-e29b-41d4-a716-446655440000',
  '2024-550e8400-0001',
  'Class 10',
  'A',
  '15',
  '2024-04-01',
  '2024-2025',
  'O+',
  'Rajesh Kumar',
  '9876543211',
  'Software Development',
  'Data Science',
  ARRAY['Python', 'Java', 'Problem Solving'],
  50000,
  50000,
  0,
  'active'
) ON CONFLICT (student_id, school_id) DO NOTHING;

-- Step 6: Insert attendance records
INSERT INTO attendance_records (student_id, school_id, date, status, mode)
SELECT 
  'a1111111-1111-1111-1111-111111111111',
  '550e8400-e29b-41d4-a716-446655440000',
  CURRENT_DATE - i,
  CASE 
    WHEN i = 2 THEN 'absent'
    WHEN i = 5 THEN 'late'
    ELSE 'present'
  END,
  'manual'
FROM generate_series(0, 9) i
ON CONFLICT (student_id, date) DO NOTHING;

-- Step 7: Insert skill assessments
INSERT INTO skill_assessments (
  student_id,
  school_id,
  assessment_type,
  assessment_date,
  score,
  max_score,
  subject,
  topic,
  remarks
) VALUES 
(
  'a1111111-1111-1111-1111-111111111111',
  '550e8400-e29b-41d4-a716-446655440000',
  'Unit Test',
  CURRENT_DATE - 7,
  85.5,
  100,
  'Mathematics',
  'Algebra',
  'Excellent performance'
),
(
  'a1111111-1111-1111-1111-111111111111',
  '550e8400-e29b-41d4-a716-446655440000',
  'Mid Term',
  CURRENT_DATE - 15,
  78.0,
  100,
  'Science',
  'Physics',
  'Good understanding'
);

-- ============================================
-- STUDENT 2: Priya Sharma (Class 9B)
-- ============================================

INSERT INTO users (
  id,
  email,
  role,
  created_at
) VALUES (
  'u2222222-2222-2222-2222-222222222222',
  'priya.sharma@example.com',
  'student',
  NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO students (
  id,
  user_id,
  school_id,
  name,
  email,
  "contactNumber",
  "dateOfBirth",
  gender,
  "bloodGroup",
  "enrollmentNumber",
  "enrollmentDate",
  grade,
  section,
  roll_number,
  admission_number,
  address,
  city,
  state,
  pincode,
  "guardianName",
  "guardianPhone",
  "guardianEmail",
  "guardianRelation",
  student_type,
  approval_status,
  "createdAt"
) VALUES (
  'a2222222-2222-2222-2222-222222222222',
  'u2222222-2222-2222-2222-222222222222',
  '550e8400-e29b-41d4-a716-446655440000',
  'Priya Sharma',
  'priya.sharma@example.com',
  '9876543220',
  '2009-08-22',
  'female',
  'A+',
  '2024-550e8400-0002',
  '2024-04-01',
  'Class 9',
  'B',
  '08',
  'ADM2400002',
  '456 Park Street',
  'Mumbai',
  'Maharashtra',
  '400002',
  'Amit Sharma',
  '9876543221',
  'amit.sharma@example.com',
  'Father',
  'direct',
  'approved',
  NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO admission_applications (
  school_id,
  application_number,
  student_name,
  date_of_birth,
  gender,
  email,
  phone,
  father_name,
  father_occupation,
  father_phone,
  mother_name,
  mother_occupation,
  mother_phone,
  address,
  city,
  state,
  pincode,
  applied_for,
  status,
  fee_amount,
  fee_paid,
  fee_status,
  enrollment_number
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'APP2400002',
  'Priya Sharma',
  '2009-08-22',
  'female',
  'priya.parent@example.com',
  '9876543220',
  'Amit Sharma',
  'Business Owner',
  '9876543221',
  'Sunita Sharma',
  'Doctor',
  '9876543222',
  '456 Park Street',
  'Mumbai',
  'Maharashtra',
  '400002',
  'Class 9',
  'approved',
  45000,
  45000,
  'paid',
  '2024-550e8400-0002'
);

INSERT INTO student_management_records (
  student_id,
  school_id,
  enrollment_number,
  class,
  section,
  roll_number,
  admission_date,
  academic_year,
  blood_group,
  allergies,
  emergency_contact,
  emergency_phone,
  primary_interest,
  secondary_interest,
  career_skills,
  total_fee,
  paid_amount,
  pending_amount,
  status
) VALUES (
  'a2222222-2222-2222-2222-222222222222',
  '550e8400-e29b-41d4-a716-446655440000',
  '2024-550e8400-0002',
  'Class 9',
  'B',
  '08',
  '2024-04-01',
  '2024-2025',
  'A+',
  ARRAY['Peanuts'],
  'Amit Sharma',
  '9876543221',
  'Medicine',
  'Research',
  ARRAY['Biology', 'Chemistry', 'Communication'],
  45000,
  45000,
  0,
  'active'
) ON CONFLICT (student_id, school_id) DO NOTHING;

INSERT INTO attendance_records (student_id, school_id, date, status, mode)
SELECT 
  'a2222222-2222-2222-2222-222222222222',
  '550e8400-e29b-41d4-a716-446655440000',
  CURRENT_DATE - i,
  'present',
  'manual'
FROM generate_series(0, 9) i
ON CONFLICT (student_id, date) DO NOTHING;

INSERT INTO skill_assessments (
  student_id,
  school_id,
  assessment_type,
  assessment_date,
  score,
  max_score,
  subject,
  topic,
  remarks
) VALUES 
(
  'a2222222-2222-2222-2222-222222222222',
  '550e8400-e29b-41d4-a716-446655440000',
  'Unit Test',
  CURRENT_DATE - 7,
  92.0,
  100,
  'Biology',
  'Cell Structure',
  'Outstanding work'
);

-- ============================================
-- STUDENT 3: Arjun Patel (Class 8A) - Low Attendance
-- ============================================

INSERT INTO users (
  id,
  email,
  role,
  created_at
) VALUES (
  'u3333333-3333-3333-3333-333333333333',
  'arjun.patel@example.com',
  'student',
  NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO students (
  id,
  user_id,
  school_id,
  name,
  email,
  "contactNumber",
  "dateOfBirth",
  gender,
  "bloodGroup",
  "enrollmentNumber",
  "enrollmentDate",
  grade,
  section,
  roll_number,
  admission_number,
  address,
  city,
  state,
  pincode,
  "guardianName",
  "guardianPhone",
  "guardianEmail",
  "guardianRelation",
  student_type,
  approval_status,
  "createdAt"
) VALUES (
  'a3333333-3333-3333-3333-333333333333',
  'u3333333-3333-3333-3333-333333333333',
  '550e8400-e29b-41d4-a716-446655440000',
  'Arjun Patel',
  'arjun.patel@example.com',
  '9876543230',
  '2010-03-10',
  'male',
  'B+',
  '2024-550e8400-0003',
  '2024-04-01',
  'Class 8',
  'A',
  '22',
  'ADM2400003',
  '789 Lake View',
  'Mumbai',
  'Maharashtra',
  '400003',
  'Vikram Patel',
  '9876543231',
  'vikram.patel@example.com',
  'Father',
  'direct',
  'approved',
  NOW()
) ON CONFLICT (email) DO NOTHING;

INSERT INTO admission_applications (
  school_id,
  application_number,
  student_name,
  date_of_birth,
  gender,
  email,
  phone,
  father_name,
  father_occupation,
  father_phone,
  mother_name,
  mother_occupation,
  mother_phone,
  address,
  city,
  state,
  pincode,
  applied_for,
  status,
  fee_amount,
  fee_paid,
  fee_status,
  enrollment_number
) VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'APP2400003',
  'Arjun Patel',
  '2010-03-10',
  'male',
  'arjun.parent@example.com',
  '9876543230',
  'Vikram Patel',
  'Architect',
  '9876543231',
  'Meera Patel',
  'Lawyer',
  '9876543232',
  '789 Lake View',
  'Mumbai',
  'Maharashtra',
  '400003',
  'Class 8',
  'approved',
  40000,
  20000,
  'partial',
  '2024-550e8400-0003'
);

INSERT INTO student_management_records (
  student_id,
  school_id,
  enrollment_number,
  class,
  section,
  roll_number,
  admission_date,
  academic_year,
  blood_group,
  emergency_contact,
  emergency_phone,
  primary_interest,
  secondary_interest,
  career_skills,
  total_fee,
  paid_amount,
  pending_amount,
  status
) VALUES (
  'a3333333-3333-3333-3333-333333333333',
  '550e8400-e29b-41d4-a716-446655440000',
  '2024-550e8400-0003',
  'Class 8',
  'A',
  '22',
  '2024-04-01',
  '2024-2025',
  'B+',
  'Vikram Patel',
  '9876543231',
  'Architecture',
  'Design',
  ARRAY['Drawing', 'CAD', 'Creative Thinking'],
  40000,
  20000,
  20000,
  'active'
) ON CONFLICT (student_id, school_id) DO NOTHING;

-- Low attendance pattern
INSERT INTO attendance_records (student_id, school_id, date, status, mode)
SELECT 
  'a3333333-3333-3333-3333-333333333333',
  '550e8400-e29b-41d4-a716-446655440000',
  CURRENT_DATE - i,
  CASE 
    WHEN i IN (1, 3, 6) THEN 'absent'
    ELSE 'present'
  END,
  'manual'
FROM generate_series(0, 9) i
ON CONFLICT (student_id, date) DO NOTHING;

-- Attendance alert
INSERT INTO attendance_alerts (
  student_id,
  school_id,
  alert_type,
  message,
  days_absent,
  attendance_percentage,
  parent_notified
) VALUES (
  'a3333333-3333-3333-3333-333333333333',
  '550e8400-e29b-41d4-a716-446655440000',
  'below_75',
  'Attendance has fallen below 75%',
  3,
  70.00,
  false
);

INSERT INTO skill_assessments (
  student_id,
  school_id,
  assessment_type,
  assessment_date,
  score,
  max_score,
  subject,
  topic,
  remarks
) VALUES 
(
  'a3333333-3333-3333-3333-333333333333',
  '550e8400-e29b-41d4-a716-446655440000',
  'Unit Test',
  CURRENT_DATE - 7,
  68.0,
  100,
  'Mathematics',
  'Geometry',
  'Needs improvement'
);

-- ============================================
-- Re-enable RLS
-- ============================================

ALTER TABLE student_management_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check complete chain
SELECT 
  u.email as user_email,
  u.role,
  s.name as student_name,
  s.grade,
  s.section,
  s.roll_number,
  smr.enrollment_number,
  smr.status as management_status
FROM users u
JOIN students s ON u.id = s.user_id
LEFT JOIN student_management_records smr ON s.id = smr.student_id
WHERE s.school_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY s.grade, s.section, s.roll_number;

-- Check attendance summary
SELECT 
  s.name,
  COUNT(ar.id) as total_days,
  COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_days,
  COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent_days,
  ROUND(COUNT(CASE WHEN ar.status = 'present' THEN 1 END)::NUMERIC / COUNT(ar.id) * 100, 2) as attendance_percentage
FROM students s
JOIN attendance_records ar ON s.id = ar.student_id
WHERE s.school_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY s.id, s.name
ORDER BY s.name;

-- Check all data counts
SELECT 
  'users' as table_name, 
  COUNT(*) as count 
FROM users 
WHERE email LIKE '%example.com'
UNION ALL
SELECT 'students', COUNT(*) 
FROM students 
WHERE school_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 'student_management_records', COUNT(*) 
FROM student_management_records 
WHERE school_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 'admission_applications', COUNT(*) 
FROM admission_applications 
WHERE school_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 'attendance_records', COUNT(*) 
FROM attendance_records 
WHERE school_id = '550e8400-e29b-41d4-a716-446655440000'
UNION ALL
SELECT 'skill_assessments', COUNT(*) 
FROM skill_assessments 
WHERE school_id = '550e8400-e29b-41d4-a716-446655440000';
