-- Add enabled column to experience table
-- This allows users to hide/show experience items on their profile

ALTER TABLE experience 
ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

-- Add approval_status column if it doesn't exist
ALTER TABLE experience 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';

-- Add comments to explain the columns
COMMENT ON COLUMN experience.enabled IS 'Controls visibility of experience item on profile (true = visible, false = hidden)';
COMMENT ON COLUMN experience.approval_status IS 'Approval status of experience (pending, approved, verified, rejected)';

-- Update existing records to be enabled by default
UPDATE experience 
SET enabled = true 
WHERE enabled IS NULL;

-- Update existing records to have approved status by default (for backward compatibility)
UPDATE experience 
SET approval_status = 'approved' 
WHERE approval_status IS NULL;
