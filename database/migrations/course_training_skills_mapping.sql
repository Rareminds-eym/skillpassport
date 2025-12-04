-- Migration: Map courses to trainings and skills
-- This allows students to complete courses (internal/external) and have them reflected in their skills

-- Step 1: Add course_id and source to trainings table
ALTER TABLE public.trainings 
ADD COLUMN IF NOT EXISTS course_id uuid NULL,
ADD COLUMN IF NOT EXISTS source varchar(50) NULL DEFAULT 'manual';

-- Add foreign key constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'trainings_course_id_fkey'
  ) THEN
    ALTER TABLE public.trainings 
    ADD CONSTRAINT trainings_course_id_fkey 
      FOREIGN KEY (course_id) REFERENCES courses (course_id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index for course lookups
CREATE INDEX IF NOT EXISTS idx_trainings_course_id 
ON public.trainings USING btree (course_id);

-- Add constraint for source type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'trainings_source_check'
  ) THEN
    ALTER TABLE public.trainings 
    ADD CONSTRAINT trainings_source_check 
    CHECK (source IN ('manual', 'internal_course', 'external_course', 'certification', 'mooc'));
  END IF;
END $$;

-- Step 2: Extend course_enrollments to track completion and skills
ALTER TABLE public.course_enrollments
ADD COLUMN IF NOT EXISTS training_id uuid NULL,
ADD COLUMN IF NOT EXISTS skills_acquired jsonb NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS certificate_url text NULL,
ADD COLUMN IF NOT EXISTS grade varchar(10) NULL;

-- Add foreign key to trainings
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'course_enrollments_training_id_fkey'
  ) THEN
    ALTER TABLE public.course_enrollments 
    ADD CONSTRAINT course_enrollments_training_id_fkey 
      FOREIGN KEY (training_id) REFERENCES trainings (id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add index
CREATE INDEX IF NOT EXISTS idx_course_enrollments_training 
ON public.course_enrollments USING btree (training_id);

-- Step 3: Create external_courses table for courses from other organizations
CREATE TABLE IF NOT EXISTS public.external_courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  course_name varchar(255) NOT NULL,
  organization varchar(255) NOT NULL, -- Coursera, Udemy, etc.
  course_url text NULL,
  start_date date NULL,
  completion_date date NULL,
  duration varchar(100) NULL,
  certificate_url text NULL,
  grade varchar(10) NULL,
  skills_acquired jsonb NULL DEFAULT '[]'::jsonb,
  training_id uuid NULL, -- Links to trainings table
  created_at timestamptz NULL DEFAULT now(),
  updated_at timestamptz NULL DEFAULT now(),
  
  CONSTRAINT external_courses_pkey PRIMARY KEY (id),
  CONSTRAINT external_courses_student_id_fkey 
    FOREIGN KEY (student_id) REFERENCES students (user_id) ON DELETE CASCADE,
  CONSTRAINT external_courses_training_id_fkey 
    FOREIGN KEY (training_id) REFERENCES trainings (id) ON DELETE SET NULL
);

-- Indexes for external_courses
CREATE INDEX IF NOT EXISTS idx_external_courses_student 
ON public.external_courses USING btree (student_id);

CREATE INDEX IF NOT EXISTS idx_external_courses_training 
ON public.external_courses USING btree (training_id);

CREATE INDEX IF NOT EXISTS idx_external_courses_organization 
ON public.external_courses USING btree (organization);

-- Trigger for updated_at
CREATE TRIGGER update_external_courses_updated_at 
BEFORE UPDATE ON external_courses 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Step 4: Function to auto-create skills from internal course completion
CREATE OR REPLACE FUNCTION create_skills_from_internal_course()
RETURNS TRIGGER AS $$
DECLARE
  skill_name text;
  training_record_id uuid;
