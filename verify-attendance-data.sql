-- Verify the attendance data exists and check the exact values

-- 1. Check total records for this school
SELECT COUNT(*) as total_records
FROM attendance_records
WHERE school_id = '550e8400-e29b-41d4-a716-446655440000';

-- 2. Check the date range of existing data
SELECT 
    MIN(date) as earliest_date,
    MAX(date) as latest_date,
    COUNT(*) as total_records
FROM attendance_records
WHERE school_id = '550e8400-e29b-41d4-a716-446655440000';

-- 3. Check if dates are in the expected range
SELECT COUNT(*) as records_in_range
FROM attendance_records
WHERE school_id = '550e8400-e29b-41d4-a716-446655440000'
AND date >= '2025-10-28'
AND date <= '2025-11-27';

-- 4. Show sample records with all fields
SELECT 
    id,
    student_id,
    school_id,
    date,
    status,
    created_at
FROM attendance_records
WHERE school_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY date DESC
LIMIT 5;

-- 5. Check if school_id is stored differently (maybe as text vs UUID)
SELECT 
    school_id,
    pg_typeof(school_id) as school_id_type,
    COUNT(*) as count
FROM attendance_records
GROUP BY school_id
LIMIT 10;
