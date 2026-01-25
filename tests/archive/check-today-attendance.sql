-- Check if there's attendance data for today
SELECT 
    date,
    COUNT(*) as record_count,
    SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
    SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
FROM attendance_records
WHERE school_id = '550e8400-e29b-41d4-a716-446655440000'
AND date = CURRENT_DATE
GROUP BY date;

-- Check what dates we have data for
SELECT 
    date,
    COUNT(*) as record_count
FROM attendance_records
WHERE school_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY date
ORDER BY date DESC
LIMIT 10;
