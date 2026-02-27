-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('school_educators', 'college_lecturers');

-- Get all columns for school_educators
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'school_educators' 
ORDER BY ordinal_position;

-- Get all columns for college_lecturers
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'college_lecturers' 
ORDER BY ordinal_position;
