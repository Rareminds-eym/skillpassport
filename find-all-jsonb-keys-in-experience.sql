-- Find all unique keys in verified_data and pending_edit_data JSONB fields
-- This helps us identify any old/invalid fields that need to be cleaned

-- Get all unique keys from verified_data
SELECT DISTINCT jsonb_object_keys(verified_data) as key_name, 'verified_data' as source
FROM experience
WHERE verified_data IS NOT NULL

UNION

-- Get all unique keys from pending_edit_data
SELECT DISTINCT jsonb_object_keys(pending_edit_data) as key_name, 'pending_edit_data' as source
FROM experience
WHERE pending_edit_data IS NOT NULL

ORDER BY key_name;

-- Valid fields for experience (for reference):
-- role, organization, start_date, end_date, duration, description, enabled

-- Show records with any unexpected keys
WITH valid_keys AS (
  SELECT unnest(ARRAY['role', 'organization', 'start_date', 'end_date', 'duration', 'description', 'enabled']) as valid_key
),
verified_keys AS (
  SELECT id, role, jsonb_object_keys(verified_data) as key_name
  FROM experience
  WHERE verified_data IS NOT NULL
),
pending_keys AS (
  SELECT id, role, jsonb_object_keys(pending_edit_data) as key_name
  FROM experience
  WHERE pending_edit_data IS NOT NULL
)
SELECT 
  'verified_data' as source,
  v.id,
  v.role,
  v.key_name as invalid_key
FROM verified_keys v
WHERE v.key_name NOT IN (SELECT valid_key FROM valid_keys)

UNION ALL

SELECT 
  'pending_edit_data' as source,
  p.id,
  p.role,
  p.key_name as invalid_key
FROM pending_keys p
WHERE p.key_name NOT IN (SELECT valid_key FROM valid_keys)

ORDER BY source, id;
