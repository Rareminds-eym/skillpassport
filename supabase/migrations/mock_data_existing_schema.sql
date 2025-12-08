-- Mock Data for Existing Schema (school_educators based)
-- Run this after teacher_management_existing_schema.sql

-- ============================================
-- 1. UPDATE EXISTING SCHOOL_EDUCATORS WITH ROLES
-- ============================================

-- Update existing educators with roles and teacher_ids
-- Replace these emails with your actual educator emails

UPDATE school_educators 
SET 
  role = 'school_admin',
  onboarding_status = 'active',
  subject_expertise = '[{"name": "Administration", "proficiency": "expert", "years_experience": 10}]'::jsonb
WHERE email = 'admin@springfield.edu' OR user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@springfield.edu'
);

UPDATE school_educators 
SET 
  role = 'principal',
  onboarding_status = 'active',
  subject_expertise = '[{"name": "Leadership", "proficiency": "expert", "years_experience": 15}]'::jsonb
WHERE email = 'principal@springfield.edu' OR user_id IN (
  SELECT id FROM auth.users WHERE email = 'principal@springfield.edu'
);

-- If you don't have these educators, you can insert them
-- (Adjust school_id to match your actual school)

INSERT INTO school_educators (user_id, school_id, email, role, onboarding_status, subject_expertise, teacher_id)
SELECT 
  u.id,
  (SELECT id FROM schools LIMIT 1), -- Use first school or specify school_id
  'robert.smith@springfield.edu',
  'subject_teacher',
  'active',
  '[{"name": "Mathematics", "proficiency": "expert", "years_experience": 8}, {"name": "Physics", "proficiency": "advanced", "years_experience": 5}]'::jsonb,
  NULL -- Will be auto-generated
FROM auth.users u
WHERE u.email = 'robert.smith@springfield.edu'
ON CONFLICT DO NOTHING;

INSERT INTO school_educators (user_id, school_id, email, role, onboarding_status, subject_expertise, teacher_id)
SELECT 
  u.id,
  (SELECT id FROM schools LIMIT 1),
  'emily.johnson@springfield.edu',
  'subject_teacher',
  'active',
  '[{"name": "English", "proficiency": "expert", "years_experience": 10}, {"name": "Literature", "proficiency": "expert", "years_experience": 10}]'::jsonb,
  NULL
FROM auth.users u
WHERE u.email = 'emily.johnson@springfield.edu'
ON CONFLICT DO NOTHING;

INSERT INTO school_educators (user_id, school_id, email, role, onboarding_status, subject_expertise, teacher_id)
SELECT 
  u.id,
  (SELECT id FROM schools LIMIT 1),
  'michael.brown@springfield.edu',
  'subject_teacher',
  'active',
  '[{"name": "Chemistry", "proficiency": "expert", "years_experience": 7}, {"name": "Biology", "proficiency": "advanced", "years_experience": 6}]'::jsonb,
  NULL
FROM auth.users u
WHERE u.email = 'michael.brown@springfield.edu'
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. CREATE TIMETABLE
-- ============================================

INSERT INTO timetables (id, school_id, academic_year, term, start_date, end_date, status)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  id,
  '2024-2025',
  'Term 1',
  '2024-09-01',
  '2024-12-20',
  'published'
FROM schools
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. CREATE TIMETABLE SLOTS
-- ============================================

-- Get educator IDs for timetable slots
DO $$
DECLARE
  v_timetable_id UUID := '00000000-0000-0000-0000-000000000001';
  v_math_teacher_id UUID;
  v_english_teacher_id UUID;
  v_chemistry_teacher_id UUID;
  v_class_10a_id UUID;
  v_class_10b_id UUID;
  v_class_11a_id UUID;
