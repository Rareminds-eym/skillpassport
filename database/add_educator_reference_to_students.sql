-- Add educator_id reference to students table
-- Run this after creating the educators table

-- Add educator_id column to students table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'students' AND column_name = 'educator_id') THEN
        ALTER TABLE students ADD COLUMN educator_id TEXT REFERENCES educators(id) ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS idx_students_educator_id ON students(educator_id);
    END IF;
END $$;

-- Update RLS policies for students table to allow educators to view their assigned students
DROP POLICY IF EXISTS "Educators can view their assigned students" ON students;
CREATE POLICY "Educators can view their assigned students" ON students FOR SELECT USING (
  auth.uid()::text = educator_id OR
  auth.uid()::text IN (
    SELECT educator_id FROM educator_students 
    WHERE student_id = students.id AND is_active = true
  )
);

DROP POLICY IF EXISTS "Educators can update their assigned students" ON students;
CREATE POLICY "Educators can update their assigned students" ON students FOR UPDATE USING (
  auth.uid()::text = educator_id OR
  auth.uid()::text IN (
    SELECT educator_id FROM educator_students 
    WHERE student_id = students.id AND is_active = true
  )
);

-- Allow educators to view related data for their students
-- Education
DROP POLICY IF EXISTS "Educators can view education of their students" ON education;
CREATE POLICY "Educators can view education of their students" ON education FOR SELECT USING (
  student_id IN (
    SELECT id FROM students 
    WHERE educator_id = auth.uid()::text OR 
    id IN (
      SELECT student_id FROM educator_students 
      WHERE educator_id = auth.uid()::text AND is_active = true
    )
  )
);

-- Training
DROP POLICY IF EXISTS "Educators can view training of their students" ON training;
CREATE POLICY "Educators can view training of their students" ON training FOR SELECT USING (
  student_id IN (
    SELECT id FROM students 
    WHERE educator_id = auth.uid()::text OR 
    id IN (
      SELECT student_id FROM educator_students 
      WHERE educator_id = auth.uid()::text AND is_active = true
    )
  )
);

-- Experience
DROP POLICY IF EXISTS "Educators can view experience of their students" ON experience;
CREATE POLICY "Educators can view experience of their students" ON experience FOR SELECT USING (
  student_id IN (
    SELECT id FROM students 
    WHERE educator_id = auth.uid()::text OR 
    id IN (
      SELECT student_id FROM educator_students 
      WHERE educator_id = auth.uid()::text AND is_active = true
    )
  )
);

-- Technical Skills
DROP POLICY IF EXISTS "Educators can view technical skills of their students" ON technical_skills;
CREATE POLICY "Educators can view technical skills of their students" ON technical_skills FOR SELECT USING (
  student_id IN (
    SELECT id FROM students 
    WHERE educator_id = auth.uid()::text OR 
    id IN (
      SELECT student_id FROM educator_students 
      WHERE educator_id = auth.uid()::text AND is_active = true
    )
  )
);

-- Soft Skills
DROP POLICY IF EXISTS "Educators can view soft skills of their students" ON soft_skills;
CREATE POLICY "Educators can view soft skills of their students" ON soft_skills FOR SELECT USING (
  student_id IN (
    SELECT id FROM students 
    WHERE educator_id = auth.uid()::text OR 
    id IN (
      SELECT student_id FROM educator_students 
      WHERE educator_id = auth.uid()::text AND is_active = true
    )
  )
);

COMMENT ON COLUMN students.educator_id IS 'Reference to the primary educator assigned to this student';