-- Test the nested query that should work
SELECT 
  s.id,
  s.email,
  s.school_id,
  schools.id as school_id,
  schools.name as school_name,
  schools.code as school_code
FROM students s
LEFT JOIN schools ON s.school_id = schools.id
WHERE s.email = 'durkadevidurkadevi43@gmail.com';
