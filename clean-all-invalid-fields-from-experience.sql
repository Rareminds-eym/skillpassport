-- Comprehensive cleanup of invalid fields from experience JSONB columns
-- This removes any old/invalid fields that might cause "column does not exist" errors

-- Valid fields for experience JSONB:
-- role, organization, start_date, end_date, duration, description, enabled

-- Step 1: Show what we're cleaning
SELECT 
  id,
  role,
  organization,
  verified_data,
  pending_edit_data
FROM experience
WHERE verified_data IS NOT NULL OR pending_edit_data IS NOT NULL;

-- Step 2: Clean verified_data - keep only valid fields
UPDATE experience
SET verified_data = jsonb_build_object(
  'role', verified_data->>'role',
  'organization', verified_data->>'organization',
  'start_date', verified_data->>'start_date',
  'end_date', verified_data->>'end_date',
  'duration', verified_data->>'duration',
  'description', verified_data->>'description',
  'enabled', (verified_data->>'enabled')::boolean
)
WHERE verified_data IS NOT NULL;

-- Step 3: Clean pending_edit_data - keep only valid fields
UPDATE experience
SET pending_edit_data = jsonb_build_object(
  'role', pending_edit_data->>'role',
  'organization', pending_edit_data->>'organization',
  'start_date', pending_edit_data->>'start_date',
  'end_date', pending_edit_data->>'end_date',
  'duration', pending_edit_data->>'duration',
  'description', pending_edit_data->>'description',
  'enabled', (pending_edit_data->>'enabled')::boolean
)
WHERE pending_edit_data IS NOT NULL;

-- Step 4: Remove null values from JSONB (cleanup)
UPDATE experience
SET verified_data = (
  SELECT jsonb_object_agg(key, value)
  FROM jsonb_each(verified_data)
  WHERE value IS NOT NULL AND value::text != 'null'
)
WHERE verified_data IS NOT NULL;

UPDATE experience
SET pending_edit_data = (
  SELECT jsonb_object_agg(key, value)
  FROM jsonb_each(pending_edit_data)
  WHERE value IS NOT NULL AND value::text != 'null'
)
WHERE pending_edit_data IS NOT NULL;

-- Step 5: Verify the cleanup
SELECT 
  id,
  role,
  organization,
  verified_data,
  pending_edit_data,
  jsonb_object_keys(verified_data) as verified_keys,
  jsonb_object_keys(pending_edit_data) as pending_keys
FROM experience
WHERE verified_data IS NOT NULL OR pending_edit_data IS NOT NULL;

-- Step 6: Summary
SELECT 
  'Cleanup Complete' as status,
  COUNT(*) as total_records,
  COUNT(CASE WHEN verified_data IS NOT NULL THEN 1 END) as has_verified_data,
  COUNT(CASE WHEN pending_edit_data IS NOT NULL THEN 1 END) as has_pending_data
FROM experience;
