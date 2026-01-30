-- Debug college educator admin conversations

-- Check if conversation type exists in constraints
SELECT conname, consrc 
FROM pg_constraint 
WHERE conname LIKE '%conversation%' 
AND consrc LIKE '%college_educator_admin%';

-- Check existing conversations with college_educator_admin type
SELECT id, educator_id, college_id, conversation_type, subject, status, created_at
FROM conversations 
WHERE conversation_type = 'college_educator_admin'
LIMIT 10;

-- Check organizations table for college admin_id
SELECT id, name, admin_id, organization_type
FROM organizations 
WHERE organization_type = 'college'
AND admin_id IS NOT NULL
LIMIT 5;

-- Check college_lecturers table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'college_lecturers'
ORDER BY ordinal_position;

-- Check if the database function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'get_or_create_college_educator_admin_conversation';