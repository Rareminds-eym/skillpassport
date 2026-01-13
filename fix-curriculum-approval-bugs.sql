-- ============================================================================
-- CURRICULUM APPROVAL WORKFLOW - BUG FIXES
-- ============================================================================
-- Purpose: Fix duplicate triggers and add missing indexes
-- Issues Fixed:
--   1. Remove duplicate triggers on university_colleges table
--   2. Add missing index on college_id for affiliation queries
-- ============================================================================

-- ============================================================================
-- BUG FIX 1: REMOVE DUPLICATE TRIGGERS
-- ============================================================================

-- Remove any duplicate triggers that might exist
DROP TRIGGER IF EXISTS update_univ_colleges_updated_at ON university_colleges;
DROP TRIGGER IF EXISTS update_university_colleges_updated_at ON university_colleges;

-- Keep only one properly named trigger (if needed for updated_at functionality)
-- Note: Only create if the table has an updated_at column
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'university_colleges' 
        AND column_name = 'updated_at'
    ) THEN
        -- Create the trigger function if it doesn't exist
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $trigger$ LANGUAGE plpgsql;
        
        -- Create the single trigger
        CREATE TRIGGER update_university_colleges_updated_at
            BEFORE UPDATE ON university_colleges
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
            
        RAISE NOTICE '✅ Created single updated_at trigger for university_colleges table';
    ELSE
        RAISE NOTICE 'ℹ️  No updated_at column found in university_colleges table - skipping trigger creation';
    END IF;
END $$;

-- ============================================================================
-- BUG FIX 2: ADD MISSING INDEX ON COLLEGE_ID
-- ============================================================================

-- Critical index for university_colleges table - frequently queried for affiliation checks
-- Query: "Which university is this college affiliated to?"
CREATE INDEX IF NOT EXISTS idx_univ_colleges_college ON university_colleges(college_id);

-- Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_university_colleges_college_university ON university_colleges(college_id, university_id);
CREATE INDEX IF NOT EXISTS idx_university_colleges_status ON university_colleges(account_status);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the fixes
DO $$
DECLARE
    trigger_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Check for duplicate triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers 
    WHERE event_object_table = 'university_colleges' 
    AND trigger_name LIKE '%updated_at%';
    
    IF trigger_count <= 1 THEN
        RAISE NOTICE '✅ Duplicate trigger issue fixed - found % trigger(s)', trigger_count;
    ELSE
        RAISE WARNING '⚠️  Still have % triggers on university_colleges table', trigger_count;
    END IF;
    
    -- Check for college_id index
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes 
    WHERE tablename = 'university_colleges' 
    AND indexname = 'idx_univ_colleges_college';
    
    IF index_count > 0 THEN
        RAISE NOTICE '✅ Missing college_id index added successfully';
    ELSE
        RAISE WARNING '⚠️  college_id index not found';
    END IF;
    
    RAISE NOTICE '🎉 Bug fixes applied successfully!';
END $$;