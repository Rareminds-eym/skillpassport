-- Check if the user exists in college_lecturers table
SELECT id, "collegeId", user_id, email, first_name, last_name
FROM college_lecturers
WHERE user_id = '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79'
   OR email = 'susmitha@gmail.com';
