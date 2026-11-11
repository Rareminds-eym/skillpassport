BEGIN;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata jsonb;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS event_key text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS notifications_event_key_unique ON public.notifications(event_key) WHERE event_key IS NOT NULL;

-- Only committed AI-domain transitions emit notifications; mirrored tasks do not.
CREATE OR REPLACE FUNCTION public.notify_saved_ai_assignment() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE allocation ai_assignment_learners; assignment ai_assignments; learner_user uuid;
 learner_name text; details jsonb; event text; batch_key text;
BEGIN
 IF TG_TABLE_NAME='ai_assignment_learners' THEN
  allocation:=NEW;
 ELSIF TG_TABLE_NAME='ai_assignment_submissions' THEN
  SELECT * INTO STRICT allocation FROM ai_assignment_learners WHERE id=NEW.assignment_learner_id;
 ELSE
  IF NEW.status<>'released' OR OLD.status='released' THEN RETURN NEW; END IF;
  SELECT al.* INTO STRICT allocation FROM ai_assignment_learners al JOIN ai_assignment_submissions s ON s.assignment_learner_id=al.id WHERE s.id=NEW.submission_id;
 END IF;
 SELECT * INTO STRICT assignment FROM ai_assignments WHERE id=allocation.assignment_id;
 SELECT user_id,name INTO STRICT learner_user,learner_name FROM learners WHERE id=allocation.learner_id;
 details:=jsonb_build_object('course_id',assignment.course_id,'assignment_id',assignment.id,'allocation_id',allocation.id);
 IF TG_TABLE_NAME='ai_assignment_learners' THEN
  INSERT INTO notifications(recipient_id,type,title,message,metadata,event_key)
  VALUES(learner_user,'assignment_assigned','New assignment',assignment.title||' — due '||to_char(allocation.due_at AT TIME ZONE 'UTC','DD Mon YYYY HH24:MI')||' UTC.',details,'ai:assigned:'||allocation.id) ON CONFLICT DO NOTHING;
  -- The allocator inserts in a loop: aggregate its transaction into one summary.
  batch_key:='ai:allocated:'||assignment.id||':'||allocation.assigned_by||':'||txid_current();
  INSERT INTO notifications(recipient_id,type,title,message,metadata,event_key)
  VALUES(allocation.assigned_by,'assignment_allocation_complete','Assignment sent',assignment.title||' assigned to 1 learner.',(details-'allocation_id')||jsonb_build_object('learner_count',1),batch_key)
  ON CONFLICT(event_key) WHERE event_key IS NOT NULL DO UPDATE SET
   metadata=notifications.metadata||jsonb_build_object('learner_count',(notifications.metadata->>'learner_count')::int+1),
   message=assignment.title||' assigned to '||((notifications.metadata->>'learner_count')::int+1)||' learners.';
 ELSIF TG_TABLE_NAME='ai_assignment_submissions' THEN
  details:=details||jsonb_build_object('submission_id',NEW.id);
  INSERT INTO notifications(recipient_id,type,title,message,metadata,event_key) VALUES
  (learner_user,'assignment_submission_received','Submission received','Your submission for '||assignment.title||' has been saved.',details,'ai:received:'||NEW.id),
  (allocation.assigned_by,'assignment_submitted','Learner submitted an assignment',coalesce(learner_name,'A learner')||' submitted '||assignment.title||'.',details,'ai:submitted:'||NEW.id)
  ON CONFLICT DO NOTHING;
 ELSE
  INSERT INTO notifications(recipient_id,type,title,message,metadata,event_key)
  VALUES(learner_user,'assignment_evaluated','Your results are ready','Results and feedback for '||assignment.title||' are available.',details||jsonb_build_object('submission_id',NEW.submission_id,'result_id',NEW.id),'ai:evaluated:'||NEW.id)
  ON CONFLICT DO NOTHING;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.notify_saved_ai_assignment() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER saved_ai_allocation_notification AFTER INSERT ON public.ai_assignment_learners FOR EACH ROW EXECUTE FUNCTION public.notify_saved_ai_assignment();
CREATE TRIGGER saved_ai_submission_notification AFTER INSERT ON public.ai_assignment_submissions FOR EACH ROW EXECUTE FUNCTION public.notify_saved_ai_assignment();
CREATE TRIGGER saved_ai_result_notification AFTER UPDATE OF status ON public.ai_assignment_results FOR EACH ROW EXECUTE FUNCTION public.notify_saved_ai_assignment();
NOTIFY pgrst,'reload schema';
COMMIT;
