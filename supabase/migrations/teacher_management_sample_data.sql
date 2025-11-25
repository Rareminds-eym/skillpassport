-- Sample Data for Teacher Management System
-- Run this after teacher_management_schema.sql for testing

-- Note: Ensure you have a schools table with at least one school
-- If not, create a sample school first:
INSERT INTO schools (id, name, address, city, state, country)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'ABC High School', '123 Main St', 'Chennai', 'Tamil Nadu', 'India')
ON CONFLICT (id) DO NOTHING;

-- Sample Teachers
INSERT INTO teachers (
  school_id,
  first_name,
  last_name,
  email,
  phone,
  subject_expertise,
  onboarding_status
) VALUES
(
  '550e8400-e29b-41d4-a716-446655440000',
  'Rajesh',
  'Kumar',
  'rajesh.kumar@abcschool.edu',
  '+91-9876543210',
  '[
    {"name": "Mathematics", "proficiency": "expert", "years_experience": 10},
    {"name": "Physics", "proficiency": "advanced", "years_experience": 8}
  ]'::jsonb,
  'active'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'Priya',
  'Sharma',
  'priya.sharma@abcschool.edu',
  '+91-9876543211',
  '[
    {"name": "English", "proficiency": "expert", "years_experience": 12},
    {"name": "Hindi", "proficiency": "advanced", "years_experience": 10}
  ]'::jsonb,
  'active'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'Arun',
  'Patel',
  'arun.patel@abcschool.edu',
  '+91-9876543212',
  '[
    {"name": "Chemistry", "proficiency": "expert", "years_experience": 15},
    {"name": "Biology", "proficiency": "intermediate", "years_experience": 5}
  ]'::jsonb,
  'active'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'Lakshmi',
  'Reddy',
  'lakshmi.reddy@abcschool.edu',
  '+91-9876543213',
  '[
    {"name": "Computer Science", "proficiency": "expert", "years_experience": 8},
    {"name": "Information Technology", "proficiency": "advanced", "years_experience": 6}
  ]'::jsonb,
  'verified'
),
(
  '550e8400-e29b-41d4-a716-446655440000',
  'Suresh',
  'Iyer',
  'suresh.iyer@abcschool.edu',
  '+91-9876543214',
  '[
    {"name": "History", "proficiency": "advanced", "years_experience": 7},
    {"name": "Geography", "proficiency": "intermediate", "years_experience": 5}
  ]'::jsonb,
  'documents_uploaded'
);

-- Create a sample timetable for current academic year
INSERT INTO timetables (
  id,
  school_id,
  academic_year,
  term,
  start_date,
  end_date,
  status
) VALUES (
  '660e8400-e29b-41d4-a716-446655440000',
  '550e8400-e29b-41d4-a716-446655440000',
  '2024-2025',
  'Term 1',
  '2024-06-01',
  '2024-12-31',
  'draft'
);

-- Sample timetable slots for Rajesh Kumar (Mathematics teacher)
-- This will demonstrate the workload calculation
DO $$
DECLARE
  teacher_id_rajesh UUID;
  timetable_id_sample UUID := '660e8400-e29b-41d4-a716-446655440000';
