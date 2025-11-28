-- Sample data for testing Student Management System
-- Run this in Supabase SQL Editor if you need test data

-- Note: Replace 'your-school-id' with an actual school ID from your schools table
-- You can find it by running: SELECT id, name FROM schools LIMIT 1;

DO $$
DECLARE
  v_school_id UUID;
  v_student_id UUID;
  v_enrollment_num TEXT;
BEGIN
  -- Get first school ID (replace with your actual school ID)
  SELECT id INTO v_school_id FROM schools LIMIT 1;
  
  IF v_school_id IS NULL THEN
    RAISE EXCEPTION 'No school found. Please create a school first.';
  END IF;

  -- Create sample admission application
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
    fee_amount
  ) VALUES (
    v_school_id,
    'APP24' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 5, '0'),
    'John Doe',
    '2010-05-15',
    'male',
    'parent.john@example.com',
    '9876543210',
    'John Doe Sr',
    'Engineer',
    '9876543211',
    'Jane Doe',
    'Teacher',
    '9876543212',
    '123 Main Street',
    'Mumbai',
    'Maharashtra',
    '400001',
    'Class 8',
    'approved',
    50000
  );

  -- Create sample student (if not exists)
  INSERT INTO students (
    school_id,
    name,
    email,
    phone,
    date_of_birth,
    gender
  ) VALUES (
    v_school_id,
    'John Doe',
    'john.doe@example.com',
    '9876543210',
    '2010-05-15',
    'male'
  )
  ON CONFLICT (email) DO NOTHING
  RETURNING id INTO v_student_id;

  -- If student already exists, get their ID
  IF v_student_id IS NULL THEN
    SELECT id INTO v_student_id FROM students WHERE email = 'john.doe@example.com';
  END IF;

  -- Generate enrollment number
  SELECT generate_enrollment_number(v_school_id, '2024') INTO v_enrollment_num;

  -- Create student management record
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
    status
  ) VALUES (
    v_student_id,
    v_school_id,
    v_enrollment_num,
    'Class 8',
    'A',
    '15',
    CURRENT_DATE,
    '2024',
    'O+',
    'John Doe Sr',
    '9876543211',
    'active'
  )
  ON CONFLICT (student_id, school_id) DO NOTHING;

  -- Create sample attendance records (last 7 days)
  FOR i IN 0..6 LOOP
    INSERT INTO attendance_records (
      student_id,
      school_id,
      date,
      status,
      mode
    ) VALUES (
      v_student_id,
      v_school_id,
      CURRENT_DATE - i,
      CASE 
        WHEN i = 2 THEN 'absent'
        WHEN i = 5 THEN 'late'
        ELSE 'present'
      END,
      'manual'
    )
    ON CONFLICT (student_id, date) DO NOTHING;
  END LOOP;

  -- Create sample skill assessment
  INSERT INTO skill_assessments (
    student_id,
    school_id,
    assessment_type,
    assessment_date,
    score,
    subject,
    topic
  ) VALUES (
    v_student_id,
    v_school_id,
    'Unit Test',
    CURRENT_DATE - 5,
    85.5,
    'Mathematics',
    'Algebra'
  );

  RAISE NOTICE 'Sample data created successfully!';
  RAISE NOTICE 'Student ID: %', v_student_id;
  RAISE NOTICE 'Enrollment Number: %', v_enrollment_num;
  
END $$;

-- Verify the data
SELECT 
  'admission_applications' as table_name, 
  COUNT(*) as count 
FROM admission_applications
UNION ALL
SELECT 'student_management_records', COUNT(*) FROM student_management_records
UNION ALL
SELECT 'attendance_records', COUNT(*) FROM attendance_records
UNION ALL
SELECT 'skill_assessments', COUNT(*) FROM skill_assessments;
