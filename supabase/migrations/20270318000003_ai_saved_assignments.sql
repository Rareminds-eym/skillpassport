BEGIN;
CREATE TYPE ai_assignment_result_status AS ENUM ('pending','evaluating','review_required','released','failed');
CREATE TABLE ai_assignments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), course_id uuid NOT NULL REFERENCES courses(course_id),
 title text NOT NULL, content jsonb NOT NULL, grading_rules jsonb NOT NULL,
 generation_config jsonb NOT NULL DEFAULT '{}', request_fingerprint text NOT NULL, context_fingerprint text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(course_id,request_fingerprint,context_fingerprint)
);
CREATE TABLE ai_lesson_plans (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), course_id uuid NOT NULL REFERENCES courses(course_id),
 title text NOT NULL, content jsonb NOT NULL, generation_config jsonb NOT NULL DEFAULT '{}',
 request_fingerprint text NOT NULL, context_fingerprint text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(course_id,request_fingerprint,context_fingerprint)
);
CREATE TABLE ai_assignment_learners (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), assignment_id uuid NOT NULL REFERENCES ai_assignments(id),
 learner_id uuid NOT NULL REFERENCES learners(id), assigned_by uuid NOT NULL REFERENCES users(id),
 due_at timestamptz NOT NULL, assigned_at timestamptz NOT NULL DEFAULT now(), UNIQUE(assignment_id,learner_id),
 school_allocation_id uuid REFERENCES learner_assignments(learner_assignment_id),
 college_allocation_id uuid REFERENCES college_learner_assignments(learner_assignment_id),
 CHECK(school_allocation_id IS NULL OR college_allocation_id IS NULL)
);
CREATE TABLE ai_assignment_submissions (
 id uuid PRIMARY KEY, assignment_learner_id uuid NOT NULL UNIQUE REFERENCES ai_assignment_learners(id),
 file_key text NOT NULL UNIQUE, file_name text NOT NULL, mime_type text NOT NULL,
 submitted_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE ai_assignment_results (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), submission_id uuid NOT NULL UNIQUE REFERENCES ai_assignment_submissions(id),
 status ai_assignment_result_status NOT NULL DEFAULT 'pending', question_results jsonb NOT NULL DEFAULT '[]',
 total_marks numeric, maximum_marks numeric, feedback text, model text,
 reviewed_by uuid REFERENCES users(id), released_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_assignment_learner_user_idx ON ai_assignment_learners(learner_id);
CREATE INDEX ai_assignment_educator_idx ON ai_assignment_learners(assigned_by);
DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['ai_assignments','ai_lesson_plans','ai_assignment_learners','ai_assignment_submissions','ai_assignment_results'] LOOP
 EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('REVOKE ALL ON %I FROM anon,authenticated',t);
 EXECUTE format('GRANT ALL ON %I TO service_role',t);
END LOOP; END $$;
CREATE FUNCTION immutable_ai_material() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Saved material is immutable; save a new revision'; END $$;
CREATE TRIGGER ai_assignment_immutable BEFORE UPDATE OR DELETE ON ai_assignments FOR EACH ROW EXECUTE FUNCTION immutable_ai_material();
CREATE TRIGGER ai_lesson_plan_immutable BEFORE UPDATE OR DELETE ON ai_lesson_plans FOR EACH ROW EXECUTE FUNCTION immutable_ai_material();

-- Chat metadata is not an extra library table. Updates are atomic and preserve concurrent chat messages.
CREATE FUNCTION set_ai_material_choice(p_user uuid,p_conversation uuid,p_message uuid,p_choice jsonb) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE changed integer;
BEGIN
 UPDATE tutor_conversations SET messages=(SELECT jsonb_agg(CASE WHEN item->>'id'=p_message::text AND item->>'role'='assistant'
 THEN item||jsonb_build_object('materialChoice',p_choice) ELSE item END ORDER BY ord)
 FROM jsonb_array_elements(messages) WITH ORDINALITY x(item,ord))
 WHERE id=p_conversation AND learner_id=p_user AND EXISTS(SELECT 1 FROM jsonb_array_elements(messages) m WHERE m->>'id'=p_message::text AND m->>'role'='assistant');
 GET DIAGNOSTICS changed=ROW_COUNT; RETURN changed=1;
END $$;

ALTER TABLE assignments ADD COLUMN saved_ai_assignment_id uuid REFERENCES ai_assignments(id);
ALTER TABLE college_assignments ADD COLUMN saved_ai_assignment_id uuid REFERENCES ai_assignments(id);
CREATE UNIQUE INDEX ai_school_saved_task ON assignments(saved_ai_assignment_id,educator_id,school_class_id) WHERE saved_ai_assignment_id IS NOT NULL;
CREATE UNIQUE INDEX ai_college_saved_task ON college_assignments(saved_ai_assignment_id,college_educator_id,program_section_id) WHERE saved_ai_assignment_id IS NOT NULL;

CREATE FUNCTION allocate_saved_ai_assignment(p_user uuid,p_assignment uuid,p_learners uuid[],p_due timestamptz) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a ai_assignments; c courses; org uuid; teacher uuid; target learners; task uuid; allocation uuid; rid uuid; maximum numeric; amount integer:=0; section record;
BEGIN
 SELECT * INTO a FROM ai_assignments WHERE id=p_assignment;
 IF NOT FOUND OR NOT can_access_course_ai(p_user,a.course_id) THEN RAISE EXCEPTION 'Course access required'; END IF;
 SELECT organization_id INTO org FROM ai_worksheet_educator_scope(p_user);
 IF org IS NULL OR p_due IS NULL OR p_due<=now() OR cardinality(p_learners) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'Mapped learners and a future deadline required'; END IF;
 IF EXISTS(SELECT 1 FROM unnest(p_learners) l WHERE NOT EXISTS(SELECT 1 FROM ai_worksheet_eligible_learners(p_user) e WHERE e.id=l)) THEN RAISE EXCEPTION 'Unmapped learner'; END IF;
 SELECT * INTO c FROM courses WHERE course_id=a.course_id;
 SELECT sum((q->>'maxMarks')::numeric) INTO maximum FROM jsonb_array_elements(a.content->'questions') q;
 IF maximum IS NULL OR maximum<=0 THEN RAISE EXCEPTION 'Reviewed questions required'; END IF;
 SELECT id INTO teacher FROM school_educators WHERE user_id=p_user AND school_id=org AND account_status='active' LIMIT 1;
 IF teacher IS NULL AND NOT EXISTS(SELECT 1 FROM college_lecturers WHERE user_id=p_user AND "collegeId"=org AND "accountStatus"='active') THEN RAISE EXCEPTION 'School or college educator profile required'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_assignment::text,0));
 IF EXISTS(SELECT 1 FROM ai_assignment_learners WHERE assignment_id=p_assignment AND assigned_by=p_user AND due_at<>p_due) THEN RAISE EXCEPTION 'Reuse the existing allocation deadline'; END IF;
 FOR target IN SELECT * FROM learners WHERE id=ANY(p_learners) LOOP
  SELECT id INTO rid FROM ai_assignment_learners WHERE assignment_id=a.id AND learner_id=target.id;
  IF rid IS NOT NULL THEN
   IF NOT EXISTS(SELECT 1 FROM ai_assignment_learners WHERE id=rid AND assigned_by=p_user AND due_at=p_due) THEN RAISE EXCEPTION 'Existing allocation differs; do not overwrite it'; END IF;
   amount:=amount+1; CONTINUE;
  END IF;
  task:=NULL; allocation:=NULL;
  IF teacher IS NOT NULL THEN
   IF NOT EXISTS(SELECT 1 FROM school_classes WHERE id=target.school_class_id AND school_id=org) THEN RAISE EXCEPTION 'School class required'; END IF;
   INSERT INTO assignments(title,instructions,course_name,course_code,educator_id,total_points,assignment_type,school_class_id,assign_classes,due_date,available_from,allow_late_submission,saved_ai_assignment_id)
   VALUES(a.title,'Complete the saved assignment in Course assignments.',c.title,c.code,teacher,maximum,'quiz',target.school_class_id,target.school_class_id::text,p_due,now(),false,a.id)
   ON CONFLICT DO NOTHING RETURNING assignment_id INTO task;
   IF task IS NULL THEN SELECT assignment_id INTO task FROM assignments WHERE saved_ai_assignment_id=a.id AND educator_id=teacher AND school_class_id=target.school_class_id; END IF;
   INSERT INTO learner_assignments(assignment_id,learner_id) VALUES(task,target.user_id) ON CONFLICT(assignment_id,learner_id) DO NOTHING RETURNING learner_assignment_id INTO allocation;
   IF allocation IS NULL THEN SELECT learner_assignment_id INTO allocation FROM learner_assignments WHERE assignment_id=task AND learner_id=target.user_id; END IF;
   INSERT INTO ai_assignment_learners(assignment_id,learner_id,assigned_by,due_at,school_allocation_id) VALUES(a.id,target.id,p_user,p_due,allocation);
  ELSE
   SELECT ps.* INTO section FROM program_sections ps JOIN departments d ON d.id=ps.department_id WHERE ps.id=target.program_section_id AND ps.status='active' AND d.college_id=org;
   IF NOT FOUND THEN RAISE EXCEPTION 'College section required'; END IF;
   INSERT INTO college_assignments(title,instructions,course_name,course_code,college_id,college_educator_id,program_section_id,department_id,program_id,total_points,assignment_type,due_date,available_from,allow_late_submission,saved_ai_assignment_id)
   VALUES(a.title,'Complete the saved assignment in Course assignments.',c.title,c.code,org,p_user,section.id,section.department_id,section.program_id,maximum,'quiz',p_due,now(),false,a.id)
   ON CONFLICT DO NOTHING RETURNING assignment_id INTO task;
   IF task IS NULL THEN SELECT assignment_id INTO task FROM college_assignments WHERE saved_ai_assignment_id=a.id AND college_educator_id=p_user AND program_section_id=section.id; END IF;
   INSERT INTO college_learner_assignments(assignment_id,learner_id) VALUES(task,target.user_id) ON CONFLICT(assignment_id,learner_id) DO NOTHING RETURNING learner_assignment_id INTO allocation;
   IF allocation IS NULL THEN SELECT learner_assignment_id INTO allocation FROM college_learner_assignments WHERE assignment_id=task AND learner_id=target.user_id; END IF;
   INSERT INTO ai_assignment_learners(assignment_id,learner_id,assigned_by,due_at,college_allocation_id) VALUES(a.id,target.id,p_user,p_due,allocation);
  END IF;
  amount:=amount+1;
 END LOOP;
 RETURN amount;
