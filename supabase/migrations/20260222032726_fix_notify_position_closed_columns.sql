-- Fix notify_candidates_position_closed function to use correct column names
-- The notifications table uses 'recipient_id' not 'user_id'
-- and doesn't have a 'related_id' column

CREATE OR REPLACE FUNCTION notify_candidates_position_closed()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if openings_count reached 0
  IF NEW.openings_count = 0 AND (OLD.openings_count IS NULL OR OLD.openings_count > 0) THEN
    -- Insert notifications for all candidates who haven't been notified
    INSERT INTO notifications (
      recipient_id,
      type,
      title,
      message,
      read,
      created_at
    )
    SELECT 
      aj.student_id,
      'position_closed',
      'Position Filled - ' || NEW.job_title,
      'The position for ' || NEW.job_title || ' at ' || NEW.company_name || ' has been filled. All openings are now closed.',
      false,
      NOW()
    FROM applied_jobs aj
    WHERE aj.opportunity_id = NEW.id
    AND aj.offer_status IS DISTINCT FROM 'accepted'
    AND aj.position_closed_notification_sent = false
    AND aj.application_status NOT IN ('rejected', 'withdrawn');
    
    -- Mark notifications as sent
    UPDATE applied_jobs
    SET position_closed_notification_sent = true
    WHERE opportunity_id = NEW.id
    AND offer_status IS DISTINCT FROM 'accepted';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
