-- Check if the students.profile JSONB has org_name in experience array
SELECT 
  id,
  email,
  profile->'experience' as experience_in_profile
FROM students
WHERE id = '3531e63e-589e-46e7-9248-4a769e84b00d';

-- Check if any experience object in the profile JSONB array has org_name
SELECT 
  id,
  email,
  jsonb_array_elements(profile->'experience') as experience_item
FROM students
WHERE id = '3531e63e-589e-46e7-9248-4a769e84b00d'
  AND profile->'experience' IS NOT NULL;

-- Clean org_name from profile JSONB experience array
-- This is more complex because it's an array of objects
UPDATE students
SET profile = jsonb_set(
  profile,
  '{experience}',
  (
    SELECT jsonb_agg(
      elem - 'org_name'
    )
    FROM jsonb_array_elements(profile->'experience') elem
  )
)
WHERE id = '3531e63e-589e-46e7-9248-4a769e84b00d'
  AND profile->'experience' IS NOT NULL;
