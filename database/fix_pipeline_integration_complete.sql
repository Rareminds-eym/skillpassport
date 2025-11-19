-- ==================================================================================
-- COMPLETE FIX: Student Application to Pipeline Integration
-- ==================================================================================
-- This script completely fixes the issue where students applying to jobs don't 
-- appear in the recruiter's pipeline.
--
-- RUN THIS SCRIPT IN YOUR SUPABASE SQL EDITOR
-- ==================================================================================

-- STEP 1: Add requisition_id column to opportunities table (if not exists)
-- ==================================================================================
ALTER TABLE opportunities 
ADD COLUMN IF NOT EXISTS requisition_id TEXT REFERENCES requisitions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_requisition_id ON opportunities(requisition_id);

-- STEP 2: Create or update requisitions for each opportunity
-- ==================================================================================
-- Option A: If you don't have requisitions, create them from opportunities
INSERT INTO requisitions (
  id,
  title,
  department,
  location,
  job_type,
  status,
  priority,
  description,
  salary_range,
  created_date,
  owner,
  hiring_manager
)
SELECT
  'req_opp_' || o.id::TEXT,
  COALESCE(o.job_title, o.title, 'Untitled Position'),
  COALESCE(o.department, 'General'),
  COALESCE(o.location, 'Not Specified'),
  COALESCE(o.employment_type, 'full_time'),
  CASE WHEN o.is_active = true THEN 'active' ELSE 'closed' END,
  'medium',
  COALESCE(o.description, ''),
  COALESCE(
    CASE 
      WHEN o.salary_range_min IS NOT NULL AND o.salary_range_max IS NOT NULL 
      THEN o.salary_range_min::TEXT || ' - ' || o.salary_range_max::TEXT
      WHEN o.stipend_or_salary IS NOT NULL 
      THEN o.stipend_or_salary
      ELSE 'Not Specified'
    END,
    'Not Specified'
  ),
  COALESCE(o.created_at, NOW()),
  COALESCE(o.recruiter_id, (SELECT id FROM auth.users LIMIT 1)),
  COALESCE(o.recruiter_id, (SELECT id FROM auth.users LIMIT 1))
FROM opportunities o
WHERE NOT EXISTS (
  SELECT 1 FROM requisitions r WHERE r.id = 'req_opp_' || o.id::TEXT
)
ON CONFLICT (id) DO NOTHING;

-- STEP 3: Link opportunities to their requisitions
-- ==================================================================================
UPDATE opportunities o
SET requisition_id = 'req_opp_' || o.id::TEXT
WHERE requisition_id IS NULL;

-- STEP 4: Create the auto-add function
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
  
  -- Get student details from the students table
  SELECT 
    s.id,
    COALESCE(
      s.profile->>'name',
      s.profile->>'firstName' || ' ' || s.profile->>'lastName',
      'Unknown Student'
    ) as name,
    COALESCE(
      s.profile->>'email',
      s.email,
      ''
    ) as email,
    COALESCE(
      s.profile->>'contact_number',
      s.profile->>'phone',
      ''
    ) as phone
  INTO v_student
  FROM students s
  WHERE s.id = NEW.student_id;
  
  -- If student not found, try to get basic info
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
        'sourced', -- Start at sourced stage
        'direct_application', -- Mark as direct application
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

-- STEP 5: Create the trigger
-- ==================================================================================
DROP TRIGGER IF EXISTS trigger_auto_add_to_pipeline ON applied_jobs;

CREATE TRIGGER trigger_auto_add_to_pipeline
  AFTER INSERT ON applied_jobs
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_applicant_to_pipeline();

-- STEP 6: Sync existing applications to pipeline
-- ==================================================================================
DO $$
DECLARE
  v_application RECORD;
  v_opportunity RECORD;
  v_student RECORD;
  v_existing_candidate INTEGER;
  v_synced INTEGER := 0;
  v_skipped INTEGER := 0;
  v_errors INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting sync of existing applications to pipeline...';
  
  FOR v_application IN
    SELECT aj.id, aj.student_id, aj.opportunity_id, aj.applied_at
    FROM applied_jobs aj
    WHERE aj.application_status NOT IN ('withdrawn')
    ORDER BY aj.applied_at DESC
  LOOP
    BEGIN
      -- Get opportunity details
      SELECT 
        o.requisition_id, 
        COALESCE(o.job_title, o.title) as job_title
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
        COALESCE(
          s.profile->>'name',
          s.profile->>'firstName' || ' ' || s.profile->>'lastName',
          'Unknown Student'
        ) as name,
        COALESCE(
          s.profile->>'email',
          s.email,
          ''
        ) as email,
        COALESCE(
          s.profile->>'contact_number',
          s.profile->>'phone',
          ''
        ) as phone
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
          v_student.phone,
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
      v_errors := v_errors + 1;
      RAISE NOTICE 'Error syncing application %: %', v_application.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Sync complete! Synced: %, Skipped: %, Errors: %', v_synced, v_skipped, v_errors;
END $$;

-- STEP 7: Create helpful view
-- ==================================================================================
CREATE OR REPLACE VIEW student_applications_with_pipeline AS
SELECT 
  aj.id as application_id,
  aj.student_id,
  aj.opportunity_id,
  aj.application_status,
  aj.applied_at,
  aj.updated_at,
  COALESCE(
    s.profile->>'name',
    s.profile->>'firstName' || ' ' || s.profile->>'lastName',
    'Unknown Student'
  ) as student_name,
  COALESCE(
    s.profile->>'email',
    s.email
  ) as student_email,
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

-- ==================================================================================
-- VERIFICATION QUERIES
-- ==================================================================================

-- Check the fix results
SELECT 
  '1. Total Opportunities' as metric,
  COUNT(*)::TEXT as count
FROM opportunities
UNION ALL
SELECT 
  '2. Opportunities with Requisition ID',
  COUNT(*)::TEXT
FROM opportunities
WHERE requisition_id IS NOT NULL
UNION ALL
SELECT 
  '3. Total Applications',
  COUNT(*)::TEXT
FROM applied_jobs
UNION ALL
SELECT 
  '4. Applications in Pipeline',
  COUNT(DISTINCT aj.id)::TEXT
FROM applied_jobs aj
JOIN opportunities o ON o.id = aj.opportunity_id
JOIN pipeline_candidates pc ON pc.requisition_id = o.requisition_id 
  AND pc.student_id = aj.student_id
UNION ALL
SELECT 
  '5. Total Pipeline Candidates',
  COUNT(*)::TEXT
FROM pipeline_candidates
WHERE status = 'active';

-- Show recent applications and their pipeline status
SELECT 
  application_id,
  student_name,
  job_title,
  company_name,
  application_status,
  is_in_pipeline,
  pipeline_stage,
  applied_at
FROM student_applications_with_pipeline
ORDER BY applied_at DESC
LIMIT 20;
