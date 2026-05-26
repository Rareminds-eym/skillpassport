-- Migration: Fix offer acceptance triggers and add rejection notifications
-- Date: 2026-05-13
-- Description:
-- 1. Fix decrease_openings_on_offer_acceptance to check application_status instead of nonexistent offer_status
-- 2. Fix sync_pipeline_on_offer_acceptance to use correct columns (stage_changed_by, added_by instead of created_by)
-- 3. Add notify_recruiter_on_offer_rejection to send notification when candidate declines offer

-- Fix 1: Update decrease_openings_on_offer_acceptance function
CREATE OR REPLACE FUNCTION "public"."decrease_openings_on_offer_acceptance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Check if application status changed to 'accepted'
  IF NEW.application_status = 'accepted' AND (OLD.application_status IS NULL OR OLD.application_status != 'accepted') THEN
    -- Decrease openings count
    UPDATE opportunities
    SET applications_count = GREATEST(0, applications_count - 1),
        updated_at = NOW()
    WHERE id = NEW.opportunity_id
    AND applications_count > 0;

    -- If applications_count reach 0, mark opportunity as filled
    UPDATE opportunities
    SET status = 'filled',
        is_active = false,
        updated_at = NOW()
    WHERE id = NEW.opportunity_id
    AND applications_count = 0;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix 2a: Add new function to handle offer rejection notifications
CREATE OR REPLACE FUNCTION "public"."notify_recruiter_on_offer_rejection"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_opportunity RECORD;
  v_learner_name TEXT;
  v_recruiter_id UUID;
  v_message TEXT;
BEGIN
  -- Only proceed if application status changed TO 'rejected' (from something else)
  IF NEW.application_status = 'rejected' AND (OLD.application_status IS NULL OR OLD.application_status != 'rejected') THEN

    -- Get opportunity details with all recruiter info
    SELECT id, job_title, company_name, recruiter_id
    INTO v_opportunity
    FROM opportunities
    WHERE id = NEW.opportunity_id;

    -- If opportunity not found, exit gracefully
    IF v_opportunity IS NULL OR v_opportunity.id IS NULL THEN
      RETURN NEW;
    END IF;

    -- Get learner name
    SELECT name INTO v_learner_name
    FROM learners
    WHERE id = NEW.learner_id;

    -- Get recruiter_id from opportunity (if NULL, we still create notification for tracking)
    v_recruiter_id := v_opportunity.recruiter_id;

    -- If no recruiter assigned to opportunity, try to find from pipeline candidate
    -- stage_changed_by already contains the user_id (UUID), cast it directly
    IF v_recruiter_id IS NULL THEN
      SELECT
        COALESCE(
          (pc.stage_changed_by)::uuid,
          (pc.added_by)::uuid
        )
      INTO v_recruiter_id
      FROM pipeline_candidates pc
      WHERE pc.learner_id = NEW.learner_id
      AND pc.opportunity_id = NEW.opportunity_id
      LIMIT 1;
    END IF;

    -- Build message with optional reason
    v_message := COALESCE(v_learner_name, 'A candidate') || ' has declined the offer for ' || v_opportunity.job_title || ' at ' || v_opportunity.company_name;
    IF NEW.notes IS NOT NULL AND NEW.notes != '' THEN
      v_message := v_message || '. Reason: ' || NEW.notes;
    END IF;

    -- Notify the recruiter if found
    IF v_recruiter_id IS NOT NULL THEN
      BEGIN
        INSERT INTO notifications (
          recipient_id,
          type,
          title,
          message,
          read
        ) VALUES (
          v_recruiter_id,
          'offer_rejected',
          'Candidate Declined Offer',
          v_message,
          false
        );
      EXCEPTION WHEN OTHERS THEN
        -- Silently ignore errors - don't block the main operation
        NULL;
      END;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Fix 2b: Update sync_pipeline_on_offer_acceptance function
-- Issue: pc.created_by column doesn't exist, should use pc.stage_changed_by and pc.added_by
-- These columns store recruiter user_id as TEXT, need to cast to UUID
CREATE OR REPLACE FUNCTION "public"."sync_pipeline_on_offer_acceptance"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_pipeline_candidate_id UUID;
  v_recruiter_id UUID;
  v_opportunity RECORD;
  v_learner_name TEXT;
BEGIN
  -- Only proceed if application_status changed to 'accepted'
  IF NEW.application_status = 'accepted' AND (OLD.application_status IS NULL OR OLD.application_status != 'accepted') THEN

    -- Get opportunity details
    SELECT id, job_title, company_name, recruiter_id
    INTO v_opportunity
    FROM opportunities
    WHERE id = NEW.opportunity_id;

    -- Get learner name
    SELECT name INTO v_learner_name
    FROM learners
    WHERE id = NEW.learner_id;

    -- Find the pipeline candidate and get recruiter from opportunity or pipeline stage changes
    -- stage_changed_by and added_by store recruiter user_id as TEXT, cast to UUID
    SELECT
      pc.id,
      COALESCE(
        v_opportunity.recruiter_id,
        (pc.stage_changed_by)::uuid,
        (pc.added_by)::uuid
      ) as recruiter_user_id
    INTO v_pipeline_candidate_id, v_recruiter_id
    FROM pipeline_candidates pc
    WHERE pc.learner_id = NEW.learner_id
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
        COALESCE(v_learner_name, 'A candidate') || ' has accepted the offer for ' || v_opportunity.job_title || ' at ' || v_opportunity.company_name,
        false,
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for offer rejection notifications
CREATE OR REPLACE TRIGGER "trigger_notify_recruiter_on_offer_rejection"
AFTER UPDATE OF "application_status" ON "public"."applied_jobs"
FOR EACH ROW
EXECUTE FUNCTION "public"."notify_recruiter_on_offer_rejection"();