BEGIN
  -- Get educator IDs
  SELECT id INTO v_math_teacher_id FROM school_educators WHERE email = 'robert.smith@springfield.edu' LIMIT 1;
  SELECT id INTO v_english_teacher_id FROM school_educators WHERE email = 'emily.johnson@springfield.edu' LIMIT 1;
  SELECT id INTO v_chemistry_teacher_id FROM school_educators WHERE email = 'michael.brown@springfield.edu' LIMIT 1;
  
  -- Get or create class IDs (with grade and academic_year columns)
  INSERT INTO school_classes (name, school_id, grade, academic_year) 
  SELECT '10-A', school_id, '10', '2024-2025' FROM school_educators LIMIT 1
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_class_10a_id;
  
  IF v_class_10a_id IS NULL THEN
    SELECT id INTO v_class_10a_id FROM school_classes WHERE name = '10-A' LIMIT 1;
  END IF;
  
  INSERT INTO school_classes (name, school_id, grade, academic_year) 
  SELECT '10-B', school_id, '10', '2024-2025' FROM school_educators LIMIT 1
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_class_10b_id;
  
  IF v_class_10b_id IS NULL THEN
    SELECT id INTO v_class_10b_id FROM school_classes WHERE name = '10-B' LIMIT 1;
  END IF;
  
  INSERT INTO school_classes (name, school_id, grade, academic_year) 
  SELECT '11-A', school_id, '11', '2024-2025' FROM school_educators LIMIT 1
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_class_11a_id;
  
  IF v_class_11a_id IS NULL THEN
    SELECT id INTO v_class_11a_id FROM school_classes WHERE name = '11-A' LIMIT 1;
  END IF;
  
  -- Insert timetable slots for Math teacher (if exists)
  IF v_math_teacher_id IS NOT NULL THEN
    -- Monday
    INSERT INTO timetable_slots (timetable_id, educator_id, class_id, day_of_week, period_number, start_time, end_time, subject_name, room_number)
    VALUES 
      (v_timetable_id, v_math_teacher_id, v_class_10a_id, 1, 1, '08:00', '08:45', 'Mathematics', '101'),
      (v_timetable_id, v_math_teacher_id, v_class_10b_id, 1, 2, '08:45', '09:30', 'Mathematics', '101'),
      (v_timetable_id, v_math_teacher_id, v_class_11a_id, 1, 4, '10:30', '11:15', 'Physics', '201'),
      (v_timetable_id, v_math_teacher_id, v_class_11a_id, 1, 5, '11:15', '12:00', 'Physics', '201')
    ON CONFLICT DO NOTHING;
    
    -- Tuesday
    INSERT INTO timetable_slots (timetable_id, educator_id, class_id, day_of_week, period_number, start_time, end_time, subject_name, room_number)
    VALUES 
      (v_timetable_id, v_math_teacher_id, v_class_10a_id, 2, 1, '08:00', '08:45', 'Mathematics', '101'),
      (v_timetable_id, v_math_teacher_id, v_class_10b_id, 2, 3, '09:45', '10:30', 'Mathematics', '101'),
      (v_timetable_id, v_math_teacher_id, v_class_11a_id, 2, 5, '11:15', '12:00', 'Physics', '201')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Insert timetable slots for English teacher (if exists)
  IF v_english_teacher_id IS NOT NULL THEN
    INSERT INTO timetable_slots (timetable_id, educator_id, class_id, day_of_week, period_number, start_time, end_time, subject_name, room_number)
    VALUES 
      (v_timetable_id, v_english_teacher_id, v_class_10a_id, 1, 3, '09:45', '10:30', 'English', '102'),
      (v_timetable_id, v_english_teacher_id, v_class_10b_id, 1, 6, '12:00', '12:45', 'English', '102'),
      (v_timetable_id, v_english_teacher_id, v_class_11a_id, 1, 7, '13:30', '14:15', 'Literature', '102')
    ON CONFLICT DO NOTHING;
  END IF;
  
  RAISE NOTICE 'Timetable slots created successfully';
END $$;

-- ============================================
-- 4. CREATE LESSON PLANS
-- ============================================

