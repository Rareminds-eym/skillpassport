-- Check Attendance Summary for Delhi Public School
-- This query shows attendance statistics for all students

SELECT 
    s.name,
    s.roll_number,
    COUNT(ar.id) AS total_records,
    SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) AS present_count,
    SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
    SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) AS late_count,
    SUM(CASE WHEN ar.status = 'excused' THEN 1 ELSE 0 END) AS excused_count,
    ROUND(
        (SUM(CASE WHEN ar.status IN ('present','late','excused') THEN 1 ELSE 0 END)::NUMERIC / 
        NULLIF(COUNT(ar.id), 0)::NUMERIC * 100), 
        2
    ) AS attendance_percentage
FROM students s
LEFT JOIN attendance_records ar 
    ON s.id = ar.student_id
WHERE s.school_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY s.id, s.name, s.roll_number
ORDER BY s.name;
