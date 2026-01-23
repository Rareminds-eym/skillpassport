-- Add notification_settings and privacy_settings columns to students table

-- 1. Add notification_settings column
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "emailNotifications": true,
  "pushNotifications": true,
  "applicationUpdates": true,
  "newOpportunities": true,
  "recruitingMessages": true,
  "weeklyDigest": false,
  "monthlyReport": false
}'::jsonb;

-- 2. Add privacy_settings column
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "profileVisibility": "public",
  "showEmail": false,
  "showPhone": false,
  "showLocation": true,
  "allowRecruiterContact": true,
  "showInTalentPool": true
}'::jsonb;

-- 3. Add comments
COMMENT ON COLUMN students.notification_settings IS 'Student notification preferences';
COMMENT ON COLUMN students.privacy_settings IS 'Student privacy preferences';

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_students_notification_settings 
ON students USING GIN (notification_settings);

CREATE INDEX IF NOT EXISTS idx_students_privacy_settings 
ON students USING GIN (privacy_settings);

-- 5. Verify columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'students' 
AND column_name IN ('notification_settings', 'privacy_settings');

-- 6. Check data
SELECT id, email, name, notification_settings, privacy_settings
FROM students
LIMIT 5;
