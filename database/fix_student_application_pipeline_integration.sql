-- ==================================================================================
-- FIX: Student Application to Pipeline Integration
-- ==================================================================================
-- This script fixes the issue where students applying to jobs don't automatically
-- appear in the recruiter's pipeline, causing the "already present" error but
-- not displaying in the dashboard.
--
-- Problem: 
-- - opportunities table and requisitions table are disconnected
-- - When students apply via applied_jobs, no pipeline_candidates record is created
-- - studentPipelineService tries to match by requisition_id but fails
--
-- Solution:
-- 1. Add requisition_id to opportunities table
-- 2. Create automatic trigger to add students to pipeline when they apply
-- 3. Update existing data to link opportunities with requisitions
-- ==================================================================================

-- Step 1: Add requisition_id column to opportunities table
-- This links each opportunity (job posting) to a requisition (recruitment pipeline)
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS requisition_id TEXT REFERENCES requisitions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_requisition_id ON opportunities(requisition_id);

COMMENT ON COLUMN opportunities.requisition_id IS 'Links opportunity to recruitment pipeline requisition';

-- ==================================================================================
-- Step 2: Create function to automatically add student to pipeline when they apply
-- ==================================================================================

CREATE OR REPLACE FUNCTION auto_add_applicant_to_pipeline()
RETURNS TRIGGER AS $$
DECLARE
  v_opportunity RECORD;
  v_student RECORD;
  v_existing_candidate INTEGER;
BEGIN
  -- Get opportunity details including requisition_id
  SELECT o.requisition_id, o.job_title, o.title
  INTO v_opportunity
  FROM opportunities o
  WHERE o.id = NEW.opportunity_id;
  
  -- Only proceed if opportunity has a linked requisition
  IF v_opportunity.requisition_id IS NULL THEN
    RAISE NOTICE 'Opportunity % has no linked requisition, skipping pipeline addition', NEW.opportunity_id;
    RETURN NEW;
  END IF;
  
  -- Get student details
  SELECT 
    s.id,
    COALESCE(s.profile->>'name', 'Unknown Student') as name,
    COALESCE(s.profile->>'email', '') as email,
    COALESCE(s.profile->>'contact_number', '') as phone
  INTO v_student
  FROM students s
  WHERE s.id = NEW.student_id;
  
  IF v_student.id IS NULL THEN
    RAISE NOTICE 'Student % not found, skipping pipeline addition', NEW.student_id;
    RETURN NEW;
  END IF;
  
  -- Check if candidate already exists in this pipeline
  SELECT id INTO v_existing_candidate
  FROM pipeline_candidates
  WHERE requisition_id = v_opportunity.requisition_id
    AND student_id = NEW.student_id
  LIMIT 1;
  
  -- If candidate doesn't exist, add them
  IF v_existing_candidate IS NULL THEN
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
      v_student.phone::TEXT,
      'sourced', -- Start at sourced stage
      'direct_application', -- Mark as direct application
      'active',
      NOW(),
      NOW(),
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Added student % to pipeline for requisition %', v_student.name, v_opportunity.requisition_id;
  ELSE
    RAISE NOTICE 'Student % already in pipeline for requisition %', v_student.name, v_opportunity.requisition_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================================================================================
-- Step 3: Create trigger on applied_jobs table
-- ==================================================================================

DROP TRIGGER IF EXISTS trigger_auto_add_to_pipeline ON applied_jobs;

CREATE TRIGGER trigger_auto_add_to_pipeline
  AFTER INSERT ON applied_jobs
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_applicant_to_pipeline();

COMMENT ON TRIGGER trigger_auto_add_to_pipeline ON applied_jobs IS 
  'Automatically adds students to pipeline_candidates when they apply to a job';

-- ==================================================================================
-- Step 4: Helper function to manually sync existing applications to pipeline
-- ==================================================================================

CREATE OR REPLACE FUNCTION sync_existing_applications_to_pipeline()
RETURNS TABLE (
  synced_count INTEGER,
  skipped_count INTEGER,
  error_count INTEGER
) AS $$
DECLARE
  v_synced INTEGER := 0;
  v_skipped INTEGER := 0;
  v_error INTEGER := 0;
  v_application RECORD;
  v_opportunity RECORD;
  v_student RECORD;
  v_existing_candidate INTEGER;
