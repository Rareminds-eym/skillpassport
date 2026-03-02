-- Check if org_name exists in the experience record that's causing the error
SELECT 
  id, 
  role, 
  organization,
  verified_data::text as verified_data_text,
  pending_edit_data::text as pending_edit_data_text,
  has_pending_edit
FROM experience 
WHERE id = 'a4243137-f2ac-42c0-952e-e925441f6db1';

-- Check if org_name is in any JSONB fields
SELECT 
  id,
  role,
  CASE 
    WHEN verified_data ? 'org_name' THEN 'YES - verified_data has org_name'
    ELSE 'NO'
  END as verified_has_org_name,
  CASE 
    WHEN pending_edit_data ? 'org_name' THEN 'YES - pending_edit_data has org_name'
    ELSE 'NO'
  END as pending_has_org_name
FROM experience 
WHERE id = 'a4243137-f2ac-42c0-952e-e925441f6db1';