DO $$
DECLARE
  v_math_teacher_id UUID;
  v_english_teacher_id UUID;
  v_chemistry_teacher_id UUID;
  v_class_10a_id UUID;
  v_class_10b_id UUID;
  v_class_11a_id UUID;
BEGIN
  -- Get IDs
  SELECT id INTO v_math_teacher_id FROM school_educators WHERE email = 'robert.smith@springfield.edu' LIMIT 1;
  SELECT id INTO v_english_teacher_id FROM school_educators WHERE email = 'emily.johnson@springfield.edu' LIMIT 1;
  SELECT id INTO v_chemistry_teacher_id FROM school_educators WHERE email = 'michael.brown@springfield.edu' LIMIT 1;
  
  SELECT id INTO v_class_10a_id FROM school_classes WHERE name = '10-A' LIMIT 1;
  SELECT id INTO v_class_10b_id FROM school_classes WHERE name = '10-B' LIMIT 1;
  SELECT id INTO v_class_11a_id FROM school_classes WHERE name = '11-A' LIMIT 1;
  
  -- Math teacher lesson plans
  IF v_math_teacher_id IS NOT NULL THEN
    -- Draft
    INSERT INTO lesson_plans (educator_id, class_id, title, subject, class_name, date, duration, learning_objectives, activities, resources, status)
    VALUES (
      v_math_teacher_id, v_class_10a_id,
      'Introduction to Quadratic Equations', 'Mathematics', '10-A', CURRENT_DATE + 1, 45,
      'Students will be able to: 1) Define quadratic equations, 2) Identify coefficients a, b, c, 3) Solve simple quadratic equations',
      '[{"description": "Review linear equations", "type": "lecture", "duration": 10}, {"description": "Introduce quadratic form", "type": "lecture", "duration": 15}, {"description": "Practice problems", "type": "group_work", "duration": 15}]'::jsonb,
      '[{"name": "Algebra Textbook Chapter 5", "type": "textbook"}, {"name": "Quadratic Equations Worksheet", "type": "worksheet"}]'::jsonb,
      'draft'
    );
    
    -- Submitted
    INSERT INTO lesson_plans (educator_id, class_id, title, subject, class_name, date, duration, learning_objectives, activities, resources, status, submitted_at)
    VALUES (
      v_math_teacher_id, v_class_11a_id,
      'Newton''s Laws of Motion', 'Physics', '11-A', CURRENT_DATE + 2, 45,
      'Students will: 1) Understand Newton''s three laws, 2) Apply laws to real-world scenarios, 3) Calculate force using F=ma',
      '[{"description": "Introduction to Newton", "type": "lecture", "duration": 10}, {"description": "Explain three laws with demonstrations", "type": "practical", "duration": 20}]'::jsonb,
      '[{"name": "Physics Textbook Chapter 3", "type": "textbook"}, {"name": "Force Demonstration Kit", "type": "equipment"}]'::jsonb,
      'submitted',
      NOW() - INTERVAL '2 days'
    );
    
    -- Approved
    INSERT INTO lesson_plans (educator_id, class_id, title, subject, class_name, date, duration, learning_objectives, activities, resources, status, submitted_at, reviewed_at, review_comments)
    VALUES (
      v_math_teacher_id, v_class_10b_id,
      'Algebraic Expressions and Simplification', 'Mathematics', '10-B', CURRENT_DATE - 5, 45,
      'Students will: 1) Simplify algebraic expressions, 2) Combine like terms, 3) Apply distributive property',
      '[{"description": "Review basic algebra", "type": "lecture", "duration": 10}, {"description": "Demonstrate simplification", "type": "lecture", "duration": 15}]'::jsonb,
      '[{"name": "Algebra Workbook", "type": "textbook"}, {"name": "Practice Worksheet", "type": "worksheet"}]'::jsonb,
      'approved',
      NOW() - INTERVAL '6 days',
      NOW() - INTERVAL '5 days',
      'Excellent lesson plan! Well-structured with clear objectives.'
    );
  END IF;
  
  -- English teacher lesson plans
  IF v_english_teacher_id IS NOT NULL THEN
    INSERT INTO lesson_plans (educator_id, class_id, title, subject, class_name, date, duration, learning_objectives, activities, resources, status, submitted_at)
    VALUES (
      v_english_teacher_id, v_class_10a_id,
      'Shakespeare''s Romeo and Juliet - Act 1', 'English', '10-A', CURRENT_DATE + 3, 45,
      'Students will: 1) Understand historical context, 2) Analyze characters in Act 1, 3) Identify key themes',
      '[{"description": "Brief history of Shakespeare", "type": "lecture", "duration": 10}, {"description": "Read Act 1 Scene 1 aloud", "type": "discussion", "duration": 15}]'::jsonb,
      '[{"name": "Romeo and Juliet Text", "type": "textbook"}, {"name": "Character Map Worksheet", "type": "worksheet"}]'::jsonb,
      'submitted',
      NOW() - INTERVAL '1 day'
    );
  END IF;
  
  RAISE NOTICE 'Lesson plans created successfully';
