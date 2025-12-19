-- Add privacy_settings column to students table
-- This will store student privacy preferences

-- Add the column with default values
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS privacy_settings JSONB DEFAULT '{
  "profileVisibility": "public",
  "showEmail": false,
  "showPhone": false,
  "showLocation": true,
  "allowRecruiterContact": true,
  "showInTalentPool": true
}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN students.privacy_settings IS 'Student privacy preferences stored as JSONB';

-- Create index for faster queries (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_students_privacy_settings 
ON students USING GIN (privacy_settings);

-- Verify the column was added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'students' 
AND column_name = 'privacy_settings';

-- Sample query to check existing data
SELECT id, email, name, privacy_settings
FROM students
LIMIT 5;
