-- Complete fix for org_name in experience table
-- This removes org_name from ALL JSONB fields

-- Step 1: Check which records have org_name
SELECT 
  id,
  role,
  organization,
  has_pending_edit,
  CASE 
    WHEN verified_data ? 'org_name' THEN 'YES'
    ELSE 'NO'
  END as has_org_name_in_verified,
  CASE 
    WHEN pending_edit_data ? 'org_name' THEN 'YES'
    ELSE 'NO'
  END as has_org_name_in_pending,
  verified_data,
  pending_edit_data
FROM experience
WHERE verified_data ? 'org_name' 
   OR pending_edit_data ? 'org_name'
ORDER BY updated_at DESC;

-- Step 2: Clean verified_data - remove org_name and keep only valid fields
UPDATE experience
SET verified_data = (
  CASE 
    WHEN verified_data IS NULL THEN NULL
    ELSE (
      SELECT jsonb_object_agg(key, value)
      FROM jsonb_each(verified_data)
      WHERE key IN ('role', 'organization', 'start_date', 'end_date', 'duration', 'description', 'enabled')
    )
  END
)
WHERE verified_data IS NOT NULL;

-- Step 3: Clean pending_edit_data - remove org_name and keep only valid fields
UPDATE experience
SET pending_edit_data = (
  CASE 
    WHEN pending_edit_data IS NULL THEN NULL
    ELSE (
      SELECT jsonb_object_agg(key, value)
      FROM jsonb_each(pending_edit_data)
      WHERE key IN ('role', 'organization', 'start_date', 'end_date', 'duration', 'description', 'enabled')
    )
  END
)
WHERE pending_edit_data IS NOT NULL;

-- Step 4: Verify the cleanup - should return no rows
SELECT 
  id,
  role,
  organization,
  has_pending_edit,
  verified_data ? 'org_name' as still_has_org_name_in_verified,
  pending_edit_data ? 'org_name' as still_has_org_name_in_pending
FROM experience
WHERE verified_data ? 'org_name' 
   OR pending_edit_data ? 'org_name';

-- Step 5: Show cleaned records with pending edits
SELECT 
  id,
  role,
  organization,
  approval_status,
  has_pending_edit,
  verified_data,
  pending_edit_data
FROM experience
WHERE has_pending_edit = true
ORDER BY updated_at DESC
LIMIT 10;