END $$;

-- ============================================
-- 5. CALCULATE WORKLOAD
-- ============================================

DO $$
DECLARE
  v_timetable_id UUID := '00000000-0000-0000-0000-000000000001';
  v_educator_id UUID;
BEGIN
  FOR v_educator_id IN 
    SELECT DISTINCT educator_id FROM timetable_slots WHERE timetable_id = v_timetable_id
  LOOP
    PERFORM calculate_teacher_workload(v_educator_id, v_timetable_id);
  END LOOP;
  
  RAISE NOTICE 'Workload calculated for all educators';
END $$;

-- ============================================
-- 6. DETECT CONFLICTS
-- ============================================

SELECT detect_timetable_conflicts('00000000-0000-0000-0000-000000000001');

-- ============================================
-- 7. VERIFICATION
-- ============================================

-- Check educators with roles
SELECT 
  teacher_id,
  email,
  role,
  onboarding_status,
  jsonb_array_length(subject_expertise) as subjects_count
FROM school_educators
WHERE role IS NOT NULL
ORDER BY teacher_id;

-- Check timetable slots
SELECT 
  se.teacher_id,
  se.email,
  COUNT(ts.id) as total_periods
FROM school_educators se
LEFT JOIN timetable_slots ts ON se.id = ts.educator_id
WHERE se.role IS NOT NULL
GROUP BY se.id, se.teacher_id, se.email
ORDER BY se.teacher_id;

-- Check lesson plans
SELECT 
  se.teacher_id,
  se.email,
  COUNT(lp.id) as lesson_plans_count,
  COUNT(CASE WHEN lp.status = 'draft' THEN 1 END) as drafts,
  COUNT(CASE WHEN lp.status = 'submitted' THEN 1 END) as submitted,
  COUNT(CASE WHEN lp.status = 'approved' THEN 1 END) as approved
FROM school_educators se
LEFT JOIN lesson_plans lp ON se.id = lp.educator_id
WHERE se.role IS NOT NULL
GROUP BY se.id, se.teacher_id, se.email
ORDER BY se.teacher_id;

-- Check workload
SELECT 
  se.teacher_id,
  se.email,
  tw.total_periods_per_week,
  tw.max_consecutive_classes
FROM school_educators se
JOIN teacher_workload tw ON se.id = tw.educator_id
ORDER BY se.teacher_id;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Mock data inserted successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Educators updated with roles and teacher_ids';
  RAISE NOTICE 'Timetable slots created';
  RAISE NOTICE 'Lesson plans created (draft, submitted, approved)';
  RAISE NOTICE 'Workload calculated';
  RAISE NOTICE 'Conflicts detected';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next: Set user in localStorage and test!';
