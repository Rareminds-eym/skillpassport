-- Fix student grade issue
-- This will update the grade field for college students

-- Option 1: If you're a college student, set grade to NULL or appropriate year
-- Replace YOUR_EMAIL_HERE with your actual email

UPDATE students
SET grade = NULL  -- or 'Year 1', 'Year 2', etc. depending on your year
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE')
  AND college_id IS NOT NULL;  -- Only update if it's a college student

-- Option 2: If you want to set it to a specific year/semester
-- UPDATE students
-- SET grade = 'Year 1'  -- or 'Semester 1', etc.
-- WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE');

-- Verify the update
SELECT 
    id,
    name,
    grade,
    year,
    semester,
    college_id,
    school_id
FROM students
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE');
