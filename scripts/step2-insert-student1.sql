-- STEP 2: Insert Student 1 - Rahul Kumar

-- Insert into users table (without created_at)
INSERT INTO users (
  id,
  email,
  role
) VALUES (
  'u1111111-1111-1111-1111-111111111111',
  'rahul.kumar@example.com',
  'student'
) ON CONFLICT (email) DO UPDATE SET role = 'student';

-- Insert into students table
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
) ON CONFLICT (email) DO UPDATE SET name = 'Rahul Kumar';

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
) ON CONFLICT (student_id, school_id) DO UPDATE SET status = 'active';

-- Insert attendance records
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
);

-- Verify
SELECT 
  s.name,
  s.grade,
  s.section,
  smr.enrollment_number,
  COUNT(ar.id) as attendance_records
FROM students s
LEFT JOIN student_management_records smr ON s.id = smr.student_id
LEFT JOIN attendance_records ar ON s.id = ar.student_id
WHERE s.id = 'a1111111-1111-1111-1111-111111111111'
GROUP BY s.id, s.name, s.grade, s.section, smr.enrollment_number;