END $$;
-- Mock Data for Existing Schema (school_educators based)
-- Run this after teacher_management_existing_schema.sql

-- ============================================
-- 1. UPDATE EXISTING SCHOOL_EDUCATORS WITH ROLES
-- ============================================

-- Update existing educators with roles and teacher_ids
-- Replace these emails with your actual educator emails

UPDATE school_educators 
SET 
  role = 'school_admin',
  onboarding_status = 'active',
  subject_expertise = '[{"name": "Administration", "proficiency": "expert", "years_experience": 10}]'::jsonb
WHERE email = 'admin@springfield.edu' OR user_id IN (
  SELECT id FROM auth.users WHERE email = 'admin@springfield.edu'
);

UPDATE school_educators 
SET 
  role = 'principal',
  onboarding_status = 'active',
  subject_expertise = '[{"name": "Leadership", "proficiency": "expert", "years_experience": 15}]'::jsonb
WHERE email = 'principal@springfield.edu' OR user_id IN (
  SELECT id FROM auth.users WHERE email = 'principal@springfield.edu'
);

-- If you don't have these educators, you can insert them
-- (Adjust school_id to match your actual school)

INSERT INTO school_educators (user_id, school_id, email, role, onboarding_status, subject_expertise, teacher_id)
SELECT 
  u.id,
  (SELECT id FROM schools LIMIT 1), -- Use first school or specify school_id
  'robert.smith@springfield.edu',
  'subject_teacher',
  'active',
  '[{"name": "Mathematics", "proficiency": "expert", "years_experience": 8}, {"name": "Physics", "proficiency": "advanced", "years_experience": 5}]'::jsonb,
  NULL -- Will be auto-generated
FROM auth.users u
WHERE u.email = 'robert.smith@springfield.edu'
ON CONFLICT DO NOTHING;

INSERT INTO school_educators (user_id, school_id, email, role, onboarding_status, subject_expertise, teacher_id)
SELECT 
  u.id,
  (SELECT id FROM schools LIMIT 1),
  'emily.johnson@springfield.edu',
  'subject_teacher',
  'active',
  '[{"name": "English", "proficiency": "expert", "years_experience": 10}, {"name": "Literature", "proficiency": "expert", "years_experience": 10}]'::jsonb,
  NULL
FROM auth.users u
WHERE u.email = 'emily.johnson@springfield.edu'
ON CONFLICT DO NOTHING;

INSERT INTO school_educators (user_id, school_id, email, role, onboarding_status, subject_expertise, teacher_id)
SELECT 
  u.id,
  (SELECT id FROM schools LIMIT 1),
  'michael.brown@springfield.edu',
  'subject_teacher',
  'active',
  '[{"name": "Chemistry", "proficiency": "expert", "years_experience": 7}, {"name": "Biology", "proficiency": "advanced", "years_experience": 6}]'::jsonb,
  NULL
FROM auth.users u
WHERE u.email = 'michael.brown@springfield.edu'
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. CREATE TIMETABLE
-- ============================================

INSERT INTO timetables (id, school_id, academic_year, term, start_date, end_date, status)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  id,
  '2024-2025',
  'Term 1',
  '2024-09-01',
  '2024-12-20',
  'published'
FROM schools
LIMIT 1
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. CREATE TIMETABLE SLOTS
-- ============================================

-- Get educator IDs for timetable slots
DO $$
DECLARE
  v_timetable_id UUID := '00000000-0000-0000-0000-000000000001';
  v_math_teacher_id UUID;
  v_english_teacher_id UUID;
  v_chemistry_teacher_id UUID;
  v_class_10a_id UUID;
  v_class_10b_id UUID;
  v_class_11a_id UUID;
