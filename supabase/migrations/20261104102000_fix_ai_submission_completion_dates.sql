-- Set completion dates when mirroring AI document submissions to standard tasks.
CREATE OR REPLACE FUNCTION commit_ai_submission(p_user uuid,p_recipient uuid,p_id uuid,p_key text,p_name text,p_mime text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r ai_assignment_learners; expected text; course uuid;
BEGIN
 SELECT al.* INTO r FROM ai_assignment_learners al JOIN learners l ON l.id=al.learner_id WHERE al.id=p_recipient AND l.user_id=p_user FOR UPDATE OF al;
 IF NOT FOUND OR r.due_at<now() THEN RAISE EXCEPTION 'Submission not permitted'; END IF;
 IF EXISTS(SELECT 1 FROM ai_assignment_submissions WHERE assignment_learner_id=r.id) THEN RAISE EXCEPTION 'Already submitted'; END IF;
 SELECT course_id INTO course FROM ai_assignments WHERE id=r.assignment_id;
 expected:='courses/'||course||'/ai-assignments/'||r.assignment_id||'/submissions/'||r.id||'/'||p_id||'/';
 IF left(p_key,length(expected))<>expected THEN RAISE EXCEPTION 'Invalid submission storage path'; END IF;
 INSERT INTO ai_assignment_submissions(id,assignment_learner_id,file_key,file_name,mime_type) VALUES(p_id,r.id,p_key,p_name,p_mime);
 INSERT INTO ai_assignment_results(submission_id) VALUES(p_id);
 UPDATE learner_assignments SET status='submitted',submission_date=now(),completed_date=COALESCE(completed_date,now()),updated_date=now() WHERE learner_assignment_id=r.school_allocation_id;
 UPDATE college_learner_assignments SET status='submitted',submission_date=now(),completed_date=COALESCE(completed_date,now()),updated_date=now() WHERE learner_assignment_id=r.college_allocation_id;
 RETURN p_id;
END $$;
