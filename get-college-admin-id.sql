-- Get college admin ID for the current user's college

SELECT 
  id as college_id,
  name as college_name,
  admin_id as college_admin_id,
  organization_type
FROM organizations 
WHERE id = 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d'
AND organization_type = 'college';