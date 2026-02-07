-- Check technical_skills table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'technical_skills'
ORDER BY ordinal_position;

-- Check soft_skills table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'soft_skills'
ORDER BY ordinal_position;

-- Check if versioning columns exist
SELECT 
  table_name,
  column_name
FROM information_schema.columns 
WHERE table_name IN ('technical_skills', 'soft_skills')
  AND column_name IN ('enabled', 'has_pending_edit', 'verified_data', 'pending_edit_data', 'approval_status')
ORDER BY table_name, column_name;
