-- SQL Script to add AI Score visibility and Student Notifications
-- Run this in your Supabase SQL Editor

-- ==================== ADD AI SCORE FIELDS TO STUDENTS ====================
-- Add ai_score_overall column if it doesn't exist (stored in profile JSONB)
-- This is just documentation - the scores are already in profile JSONB

-- ==================== CREATE STUDENT NOTIFICATIONS TABLE ====================
CREATE TABLE IF NOT EXISTS student_notifications (
  id SERIAL PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'stage_change', 'interview_scheduled', 'offer_received', 'application_status', 'message'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entities
  pipeline_candidate_id INTEGER REFERENCES pipeline_candidates(id) ON DELETE CASCADE,
  requisition_id TEXT REFERENCES requisitions(id) ON DELETE CASCADE,
  interview_id TEXT REFERENCES interviews(id) ON DELETE CASCADE,
  application_id INTEGER, -- Link to applied_jobs if needed
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB, -- Store additional data like stage changes, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==================== INDEXES ====================
CREATE INDEX IF NOT EXISTS idx_student_notifications_student_id ON student_notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notifications_is_read ON student_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_student_notifications_created_at ON student_notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_student_notifications_type ON student_notifications(notification_type);

-- ==================== ROW LEVEL SECURITY ====================
ALTER TABLE student_notifications ENABLE ROW LEVEL SECURITY;

-- Students can view their own notifications
DROP POLICY IF EXISTS "Students can view own notifications" ON student_notifications;
CREATE POLICY "Students can view own notifications" 
  ON student_notifications FOR SELECT 
  USING (auth.uid() IN (SELECT user_id FROM students WHERE id = student_notifications.student_id));

-- Students can update their own notifications (mark as read)
DROP POLICY IF EXISTS "Students can update own notifications" ON student_notifications;
CREATE POLICY "Students can update own notifications" 
  ON student_notifications FOR UPDATE 
  USING (auth.uid() IN (SELECT user_id FROM students WHERE id = student_notifications.student_id));

-- Allow system/recruiters to insert notifications
DROP POLICY IF EXISTS "Allow inserting notifications" ON student_notifications;
CREATE POLICY "Allow inserting notifications" 
  ON student_notifications FOR INSERT 
  WITH CHECK (true);

-- ==================== FUNCTION TO CREATE STAGE CHANGE NOTIFICATION ====================
CREATE OR REPLACE FUNCTION notify_student_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if stage actually changed
  IF (TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage) THEN
    INSERT INTO student_notifications (
      student_id,
      notification_type,
      title,
      message,
      pipeline_candidate_id,
      requisition_id,
      metadata
    )
    VALUES (
      NEW.student_id,
      'stage_change',
      'Application Status Update',
      CASE 
        WHEN NEW.stage = 'rejected' THEN 
          'Your application status has been updated. Thank you for your interest.'
        WHEN NEW.stage = 'hired' THEN 
          'Congratulations! You have been selected for the position.'
        WHEN NEW.stage = 'offer' THEN 
          'Great news! An offer is being prepared for you.'
        WHEN NEW.stage LIKE 'interview%' THEN 
          'You have been shortlisted for an interview!'
        ELSE 
          'Your application has progressed to the next stage: ' || NEW.stage
      END,
      NEW.id,
      NEW.requisition_id,
      jsonb_build_object(
        'from_stage', OLD.stage,
        'to_stage', NEW.stage,
        'changed_at', NEW.stage_changed_at,
        'changed_by', NEW.stage_changed_by,
        'rejection_reason', NEW.rejection_reason
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== TRIGGER FOR STAGE CHANGES ====================
DROP TRIGGER IF EXISTS trigger_notify_student_stage_change ON pipeline_candidates;
CREATE TRIGGER trigger_notify_student_stage_change
  AFTER UPDATE ON pipeline_candidates
  FOR EACH ROW
  WHEN (OLD.stage IS DISTINCT FROM NEW.stage)
  EXECUTE FUNCTION notify_student_stage_change();

-- ==================== FUNCTION TO CREATE INTERVIEW NOTIFICATION ====================
CREATE OR REPLACE FUNCTION notify_student_interview()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'scheduled') THEN
    INSERT INTO student_notifications (
      student_id,
      notification_type,
      title,
      message,
      interview_id,
      metadata
    )
    VALUES (
      NEW.student_id,
      'interview_scheduled',
      'Interview Scheduled',
      'You have a ' || NEW.type || ' interview scheduled for ' || TO_CHAR(NEW.date, 'Mon DD, YYYY at HH:MI AM'),
      NEW.id,
      jsonb_build_object(
        'interview_type', NEW.type,
        'interview_date', NEW.date,
        'interviewer', NEW.interviewer,
        'meeting_type', NEW.meeting_type,
        'meeting_link', NEW.meeting_link,
        'duration', NEW.duration
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== TRIGGER FOR INTERVIEWS ====================
DROP TRIGGER IF EXISTS trigger_notify_student_interview ON interviews;
CREATE TRIGGER trigger_notify_student_interview
  AFTER INSERT ON interviews
  FOR EACH ROW
  WHEN (NEW.status = 'scheduled')
  EXECUTE FUNCTION notify_student_interview();

-- ==================== FUNCTION TO MARK NOTIFICATIONS AS READ ====================
CREATE OR REPLACE FUNCTION mark_notification_as_read(notification_id INTEGER, user_student_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE student_notifications
  SET 
    is_read = TRUE,
    read_at = NOW()
  WHERE 
    id = notification_id 
    AND student_id = user_student_id
    AND is_read = FALSE;
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== FUNCTION TO GET UNREAD COUNT ====================
CREATE OR REPLACE FUNCTION get_student_unread_notifications_count(user_student_id UUID)
RETURNS INTEGER AS $$
DECLARE
  unread_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO unread_count
  FROM student_notifications
  WHERE student_id = user_student_id
    AND is_read = FALSE;
  
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== SAMPLE TEST DATA (OPTIONAL) ====================
-- Uncomment to insert test notification
/*
INSERT INTO student_notifications (
  student_id,
  notification_type,
  title,
  message,
  metadata
) VALUES (
  (SELECT id FROM students LIMIT 1), -- Replace with actual student ID
  'stage_change',
  'Application Status Update',
  'Your application has progressed to Interview Round 1!',
  '{"from_stage": "screened", "to_stage": "interview_1"}'::jsonb
);
*/

-- ==================== VERIFY ====================
-- Check that the tables and functions were created
SELECT 'student_notifications table created' AS status
WHERE EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'student_notifications');

SELECT 'Triggers created successfully' AS status
WHERE EXISTS (
  SELECT FROM pg_trigger 
  WHERE tgname IN ('trigger_notify_student_stage_change', 'trigger_notify_student_interview')
);

-- Check indexes
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename = 'student_notifications'
ORDER BY indexname;
