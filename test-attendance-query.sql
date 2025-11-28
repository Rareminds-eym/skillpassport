-- Test the exact query that the UI is using
SELECT 
    ar.*,
    s.id as student_id_check,
    s.name as student_name,
    s.roll_number,
    s.grade,
    s.section
FROM attendance_records ar
LEFT JOIN students s ON ar.student_id = s.id
WHERE ar.school_id = '550e8400-e29b-41d4-a716-446655440000'
AND ar.date >= (CURRENT_DATE - INTERVAL '30 days')
AND ar.date <= CURRENT_DATE
ORDER BY ar.date DESC
LIMIT 10;
