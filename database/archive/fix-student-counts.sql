-- Fix student counts in program_sections table using section field
UPDATE program_sections 
SET current_students = (
  SELECT COUNT(*) 
  FROM students 
  WHERE students.program_id = program_sections.program_id 
    AND students.semester = program_sections.semester 
    AND students.section = program_sections.section
    AND students.is_deleted = false
)
WHERE program_sections.id IS NOT NULL;