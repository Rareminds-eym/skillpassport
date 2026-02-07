-- Check if experience table has org_name column (it shouldn't)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'experience' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- This will show all columns in the experience table
-- If org_name appears here, that's the problem!