BEGIN
  -- Get educator IDs
  SELECT id INTO v_math_teacher_id FROM school_educators WHERE email = 'robert.smith@springfield.edu' LIMIT 1;
  SELECT id INTO v_english_teacher_id FROM school_educators WHERE email = 'emily.johnson@springfield.edu' LIMIT 1;
  SELECT id INTO v_chemistry_teacher_id FROM school_educators WHERE email = 'michael.brown@springfield.edu' LIMIT 1;
  
  -- Get or create class IDs (with grade and academic_year columns)
  INSERT INTO school_classes (name, school_id, grade, academic_year) 
  SELECT '10-A', school_id, '10', '2024-2025' FROM school_educators LIMIT 1
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_class_10a_id;
  
  IF v_class_10a_id IS NULL THEN
    SELECT id INTO v_class_10a_id FROM school_classes WHERE name = '10-A' LIMIT 1;
  END IF;
  
  INSERT INTO school_classes (name, school_id, grade, academic_year) 
  SELECT '10-B', school_id, '10', '2024-2025' FROM school_educators LIMIT 1
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_class_10b_id;
  
  IF v_class_10b_id IS NULL THEN
    SELECT id INTO v_class_10b_id FROM school_classes WHERE name = '10-B' LIMIT 1;
  END IF;
  
  INSERT INTO school_classes (name, school_id, grade, academic_year) 
  SELECT '11-A', school_id, '11', '2024-2025' FROM school_educators LIMIT 1
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_class_11a_id;
  
  IF v_class_11a_id IS NULL THEN
    SELECT id INTO v_class_11a_id FROM school_classes WHERE name = '11-A' LIMIT 1;
  END IF;
  
  -- Insert timetable slots for Math teacher (if exists)
  IF v_math_teacher_id IS NOT NULL THEN
    -- Monday
    INSERT INTO timetable_slots (timetable_id, educator_id, class_id, day_of_week, period_number, start_time, end_time, subject_name, room_number)
    VALUES 
      (v_timetable_id, v_math_teacher_id, v_class_10a_id, 1, 1, '08:00', '08:45', 'Mathematics', '101'),
      (v_timetable_id, v_math_teacher_id, v_class_10b_id, 1, 2, '08:45', '09:30', 'Mathematics', '101'),
      (v_timetable_id, v_math_teacher_id, v_class_11a_id, 1, 4, '10:30', '11:15', 'Physics', '201'),
      (v_timetable_id, v_math_teacher_id, v_class_11a_id, 1, 5, '11:15', '12:00', 'Physics', '201')
    ON CONFLICT DO NOTHING;
    
    -- Tuesday
    INSERT INTO timetable_slots (timetable_id, educator_id, class_id, day_of_week, period_number, start_time, end_time, subject_name, room_number)
    VALUES 
      (v_timetable_id, v_math_teacher_id, v_class_10a_id, 2, 1, '08:00', '08:45', 'Mathematics', '101'),
      (v_timetable_id, v_math_teacher_id, v_class_10b_id, 2, 3, '09:45', '10:30', 'Mathematics', '101'),
      (v_timetable_id, v_math_teacher_id, v_class_11a_id, 2, 5, '11:15', '12:00', 'Physics', '201')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- Insert timetable slots for English teacher (if exists)
  IF v_english_teacher_id IS NOT NULL THEN
    INSERT INTO timetable_slots (timetable_id, educator_id, class_id, day_of_week, period_number, start_time, end_time, subject_name, room_number)
    VALUES 
      (v_timetable_id, v_english_teacher_id, v_class_10a_id, 1, 3, '09:45', '10:30', 'English', '102'),
      (v_timetable_id, v_english_teacher_id, v_class_10b_id, 1, 6, '12:00', '12:45', 'English', '102'),
      (v_timetable_id, v_english_teacher_id, v_class_11a_id, 1, 7, '13:30', '14:15', 'Literature', '102')
    ON CONFLICT DO NOTHING;
  END IF;
  
  RAISE NOTICE 'Timetable slots created successfully';
END $$;

-- ============================================
-- 4. CREATE LESSON PLANS
-- ============================================

