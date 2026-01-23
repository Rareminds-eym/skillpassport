-- Check the structure of timetable_slots table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'timetable_slots'
ORDER BY ordinal_position;

-- Check if there's a class_id or class_name column
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'timetable_slots' 
AND (column_name LIKE '%class%' OR column_name LIKE '%subject%');
