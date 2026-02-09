-- Check education records with versioning fields
SELECT 
  id,
  degree,
  university,
  approval_status,
  has_pending_edit,
  verified_data,
  pending_edit_data,
  enabled,
  created_at,
  updated_at
FROM education
WHERE degree LIKE '%Grade%' OR degree LIKE '%Gradess%'
ORDER BY updated_at DESC;

-- Check all education for the student
SELECT 
  id,
  degree,
  university,
  approval_status,
  has_pending_edit,
  CASE 
    WHEN verified_data IS NOT NULL THEN 'HAS verified_data'
    ELSE 'NO verified_data'
  END as verified_data_status,
  CASE 
    WHEN pending_edit_data IS NOT NULL THEN 'HAS pending_edit_data'
    ELSE 'NO pending_edit_data'
  END as pending_edit_data_status,
  enabled
FROM education
ORDER BY updated_at DESC
LIMIT 10;
