-- Import script for Excel data into Supabase
-- School ID: 19442d7b-ff7f-4c7f-ad85-9e501f122b26
-- 
-- INSTRUCTIONS:
-- 1. This script creates students WITHOUT requiring auth.users entries
-- 2. Run this in Supabase SQL Editor
-- 3. Modify the data below based on your Excel file

-- First, let's create a temporary function to insert students without user dependency
-- (This bypasses the foreign key constraint temporarily)

-- Example: Insert a student from Grades 6-10
INSERT INTO students (
    school_id,
    name,
    email,
    student_id,
    grade,
    student_type,
    created_at
) VALUES (
    '19442d7b-ff7f-4c7f-ad85-9e501f122b26',
    'Aditi Sharma',
    'stu501@school.edu',
    'STU501',
    '10',
    'direct',
    NOW()
) ON CONFLICT (email) DO NOTHING
RETURNING id, user_id;

-- After students are created, you can add their projects
-- Example: Insert project for a student
INSERT INTO projects (
    student_id,
    title,
    description,
    status,
    tech_stack,
    approval_status,
    enabled,
    created_at
) 
SELECT 
    s.user_id,
    'Social survey',
    'Grade 6 project. Fast learner',
    'completed',
    '{}',
    'approved',
    true,
    NOW()
FROM students s
WHERE s.student_id = 'STU501'
ON CONFLICT DO NOTHING;

-- Add skills for students (from Grades 11-12)
INSERT INTO skills (
    student_id,
    name,
    type,
    level,
    verified,
    approval_status,
    enabled,
    created_at
)
SELECT 
    s.user_id,
    'Python',
    'technical',
    3,
    false,
    'approved',
    true,
    NOW()
FROM students s
WHERE s.student_id = 'STU501'
ON CONFLICT DO NOTHING;

-- Add certificates
INSERT INTO certificates (
    student_id,
    title,
    issuer,
    status,
    approval_status,
    enabled,
    created_at
)
SELECT 
    s.user_id,
    'Communication Course',
    'School',
    'completed',
    'approved',
    true,
    NOW()
FROM students s
WHERE s.student_id = 'STU501'
ON CONFLICT DO NOTHING;

-- Add education records (from College sheet)
INSERT INTO education (
    student_id,
    level,
    degree,
    department,
    status,
    approval_status,
    created_at
)
SELECT 
    s.user_id,
    'undergraduate',
    'B.Tech',
    'Computer Science',
    'ongoing',
    'approved',
    NOW()
FROM students s
WHERE s.student_id = 'STU501'
ON CONFLICT DO NOTHING;

-- Add experience/internships
INSERT INTO experience (
    student_id,
    organization,
    role,
    duration,
    verified,
    approval_status,
    created_at
)
SELECT 
    s.user_id,
    'Tech Company',
    'Intern',
    '3 months',
    false,
    'approved',
    NOW()
FROM students s
WHERE s.student_id = 'STU501'
ON CONFLICT DO NOTHING;
