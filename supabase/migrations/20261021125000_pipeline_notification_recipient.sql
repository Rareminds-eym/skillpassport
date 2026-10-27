CREATE OR REPLACE FUNCTION public.create_notification_from_pipeline_activity()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_learner_id UUID;
  v_recipient_id UUID;
  v_candidate_name TEXT;
  v_opportunity_title TEXT;
  v_notification_type TEXT;
  v_notification_title TEXT;
  v_notification_message TEXT;
BEGIN
  IF NEW.activity_type = 'assigned' THEN RETURN NEW; END IF;
  -- Get learner ID from pipeline_candidates
  SELECT learner_id INTO v_learner_id
  FROM pipeline_candidates
  WHERE id = NEW.candidate_uuid OR (NEW.candidate_uuid IS NULL AND id_old = NEW.pipeline_candidate_id)
  LIMIT 1;

  -- Get candidate name and opportunity title
  SELECT
    pc.candidate_name,
    o.title
  INTO
    v_candidate_name,
    v_opportunity_title
  FROM pipeline_candidates pc
  LEFT JOIN opportunities o ON pc.opportunity_id = o.id
  WHERE pc.id = NEW.candidate_uuid OR (NEW.candidate_uuid IS NULL AND pc.id_old = NEW.pipeline_candidate_id)
  LIMIT 1;

  -- Determine notification type and message based on activity
  IF NEW.activity_type = 'stage_change' OR NEW.activity_type = 'rejected' THEN
    -- Stage change notification
    v_notification_type := 'pipeline_stage_changed';

    IF NEW.to_stage = 'hired' THEN
      v_notification_title := 'Congratulations! You''ve been hired!';
      v_notification_message := 'Great news! You have been selected for the position of ' || COALESCE(v_opportunity_title, 'the opportunity') || '.';
    ELSIF NEW.to_stage = 'offer' THEN
      v_notification_title := 'Offer Extended!';
      v_notification_message := 'You have received an offer for ' || COALESCE(v_opportunity_title, 'a position') || '. Review the details in your dashboard.';
    ELSIF NEW.to_stage = 'interview_2' THEN
      v_notification_title := 'Advanced to Final Interview';
      v_notification_message := 'Congratulations! You have been selected for the final interview round for ' || COALESCE(v_opportunity_title, 'a position') || '.';
    ELSIF NEW.to_stage = 'interview_1' THEN
      v_notification_title := 'Interview Scheduled';
      v_notification_message := 'You have been selected for an interview for ' || COALESCE(v_opportunity_title, 'a position') || '.';
    ELSIF NEW.to_stage = 'screened' THEN
      v_notification_title := 'Application Screened';
      v_notification_message := 'Your application for ' || COALESCE(v_opportunity_title, 'a position') || ' is under review.';
    ELSIF NEW.to_stage = 'rejected' OR NEW.activity_type = 'rejected' THEN
      v_notification_type := 'candidate_rejected';
      v_notification_title := 'Application Status Update';
      v_notification_message := 'Thank you for your interest in ' || COALESCE(v_opportunity_title, 'a position') || '. We have decided to move forward with other candidates.';
    END IF;

  ELSIF NEW.activity_type = 'note_added' THEN
    v_notification_type := 'pipeline_stage_changed';
    v_notification_title := 'Update on your application';
    v_notification_message := 'Your application for ' || COALESCE(v_opportunity_title, 'a position') || ' has been updated.';

  ELSIF NEW.activity_type = 'next_action_set' THEN
    v_notification_type := 'interview_reminder';
    v_notification_title := 'Action Required';
    v_notification_message := 'Next steps for your application for ' || COALESCE(v_opportunity_title, 'a position') || ' have been set.';

  ELSE
    -- For other activity types, use generic notification
    v_notification_type := 'pipeline_stage_changed';
    v_notification_title := 'Application Update';
    v_notification_message := 'Your application for ' || COALESCE(v_opportunity_title, 'a position') || ' has been updated.';
  END IF;

  -- Only create notification if learner_id exists
  IF v_learner_id IS NOT NULL THEN
    -- Store learner_id in the pipeline_activities record if not already set
    IF NEW.learner_id IS NULL THEN
      NEW.learner_id := v_learner_id;
    END IF;

    SELECT user_id INTO v_recipient_id FROM learners WHERE id=v_learner_id;
    IF v_recipient_id IS NULL OR NOT EXISTS(SELECT 1 FROM users WHERE id=v_recipient_id) THEN RETURN NEW; END IF;
    -- Notifications reference users.id, while pipeline candidates reference learners.id.
    INSERT INTO notifications (
      recipient_id,
      type,
      title,
      message,
      read,
      created_at
    ) VALUES (
      v_recipient_id,
      v_notification_type,
      v_notification_title,
      v_notification_message,
      false,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$function$
