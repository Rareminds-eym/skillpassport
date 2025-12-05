-- Query 1: Get all Aditya College students (basic info)
SELECT 
    student_id, 
    name, 
    email, 
    student_type,
    course_name,
    branch_field
FROM students 
WHERE college_id = 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
ORDER BY student_id;

-- Query 2: Count total Aditya College students
SELECT COUNT(*) as total_students
FROM students 
WHERE college_id = 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d';

-- Query 3: Group by course/stream
SELECT 
    branch_field,
    course_name,
    COUNT(*) as student_count
FROM students 
WHERE college_id = 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
GROUP BY branch_field, course_name
ORDER BY branch_field, course_name;

-- Query 4: Get detailed info with profile data
SELECT 
    student_id, 
    name, 
    email,
    course_name,
    branch_field,
    profile
FROM students 
WHERE college_id = 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
ORDER BY student_id;

-- Query 5: Check specific student (example: CSTU501)
SELECT * 
FROM students 
WHERE student_id = 'CSTU501';

-- Query 6: Get students with their auth user info
SELECT 
    s.student_id,
    s.name,
    s.email,
    s.course_name,
    s.branch_field,
    u.firstName,
    u.lastName,
    u.role
FROM students s
LEFT JOIN users u ON s.user_id = u.id
WHERE s.college_id = 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
ORDER BY s.student_id;

-- Query 7: Search by name
SELECT 
    student_id, 
    name, 
    email, 
    course_name
FROM students 
WHERE college_id = 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
AND name ILIKE '%Aditi%'  -- Replace 'Aditi' with any name
ORDER BY name;

-- Query 8: Get students by specific course
SELECT 
    student_id, 
    name, 
    email
FROM students 
WHERE college_id = 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
AND course_name = 'BCA'  -- Change to: B.Com, BBA, B.Tech CSE, etc.
ORDER BY name;
