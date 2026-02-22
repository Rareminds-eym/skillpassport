-- Automatically sync pipeline stage to 'hired' and notify recruiter when candidate accepts offer

CREATE OR REPLACE FUNCTION sync_pipeline_on_offer_acceptance()
RETURNS TRIGGER AS $$
DECLARE
  v_pipeline_candidate_id UUID;
  v_recruiter_id UUID;
  v_opportunity RECORD;
  v_student_name TEXT;
BEGIN
  -- Only proceed if offer_status changed to 'accepted'
  IF NEW.offer_status = 'accepted' AND (OLD.offer_status IS NULL OR OLD.offer_status != 'accepted') THEN
    
    -- Get opportunity details
    SELECT id, job_title, company_name, recruiter_id
    INTO v_opportunity
    FROM opportunities
    WHERE id = NEW.opportunity_id;
    
    -- Get student name
    SELECT name INTO v_student_name
    FROM students
    WHERE id = NEW.student_id;
    
    -- Find the pipeline candidate and get recruiter from stage_changed_by or created_by
    SELECT 
      pc.id,
      COALESCE(
        v_opportunity.recruiter_id,
        (SELECT user_id FROM recruiters WHERE id::text = pc.stage_changed_by LIMIT 1),
        (SELECT user_id FROM recruiters WHERE id::text = pc.created_by LIMIT 1)
      ) as recruiter_user_id
    INTO v_pipeline_candidate_id, v_recruiter_id
    FROM pipeline_candidates pc
    WHERE pc.student_id = NEW.student_id
    AND pc.opportunity_id = NEW.opportunity_id
    LIMIT 1;
    
    -- Update pipeline stage to 'hired' if candidate exists in pipeline
    IF v_pipeline_candidate_id IS NOT NULL THEN
      UPDATE pipeline_candidates
      SET 
        stage = 'hired',
        previous_stage = stage,
        stage_changed_at = NOW(),
        updated_at = NOW()
      WHERE id = v_pipeline_candidate_id;
      
      -- Log the activity
      INSERT INTO pipeline_activity (
        pipeline_candidate_id,
        activity_type,
        from_stage,
        to_stage,
        activity_details,
        student_id,
        created_at
      )
      SELECT 
        v_pipeline_candidate_id,
        'stage_change',
        stage,
        'hired',
        jsonb_build_object('reason', 'Candidate accepted offer'),
        NEW.student_id,
        NOW()
      FROM pipeline_candidates
      WHERE id = v_pipeline_candidate_id;
    END IF;
    
    -- Notify the recruiter if found
    IF v_recruiter_id IS NOT NULL THEN
      INSERT INTO notifications (
        recipient_id,
        type,
        title,
        message,
        read,
        created_at
      ) VALUES (
        v_recruiter_id,
        'offer_accepted',
        'Candidate Accepted Offer! 🎉',
        COALESCE(v_student_name, 'A candidate') || ' has accepted the offer for ' || v_opportunity.job_title || ' at ' || v_opportunity.company_name,
        false,
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_sync_pipeline_on_offer_acceptance ON applied_jobs;
CREATE TRIGGER trigger_sync_pipeline_on_offer_acceptance
  AFTER UPDATE OF offer_status ON applied_jobs
  FOR EACH ROW
  EXECUTE FUNCTION sync_pipeline_on_offer_acceptance();