END $$;
CREATE FUNCTION commit_ai_submission(p_user uuid,p_recipient uuid,p_id uuid,p_key text,p_name text,p_mime text) RETURNS uuid
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
 UPDATE learner_assignments SET status='submitted',submission_date=now(),updated_date=now() WHERE learner_assignment_id=r.school_allocation_id;
 UPDATE college_learner_assignments SET status='submitted',submission_date=now(),updated_date=now() WHERE learner_assignment_id=r.college_allocation_id;
 RETURN p_id;
END $$;
CREATE FUNCTION release_saved_ai_result(p_user uuid,p_result uuid,p_results jsonb,p_feedback text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE r ai_assignment_results; allocation ai_assignment_learners; a ai_assignments; total numeric:=0; maximum numeric:=0; q jsonb; item jsonb;
BEGIN
 SELECT * INTO r FROM ai_assignment_results WHERE id=p_result FOR UPDATE;
 SELECT al.* INTO allocation FROM ai_assignment_submissions s JOIN ai_assignment_learners al ON al.id=s.assignment_learner_id WHERE s.id=r.submission_id;
 IF allocation.assigned_by IS DISTINCT FROM p_user OR r.status NOT IN ('review_required','failed') THEN RAISE EXCEPTION 'Educator review required'; END IF;
 SELECT * INTO a FROM ai_assignments WHERE id=allocation.assignment_id;
 IF jsonb_array_length(p_results)<>jsonb_array_length(a.content->'questions') THEN RAISE EXCEPTION 'Every question requires a reviewed mark'; END IF;
 FOR q IN SELECT value FROM jsonb_array_elements(a.content->'questions') LOOP
  SELECT value INTO item FROM jsonb_array_elements(p_results) WHERE value->>'questionId'=q->>'id';
  IF item IS NULL OR (SELECT count(*) FROM jsonb_array_elements(p_results) WHERE value->>'questionId'=q->>'id')<>1 OR item->>'marks' IS NULL OR (item->>'marks')::numeric::text='NaN' OR (item->>'marks')::numeric NOT BETWEEN 0 AND (q->>'maxMarks')::numeric OR length(trim(COALESCE(item->>'reason','')))=0 THEN RAISE EXCEPTION 'Valid marks and review reasons required'; END IF;
  total:=total+(item->>'marks')::numeric; maximum:=maximum+(q->>'maxMarks')::numeric;
 END LOOP;
 UPDATE ai_assignment_results SET status='released',question_results=jsonb_build_object('ai',r.question_results,'review',p_results),total_marks=total,maximum_marks=maximum,feedback=p_feedback,reviewed_by=p_user,released_at=now(),updated_at=now() WHERE id=r.id;
 UPDATE learner_assignments SET status='graded',grade_received=total,grade_percentage=round(total/maximum*100,2),instructor_feedback=p_feedback,graded_by=p_user,graded_date=now(),feedback_date=now(),updated_date=now() WHERE learner_assignment_id=allocation.school_allocation_id;
 UPDATE college_learner_assignments SET status='graded',grade_received=total,grade_percentage=round(total/maximum*100,2),instructor_feedback=p_feedback,graded_by=p_user,graded_date=now(),feedback_date=now(),updated_date=now() WHERE learner_assignment_id=allocation.college_allocation_id;
END $$;
-- Existing status/grade endpoints must not bypass the submitted document and released result.
CREATE FUNCTION guard_saved_ai_task_update() RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE allocation uuid; submission uuid; released ai_assignment_results;
BEGIN
 IF TG_TABLE_NAME='learner_assignments' THEN SELECT id INTO allocation FROM ai_assignment_learners WHERE school_allocation_id=NEW.learner_assignment_id;
 ELSE SELECT id INTO allocation FROM ai_assignment_learners WHERE college_allocation_id=NEW.learner_assignment_id; END IF;
 IF allocation IS NULL THEN RETURN NEW; END IF;
 SELECT id INTO submission FROM ai_assignment_submissions WHERE assignment_learner_id=allocation;
 SELECT * INTO released FROM ai_assignment_results WHERE submission_id=submission AND status='released';
 IF released.id IS NOT NULL THEN
  IF NEW.status<>'graded' OR NEW.grade_received IS DISTINCT FROM released.total_marks OR NEW.grade_percentage IS DISTINCT FROM round(released.total_marks/released.maximum_marks*100,2) OR NEW.instructor_feedback IS DISTINCT FROM released.feedback THEN RAISE EXCEPTION 'Released AI result is authoritative'; END IF;
 ELSIF submission IS NOT NULL THEN
  IF NEW.status<>'submitted' OR NEW.grade_received IS NOT NULL OR NEW.grade_percentage IS NOT NULL THEN RAISE EXCEPTION 'Educator result release required'; END IF;
 ELSIF NEW.status IN ('submitted','graded') OR NEW.grade_received IS NOT NULL OR NEW.grade_percentage IS NOT NULL THEN RAISE EXCEPTION 'Submit the completed document first'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER saved_ai_school_task_guard BEFORE UPDATE ON learner_assignments FOR EACH ROW EXECUTE FUNCTION guard_saved_ai_task_update();
CREATE TRIGGER saved_ai_college_task_guard BEFORE UPDATE ON college_learner_assignments FOR EACH ROW EXECUTE FUNCTION guard_saved_ai_task_update();
REVOKE ALL ON FUNCTION guard_saved_ai_task_update() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION immutable_ai_material(),set_ai_material_choice(uuid,uuid,uuid,jsonb),allocate_saved_ai_assignment(uuid,uuid,uuid[],timestamptz),commit_ai_submission(uuid,uuid,uuid,text,text,text),release_saved_ai_result(uuid,uuid,jsonb,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION set_ai_material_choice(uuid,uuid,uuid,jsonb),allocate_saved_ai_assignment(uuid,uuid,uuid[],timestamptz),commit_ai_submission(uuid,uuid,uuid,text,text,text),release_saved_ai_result(uuid,uuid,jsonb,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
