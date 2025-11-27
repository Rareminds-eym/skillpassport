-- STEP 3: Re-enable RLS (run this last)

ALTER TABLE student_management_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE admission_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'student_management_records',
    'admission_applications',
    'attendance_records',
    'skill_assessments',
    'students',
    'users'
  );

-- Final verification
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
WHERE school_id = '550e8400-e29b-41d4-a716-446655440000';
