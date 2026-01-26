-- ==================================================================================
-- MIGRATION: Add Missing Student Profile Fields
-- ==================================================================================
-- Adds Gap in Studies, Gap Years, Gap Reason, Work Experience, Aadhar Number, 
-- Backlogs History, Current Backlogs fields to students table
-- ==================================================================================

-- STEP 1: Add new columns to students table
-- ==================================================================================
ALTER TABLE students
ADD COLUMN IF NOT EXISTS gap_in_studies BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS gap_years INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS gap_reason TEXT,
ADD COLUMN IF NOT EXISTS work_experience TEXT,
ADD COLUMN IF NOT EXISTS aadhar_number VARCHAR(12),
ADD COLUMN IF NOT EXISTS backlogs_history TEXT,
ADD COLUMN IF NOT EXISTS current_backlogs INTEGER DEFAULT 0;

-- STEP 2: Add comments for documentation
-- ==================================================================================
COMMENT ON COLUMN students.gap_in_studies IS 'Whether student has gap years in education';
COMMENT ON COLUMN students.gap_years IS 'Number of gap years in education';
COMMENT ON COLUMN students.gap_reason IS 'Reason for gap in studies';
COMMENT ON COLUMN students.work_experience IS 'Work experience details during gap or alongside studies';
COMMENT ON COLUMN students.aadhar_number IS 'Aadhar card number (12 digits)';
COMMENT ON COLUMN students.backlogs_history IS 'History of academic backlogs/failures';
COMMENT ON COLUMN students.current_backlogs IS 'Number of current pending backlogs';

-- STEP 3: Add indexes for frequently queried fields
-- ==================================================================================
CREATE INDEX IF NOT EXISTS idx_students_gap_in_studies ON students(gap_in_studies);
CREATE INDEX IF NOT EXISTS idx_students_current_backlogs ON students(current_backlogs);
CREATE INDEX IF NOT EXISTS idx_students_aadhar_number ON students(aadhar_number) WHERE aadhar_number IS NOT NULL;

-- STEP 4: Add constraints for data validation
-- ==================================================================================
-- Aadhar number should be exactly 12 digits if provided
ALTER TABLE students 
ADD CONSTRAINT chk_aadhar_format 
CHECK (aadhar_number IS NULL OR (aadhar_number ~ '^[0-9]{12}$'));

-- Gap years should be non-negative
ALTER TABLE students 
ADD CONSTRAINT chk_gap_years_positive 
CHECK (gap_years >= 0);

-- Current backlogs should be non-negative
ALTER TABLE students 
ADD CONSTRAINT chk_current_backlogs_positive 
CHECK (current_backlogs >= 0);

-- If gap_in_studies is true, gap_years should be > 0
ALTER TABLE students 
ADD CONSTRAINT chk_gap_consistency 
CHECK (NOT gap_in_studies OR gap_years > 0);

-- STEP 5: Update RLS policies to include new fields
-- ==================================================================================
-- The existing RLS policies should automatically cover these new columns
-- since they use SELECT * and UPDATE * patterns

-- STEP 6: Create function to validate Aadhar number (optional)
-- ==================================================================================
CREATE OR REPLACE FUNCTION validate_aadhar_number(aadhar_num TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if it's exactly 12 digits
  IF aadhar_num IS NULL OR LENGTH(aadhar_num) != 12 THEN
    RETURN FALSE;
  END IF;
  
  -- Check if all characters are digits
  IF aadhar_num !~ '^[0-9]{12}$' THEN
    RETURN FALSE;
  END IF;
  
  -- Basic Aadhar validation: first digit cannot be 0 or 1
  IF SUBSTRING(aadhar_num, 1, 1) IN ('0', '1') THEN
    RETURN FALSE;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- STEP 7: Add trigger to validate Aadhar on insert/update (optional)
-- ==================================================================================
CREATE OR REPLACE FUNCTION trigger_validate_aadhar()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.aadhar_number IS NOT NULL AND NOT validate_aadhar_number(NEW.aadhar_number) THEN
    RAISE EXCEPTION 'Invalid Aadhar number format. Must be 12 digits and cannot start with 0 or 1.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_aadhar_trigger
  BEFORE INSERT OR UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION trigger_validate_aadhar();

-- STEP 8: Sample data update (optional - for testing)
-- ==================================================================================
-- Uncomment below to add sample data for testing
/*
UPDATE students 
SET 
  gap_in_studies = false,
  gap_years = 0,
  gap_reason = NULL,
  work_experience = NULL,
  aadhar_number = NULL,
  backlogs_history = NULL,
  current_backlogs = 0
WHERE gap_in_studies IS NULL;
*/

-- STEP 9: Verification queries
-- ==================================================================================
-- Run these to verify the migration worked correctly:
/*
-- Check new columns exist
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'students' 
AND column_name IN ('gap_in_studies', 'gap_years', 'gap_reason', 'work_experience', 'aadhar_number', 'backlogs_history', 'current_backlogs');

-- Check constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'students' 
AND constraint_name LIKE 'chk_%';

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'students' 
AND indexname LIKE 'idx_students_%';
*/