-- ==========================================
-- RESUME PARSER JSONB VERIFICATION SCRIPT
-- ==========================================
-- Run this in Supabase SQL Editor to verify resume data storage

-- 1. Check if students table has JSONB profile column
-- ================================================
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'students'
  AND column_name = 'profile';

-- Expected output: profile | jsonb | YES


-- 2. View all students with resume data
-- ======================================
SELECT 
  id,
  email,
  profile->>'name' as name,
  profile->>'resumeImportedAt' as resume_imported,
  profile IS NOT NULL as has_profile,
  jsonb_typeof(profile) as profile_type
FROM students
ORDER BY "createdAt" DESC
LIMIT 10;


-- 3. Check resume data structure for a specific student
-- ======================================================
-- Replace 'your-email@example.com' with actual email
SELECT 
  email,
  profile->>'name' as name,
  profile->>'email' as profile_email,
  profile->>'contact_number' as phone,
  profile->>'university' as university,
  profile->>'branch_field' as branch,
  profile->>'resumeImportedAt' as imported_at
FROM students
WHERE email = 'your-email@example.com';


-- 4. Check array fields in profile JSONB
-- =======================================
SELECT 
  email,
  profile->>'name' as name,
  jsonb_array_length(COALESCE(profile->'education', '[]'::jsonb)) as education_count,
  jsonb_array_length(COALESCE(profile->'training', '[]'::jsonb)) as training_count,
  jsonb_array_length(COALESCE(profile->'experience', '[]'::jsonb)) as experience_count,
  jsonb_array_length(COALESCE(profile->'technicalSkills', '[]'::jsonb)) as tech_skills_count,
  jsonb_array_length(COALESCE(profile->'softSkills', '[]'::jsonb)) as soft_skills_count,
  jsonb_array_length(COALESCE(profile->'certificates', '[]'::jsonb)) as certificates_count
FROM students
WHERE profile IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 10;


-- 5. View full profile JSONB (formatted)
-- =======================================
SELECT 
  email,
  jsonb_pretty(profile) as profile_data
FROM students
WHERE email = 'your-email@example.com';


-- 6. Extract education array details
-- ===================================
SELECT 
  s.email,
  s.profile->>'name' as student_name,
  e.value->>'degree' as degree,
  e.value->>'university' as university,
  e.value->>'department' as department,
  e.value->>'yearOfPassing' as year,
  e.value->>'cgpa' as cgpa
FROM students s
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(s.profile->'education', '[]'::jsonb)) as e(value)
WHERE s.email = 'your-email@example.com';


-- 7. Extract experience array details
-- ====================================
SELECT 
  s.email,
  s.profile->>'name' as student_name,
  exp.value->>'role' as role,
  exp.value->>'organization' as organization,
  exp.value->>'duration' as duration,
  exp.value->>'verified' as verified
FROM students s
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(s.profile->'experience', '[]'::jsonb)) as exp(value)
WHERE s.email = 'your-email@example.com';


-- 8. Extract technical skills array details
-- ==========================================
SELECT 
  s.email,
  s.profile->>'name' as student_name,
  skill.value->>'name' as skill_name,
  skill.value->>'category' as category,
  skill.value->>'level' as level,
  skill.value->>'verified' as verified
FROM students s
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(s.profile->'technicalSkills', '[]'::jsonb)) as skill(value)
WHERE s.email = 'your-email@example.com';


-- 9. Extract certificates array details
-- ======================================
SELECT 
  s.email,
  s.profile->>'name' as student_name,
  cert.value->>'title' as certificate_title,
  cert.value->>'issuer' as issuer,
  cert.value->>'issuedOn' as issued_date,
  cert.value->>'credentialId' as credential_id,
  cert.value->>'link' as certificate_link
FROM students s
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(s.profile->'certificates', '[]'::jsonb)) as cert(value)
WHERE s.email = 'your-email@example.com';


-- 10. Search for students by skill in JSONB
-- ==========================================
SELECT 
  email,
  profile->>'name' as name,
  skill.value->>'name' as skill_name,
  skill.value->>'level' as skill_level
FROM students s
CROSS JOIN LATERAL jsonb_array_elements(s.profile->'technicalSkills') as skill(value)
WHERE skill.value->>'name' ILIKE '%javascript%'
ORDER BY (skill.value->>'level')::int DESC;


-- 11. Verify JSONB indexes (for performance)
-- ===========================================
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'students'
  AND (indexdef LIKE '%gin%' OR indexdef LIKE '%jsonb%');

-- Expected: idx_students_profile_gin using gin(profile)


-- 12. Test JSONB query performance
-- =================================
EXPLAIN ANALYZE
SELECT email, profile->>'name' as name
FROM students
WHERE profile->>'university' = 'XYZ University';