BEGIN
  -- Only process when course is completed
  IF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR OLD.completed_at != NEW.completed_at) THEN
    
    -- Create or update training record
    IF NEW.training_id IS NULL THEN
      INSERT INTO public.trainings (
        student_id,
        title,
        organization,
        start_date,
        end_date,
        status,
        course_id,
        source
      ) VALUES (
        NEW.student_id,
        NEW.course_title,
        NEW.educator_name,
        NEW.enrolled_at::date,
        NEW.completed_at::date,
        'completed',
        NEW.course_id,
        'internal_course'
      )
      RETURNING id INTO training_record_id;
      
      -- Update enrollment with training_id
      NEW.training_id := training_record_id;
    END IF;
    
    -- Create skills from skills_acquired array
    IF NEW.skills_acquired IS NOT NULL AND jsonb_array_length(NEW.skills_acquired) > 0 THEN
      FOR skill_name IN SELECT jsonb_array_elements_text(NEW.skills_acquired)
      LOOP
        INSERT INTO public.skills (
          student_id,
          name,
          type,
          level,
          training_id,
          verified,
          approval_status
        ) VALUES (
          NEW.student_id,
          skill_name,
          'technical',
          3, -- Default level
          COALESCE(NEW.training_id, training_record_id),
          true, -- Auto-verified from course completion
          'approved'
        )
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for internal course completion
DROP TRIGGER IF EXISTS auto_create_skills_from_internal_course ON course_enrollments;
CREATE TRIGGER auto_create_skills_from_internal_course
BEFORE UPDATE ON course_enrollments
FOR EACH ROW
EXECUTE FUNCTION create_skills_from_internal_course();

-- Step 5: Function to auto-create skills from external course completion
CREATE OR REPLACE FUNCTION create_skills_from_external_course()
RETURNS TRIGGER AS $$
DECLARE
  skill_name text;
  training_record_id uuid;
BEGIN
  -- Only process when course is completed
  IF NEW.completion_date IS NOT NULL AND (OLD IS NULL OR OLD.completion_date IS NULL OR OLD.completion_date != NEW.completion_date) THEN
    
    -- Create or update training record
    IF NEW.training_id IS NULL THEN
      INSERT INTO public.trainings (
        student_id,
        title,
        organization,
        start_date,
        end_date,
        status,
        source
      ) VALUES (
        NEW.student_id,
        NEW.course_name,
        NEW.organization,
        NEW.start_date,
        NEW.completion_date,
        'completed',
        'external_course'
      )
      RETURNING id INTO training_record_id;
      
      -- Update external course with training_id
      NEW.training_id := training_record_id;
    END IF;
    
    -- Create skills from skills_acquired array
    IF NEW.skills_acquired IS NOT NULL AND jsonb_array_length(NEW.skills_acquired) > 0 THEN
      FOR skill_name IN SELECT jsonb_array_elements_text(NEW.skills_acquired)
      LOOP
        INSERT INTO public.skills (
          student_id,
          name,
          type,
          level,
          training_id,
          verified,
          approval_status
        ) VALUES (
          NEW.student_id,
          skill_name,
          'technical',
          3, -- Default level
          COALESCE(NEW.training_id, training_record_id),
          true, -- Auto-verified from course completion
          'approved'
        )
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for external course completion
DROP TRIGGER IF EXISTS auto_create_skills_from_external_course ON external_courses;
CREATE TRIGGER auto_create_skills_from_external_course
BEFORE INSERT OR UPDATE ON external_courses
FOR EACH ROW
EXECUTE FUNCTION create_skills_from_external_course();

-- Add comments for documentation
COMMENT ON COLUMN trainings.course_id IS 'Links training to internal course if applicable';
COMMENT ON COLUMN trainings.source IS 'Source of training: manual, internal_course, external_course, certification, mooc';
COMMENT ON COLUMN course_enrollments.skills_acquired IS 'JSON array of skill names acquired from this course';
COMMENT ON COLUMN course_enrollments.training_id IS 'Links to training record created when course is completed';
COMMENT ON TABLE external_courses IS 'Tracks external course completions (Coursera, Udemy, etc.) with automatic skill creation';
COMMENT ON COLUMN external_courses.skills_acquired IS 'JSON array of skill names acquired from this external course';
