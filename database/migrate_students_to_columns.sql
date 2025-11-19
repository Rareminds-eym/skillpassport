-- ==================================================================================
-- MIGRATION: Restructure Students Table from JSONB to Proper Columns
-- ==================================================================================
-- This migrates the students table from using a JSONB profile column to 
-- individual columns for better performance and compatibility with pipeline views
-- ==================================================================================

-- STEP 1: Add new columns to students table
-- ==================================================================================
ALTER TABLE students
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS university TEXT,
ADD COLUMN IF NOT EXISTS cgpa NUMERIC,
ADD COLUMN IF NOT EXISTS employability_score NUMERIC,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- STEP 2: Migrate data from profile to individual columns
-- ==================================================================================
-- Note: Converts TEXT profile to JSONB if needed, then extracts data
UPDATE students
SET 
  name = COALESCE(
    CASE 
      WHEN profile::text LIKE '{%' THEN (profile::jsonb)->>'name'
      ELSE NULL
    END,
    CASE 
      WHEN profile::text LIKE '{%' THEN 
        COALESCE((profile::jsonb)->>'firstName', '') || ' ' || COALESCE((profile::jsonb)->>'lastName', '')
      ELSE NULL
    END,
    'Unknown Student'
  ),
  email = COALESCE(
    CASE 
      WHEN profile::text LIKE '{%' THEN (profile::jsonb)->>'email'
      ELSE NULL
    END,
    email  -- Keep existing email column if profile doesn't have it
  ),
  phone = COALESCE(
    CASE 
      WHEN profile::text LIKE '{%' THEN (profile::jsonb)->>'contact_number'
      ELSE NULL
    END,
    CASE 
      WHEN profile::text LIKE '{%' THEN (profile::jsonb)->>'phone'
      ELSE NULL
    END
  ),
  department = COALESCE(
    CASE 
      WHEN profile::text LIKE '{%' THEN (profile::jsonb)->>'dept'
      ELSE NULL
    END,
    CASE 
      WHEN profile::text LIKE '{%' THEN (profile::jsonb)->>'department'
      ELSE NULL
    END
  ),
  university = COALESCE(
    CASE 
      WHEN profile::text LIKE '{%' THEN (profile::jsonb)->>'college'
      ELSE NULL
    END,
    CASE 
      WHEN profile::text LIKE '{%' THEN (profile::jsonb)->>'university'
      ELSE NULL
    END
  ),
  cgpa = COALESCE(
    CASE 
      WHEN profile::text LIKE '{%' THEN 
        NULLIF((profile::jsonb)->>'cgpa', '')::numeric
      ELSE NULL
    END,
    0
  ),
  employability_score = COALESCE(
    CASE 
      WHEN profile::text LIKE '{%' THEN 
        NULLIF((profile::jsonb)->>'employability_score', '')::numeric
      ELSE NULL
    END,
    CASE 
      WHEN profile::text LIKE '{%' THEN 
        NULLIF((profile::jsonb)->>'ai_score_overall', '')::numeric
      ELSE NULL
    END,
    0
  ),
  verified = COALESCE(
    CASE 
      WHEN profile::text LIKE '{%' THEN 
        CASE WHEN (profile::jsonb)->>'verified' = 'true' THEN true ELSE false END
      ELSE NULL
    END,
    false
  )
WHERE profile IS NOT NULL AND profile::text != '';

-- STEP 3: Create indexes for better performance
-- ==================================================================================
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_students_department ON students(department);
CREATE INDEX IF NOT EXISTS idx_students_university ON students(university);

-- STEP 4: Update the pipeline_candidates_detailed view to use new columns
-- ==================================================================================
DROP VIEW IF EXISTS pipeline_candidates_detailed CASCADE;

CREATE VIEW pipeline_candidates_detailed AS
SELECT 
  pc.*,
  s.name as student_name,
  s.email as student_email,
  s.phone as student_phone,
  s.department,
  s.university,
  s.cgpa,
  s.employability_score,
  s.verified,
  s.profile as student_profile,  -- Keep profile for any additional data
  r.title as job_title,
  r.location as job_location,
  r.status as requisition_status
FROM pipeline_candidates pc
LEFT JOIN students s ON pc.student_id = s.id
LEFT JOIN requisitions r ON pc.requisition_id = r.id
WHERE pc.status = 'active';

COMMENT ON VIEW pipeline_candidates_detailed IS 'Pipeline candidates with full student and requisition details';

-- STEP 5: Update the student_applications_with_pipeline view
-- ==================================================================================
DROP VIEW IF EXISTS student_applications_with_pipeline CASCADE;

