-- Verify and Fix Name Field in Students Profile
-- Run this in Supabase SQL Editor to check and fix name field issues

-- ==================== STEP 1: CHECK CURRENT STATE ====================

-- 1. Check if name field exists in profile JSONB
SELECT 
  email,
  profile->>'email' as profile_email,
  profile->>'name' as profile_name,
  CASE 
    WHEN profile->>'name' IS NULL OR profile->>'name' = '' THEN '❌ Empty or NULL'
    WHEN LENGTH(profile->>'name') > 100 THEN '⚠️ Too long (possibly corrupted)'
    ELSE '✅ Valid'
  END as name_status,
  LENGTH(profile->>'name') as name_length
FROM students
ORDER BY email
LIMIT 20;

-- 2. Find students with missing or corrupted names
SELECT 
  id,
  email,
  profile->>'email' as profile_email,
  profile->>'name' as current_name,
  profile->>'registration_number' as reg_number,
  profile->>'contact_number' as phone
FROM students
WHERE 
  profile->>'name' IS NULL 
  OR profile->>'name' = '' 
  OR LENGTH(profile->>'name') > 100;

-- ==================== STEP 2: VIEW FULL PROFILE STRUCTURE ====================

-- View a sample profile to understand the structure
SELECT 
  email,
  jsonb_pretty(profile) as formatted_profile
FROM students
WHERE profile->>'email' IS NOT NULL
LIMIT 1;

-- ==================== STEP 3: CHECK FOR NESTED NAME ====================

-- Check if name is stored in a nested structure
SELECT 
  email,
  profile->>'name' as root_name,
  profile->'profile'->>'name' as nested_name_1,
  profile->'profile'->'profile'->>'name' as nested_name_2,
  CASE
    WHEN profile->>'name' IS NOT NULL AND profile->>'name' != '' THEN 'Root level'
    WHEN profile->'profile'->>'name' IS NOT NULL THEN 'Nested level 1'
    WHEN profile->'profile'->'profile'->>'name' IS NOT NULL THEN 'Nested level 2'
    ELSE 'Not found'
  END as name_location
FROM students
ORDER BY email
LIMIT 20;

-- ==================== STEP 4: FIX CORRUPTED NAMES ====================

-- Option A: Extract name from contact info (if pattern exists)
-- This attempts to extract name from the beginning of corrupted data
UPDATE students
SET profile = jsonb_set(
  profile, 
  '{name}', 
  to_jsonb(SPLIT_PART(profile->>'name', 'CONTACT', 1))
)
WHERE 
  profile->>'name' LIKE '%CONTACT%' 
  OR LENGTH(profile->>'name') > 100;

-- Option B: Set to placeholder if name is corrupted
-- Run this if you want to reset corrupted names
/*
UPDATE students
SET profile = jsonb_set(
  profile, 
  '{name}', 
  '"Student"'::jsonb
)
WHERE 
  profile->>'name' IS NULL 
  OR profile->>'name' = '' 
  OR LENGTH(profile->>'name') > 100;
*/

-- ==================== STEP 5: VERIFY RECENT RESUME UPLOADS ====================

-- Check recently updated profiles (likely from resume uploads)
SELECT 
  email,
  profile->>'name' as name,
  profile->>'email' as profile_email,
  profile->>'university' as university,
  jsonb_array_length(COALESCE(profile->'education', '[]'::jsonb)) as education_count,
  jsonb_array_length(COALESCE(profile->'technicalSkills', '[]'::jsonb)) as skills_count,
  "updatedAt"
FROM students
WHERE "updatedAt" > NOW() - INTERVAL '1 day'
ORDER BY "updatedAt" DESC
LIMIT 10;

-- ==================== STEP 6: CHECK SPECIFIC USER ====================

-- Replace 'your-email@example.com' with the actual email
SELECT 
  id,
  email,
  jsonb_pretty(profile) as profile_data,
  "createdAt",
  "updatedAt"
FROM students
WHERE profile->>'email' = 'your-email@example.com'
  OR email = 'your-email@example.com';

-- ==================== STEP 7: MANUAL NAME UPDATE ====================

-- Use this to manually set a name for a specific user
-- Replace values with actual data
/*
UPDATE students
SET profile = jsonb_set(
  profile, 
  '{name}', 
  '"P. Durkadevi"'::jsonb
)
WHERE profile->>'email' = 'durkadevidurkadevi43@gmail.com'
  OR email = 'durkadevidurkadevi43@gmail.com';
*/

-- ==================== STEP 8: VERIFY UPDATE ====================

-- After running update, verify it worked
SELECT 
  email,
  profile->>'name' as name,
  profile->>'email' as profile_email,
  "updatedAt"
FROM students
WHERE profile->>'email' = 'durkadevidurkadevi43@gmail.com'
  OR email = 'durkadevidurkadevi43@gmail.com';

-- ==================== STEP 9: STATISTICS ====================

-- Get statistics about name field quality
SELECT 
  COUNT(*) as total_students,
  COUNT(CASE WHEN profile->>'name' IS NOT NULL AND profile->>'name' != '' THEN 1 END) as with_name,
  COUNT(CASE WHEN profile->>'name' IS NULL OR profile->>'name' = '' THEN 1 END) as without_name,
  COUNT(CASE WHEN LENGTH(profile->>'name') > 100 THEN 1 END) as corrupted_name,
  ROUND(AVG(LENGTH(profile->>'name'::text)), 2) as avg_name_length
FROM students;

-- ==================== STEP 10: FIND DUPLICATE NAMES ====================

-- Check if multiple students have the same name (possible data issue)
SELECT 
  profile->>'name' as name,
  COUNT(*) as count,
  array_agg(email) as emails
FROM students
WHERE profile->>'name' IS NOT NULL
GROUP BY profile->>'name'
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- ==================== TROUBLESHOOTING ====================

-- If name still doesn't update after resume upload, check:

-- 1. Row Level Security policies
SELECT * FROM pg_policies WHERE tablename = 'students';

-- 2. Triggers on students table
SELECT 
  trigger_name, 
  event_manipulation, 
  action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'students';

-- 3. Check if user has permission to update
-- Run this as the authenticated user
/*
SELECT 
  auth.uid() as current_user_id,
  user_id,
  email
FROM students
WHERE user_id = auth.uid();
*/

-- ==================== EXPECTED OUTPUT ====================

-- After successful update, you should see:
-- ✅ profile->>'name' = "P. Durkadevi" (or actual student name)
-- ✅ name_length between 5 and 50 characters
-- ✅ name_status = "Valid"
-- ✅ updatedAt = recent timestamp
