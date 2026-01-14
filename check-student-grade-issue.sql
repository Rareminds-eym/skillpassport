-- Check student data to see where grade "9" is coming from
-- Replace with your actual user_id

-- 1. Check students table for grade information
SELECT 
    id,
    name,
    grade,
    year,
    semester,
    school_roll_no,
    institute_roll_no,
    university_roll_no,
    school_id,
    college_id,
    school_class_id,
    branch_field,
    course_name,
    grade_start_date
FROM students
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE')
LIMIT 1;

-- 2. Check if there's a school_class linked
SELECT 
    s.id,
    s.name,
    s.grade as student_grade,
    sc.grade as class_grade,
    sc.academic_year
FROM students s
LEFT JOIN school_classes sc ON s.school_class_id = sc.id
WHERE s.user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE')
LIMIT 1;

-- 3. Check assessment results for grade_level
SELECT 
    id,
    student_id,
    grade_level,
    status,
    created_at
FROM personal_assessment_results
WHERE student_id = (
    SELECT id FROM students 
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE')
)
ORDER BY created_at DESC
LIMIT 1;

-- 4. Check assessment attempts for grade_level
SELECT 
    id,
    student_id,
    grade_level,
    status,
    created_at
FROM personal_assessment_attempts
WHERE student_id = (
    SELECT id FROM students 
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE')
)
ORDER BY created_at DESC
LIMIT 1;
