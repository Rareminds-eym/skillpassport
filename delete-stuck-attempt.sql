-- Delete the stuck assessment attempt
DELETE FROM external_assessment_attempts 
WHERE id = '95da7627-b83b-45c9-8970-e748e4dcf0cc';

-- Verify it's deleted
SELECT COUNT(*) as remaining_attempts
FROM external_assessment_attempts
WHERE student_id = 'c5d30a55-8d9a-46e6-b8d0-6accc0415c1c'
  AND course_name = 'Delivering Constructive Criticism';
