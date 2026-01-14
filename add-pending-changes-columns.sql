-- ============================================================================
-- ADD PENDING CHANGES COLUMNS TO college_curriculums
-- ============================================================================
-- Purpose: Add JSONB columns to track pending changes without creating new tables
-- Execution Time: ~5 seconds
-- ============================================================================

-- Add columns to track pending changes
ALTER TABLE college_curriculums 
ADD COLUMN IF NOT EXISTS pending_changes JSONB DEFAULT '[]'::jsonb;

ALTER TABLE college_curriculums 
ADD COLUMN IF NOT EXISTS change_history JSONB DEFAULT '[]'::jsonb;

ALTER TABLE college_curriculums 
ADD COLUMN IF NOT EXISTS has_pending_changes BOOLEAN DEFAULT FALSE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_curriculums_pending_changes 
ON college_curriculums(has_pending_changes) 
WHERE has_pending_changes = TRUE;

-- Add index for JSONB queries
CREATE INDEX IF NOT EXISTS idx_curriculums_pending_changes_jsonb 
ON college_curriculums USING GIN (pending_changes);

-- Add comments for documentation
COMMENT ON COLUMN college_curriculums.pending_changes IS 
'Array of pending change requests awaiting university approval. Each change includes type, data, requester info, and timestamp.';

COMMENT ON COLUMN college_curriculums.change_history IS 
'Array of approved/rejected changes for audit trail. Includes reviewer info, decision, and notes.';

COMMENT ON COLUMN college_curriculums.has_pending_changes IS 
'Quick boolean flag to check if curriculum has any pending changes. Used for filtering and performance.';

-- Verify columns were added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'college_curriculums' 
        AND column_name = 'pending_changes'
    ) THEN
        RAISE NOTICE '✅ pending_changes column added successfully';
    ELSE
        RAISE EXCEPTION '❌ Failed to add pending_changes column';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'college_curriculums' 
        AND column_name = 'change_history'
    ) THEN
        RAISE NOTICE '✅ change_history column added successfully';
    ELSE
        RAISE EXCEPTION '❌ Failed to add change_history column';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'college_curriculums' 
        AND column_name = 'has_pending_changes'
    ) THEN
        RAISE NOTICE '✅ has_pending_changes column added successfully';
    ELSE
        RAISE EXCEPTION '❌ Failed to add has_pending_changes column';
    END IF;
    
    RAISE NOTICE '🎉 All columns added successfully! Ready for functions.';
END $$;