-- 13. Count students with resume data
-- ====================================
SELECT 
  COUNT(*) as total_students,
  COUNT(CASE WHEN profile->>'resumeImportedAt' IS NOT NULL THEN 1 END) as with_resume,
  COUNT(CASE WHEN jsonb_array_length(COALESCE(profile->'education', '[]'::jsonb)) > 0 THEN 1 END) as with_education,
  COUNT(CASE WHEN jsonb_array_length(COALESCE(profile->'experience', '[]'::jsonb)) > 0 THEN 1 END) as with_experience,
  COUNT(CASE WHEN jsonb_array_length(COALESCE(profile->'technicalSkills', '[]'::jsonb)) > 0 THEN 1 END) as with_skills
FROM students;


-- 14. Validate JSONB structure
-- =============================
SELECT 
  email,
  profile->>'name' as name,
  CASE 
    WHEN jsonb_typeof(profile->'education') = 'array' THEN '✓'
    ELSE '✗ Invalid'
  END as education_valid,
  CASE 
    WHEN jsonb_typeof(profile->'experience') = 'array' THEN '✓'
    ELSE '✗ Invalid'
  END as experience_valid,
  CASE 
    WHEN jsonb_typeof(profile->'technicalSkills') = 'array' THEN '✓'
    ELSE '✗ Invalid'
  END as skills_valid,
  CASE 
    WHEN jsonb_typeof(profile->'certificates') = 'array' THEN '✓'
    ELSE '✗ Invalid'
  END as certificates_valid
FROM students
WHERE profile IS NOT NULL
LIMIT 10;


-- 15. Find missing required fields in profile
-- ============================================
SELECT 
  email,
  profile->>'name' as name,
  CASE WHEN profile ? 'name' THEN '✓' ELSE '✗ Missing' END as has_name,
  CASE WHEN profile ? 'email' THEN '✓' ELSE '✗ Missing' END as has_email,
  CASE WHEN profile ? 'education' THEN '✓' ELSE '✗ Missing' END as has_education,
  CASE WHEN profile ? 'experience' THEN '✓' ELSE '✗ Missing' END as has_experience,
  CASE WHEN profile ? 'technicalSkills' THEN '✓' ELSE '✗ Missing' END as has_skills
FROM students
WHERE profile IS NOT NULL
LIMIT 10;


-- 16. Test data cleanup (if needed)
-- ==================================
-- Uncomment to reset a student's profile for testing
/*
UPDATE students
SET profile = jsonb_build_object(
  'name', profile->>'name',
  'email', profile->>'email',
  'education', '[]'::jsonb,
  'training', '[]'::jsonb,
  'experience', '[]'::jsonb,
  'technicalSkills', '[]'::jsonb,
  'softSkills', '[]'::jsonb,
  'certificates', '[]'::jsonb
)
WHERE email = 'your-email@example.com';
*/


-- 17. Export profile data as JSON file
-- =====================================
-- Copy result and save as .json file for inspection
SELECT jsonb_build_object(
  'email', email,
  'profile', profile
) as student_data
FROM students
WHERE email = 'your-email@example.com';


-- 18. Check for duplicate entries in arrays
-- ==========================================
WITH skill_counts AS (
  SELECT 
    email,
    skill.value->>'name' as skill_name,
    COUNT(*) as count
  FROM students s
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(s.profile->'technicalSkills', '[]'::jsonb)) as skill(value)
  WHERE s.email = 'your-email@example.com'
  GROUP BY email, skill.value->>'name'
  HAVING COUNT(*) > 1
)
SELECT * FROM skill_counts;


-- 19. Verify data types in JSONB
-- ===============================
SELECT 
  email,
  profile->>'name' as name,
  jsonb_typeof(profile->'education') as education_type,
  jsonb_typeof(profile->'experience') as experience_type,
  jsonb_typeof(profile->'technicalSkills') as skills_type,
  jsonb_typeof(profile->>'name') as name_type,
  jsonb_typeof(profile->>'contact_number') as phone_type
FROM students
WHERE email = 'your-email@example.com';


-- 20. Summary report for all students
-- ====================================
SELECT 
  'Total Students' as metric,
  COUNT(*)::text as value
FROM students
UNION ALL
SELECT 
  'With Resume Data',
  COUNT(CASE WHEN profile->>'resumeImportedAt' IS NOT NULL THEN 1 END)::text
FROM students
UNION ALL
SELECT 
  'Avg Education Entries',
  ROUND(AVG(jsonb_array_length(COALESCE(profile->'education', '[]'::jsonb))), 2)::text
FROM students
UNION ALL
SELECT 
  'Avg Experience Entries',
  ROUND(AVG(jsonb_array_length(COALESCE(profile->'experience', '[]'::jsonb))), 2)::text
FROM students
UNION ALL
SELECT 
  'Avg Technical Skills',
  ROUND(AVG(jsonb_array_length(COALESCE(profile->'technicalSkills', '[]'::jsonb))), 2)::text
FROM students;


-- ==========================================
-- NOTES:
-- 1. Replace 'your-email@example.com' with actual student email
-- 2. All queries are read-only except #16 (commented out)
-- 3. Use these queries to verify resume parsing results
-- 4. Check for proper JSONB structure and data types
-- ==========================================