BEGIN
  -- Loop through all applications
  FOR v_application IN
    SELECT aj.id, aj.student_id, aj.opportunity_id, aj.applied_at
    FROM applied_jobs aj
    WHERE aj.application_status NOT IN ('withdrawn', 'rejected')
    ORDER BY aj.applied_at DESC
  LOOP
    BEGIN
      -- Get opportunity details
      SELECT o.requisition_id, o.job_title, o.title
      INTO v_opportunity
      FROM opportunities o
      WHERE o.id = v_application.opportunity_id;
      
      -- Skip if no requisition
      IF v_opportunity.requisition_id IS NULL THEN
        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;
      
      -- Get student details
      SELECT 
        s.id,
        COALESCE(s.profile->>'name', 'Unknown Student') as name,
        COALESCE(s.profile->>'email', '') as email,
        COALESCE(s.profile->>'contact_number', '') as phone
      INTO v_student
      FROM students s
      WHERE s.id = v_application.student_id;
      
      IF v_student.id IS NULL THEN
        v_skipped := v_skipped + 1;
        CONTINUE;
      END IF;
      
      -- Check if already in pipeline
      SELECT id INTO v_existing_candidate
      FROM pipeline_candidates
      WHERE requisition_id = v_opportunity.requisition_id
        AND student_id = v_application.student_id
      LIMIT 1;
      
      -- Add if not exists
      IF v_existing_candidate IS NULL THEN
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
          v_student.phone::TEXT,
          'sourced',
          'direct_application',
          'active',
          v_application.applied_at,
          v_application.applied_at,
          v_application.applied_at,
          NOW()
        );
        
        v_synced := v_synced + 1;
      ELSE
        v_skipped := v_skipped + 1;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      v_error := v_error + 1;
      RAISE NOTICE 'Error syncing application %: %', v_application.id, SQLERRM;
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_synced, v_skipped, v_error;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sync_existing_applications_to_pipeline() IS 
  'Manually sync existing applied_jobs records to pipeline_candidates. Run once after setup.';

-- ==================================================================================
-- Step 5: Create a view for easier querying of applications with pipeline status
-- ==================================================================================

CREATE OR REPLACE VIEW student_applications_with_pipeline AS
SELECT 
  aj.id as application_id,
  aj.student_id,
  aj.opportunity_id,
  aj.application_status,
  aj.applied_at,
  o.id as opportunity_id,
  o.job_title,
  o.title,
  o.company_name,
  o.location,
  o.requisition_id,
  pc.id as pipeline_candidate_id,
  pc.stage as pipeline_stage,
  pc.status as pipeline_status,
  pc.stage_changed_at as pipeline_stage_changed_at,
  pc.next_action,
  pc.next_action_date,
  pc.rejection_reason,
  pc.recruiter_notes
FROM applied_jobs aj
LEFT JOIN opportunities o ON aj.opportunity_id = o.id
LEFT JOIN pipeline_candidates pc ON pc.requisition_id = o.requisition_id 
  AND pc.student_id = aj.student_id
  AND pc.status = 'active'
ORDER BY aj.applied_at DESC;

COMMENT ON VIEW student_applications_with_pipeline IS 
  'Combined view of student applications with their pipeline status';

-- ==================================================================================
-- Step 6: Instructions for linking existing opportunities to requisitions
-- ==================================================================================

-- You need to manually link opportunities to requisitions.
-- Here's a template query to help:

-- Example 1: Link by job title match
-- UPDATE opportunities o
-- SET requisition_id = r.id
-- FROM requisitions r
-- WHERE o.requisition_id IS NULL
--   AND LOWER(o.job_title) = LOWER(r.title)
--   OR LOWER(o.title) = LOWER(r.title);

-- Example 2: Create requisitions for opportunities that don't have one
-- INSERT INTO requisitions (
--   id,
--   title,
--   department,
--   location,
--   job_type,
--   status,
--   priority,
--   description,
--   salary_range,
--   created_date
-- )
-- SELECT
--   'req_' || o.id,
--   COALESCE(o.job_title, o.title),
--   COALESCE(o.department, 'General'),
--   o.location,
--   o.employment_type,
--   'active',
--   'medium',
--   o.description,
--   o.stipend_or_salary,
--   o.created_at
-- FROM opportunities o
-- WHERE o.requisition_id IS NULL
--   AND o.is_active = true;

-- Then update opportunities to link to these new requisitions:
-- UPDATE opportunities o
-- SET requisition_id = 'req_' || o.id
-- WHERE o.requisition_id IS NULL;

-- ==================================================================================
-- Step 7: Run sync function for existing data (OPTIONAL - run after linking)
-- ==================================================================================

-- After you've linked opportunities to requisitions, run this to sync existing applications:
-- SELECT * FROM sync_existing_applications_to_pipeline();

-- This will return:
-- synced_count   | Number of students added to pipeline
-- skipped_count  | Number of applications skipped (no requisition or already in pipeline)
-- error_count    | Number of errors encountered

-- ==================================================================================
-- TESTING QUERIES
-- ==================================================================================

-- Check if opportunities are linked to requisitions:
-- SELECT 
--   o.id,
--   o.job_title,
--   o.title,
--   o.requisition_id,
--   r.title as requisition_title
-- FROM opportunities o
-- LEFT JOIN requisitions r ON o.requisition_id = r.id
-- ORDER BY o.created_at DESC
-- LIMIT 20;

-- Check applications with pipeline status:
-- SELECT * FROM student_applications_with_pipeline LIMIT 20;

-- Check pipeline candidates from direct applications:
-- SELECT 
--   pc.candidate_name,
--   pc.stage,
--   pc.source,
--   r.title as job_title,
--   pc.added_at
-- FROM pipeline_candidates pc
-- LEFT JOIN requisitions r ON pc.requisition_id = r.id
-- WHERE pc.source = 'direct_application'
-- ORDER BY pc.added_at DESC;
