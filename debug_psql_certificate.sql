-- Debug the psql certificate to see why it shows multiple badges

SELECT 
  id,
  title,
  issuer,
  status,
  approval_status,
  has_pending_edit,
  verified_data,
  pending_edit_data,
  created_at,
  updated_at
FROM certificates
WHERE student_id = (SELECT id FROM students WHERE email = 'testss@gmail.com')
  AND title = 'psql';
