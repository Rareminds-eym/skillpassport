-- Simple diagnostic queries - no assumptions about column names

-- 1. Check lecturer data
SELECT * FROM college_lecturers 
WHERE id = '0f4b36d3-bebe-456f-8e11-b89a4fe2a723';

-- 2. Check what columns exist in programs table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'programs' 
ORDER BY ordinal_position;

-- 3. Check sample programs data
SELECT * FROM programs LIMIT 3;

-- 4. Check what columns exist in program_sections table  
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'program_sections' 
ORDER BY ordinal_position;

-- 5. Check sample program_sections data
SELECT * FROM program_sections LIMIT 3;

-- 6. Check students table columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students' 
ORDER BY ordinal_position;

-- 7. Check sample students data
SELECT * FROM students 
WHERE college_id = 'c16a95cf-6ee5-4aa9-8e47-84fbda49611d' 
LIMIT 3;