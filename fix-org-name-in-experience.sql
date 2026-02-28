-- Fix org_name issue in experience table
-- This removes the org_name field from JSONB columns

-- Step 1: Check which records have org_name
SELECT 
  id,
  role,
  organization,
  has_pending_edit,
  CASE 
    WHEN verified_data ? 'org_name' THEN 'YES'
    ELSE 'NO'
  END as verified_has_org_name,
  CASE 
    WHEN pending_edit_data ? 'org_name' THEN 'YES'
    ELSE 'NO'
  END as pending_has_org_name
FROM experience
WHERE 
  verified_data ? 'org_name' 
  OR pending_edit_data ? 'org_name';

-- Step 2: Remove org_name from verified_data
UPDATE experience
SET verified_data = verified_data - 'org_name'
WHERE verified_data ? 'org_name';

-- Step 3: Remove org_name from pending_edit_data
UPDATE experience
SET pending_edit_data = pending_edit_data - 'org_name'
WHERE pending_edit_data ? 'org_name';

-- Step 4: Verify the fix
SELECT 
  id,
  role,
  organization,
  verified_data,
  pending_edit_data
FROM experience
WHERE 
  verified_data ? 'org_name' 
  OR pending_edit_data ? 'org_name';

-- Should return 0 rows if successful
