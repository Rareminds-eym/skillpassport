-- Fix: Remove org_name from verified_data and pending_edit_data JSONB fields
-- This column doesn't exist in the experience table, causing errors when Supabase
-- tries to map JSONB keys to columns during updates

-- Update all records that have org_name in their JSONB fields
UPDATE experience
SET 
  verified_data = CASE 
    WHEN verified_data IS NOT NULL AND verified_data ? 'org_name' THEN 
      (verified_data - 'org_name')
    ELSE verified_data
  END,
  pending_edit_data = CASE 
    WHEN pending_edit_data IS NOT NULL AND pending_edit_data ? 'org_name' THEN 
      (pending_edit_data - 'org_name')
    ELSE pending_edit_data
  END
WHERE 
  (verified_data ? 'org_name') OR 
  (pending_edit_data ? 'org_name');

-- Log the fix
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Cleaned org_name from % experience records', affected_count;
END $$;
