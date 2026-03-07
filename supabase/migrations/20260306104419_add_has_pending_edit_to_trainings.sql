-- Add has_pending_edit column to trainings table
ALTER TABLE trainings 
ADD COLUMN IF NOT EXISTS has_pending_edit BOOLEAN DEFAULT FALSE;

-- Add pending_edit_data and verified_data columns if they don't exist
ALTER TABLE trainings 
ADD COLUMN IF NOT EXISTS pending_edit_data JSONB,
ADD COLUMN IF NOT EXISTS verified_data JSONB;
