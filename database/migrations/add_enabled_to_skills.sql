-- Add enabled column to skills table
-- This allows users to hide/show skill items on their profile

ALTER TABLE skills 
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

-- Add comment to explain the column
COMMENT ON COLUMN skills.enabled IS 'Controls visibility of skill item on profile. Default is true (visible).';

-- Update existing records to have enabled = true
UPDATE skills 
SET enabled = true 
WHERE enabled IS NULL;
