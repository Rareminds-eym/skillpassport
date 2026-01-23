-- Quick fix for settings not persisting

-- 1. Check if students have user_id
SELECT 
  email,
  name,
  user_id,
  CASE 
    WHEN user_id IS NULL THEN '❌ Missing user_id'
    ELSE '✅ Has user_id'
  END as status
FROM students
LIMIT 10;

-- 2. Link students to auth users (if user_id is missing)
UPDATE students s
SET user_id = u.id
FROM auth.users u
WHERE s.email = u.email
AND s.user_id IS NULL;

-- 3. Create user_settings for students who don't have them
INSERT INTO user_settings (user_id, notification_preferences, privacy_settings)
SELECT 
  s.user_id,
  '{"emailNotifications": true, "applicationUpdates": true, "newOpportunities": true, "recruitingMessages": true}'::jsonb,
  '{"profileVisibility": "public", "showEmail": false, "showPhone": false, "showLocation": true, "allowRecruiterContact": true, "showInTalentPool": true}'::jsonb
FROM students s
WHERE s.user_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM user_settings us WHERE us.user_id = s.user_id
)
ON CONFLICT (user_id) DO NOTHING;

-- 4. Verify everything is set up
SELECT 
  s.email,
  s.name,
  s.user_id,
  CASE 
    WHEN us.id IS NULL THEN '❌ No settings record'
    ELSE '✅ Has settings'
  END as settings_status,
  us.notification_preferences,
  us.privacy_settings
FROM students s
LEFT JOIN user_settings us ON us.user_id = s.user_id
LIMIT 10;
