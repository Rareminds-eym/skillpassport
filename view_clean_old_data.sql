-- Clean view of old certificate data (without embedding field)
-- This shows only the human-readable fields

-- ============================================
-- VIEW OLD DATA WITHOUT EMBEDDING FIELD
-- ============================================

SELECT 
  id,
  title as current_title,
  
  -- OLD DATA (from verified_data) - Clean view
  verified_data->>'id' as old_id,
  verified_data->>'title' as old_title,
  verified_data->>'issuer' as old_issuer,
  verified_data->>'level' as old_level,
  verified_data->>'credential_id' as old_credential_id,
  verified_data->>'link' as old_link,
  verified_data->>'issued_on' as old_issued_on,
  verified_data->>'expiry_date' as old_expiry_date,
  verified_data->>'description' as old_description,
  verified_data->>'status' as old_status,
  verified_data->>'approval_status' as old_approval_status,
  verified_data->>'enabled' as old_enabled,
  
  -- NEW DATA (from pending_edit_data) - Clean view
  pending_edit_data->>'title' as new_title,
  pending_edit_data->>'issuer' as new_issuer,
  pending_edit_data->>'level' as new_level,
  pending_edit_data->>'credential_id' as new_credential_id,
  pending_edit_data->>'link' as new_link,
  pending_edit_data->>'issued_on' as new_issued_on,
  pending_edit_data->>'expiry_date' as new_expiry_date,
  pending_edit_data->>'description' as new_description,
  pending_edit_data->>'status' as new_status,
  pending_edit_data->>'approval_status' as new_approval_status,
  pending_edit_data->>'enabled' as new_enabled,
  
  -- Status flags
  has_pending_edit,
  approval_status,
  
  -- Timestamps
  updated_at
FROM certificates
WHERE has_pending_edit = true
ORDER BY updated_at DESC;

-- ============================================
-- SIMPLIFIED VIEW - JUST TITLES
-- ============================================

SELECT 
  id,
  title as dashboard_shows,
  verified_data->>'title' as old_verified_title,
  pending_edit_data->>'title' as your_new_title,
  has_pending_edit,
  approval_status
FROM certificates
WHERE has_pending_edit = true;

-- ============================================
-- CHECK SPECIFIC CERTIFICATE (Replace 'Sports')
-- ============================================

SELECT 
  id,
  title,
  issuer,
  description,
  
  -- Old data
  verified_data->>'title' as old_title,
  verified_data->>'issuer' as old_issuer,
  verified_data->>'description' as old_description,
  
  -- New data
  pending_edit_data->>'title' as new_title,
  pending_edit_data->>'issuer' as new_issuer,
  pending_edit_data->>'description' as new_description,
  
  has_pending_edit,
  approval_status
FROM certificates
WHERE title LIKE '%Sports%' 
   OR pending_edit_data->>'title' LIKE '%Sports%'
ORDER BY updated_at DESC;

-- ============================================
-- EXPLANATION
-- ============================================

/*
The "embedding" field you see is a vector of numbers used for AI-powered search.
It's NOT part of the old data storage - it's just a technical field.

The actual old data is stored in these fields:
- verified_data->>'title' = Old title
- verified_data->>'issuer' = Old issuer
- verified_data->>'description' = Old description
- ... and so on for all fields

The embedding field is automatically generated and can be ignored when viewing old data.
*/
