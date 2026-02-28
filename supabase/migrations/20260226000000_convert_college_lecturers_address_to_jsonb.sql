-- Convert college_lecturers address column from TEXT to JSONB
-- This allows proper storage of structured address data (address, city, state, country, pincode)

-- First, update any plain text addresses to valid JSON format
UPDATE college_lecturers
SET address = jsonb_build_object('address', address, 'city', '', 'state', '', 'country', '', 'pincode', '')::text
WHERE address IS NOT NULL 
  AND address != '' 
  AND address !~ '^\s*\{.*\}\s*$';  -- Only update if not already JSON

-- Now safely convert the column type from TEXT to JSONB
ALTER TABLE college_lecturers
ALTER COLUMN address TYPE jsonb
USING CASE 
  WHEN address IS NULL OR address = '' THEN NULL
  ELSE address::jsonb
END;

-- Add a comment to document the structure
COMMENT ON COLUMN college_lecturers.address IS 'JSONB object containing structured address data: {address, city, state, country, pincode}';
