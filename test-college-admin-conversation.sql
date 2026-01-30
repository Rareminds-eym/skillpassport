-- Test creating a college educator admin conversation

-- First, let's see what college and educator IDs we have
SELECT 
  cl.id as educator_id,
  cl.name as educator_name,
  cl.collegeId as college_id,
  o.name as college_name,
  o.admin_id as college_admin_id
FROM college_lecturers cl
JOIN organizations o ON o.id = cl.collegeId
WHERE o.organization_type = 'college'
AND o.admin_id IS NOT NULL
LIMIT 5;

-- Try to create a test conversation manually
-- (Replace with actual IDs from the query above)
-- INSERT INTO conversations (
--   id,
--   educator_id,
--   college_id,
--   subject,
--   conversation_type,
--   status,
--   created_at,
--   updated_at
-- ) VALUES (
--   'conv_cea_test_' || extract(epoch from now())::bigint,
--   'EDUCATOR_ID_HERE',
--   'COLLEGE_ID_HERE',
--   'Test Conversation',
--   'college_educator_admin',
--   'active',
--   now(),
--   now()
-- );