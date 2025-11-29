-- ============================================
-- DUMMY STUDENT DATA FOR TESTING
-- School ID: 550e8400-e29b-41d4-a716-446655440000
-- ============================================

-- First, temporarily disable RLS if needed
ALTER TABLE student_management_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE admission_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE skill_assessments DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STUDENT 1: Rahul Kumar (Class 10A)
-- ============================================

-- Step 1: Create auth user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  'a1111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'rahul.kumar@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Rahul Kumar"}',
  false,
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Create user record
INSERT INTO users (
  id,
  email,
  name,
  role,
  created_at
) VALUES (
  'a1111111-1111-1111-1111-111111111111',
  'rahul.kumar@example.com',
  'Rahul Kumar',
  'student',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Step 3: Insert into students table (matching your actual schema)
INSERT INTO students (
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
  'APP2400001',
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

-- Insert admission application
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

-- Insert student management record
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

-- Insert attendance records (last 10 days)
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

-- Insert skill assessments
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

INSERT INTO students (
  id,
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
  'APP2400002',
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
-- STUDENT 3: Arjun Patel (Class 8A)
-- ============================================

INSERT INTO students (
  id,
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
  'APP2400003',
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

-- Create attendance alert for Arjun (low attendance)
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
-- STUDENT 4: Ananya Singh (Class 10B)
-- ============================================

INSERT INTO students (
  id,
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
  'a4444444-4444-4444-4444-444444444444',
  '550e8400-e29b-41d4-a716-446655440000',
  'Ananya Singh',
  'ananya.singh@example.com',
  '9876543240',
  '2008-11-30',
  'female',
  'AB+',
  '2024-550e8400-0004',
  '2024-04-01',
  'Class 10',
  'B',
  '05',
  'APP2400004',
  '321 Hill Road',
  'Mumbai',
  'Maharashtra',
  '400004',
  'Rajiv Singh',
  '9876543241',
  'rajiv.singh@example.com',
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
  'APP2400004',
  'Ananya Singh',
  '2008-11-30',
  'female',
  'ananya.parent@example.com',
  '9876543240',
  'Rajiv Singh',
  'Bank Manager',
  '9876543241',
  'Kavita Singh',
  'Homemaker',
  '9876543242',
  '321 Hill Road',
  'Mumbai',
  'Maharashtra',
  '400004',
  'Class 10',
  'approved',
  50000,
  50000,
  'paid',
  '2024-550e8400-0004'
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
  chronic_conditions,
  medications,
  emergency_contact,
  emergency_phone,
  primary_interest,
  secondary_interest,
  career_skills,
  aspirations,
  total_fee,
  paid_amount,
  pending_amount,
  status
) VALUES (
  'a4444444-4444-4444-4444-444444444444',
  '550e8400-e29b-41d4-a716-446655440000',
  '2024-550e8400-0004',
  'Class 10',
  'B',
  '05',
  '2024-04-01',
  '2024-2025',
  'AB+',
  ARRAY['Asthma'],
  ARRAY['Inhaler as needed'],
  'Rajiv Singh',
  '9876543241',
  'Business Management',
  'Finance',
  ARRAY['Leadership', 'Excel', 'Public Speaking'],
  'Want to become a CEO of a tech company',
  50000,
  50000,
  0,
  'active'
) ON CONFLICT (student_id, school_id) DO NOTHING;

INSERT INTO attendance_records (student_id, school_id, date, status, mode)
SELECT 
  'a4444444-4444-4444-4444-444444444444',
  '550e8400-e29b-41d4-a716-446655440000',
  CURRENT_DATE - i,
  CASE 
    WHEN i = 4 THEN 'late'
    ELSE 'present'
  END,
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
  'a4444444-4444-4444-4444-444444444444',
  '550e8400-e29b-41d4-a716-446655440000',
  'Unit Test',
  CURRENT_DATE - 7,
  88.5,
  100,
  'Economics',
  'Microeconomics',
  'Very good analytical skills'
),
(
  'a4444444-4444-4444-4444-444444444444',
  '550e8400-e29b-41d4-a716-446655440000',
  'Project',
  CURRENT_DATE - 10,
  95.0,
  100,
  'Business Studies',
  'Marketing Plan',
  'Excellent presentation'
);

-- ============================================
-- STUDENT 5: Vikram Reddy (Class 7C)
-- ============================================

INSERT INTO students (
  id,
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
  'a5555555-5555-5555-5555-555555555555',
  '550e8400-e29b-41d4-a716-446655440000',
  'Vikram Reddy',
  'vikram.reddy@example.com',
  '9876543250',
  '2011-07-18',
  'male',
  'O-',
  '2024-550e8400-0005',
  '2024-04-01',
  'Class 7',
  'C',
  '12',
  'APP2400005',
  '654 Beach Road',
  'Mumbai',
  'Maharashtra',
  '400005',
  'Suresh Reddy',
  '9876543251',
  'suresh.reddy@example.com',
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
  'APP2400005',
  'Vikram Reddy',
  '2011-07-18',
  'male',
  'vikram.parent@example.com',
  '9876543250',
  'Suresh Reddy',
  'Civil Engineer',
  '9876543251',
  'Lakshmi Reddy',
  'Professor',
  '9876543252',
  '654 Beach Road',
  'Mumbai',
  'Maharashtra',
  '400005',
  'Class 7',
  'approved',
  35000,
  35000,
  'paid',
  '2024-550e8400-0005'
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
  'a5555555-5555-5555-5555-555555555555',
  '550e8400-e29b-41d4-a716-446655440000',
  '2024-550e8400-0005',
  'Class 7',
  'C',
  '12',
  '2024-04-01',
  '2024-2025',
  'O-',
  'Suresh Reddy',
  '9876543251',
  'Sports',
  'Engineering',
  ARRAY['Cricket', 'Mathematics', 'Teamwork'],
  35000,
  35000,
  0,
  'active'
) ON CONFLICT (student_id, school_id) DO NOTHING;

INSERT INTO attendance_records (student_id, school_id, date, status, mode)
SELECT 
  'a5555555-5555-5555-5555-555555555555',
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
  'a5555555-5555-5555-5555-555555555555',
  '550e8400-e29b-41d4-a716-446655440000',
  'Unit Test',
  CURRENT_DATE - 7,
  75.0,
  100,
  'Physical Education',
  'Athletics',
  'Excellent athlete'
);

-- ============================================
-- Re-enable RLS
-- ============================================

ALTER TABLE student_management_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_assessments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all created students
SELECT 
  s.name,
  smr.enrollment_number,
  smr.class,
  smr.section,
  smr.status,
  smr.total_fee,
  smr.paid_amount,
  smr.pending_amount
FROM students s
JOIN student_management_records smr ON s.id = smr.student_id
WHERE s.school_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY smr.class, smr.section, smr.roll_number;

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

-- Check skill assessments
SELECT 
  s.name,
  sa.subject,
  sa.topic,
  sa.score,
  sa.max_score,
  ROUND((sa.score / sa.max_score * 100), 2) as percentage,
  sa.remarks
FROM students s
JOIN skill_assessments sa ON s.id = sa.student_id
WHERE s.school_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY s.name, sa.assessment_date DESC;

-- Check alerts
SELECT 
  s.name,
  aa.alert_type,
  aa.message,
  aa.days_absent,
  aa.attendance_percentage,
  aa.parent_notified
FROM students s
JOIN attendance_alerts aa ON s.id = aa.student_id
WHERE s.school_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY aa.created_at DESC;
ance_percentage, parent_notified
  ) VALUES (
    v_student_ids[3], v_school_id, 'below_75',
    'Attendance has fallen below 75%', 73.33, false
  );

  -- Alert for Arjun Singh (consecutive absences)
  INSERT INTO attendance_alerts (
    student_id, school_id, alert_type, message, days_absent, parent_notified
  ) VALUES (
    v_student_ids[5], v_school_id, 'consecutive_absent',
    'Student has been absent for 3 consecutive days', 3, false
  );

  RAISE NOTICE 'Created 2 attendance alerts';

  -- ============================================
  -- 6. CREATE SKILL ASSESSMENTS
  -- ============================================

  -- Rahul Kumar assessments
  INSERT INTO skill_assessments (
    student_id, school_id, assessment_type, assessment_date, score, subject, topic, assessed_by
  ) VALUES
    (v_student_ids[1], v_school_id, 'Unit Test', CURRENT_DATE - 10, 85.5, 'Mathematics', 'Algebra', v_user_id),
    (v_student_ids[1], v_school_id, 'Mid Term', CURRENT_DATE - 20, 78.0, 'Science', 'Physics', v_user_id),
    (v_student_ids[1], v_school_id, 'Quiz', CURRENT_DATE - 5, 92.0, 'Computer Science', 'Programming', v_user_id);

  -- Priya Sharma assessments
  INSERT INTO skill_assessments (
    student_id, school_id, assessment_type, assessment_date, score, subject, topic, assessed_by
  ) VALUES
    (v_student_ids[2], v_school_id, 'Unit Test', CURRENT_DATE - 10, 95.0, 'Biology', 'Cell Structure', v_user_id),
    (v_student_ids[2], v_school_id, 'Mid Term', CURRENT_DATE - 20, 91.5, 'Chemistry', 'Organic Chemistry', v_user_id),
    (v_student_ids[2], v_school_id, 'Practical', CURRENT_DATE - 7, 98.0, 'Biology', 'Lab Work', v_user_id);

  -- Amit Patel assessments
  INSERT INTO skill_assessments (
    student_id, school_id, assessment_type, assessment_date, score, subject, topic, assessed_by
  ) VALUES
    (v_student_ids[3], v_school_id, 'Unit Test', CURRENT_DATE - 10, 72.0, 'Commerce', 'Accounting', v_user_id),
    (v_student_ids[3], v_school_id, 'Project', CURRENT_DATE - 15, 88.0, 'Business Studies', 'Marketing', v_user_id);

  RAISE NOTICE 'Created skill assessments';

  -- ============================================
  -- 7. CREATE STUDENT REPORTS
  -- ============================================

  -- Attendance report for Rahul
  INSERT INTO student_reports (
    student_id, school_id, report_type, title, academic_year, term,
    generated_by, data, has_school_logo, is_parent_friendly
  ) VALUES (
    v_student_ids[1], v_school_id, 'attendance',
    'Attendance Report - Term 1, 2024', '2024', 'Term 1',
    v_user_id,
    jsonb_build_object(
      'totalDays', 30,
      'presentDays', 26,
      'absentDays', 2,
      'lateDays', 2,
      'percentage', 86.67
    ),
    true, true
  );

  -- Academic report for Priya
  INSERT INTO student_reports (
    student_id, school_id, report_type, title, academic_year, term,
    generated_by, data, has_school_logo, is_parent_friendly
  ) VALUES (
    v_student_ids[2], v_school_id, 'academic',
    'Academic Performance Report - Term 1, 2024', '2024', 'Term 1',
    v_user_id,
    jsonb_build_object(
      'averageScore', 94.83,
      'rank', 1,
      'subjects', jsonb_build_array(
        jsonb_build_object('name', 'Biology', 'score', 95.0, 'grade', 'A+'),
        jsonb_build_object('name', 'Chemistry', 'score', 91.5, 'grade', 'A'),
        jsonb_build_object('name', 'Physics', 'score', 98.0, 'grade', 'A+')
      )
    ),
    true, true
  );

  RAISE NOTICE 'Created student reports';

  -- ============================================
  -- SUMMARY
  -- ============================================
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DUMMY DATA CREATED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Students: 5';
  RAISE NOTICE 'Management Records: 5';
  RAISE NOTICE 'Admission Applications: 2';
  RAISE NOTICE 'Attendance Records: 150 (30 days × 5 students)';
  RAISE NOTICE 'Attendance Alerts: 2';
  RAISE NOTICE 'Skill Assessments: 8';
  RAISE NOTICE 'Student Reports: 2';
  RAISE NOTICE '========================================';
  
END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check created data
SELECT 'Students' as table_name, COUNT(*) as count FROM students WHERE email LIKE '%@test.com'
UNION ALL
SELECT 'Management Records', COUNT(*) FROM student_management_records WHERE student_id IN (SELECT id FROM students WHERE email LIKE '%@test.com')
UNION ALL
SELECT 'Admission Applications', COUNT(*) FROM admission_applications WHERE email LIKE '%@test.com'
UNION ALL
SELECT 'Attendance Records', COUNT(*) FROM attendance_records WHERE student_id IN (SELECT id FROM students WHERE email LIKE '%@test.com')
UNION ALL
SELECT 'Attendance Alerts', COUNT(*) FROM attendance_alerts WHERE student_id IN (SELECT id FROM students WHERE email LIKE '%@test.com')
UNION ALL
SELECT 'Skill Assessments', COUNT(*) FROM skill_assessments WHERE student_id IN (SELECT id FROM students WHERE email LIKE '%@test.com')
UNION ALL
SELECT 'Student Reports', COUNT(*) FROM student_reports WHERE student_id IN (SELECT id FROM students WHERE email LIKE '%@test.com');

-- View student summary
SELECT 
  s.name,
  s.email,
  smr.enrollment_number,
  smr.class,
  smr.section,
  smr.roll_number,
  smr.status,
  smr.total_fee,
  smr.paid_amount,
  smr.pending_amount
FROM students s
JOIN student_management_records smr ON s.id = smr.student_id
WHERE s.email LIKE '%@test.com'
ORDER BY smr.class, smr.section, smr.roll_number;