BEGIN
  -- Get Rajesh's teacher ID
  SELECT id INTO teacher_id_rajesh 
  FROM teachers 
  WHERE email = 'rajesh.kumar@abcschool.edu';

  -- Monday - 4 periods
  INSERT INTO timetable_slots (timetable_id, teacher_id, day_of_week, period_number, start_time, end_time, class_name, subject_name, room_number)
  VALUES
    (timetable_id_sample, teacher_id_rajesh, 1, 1, '09:00', '10:00', '10-A', 'Mathematics', '101'),
    (timetable_id_sample, teacher_id_rajesh, 1, 2, '10:00', '11:00', '10-B', 'Mathematics', '101'),
    (timetable_id_sample, teacher_id_rajesh, 1, 4, '12:00', '13:00', '9-A', 'Mathematics', '102'),
    (timetable_id_sample, teacher_id_rajesh, 1, 6, '14:00', '15:00', '9-B', 'Mathematics', '102');

  -- Tuesday - 5 periods
  INSERT INTO timetable_slots (timetable_id, teacher_id, day_of_week, period_number, start_time, end_time, class_name, subject_name, room_number)
  VALUES
    (timetable_id_sample, teacher_id_rajesh, 2, 1, '09:00', '10:00', '10-A', 'Physics', '201'),
    (timetable_id_sample, teacher_id_rajesh, 2, 2, '10:00', '11:00', '10-A', 'Physics', '201'),
    (timetable_id_sample, teacher_id_rajesh, 2, 3, '11:00', '12:00', '10-B', 'Physics', '201'),
    (timetable_id_sample, teacher_id_rajesh, 2, 5, '13:00', '14:00', '9-A', 'Mathematics', '102'),
    (timetable_id_sample, teacher_id_rajesh, 2, 7, '15:00', '16:00', '9-B', 'Mathematics', '102');

  -- Wednesday - 4 periods
  INSERT INTO timetable_slots (timetable_id, teacher_id, day_of_week, period_number, start_time, end_time, class_name, subject_name, room_number)
  VALUES
    (timetable_id_sample, teacher_id_rajesh, 3, 2, '10:00', '11:00', '10-A', 'Mathematics', '101'),
    (timetable_id_sample, teacher_id_rajesh, 3, 3, '11:00', '12:00', '10-B', 'Mathematics', '101'),
    (timetable_id_sample, teacher_id_rajesh, 3, 5, '13:00', '14:00', '9-A', 'Physics', '201'),
    (timetable_id_sample, teacher_id_rajesh, 3, 6, '14:00', '15:00', '9-B', 'Physics', '201');

  -- Thursday - 5 periods
  INSERT INTO timetable_slots (timetable_id, teacher_id, day_of_week, period_number, start_time, end_time, class_name, subject_name, room_number)
  VALUES
    (timetable_id_sample, teacher_id_rajesh, 4, 1, '09:00', '10:00', '10-A', 'Mathematics', '101'),
    (timetable_id_sample, teacher_id_rajesh, 4, 2, '10:00', '11:00', '10-B', 'Mathematics', '101'),
    (timetable_id_sample, teacher_id_rajesh, 4, 4, '12:00', '13:00', '9-A', 'Mathematics', '102'),
    (timetable_id_sample, teacher_id_rajesh, 4, 6, '14:00', '15:00', '9-B', 'Mathematics', '102'),
    (timetable_id_sample, teacher_id_rajesh, 4, 7, '15:00', '16:00', '10-A', 'Physics', '201');

  -- Friday - 4 periods
  INSERT INTO timetable_slots (timetable_id, teacher_id, day_of_week, period_number, start_time, end_time, class_name, subject_name, room_number)
  VALUES
    (timetable_id_sample, teacher_id_rajesh, 5, 1, '09:00', '10:00', '10-A', 'Mathematics', '101'),
    (timetable_id_sample, teacher_id_rajesh, 5, 3, '11:00', '12:00', '10-B', 'Mathematics', '101'),
    (timetable_id_sample, teacher_id_rajesh, 5, 5, '13:00', '14:00', '9-A', 'Physics', '201'),
    (timetable_id_sample, teacher_id_rajesh, 5, 6, '14:00', '15:00', '9-B', 'Physics', '201');

  -- Saturday - 3 periods
  INSERT INTO timetable_slots (timetable_id, teacher_id, day_of_week, period_number, start_time, end_time, class_name, subject_name, room_number)
  VALUES
    (timetable_id_sample, teacher_id_rajesh, 6, 1, '09:00', '10:00', '10-A', 'Mathematics', '101'),
    (timetable_id_sample, teacher_id_rajesh, 6, 2, '10:00', '11:00', '10-B', 'Mathematics', '101'),
    (timetable_id_sample, teacher_id_rajesh, 6, 3, '11:00', '12:00', '9-A', 'Mathematics', '102');

  -- Total: 25 periods (within 30 limit)
  -- Max consecutive: 3 (Tuesday periods 1-3, within limit)
END $$;

-- Verify the data
SELECT 
  t.teacher_id,
  t.first_name,
  t.last_name,
  t.onboarding_status,
  COUNT(ts.id) as total_slots
FROM teachers t
LEFT JOIN timetable_slots ts ON t.id = ts.teacher_id
WHERE t.school_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY t.id, t.teacher_id, t.first_name, t.last_name, t.onboarding_status
ORDER BY t.first_name;

-- Check workload for Rajesh
SELECT * FROM teacher_workload 
WHERE timetable_id = '660e8400-e29b-41d4-a716-446655440000';

-- Check for any conflicts
SELECT * FROM timetable_conflicts 
WHERE timetable_id = '660e8400-e29b-41d4-a716-446655440000' 
AND resolved = FALSE;
