-- Migration: Add pending edit fields for versioning system
-- This allows keeping verified data visible while edits are pending approval

-- Add pending_edit_data column to store the edited version
-- Add has_pending_edit flag to quickly check if there's a pending edit
-- Add verified_data column to store the last verified version

-- Certificates table
ALTER TABLE certificates 
ADD COLUMN IF NOT EXISTS pending_edit_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS has_pending_edit BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_data JSONB DEFAULT NULL;

-- Projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS pending_edit_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS has_pending_edit BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_data JSONB DEFAULT NULL;

-- Experience table
ALTER TABLE experience 
ADD COLUMN IF NOT EXISTS pending_edit_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS has_pending_edit BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_data JSONB DEFAULT NULL;

-- Education table
ALTER TABLE education 
ADD COLUMN IF NOT EXISTS pending_edit_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS has_pending_edit BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_data JSONB DEFAULT NULL;

-- Skills table
ALTER TABLE skills 
ADD COLUMN IF NOT EXISTS pending_edit_data JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS has_pending_edit BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_data JSONB DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN certificates.pending_edit_data IS 'Stores the edited version of data awaiting verification';
COMMENT ON COLUMN certificates.has_pending_edit IS 'Flag to indicate if there is a pending edit for this record';
COMMENT ON COLUMN certificates.verified_data IS 'Stores the last verified version of the data';

COMMENT ON COLUMN projects.pending_edit_data IS 'Stores the edited version of data awaiting verification';
COMMENT ON COLUMN projects.has_pending_edit IS 'Flag to indicate if there is a pending edit for this record';
COMMENT ON COLUMN projects.verified_data IS 'Stores the last verified version of the data';

COMMENT ON COLUMN experience.pending_edit_data IS 'Stores the edited version of data awaiting verification';
COMMENT ON COLUMN experience.has_pending_edit IS 'Flag to indicate if there is a pending edit for this record';
COMMENT ON COLUMN experience.verified_data IS 'Stores the last verified version of the data';

COMMENT ON COLUMN education.pending_edit_data IS 'Stores the edited version of data awaiting verification';
COMMENT ON COLUMN education.has_pending_edit IS 'Flag to indicate if there is a pending edit for this record';
COMMENT ON COLUMN education.verified_data IS 'Stores the last verified version of the data';

COMMENT ON COLUMN skills.pending_edit_data IS 'Stores the edited version of data awaiting verification';
COMMENT ON COLUMN skills.has_pending_edit IS 'Flag to indicate if there is a pending edit for this record';
COMMENT ON COLUMN skills.verified_data IS 'Stores the last verified version of the data';
