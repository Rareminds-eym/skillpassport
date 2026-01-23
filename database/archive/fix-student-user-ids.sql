-- Fix missing user_id in students table
-- This links students to their auth users so settings can be saved

-- Step 1: Check how many students are missing user_id
SELECT 
  COUNT(*) as total_students,
  COUNT(user_id) as students_with_user_id,
  COUNT(*) - COUNT(user_id) as students_missing_user_id
FROM students;

-- Step 2: Try to link students to auth users by email
UPDATE students s
SET user_id = u.id
FROM auth.users u
WHERE s.email = u.email
AND s.user_id IS NULL;

-- Step 3: Verify the fix
SELECT 
  COUNT(*) as total_students,
  COUNT(user_id) as students_with_user_id,
  COUNT(*) - COUNT(user_id) as students_missing_user_id
FROM students;

-- Step 4: Show students that still don't have user_id
SELECT id, email, name, user_id
FROM students
WHERE user_id IS NULL
LIMIT 10;

-- Step 5: Create user_settings records for students who don't have them yet
INSERT INTO user_settings (user_id, notification_preferences, privacy_settings)
SELECT 
  s.user_id,
  '{
    "emailNotifications": true,
    "pushNotifications": true,
    "applicationUpdates": true,
    "newOpportunities": true,
    "recruitingMessages": true,
    "weeklyDigest": false,
    "monthlyReport": false
  }'::jsonb,
  '{
    "profileVisibility": "public",
    "showEmail": false,
    "showPhone": false,
    "showLocation": true,
    "allowRecruiterContact": true,
    "showInTalentPool": true
  }'::jsonb
FROM students s
WHERE s.user_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM user_settings us WHERE us.user_id = s.user_id
);

-- Step 6: Verify user_settings were created
SELECT 
  COUNT(*) as total_user_settings,
  COUNT(DISTINCT user_id) as unique_users
FROM user_settings;

-- Step 7: Check your specific settings (replace with your email)
SELECT 
  s.email,
  s.name,
  s.user_id,
  us.notification_preferences,
  us.privacy_settings,
  us.created_at,
  us.updated_at
FROM students s
LEFT JOIN user_settings us ON us.user_id = s.user_id
WHERE s.email = 'your-email@example.com'; -- Replace with your actual email
