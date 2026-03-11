-- Add type column to course_skills table to distinguish between technical and soft skills
-- First create the enum type if it doesn't exist
DO $$ BEGIN
  CREATE TYPE skill_type AS ENUM ('technical', 'soft');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add the type column using the enum
ALTER TABLE course_skills 
ADD COLUMN IF NOT EXISTS type skill_type DEFAULT null;
