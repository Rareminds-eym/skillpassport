-- Fix the constraint to allow university + college class combination
-- Since colleges are under universities in your system

-- Drop the old restrictive constraint
ALTER TABLE students DROP CONSTRAINT chk_only_one_class;

-- Add new constraint that allows university_college_id + college_class_id together
ALTER TABLE students ADD CONSTRAINT chk_only_one_class 
CHECK (
  -- School students: only school_class_id
  (school_class_id IS NOT NULL AND university_college_id IS NULL AND college_class_id IS NULL) OR
  
  -- University students without college class: only university_college_id  
  (school_class_id IS NULL AND university_college_id IS NOT NULL AND college_class_id IS NULL) OR
  
  -- University college students with college class: both university_college_id AND college_class_id
  (school_class_id IS NULL AND university_college_id IS NOT NULL AND college_class_id IS NOT NULL) OR
  
  -- No assignment
  (school_class_id IS NULL AND university_college_id IS NULL AND college_class_id IS NULL)
);

-- Verify the constraint was updated
SELECT constraint_name, check_clause 
FROM information_schema.check_constraints 
WHERE constraint_name = 'chk_only_one_class';