DO $$
DECLARE
  v_math_teacher_id UUID;
  v_english_teacher_id UUID;
  v_chemistry_teacher_id UUID;
  v_class_10a_id UUID;
  v_class_10b_id UUID;
  v_class_11a_id UUID;
BEGIN
  -- Get IDs
  SELECT id INTO v_math_teacher_id FROM school_educators WHERE email = 'robert.smith@springfield.edu' LIMIT 1;
  SELECT id INTO v_english_teacher_id FROM school_educators WHERE email = 'emily.johnson@springfield.edu' LIMIT 1;
  SELECT id INTO v_chemistry_teacher_id FROM school_educators WHERE email = 'michael.brown@springfield.edu' LIMIT 1;
  
  SELECT id INTO v_class_10a_id FROM school_classes WHERE name = '10-A' LIMIT 1;
  SELECT id INTO v_class_10b_id FROM school_classes WHERE name = '10-B' LIMIT 1;
  SELECT id INTO v_class_11a_id FROM school_classes WHERE name = '11-A' LIMIT 1;
  
  -- Math teacher lesson plans
  IF v_math_teacher_id IS NOT NULL THEN
    -- Draft
    INSERT INTO lesson_plans (educator_id, class_id, title, subject, class_name, date, duration, learning_objectives, activities, resources, status)
    VALUES (
      v_math_teacher_id, v_class_10a_id,
      'Introduction to Quadratic Equations', 'Mathematics', '10-A', CURRENT_DATE + 1, 45,
      'Students will be able to: 1) Define quadratic equations, 2) Identify coefficients a, b, c, 3) Solve simple quadratic equations',
      '[{"description": "Review linear equations", "type": "lecture", "duration": 10}, {"description": "Introduce quadratic form", "type": "lecture", "duration": 15}, {"description": "Practice problems", "type": "group_work", "duration": 15}]'::jsonb,
      '[{"name": "Algebra Textbook Chapter 5", "type": "textbook"}, {"name": "Quadratic Equations Worksheet", "type": "worksheet"}]'::jsonb,
      'draft'
    );
    
    -- Submitted
    INSERT INTO lesson_plans (educator_id, class_id, title, subject, class_name, date, duration, learning_objectives, activities, resources, status, submitted_at)
    VALUES (
      v_math_teacher_id, v_class_11a_id,
      'Newton''s Laws of Motion', 'Physics', '11-A', CURRENT_DATE + 2, 45,
      'Students will: 1) Understand Newton''s three laws, 2) Apply laws to real-world scenarios, 3) Calculate force using F=ma',
      '[{"description": "Introduction to Newton", "type": "lecture", "duration": 10}, {"description": "Explain three laws with demonstrations", "type": "practical", "duration": 20}]'::jsonb,
      '[{"name": "Physics Textbook Chapter 3", "type": "textbook"}, {"name": "Force Demonstration Kit", "type": "equipment"}]'::jsonb,
      'submitted',
      NOW() - INTERVAL '2 days'
    );
    
    -- Approved
    INSERT INTO lesson_plans (educator_id, class_id, title, subject, class_name, date, duration, learning_objectives, activities, resources, status, submitted_at, reviewed_at, review_comments)
    VALUES (
      v_math_teacher_id, v_class_10b_id,
      'Algebraic Expressions and Simplification', 'Mathematics', '10-B', CURRENT_DATE - 5, 45,
      'Students will: 1) Simplify algebraic expressions, 2) Combine like terms, 3) Apply distributive property',
      '[{"description": "Review basic algebra", "type": "lecture", "duration": 10}, {"description": "Demonstrate simplification", "type": "lecture", "duration": 15}]'::jsonb,
      '[{"name": "Algebra Workbook", "type": "textbook"}, {"name": "Practice Worksheet", "type": "worksheet"}]'::jsonb,
      'approved',
      NOW() - INTERVAL '6 days',
      NOW() - INTERVAL '5 days',
      'Excellent lesson plan! Well-structured with clear objectives.'
    );
  END IF;
  
  -- English teacher lesson plans
  IF v_english_teacher_id IS NOT NULL THEN
    INSERT INTO lesson_plans (educator_id, class_id, title, subject, class_name, date, duration, learning_objectives, activities, resources, status, submitted_at)
    VALUES (
      v_english_teacher_id, v_class_10a_id,
      'Shakespeare''s Romeo and Juliet - Act 1', 'English', '10-A', CURRENT_DATE + 3, 45,
      'Students will: 1) Understand historical context, 2) Analyze characters in Act 1, 3) Identify key themes',
      '[{"description": "Brief history of Shakespeare", "type": "lecture", "duration": 10}, {"description": "Read Act 1 Scene 1 aloud", "type": "discussion", "duration": 15}]'::jsonb,
      '[{"name": "Romeo and Juliet Text", "type": "textbook"}, {"name": "Character Map Worksheet", "type": "worksheet"}]'::jsonb,
      'submitted',
      NOW() - INTERVAL '1 day'
    );
  END IF;
  
  RAISE NOTICE 'Lesson plans created successfully';
