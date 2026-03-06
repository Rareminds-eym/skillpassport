-- Add enabled column to trainings table
ALTER TABLE trainings ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT true;

-- Set enabled to true for existing records
UPDATE trainings SET enabled = true WHERE enabled IS NULL;
