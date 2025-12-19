-- Check if user_settings table exists and has data
-- Run this in Supabase SQL Editor

-- 1. Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'user_settings'
);

-- 2. Check table structure
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'user_settings'
ORDER BY ordinal_position;

-- 3. Check if there are any records
SELECT COUNT(*) as total_records
FROM user_settings;

-- 4. Check your specific user's settings (replace with your email)
SELECT 
  us.id,
  us.user_id,
  us.notification_preferences,
  us.privacy_settings,
  us.created_at,
  us.updated_at,
  s.email,
  s.name
FROM user_settings us
JOIN students s ON s.user_id = us.user_id
WHERE s.email = 'your-email@example.com'; -- Replace with your actual email

-- 5. Check all user_settings (limit 10)
SELECT 
  us.id,
  us.user_id,
  us.notification_preferences,
  us.privacy_settings,
  us.created_at,
  us.updated_at
FROM user_settings us
LIMIT 10;

-- 6. Check if students have user_id
SELECT 
  id,
  email,
  name,
  user_id,
  CASE 
    WHEN user_id IS NULL THEN '❌ Missing user_id'
    ELSE '✅ Has user_id'
  END as status
FROM students
LIMIT 10;
