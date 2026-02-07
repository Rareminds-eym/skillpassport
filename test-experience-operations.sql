-- Test Experience Operations: Add, Update, Delete
-- Using the student from your screenshot: 3531e63e-589e-46e7-9248-4a769e84b00d

-- 1. TEST: Add a new experience record
INSERT INTO experience (
  student_id,
  organization,
  role,
  start_date,
  end_date,
  duration,
  description,
  verified,
  approval_status,
  enabled
) VALUES (
  '3531e63e-589e-46e7-9248-4a769e84b00d',
  'Test Company',
  'Test Role',
  '2024-01-01',
  '2024-12-31',
  'Jan 2024 - Dec 2024',
  'This is a test experience',
  false,
  'pending',
  true
) RETURNING id, organization, role, approval_status, approval_authority;

-- Store the ID for later tests
DO $$
DECLARE
  test_id uuid;
BEGIN
  -- Get the last inserted ID
  SELECT id INTO test_id FROM experience 
  WHERE organization = 'Test Company' 
  ORDER BY created_at DESC LIMIT 1;
  
  RAISE NOTICE 'Created test record with ID: %', test_id;
END $$;

-- 2. TEST: Update the record (simulating an edit)
UPDATE experience
SET 
  role = 'Updated Test Role',
  organization = 'Updated Test Company',
  updated_at = NOW()
WHERE organization = 'Test Company'
RETURNING id, organization, role, approval_status, has_pending_edit;

-- 3. TEST: Update with versioning (simulating approved record being edited)
UPDATE experience
SET 
  approval_status = 'approved',
  verified = true
WHERE organization = 'Updated Test Company';

-- Now edit it to trigger versioning
UPDATE experience
SET 
  role = 'Marketing Manager',
  verified_data = jsonb_build_object(
    'role', 'Updated Test Role',
    'organization', 'Updated Test Company',
    'start_date', '2024-01-01',
    'end_date', '2024-12-31',
    'duration', 'Jan 2024 - Dec 2024',
    'description', 'This is a test experience',
    'enabled', true
  ),
  pending_edit_data = jsonb_build_object(
    'role', 'Marketing Manager',
    'organization', 'Updated Test Company',
    'start_date', '2024-01-01',
    'end_date', '2024-12-31',
    'duration', 'Jan 2024 - Dec 2024',
    'description', 'This is a test experience',
    'enabled', true
  ),
  has_pending_edit = true,
  approval_status = 'pending',
  updated_at = NOW()
WHERE organization = 'Updated Test Company'
RETURNING id, role, has_pending_edit, verified_data, pending_edit_data;

-- 4. TEST: Delete the test record
DELETE FROM experience
WHERE organization = 'Updated Test Company'
RETURNING id, organization, role;

-- 5. Verify all operations completed
SELECT 
  'Test completed successfully' as status,
  COUNT(*) as remaining_test_records
FROM experience
WHERE organization LIKE '%Test%';
