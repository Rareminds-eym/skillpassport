-- Check RLS policies for competition_registrations table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'competition_registrations';

-- Check if RLS is enabled on the table
SELECT schemaname, tablename, rowsecurity, forcerowsecurity
FROM pg_tables 
WHERE tablename = 'competition_registrations';

-- Test query to see all registrations for a specific competition
-- Replace 'your-competition-id' with an actual competition ID
SELECT 
    cr.*,
    s.name as student_name,
    s.grade as student_grade
FROM competition_registrations cr
LEFT JOIN students s ON s.email = cr.student_email
WHERE cr.comp_id = 'your-competition-id'
ORDER BY cr.registration_date DESC;