END $$;

-- ============================================
-- 5. CALCULATE WORKLOAD
-- ============================================

DO $$
DECLARE
  v_timetable_id UUID := '00000000-0000-0000-0000-000000000001';
  v_educator_id UUID;
BEGIN
  FOR v_educator_id IN 
    SELECT DISTINCT educator_id FROM timetable_slots WHERE timetable_id = v_timetable_id
  LOOP
    PERFORM calculate_teacher_workload(v_educator_id, v_timetable_id);
  END LOOP;
  
  RAISE NOTICE 'Workload calculated for all educators';
END $$;

-- ============================================
-- 6. DETECT CONFLICTS
-- ============================================

SELECT detect_timetable_conflicts('00000000-0000-0000-0000-000000000001');

-- ============================================
-- 7. VERIFICATION
-- ============================================

-- Check educators with roles
SELECT 
  teacher_id,
  email,
  role,
  onboarding_status,
  jsonb_array_length(subject_expertise) as subjects_count
FROM school_educators
WHERE role IS NOT NULL
ORDER BY teacher_id;

-- Check timetable slots
SELECT 
  se.teacher_id,
  se.email,
  COUNT(ts.id) as total_periods
FROM school_educators se
LEFT JOIN timetable_slots ts ON se.id = ts.educator_id
WHERE se.role IS NOT NULL
GROUP BY se.id, se.teacher_id, se.email
ORDER BY se.teacher_id;

-- Check lesson plans
SELECT 
  se.teacher_id,
  se.email,
  COUNT(lp.id) as lesson_plans_count,
  COUNT(CASE WHEN lp.status = 'draft' THEN 1 END) as drafts,
  COUNT(CASE WHEN lp.status = 'submitted' THEN 1 END) as submitted,
  COUNT(CASE WHEN lp.status = 'approved' THEN 1 END) as approved
FROM school_educators se
LEFT JOIN lesson_plans lp ON se.id = lp.educator_id
WHERE se.role IS NOT NULL
GROUP BY se.id, se.teacher_id, se.email
ORDER BY se.teacher_id;

-- Check workload
SELECT 
  se.teacher_id,
  se.email,
  tw.total_periods_per_week,
  tw.max_consecutive_classes
FROM school_educators se
JOIN teacher_workload tw ON se.id = tw.educator_id
ORDER BY se.teacher_id;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Mock data inserted successfully!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Educators updated with roles and teacher_ids';
  RAISE NOTICE 'Timetable slots created';
  RAISE NOTICE 'Lesson plans created (draft, submitted, approved)';
  RAISE NOTICE 'Workload calculated';
  RAISE NOTICE 'Conflicts detected';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Next: Set user in localStorage and test!';
END $$;
