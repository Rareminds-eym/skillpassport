-- ============================================
-- FIXED STUDENT INSERT - Handles conflicts properly
-- School ID: 550e8400-e29b-41d4-a716-446655440000
-- ============================================

-- Disable RLS
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_management_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE admission_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE skill_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_alerts DISABLE ROW LEVEL SECURITY;

-- ============================================
-- STUDENT 1: Rahul Kumar
-- ============================================

-- Delete if exists (for clean re-run)
DELETE FROM attendance_records WHERE student_id = 'a1111111-1111-1111-1111-111111111111';
DELETE FROM skill_assessments WHERE student_id = 'a1111111-1111-1111-1111-111111111111';
DELETE FROM student_management_records WHERE student_id = 'a1111111-1111-1111-1111-111111111111';
DELETE FROM students WHERE id = 'a1111111-1111-1111-1111-111111111111';

-- Insert student
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
  approval_status
) VALUES (
  'a1111111-1111-1111-1111-111111111111',
  '550e8400-e29b-41d4-a716-446655440000',
  'Rahul Kumar',
  'rahul.kumar.test@example.com',
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
  'approved'
);

-- Insert management record
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
);

-- Insert attendance
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
FROM generate_series(0, 9) i;

-- Insert assessments
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

-- ============================================
-- STUDENT 2: Priya Sharma
-- ============================================

DELETE FROM attendance_records WHERE student_id = 'a2222222-2222-2222-2222-222222222222';
DELETE FROM skill_assessments WHERE student_id = 'a2222222-2222-2222-2222-222222222222';
DELETE FROM student_management_records WHERE student_id = 'a2222222-2222-2222-2222-222222222222';
DELETE FROM students WHERE id = 'a2222222-2222-2222-2222-222222222222';

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
  approval_status
) VALUES (
  'a2222222-2222-2222-2222-222222222222',
  '550e8400-e29b-41d4-a716-446655440000',
  'Priya Sharma',
  'priya.sharma.test@example.com',
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
  'approved'
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
);

INSERT INTO attendance_records (student_id, school_id, date, status, mode)
SELECT 
  'a2222222-2222-2222-2222-222222222222',
  '550e8400-e29b-41d4-a716-446655440000',
  CURRENT_DATE - i,
  'present',
  'manual'
FROM generate_series(0, 9) i;

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
-- STUDENT 3: Arjun Patel (Low Attendance)
-- ============================================

DELETE FROM attendance_alerts WHERE student_id = 'a3333333-3333-3333-3333-333333333333';
DELETE FROM attendance_records WHERE student_id = 'a3333333-3333-3333-3333-333333333333';
DELETE FROM skill_assessments WHERE student_id = 'a3333333-3333-3333-3333-333333333333';
DELETE FROM student_management_records WHERE student_id = 'a3333333-3333-3333-3333-333333333333';
DELETE FROM students WHERE id = 'a3333333-3333-3333-3333-333333333333';

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
  approval_status
) VALUES (
  'a3333333-3333-3333-3333-333333333333',
  '550e8400-e29b-41d4-a716-446655440000',
  'Arjun Patel',
  'arjun.patel.test@example.com',
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
  'approved'
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
);

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
FROM generate_series(0, 9) i;

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

-- Re-enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_management_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_alerts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT '✅ Students Created' as status;

SELECT 
  s.name,
  s.email,
  s.grade,
  s.section,
  s.roll_number,
  smr.enrollment_number,
  smr.total_fee,
  smr.paid_amount,
  smr.status
FROM students s
JOIN student_management_records smr ON s.id = smr.student_id
WHERE s.school_id = '550e8400-e29b-41d4-a716-446655440000'
  AND s.email LIKE '%.test@example.com'
ORDER BY s.grade, s.section, s.roll_number;

SELECT '✅ Attendance Summary' as status;

SELECT 
  s.name,
  COUNT(ar.id) as total_days,
  COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present,
  COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent,
  COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late,
  ROUND(COUNT(CASE WHEN ar.status = 'present' THEN 1 END)::NUMERIC / COUNT(ar.id) * 100, 2) as percentage
FROM students s
JOIN attendance_records ar ON s.id = ar.student_id
WHERE s.school_id = '550e8400-e29b-41d4-a716-446655440000'
  AND s.email LIKE '%.test@example.com'
GROUP BY s.id, s.name
ORDER BY s.name;

SELECT '✅ Skill Assessments' as status;

SELECT 
  s.name,
  sa.subject,
  sa.score,
  sa.max_score,
  ROUND((sa.score / sa.max_score * 100), 2) as percentage,
  sa.remarks
FROM students s
JOIN skill_assessments sa ON s.id = sa.student_id
WHERE s.school_id = '550e8400-e29b-41d4-a716-446655440000'
  AND s.email LIKE '%.test@example.com'
ORDER BY s.name;

SELECT '✅ Attendance Alerts' as status;

SELECT 
  s.name,
  aa.alert_type,
  aa.message,
  aa.attendance_percentage,
  aa.parent_notified
FROM students s
JOIN attendance_alerts aa ON s.id = aa.student_id
WHERE s.school_id = '550e8400-e29b-41d4-a716-446655440000'
  AND s.email LIKE '%.test@example.com';
