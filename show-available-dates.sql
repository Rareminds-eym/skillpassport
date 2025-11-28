-- Show all dates that have attendance data
SELECT 
    date,
    TO_CHAR(date, 'Day, DD Mon YYYY') as formatted_date,
    COUNT(*) as total_students,
    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
    SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
    SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) as excused
FROM attendance_records
WHERE school_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY date
ORDER BY date DESC;
