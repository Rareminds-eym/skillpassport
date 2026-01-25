-- Fix semester values in students table
-- This script sets proper semester values for students who don't have them

-- First, check current state
SELECT 
  COUNT(*) as total_students,
  COUNT(semester) as students_with_semester,
  COUNT(*) - COUNT(semester) as students_without_semester
FROM students;

-- Check sample data
SELECT id, name, semester, grade, college_id, school_id
FROM students 
LIMIT 10;

-- Fix 1: Set semester = 1 for college students who don't have semester set
UPDATE students 
SET semester = 1 
WHERE semester IS NULL 
  AND college_id IS NOT NULL;

-- Fix 2: Set semester = grade for school students (if grade is numeric)
UPDATE students 
SET semester = CAST(grade AS INTEGER) 
WHERE semester IS NULL 
  AND school_id IS NOT NULL 
  AND grade IS NOT NULL 
  AND grade ~ '^[0-9]+$';  -- Only if grade is numeric

-- Fix 3: Set default semester = 1 for any remaining students
UPDATE students 
SET semester = 1 
WHERE semester IS NULL;

-- Verify the fix
SELECT 
  COUNT(*) as total_students,
  COUNT(semester) as students_with_semester,
  AVG(semester) as avg_semester,
  MIN(semester) as min_semester,
  MAX(semester) as max_semester
FROM students;

-- Show sample of fixed data
SELECT id, name, semester, grade, college_id, school_id
FROM students 
WHERE semester IS NOT NULL
LIMIT 10;

COMMENT ON COLUMN students.semester IS 'Current semester/grade of the student. Used for promotion tracking.';