CREATE VIEW student_applications_with_pipeline AS
SELECT 
  aj.id as application_id,
  aj.student_id,
  aj.opportunity_id,
  aj.application_status,
  aj.applied_at,
  aj.updated_at,
  s.name as student_name,
  s.email as student_email,
  o.job_title,
  o.company_name,
  o.location,
  o.requisition_id,
  pc.id as pipeline_candidate_id,
  pc.stage as pipeline_stage,
  pc.status as pipeline_status,
  pc.stage_changed_at,
  pc.source as pipeline_source,
  CASE 
    WHEN pc.id IS NOT NULL THEN true 
    ELSE false 
  END as is_in_pipeline
FROM applied_jobs aj
LEFT JOIN students s ON aj.student_id = s.id
LEFT JOIN opportunities o ON aj.opportunity_id = o.id
LEFT JOIN pipeline_candidates pc ON pc.requisition_id = o.requisition_id 
  AND pc.student_id = aj.student_id
  AND pc.status = 'active'
ORDER BY aj.applied_at DESC;

COMMENT ON VIEW student_applications_with_pipeline IS 'Combined view of student applications with their pipeline status';

-- STEP 6: Update the trigger function to use new columns
-- ==================================================================================
CREATE OR REPLACE FUNCTION auto_add_applicant_to_pipeline()
RETURNS TRIGGER AS $$
DECLARE
  v_opportunity RECORD;
  v_student RECORD;
  v_existing_candidate INTEGER;
BEGIN
  -- Get opportunity details including requisition_id
  SELECT 
    o.requisition_id, 
    COALESCE(o.job_title, o.title) as job_title
  INTO v_opportunity
  FROM opportunities o
  WHERE o.id = NEW.opportunity_id;
  
  -- Only proceed if opportunity has a linked requisition
  IF v_opportunity.requisition_id IS NULL THEN
    RAISE NOTICE 'Opportunity % has no linked requisition, skipping pipeline addition', NEW.opportunity_id;
    RETURN NEW;
  END IF;
  
  -- Get student details from the students table (using new columns)
  SELECT 
    s.id,
    COALESCE(s.name, 'Unknown Student') as name,
    COALESCE(s.email, '') as email,
    COALESCE(s.phone, '') as phone
  INTO v_student
  FROM students s
  WHERE s.id = NEW.student_id;
  
  -- If student not found, skip
  IF v_student.id IS NULL THEN
    RAISE NOTICE 'Student % not found in students table, skipping pipeline addition', NEW.student_id;
    RETURN NEW;
  END IF;
  
  -- Check if candidate already exists in this pipeline
  SELECT id INTO v_existing_candidate
  FROM pipeline_candidates
  WHERE requisition_id = v_opportunity.requisition_id
    AND student_id = NEW.student_id
  LIMIT 1;
  
  -- If candidate doesn't exist, add them to the pipeline
  IF v_existing_candidate IS NULL THEN
    BEGIN
      INSERT INTO pipeline_candidates (
        requisition_id,
        student_id,
        candidate_name,
        candidate_email,
        candidate_phone,
        stage,
        source,
        status,
        added_at,
        stage_changed_at,
        created_at,
        updated_at
      ) VALUES (
        v_opportunity.requisition_id,
        v_student.id,
        v_student.name,
        v_student.email,
        v_student.phone,
        'sourced',
        'direct_application',
        'active',
        NOW(),
        NOW(),
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'Successfully added student % (%) to pipeline for requisition %', 
        v_student.name, NEW.student_id, v_opportunity.requisition_id;
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'Failed to add student to pipeline: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Student % already exists in pipeline for requisition % (pipeline_candidate_id: %)', 
      NEW.student_id, v_opportunity.requisition_id, v_existing_candidate;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 7: Verification queries
-- ==================================================================================

-- Check the migration results
SELECT 
  'Students Table Migration Status' as check_type,
  COUNT(*) as total_students,
  COUNT(name) as students_with_name,
  COUNT(email) as students_with_email,
  COUNT(phone) as students_with_phone,
  COUNT(department) as students_with_department
FROM students;

-- Check a sample of migrated data
SELECT 
  id,
  name,
  email,
  phone,
  department,
  university,
  cgpa,
  employability_score,
  verified
FROM students
LIMIT 5;

-- Test the views
SELECT 'Testing pipeline_candidates_detailed view...' as status;
SELECT 
  candidate_name,
  student_name,
  student_email,
  department,
  university,
  job_title
FROM pipeline_candidates_detailed
LIMIT 3;

SELECT 'Testing student_applications_with_pipeline view...' as status;
SELECT 
  application_id,
  student_name,
  student_email,
  job_title,
  is_in_pipeline,
  pipeline_stage
FROM student_applications_with_pipeline
LIMIT 3;

-- OPTIONAL: After verifying everything works, you can drop the profile column
-- ==================================================================================
-- WARNING: Only run this after you've verified all data is migrated correctly
-- and you no longer need the profile column for anything!
--
-- ALTER TABLE students DROP COLUMN profile;
--
-- For now, we're keeping it as a backup in case you need any data from it

SELECT '✅ Students table restructured successfully!' as status;
SELECT '⚠️  Profile column kept as backup - drop it manually after verification' as note;
