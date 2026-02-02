-- Debug current user's college lecturer data

-- Check the current user's college lecturer record
SELECT 
  cl.id,
  cl.name,
  cl.user_id,
  cl.userId,
  cl.collegeId,
  o.name as college_name,
  o.admin_id as college_admin_id,
  o.organization_type
FROM college_lecturers cl
LEFT JOIN organizations o ON o.id = cl.collegeId
WHERE cl.user_id = '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79'
   OR cl.userId = '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79';

-- Also check if there's a record with the college lecturer record ID
SELECT 
  cl.id,
  cl.name,
  cl.user_id,
  cl.userId,
  cl.collegeId,
  o.name as college_name,
  o.admin_id as college_admin_id,
  o.organization_type
FROM college_lecturers cl
LEFT JOIN organizations o ON o.id = cl.collegeId
WHERE cl.id = '0f4b36d3-bebe-456f-8e11-b89a4fe2a723';

-- Check existing conversations for this educator
SELECT 
  c.id,
  c.educator_id,
  c.college_id,
  c.conversation_type,
  c.subject,
  c.status,
  o.name as college_name,
  o.admin_id as college_admin_id
FROM conversations c
LEFT JOIN organizations o ON o.id = c.college_id
WHERE c.educator_id = '0f4b36d3-bebe-456f-8e11-b89a4fe2a723'
   OR c.educator_id = '0ffcf1ed-e010-43ec-b13b-4bee6c9a2d79';