-- Add notification_settings column to students table
-- This will store student notification preferences

-- Add the column with default values
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "emailNotifications": true,
  "applicationUpdates": true,
  "newOpportunities": true,
  "recruitingMessages": true,
  "weeklyDigest": false,
  "monthlyReport": false
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN students.notification_settings IS 'Student notification preferences stored as JSONB';

-- Create index for faster queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_students_notification_settings 
ON students USING GIN (notification_settings);

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'students' 
AND column_name = 'notification_settings';

-- Sample query to check existing data
SELECT id, email, name, notification_settings
FROM students
LIMIT 5;
