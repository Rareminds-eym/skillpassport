-- Script to View Old Certificate Data (Verified Version)
-- This shows where the old data is stored when you edit a verified certificate

-- ============================================
-- 1. VIEW ALL CERTIFICATES WITH PENDING EDITS
-- ============================================
-- This shows certificates that have been edited but not yet approved

SELECT 
  id,
  title as current_dashboard_title,
  approval_status,
  has_pending_edit,
  
  -- OLD VERIFIED DATA (what dashboard shows)
  verified_data->>'title' as old_title,
  verified_data->>'issuer' as old_issuer,
  verified_data->>'description' as old_description,
  verified_data->>'approval_status' as old_approval_status,
  
  -- YOUR NEW PENDING CHANGES (what edit modal shows)
  pending_edit_data->>'title' as new_title,
  pending_edit_data->>'issuer' as new_issuer,
  pending_edit_data->>'description' as new_description,
  
  updated_at
FROM certificates
WHERE has_pending_edit = true
ORDER BY updated_at DESC;

-- ============================================
-- 2. VIEW SPECIFIC CERTIFICATE (Replace 'Sports')
-- ============================================

SELECT 
  id,
  title,
  
  -- Show if it has pending edits
  has_pending_edit,
  approval_status,
  
  -- OLD DATA (stored in verified_data)
  jsonb_pretty(verified_data) as old_verified_data,
  
  -- NEW DATA (stored in pending_edit_data)
  jsonb_pretty(pending_edit_data) as your_pending_changes,
  
  updated_at
FROM certificates
WHERE title LIKE '%Sports%' 
   OR pending_edit_data->>'title' LIKE '%Sports%'
ORDER BY updated_at DESC;

-- ============================================
-- 3. COMPARE OLD VS NEW SIDE BY SIDE
-- ============================================

SELECT 
  id,
  
  -- What dashboard shows
  CASE 
    WHEN has_pending_edit THEN verified_data->>'title'
    ELSE title
  END as dashboard_shows,
  
  -- What edit modal shows
  CASE 
    WHEN has_pending_edit THEN pending_edit_data->>'title'
    ELSE title
  END as edit_modal_shows,
  
  -- Status
  has_pending_edit,
  approval_status,
  
  -- Timestamps
  updated_at
FROM certificates
WHERE has_pending_edit = true
ORDER BY updated_at DESC;

-- ============================================
-- 4. VIEW FULL JSON DATA
-- ============================================
-- This shows the complete verified_data and pending_edit_data JSON

SELECT 
  id,
  title,
  
  -- Complete old data
  verified_data as complete_old_data,
  
  -- Complete new data
  pending_edit_data as complete_new_data,
  
  has_pending_edit,
  approval_status
FROM certificates
WHERE has_pending_edit = true;

-- ============================================
-- 5. VIEW YOUR SPECIFIC STUDENT'S CERTIFICATES
-- ============================================
-- Replace 'your-email@example.com' with your actual email

SELECT 
  c.id,
  c.title as dashboard_title,
  c.has_pending_edit,
  c.approval_status,
  
  -- Old verified data
  c.verified_data->>'title' as old_title,
  c.verified_data->>'issuer' as old_issuer,
  
  -- Your new changes
  c.pending_edit_data->>'title' as new_title,
  c.pending_edit_data->>'issuer' as new_issuer,
  
  c.updated_at
FROM certificates c
JOIN students s ON c.student_id = s.id
WHERE s.email = 'your-email@example.com'
  AND c.has_pending_edit = true
ORDER BY c.updated_at DESC;

-- ============================================
-- 6. COUNT CERTIFICATES BY STATUS
-- ============================================

SELECT 
  approval_status,
  has_pending_edit,
  COUNT(*) as count
FROM certificates
GROUP BY approval_status, has_pending_edit
ORDER BY approval_status, has_pending_edit;

-- ============================================
-- 7. VIEW CERTIFICATE HISTORY (WHAT CHANGED)
-- ============================================

SELECT 
  id,
  title,
  
  -- What changed
  CASE 
    WHEN verified_data->>'title' != pending_edit_data->>'title' 
    THEN 'Title changed from "' || (verified_data->>'title') || '" to "' || (pending_edit_data->>'title') || '"'
    ELSE 'Title unchanged'
  END as title_change,
  
  CASE 
    WHEN verified_data->>'issuer' != pending_edit_data->>'issuer' 
    THEN 'Issuer changed from "' || (verified_data->>'issuer') || '" to "' || (pending_edit_data->>'issuer') || '"'
    ELSE 'Issuer unchanged'
  END as issuer_change,
  
  CASE 
    WHEN verified_data->>'description' != pending_edit_data->>'description' 
    THEN 'Description changed'
    ELSE 'Description unchanged'
  END as description_change,
  
  updated_at
FROM certificates
WHERE has_pending_edit = true
ORDER BY updated_at DESC;

-- ============================================
-- 8. EXPORT OLD DATA TO CSV (for backup)
-- ============================================
-- Copy the results and save as CSV

SELECT 
  id,
  title,
  verified_data->>'title' as old_title,
  verified_data->>'issuer' as old_issuer,
  verified_data->>'level' as old_level,
  verified_data->>'credential_id' as old_credential_id,
  verified_data->>'link' as old_link,
  verified_data->>'issued_on' as old_issued_on,
  verified_data->>'expiry_date' as old_expiry_date,
  verified_data->>'description' as old_description,
  pending_edit_data->>'title' as new_title,
  pending_edit_data->>'issuer' as new_issuer,
  pending_edit_data->>'level' as new_level,
  pending_edit_data->>'credential_id' as new_credential_id,
  pending_edit_data->>'link' as new_link,
  pending_edit_data->>'issued_on' as new_issued_on,
  pending_edit_data->>'expiry_date' as new_expiry_date,
  pending_edit_data->>'description' as new_description,
  updated_at
FROM certificates
WHERE has_pending_edit = true
ORDER BY updated_at DESC;

-- ============================================
-- UNDERSTANDING THE RESULTS
-- ============================================

/*
COLUMN MEANINGS:

1. verified_data (JSONB column)
   - Contains the OLD verified data
   - This is what the dashboard shows
   - Preserved when you edit a verified certificate
   - Example: { "title": "Sports day medal", "issuer": "Aditya College" }

2. pending_edit_data (JSONB column)
   - Contains YOUR NEW changes
   - This is what the edit modal shows
   - Waiting for approval
   - Example: { "title": "Sports", "issuer": "Aditya College" }

3. has_pending_edit (boolean)
   - true = You have edited this certificate, changes pending approval
   - false = No pending changes

4. approval_status
   - 'verified' = Approved and live on dashboard
   - 'pending' = Waiting for approval (either new or edited)
   - 'approved' = Approved but not yet verified

WORKFLOW:
1. Original: title = "Sports day medal", approval_status = "verified"
2. You edit to "Sports"
3. System stores:
   - verified_data = { title: "Sports day medal" } ← OLD DATA HERE
   - pending_edit_data = { title: "Sports" } ← NEW DATA HERE
   - has_pending_edit = true
   - approval_status = "pending"
4. Dashboard shows: "Sports day medal" (from verified_data)
5. Edit modal shows: "Sports" (from pending_edit_data)
6. After approval:
   - title = "Sports"
   - verified_data = null
   - pending_edit_data = null
   - has_pending_edit = false
   - approval_status = "verified"
*/
