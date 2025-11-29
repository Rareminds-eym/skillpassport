-- Test the exact query that the service is using
-- This mimics what attendanceService.getAttendance() does

SELECT 
    ar.*,
    json_build_object(
        'id', s.id,
        'name', s.name,
        'roll_number', s.roll_number,
        'grade', s.grade,
        'section', s.section
    ) as student
FROM attendance_records ar
LEFT JOIN students s ON ar.student_id = s.id
WHERE ar.school_id = '550e8400-e29b-41d4-a716-446655440000'
AND ar.date >= '2025-10-28'
AND ar.date <= '2025-11-27'
ORDER BY ar.date DESC
LIMIT 10;

-- Also check if the join is working
SELECT 
    COUNT(*) as total_records,
    COUNT(s.id) as records_with_student
FROM attendance_records ar
LEFT JOIN students s ON ar.student_id = s.id
WHERE ar.school_id = '550e8400-e29b-41d4-a716-446655440000';
