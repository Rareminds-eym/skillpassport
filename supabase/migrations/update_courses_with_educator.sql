-- =====================================================
-- UPDATE EXISTING COURSES WITH EDUCATOR INFORMATION
-- =====================================================

-- First, let's check if Karthik's user exists and get the UUID
-- You can run this query to find the user_id:
-- SELECT id, email FROM auth.users WHERE email = 'karthikeyan@rareminds.in';

-- Update all existing courses to have Karthik as the educator
-- Replace 'USER_UUID_HERE' with Karthik's actual UUID from auth.users

-- Option 1: If you know the user_id already (e.g., 'ef67521d-595b-4542-93a4-41b4018f4fae')
UPDATE courses
SET
    educator_id = 'ef67521d-595b-4542-93a4-41b4018f4fae',  -- Replace with actual UUID
    educator_name = 'Karthik'
WHERE educator_id IS NULL;

-- Option 2: Or update using email lookup (if the user exists in auth.users)
-- UPDATE courses
-- SET
--     educator_id = (SELECT id FROM auth.users WHERE email = 'karthikeyan@rareminds.in' LIMIT 1),
--     educator_name = 'Karthik'
-- WHERE educator_id IS NULL;

-- Verify the update
SELECT course_id, title, educator_id, educator_name, created_at
FROM courses
ORDER BY created_at DESC;
