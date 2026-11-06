// Dedicated disposable Docker database only. Never reads application credentials or DATABASE_URL.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const container = 'rm2-course-ai-test';
function docker(args, input) {
  const result = spawnSync('docker', args, { input, encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout);
  return result.stdout.trim();
}
if (docker(['inspect','--format','{{index .Config.Labels "rm2.task"}}', container]) !== 'course-ai') throw new Error('Dedicated test container label required');
const database = `course_ai_${Date.now()}`;
docker(['exec',container,'createdb','-U','postgres', database]);
const sql = input => docker(['exec','-i',container,'psql','-U','postgres','-d',database,'-v','ON_ERROR_STOP=1'], input);
try {
  sql(`DO $$ BEGIN CREATE ROLE anon; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE authenticated; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE ROLE service_role; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE SCHEMA extensions; CREATE EXTENSION vector WITH SCHEMA extensions;
CREATE TABLE users(id uuid PRIMARY KEY,role text);
CREATE TABLE courses(course_id uuid PRIMARY KEY,educator_id uuid,deleted_at timestamptz,status text DEFAULT 'Active',school_id uuid,title text DEFAULT 'Course',code text DEFAULT 'CODE');
CREATE TABLE course_modules(module_id uuid PRIMARY KEY,course_id uuid);
CREATE TABLE lessons(lesson_id uuid PRIMARY KEY,module_id uuid,content text);
CREATE TABLE video_summaries(lesson_id uuid,transcript text,summary text,processing_status text);
CREATE TABLE lesson_resources(resource_id uuid PRIMARY KEY,lesson_id uuid,name text,type text,url text,content text);
CREATE TABLE school_educators(id uuid,user_id uuid,account_status text,school_id uuid);
CREATE TABLE college_lecturers(user_id uuid,"collegeId" uuid,"accountStatus" text);
CREATE TABLE organization_staff(user_id uuid,organization_id uuid,account_status text);
CREATE TABLE course_enrollments(course_id uuid,learner_id uuid,educator_id uuid,status text);
CREATE TABLE tutor_conversations(id uuid PRIMARY KEY,learner_id uuid,course_id uuid,messages jsonb);
CREATE TABLE learners(id uuid PRIMARY KEY,user_id uuid UNIQUE,school_class_id uuid,program_section_id uuid);
CREATE TABLE school_classes(id uuid PRIMARY KEY,school_id uuid);
CREATE TABLE departments(id uuid PRIMARY KEY,college_id uuid);
CREATE TABLE program_sections(id uuid PRIMARY KEY,department_id uuid,program_id uuid,status text);
CREATE TABLE organization_members(organization_id uuid,user_id uuid,status text);
CREATE TABLE assignments(assignment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),title text,instructions text,course_name text,course_code text,educator_id uuid,total_points numeric,assignment_type text,school_class_id uuid,assign_classes text,due_date timestamptz,available_from timestamptz,allow_late_submission boolean);
CREATE TABLE college_assignments(assignment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),title text,instructions text,course_name text,course_code text,college_id uuid,college_educator_id uuid,program_section_id uuid,department_id uuid,program_id uuid,total_points numeric,assignment_type text,due_date timestamptz,available_from timestamptz,allow_late_submission boolean);
CREATE TABLE learner_assignments(learner_assignment_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),assignment_id uuid,learner_id uuid REFERENCES learners(user_id),status text DEFAULT 'todo',grade_received numeric,grade_percentage numeric,instructor_feedback text,graded_by uuid,graded_date timestamptz,feedback_date timestamptz,started_date timestamptz,submission_date timestamptz,completed_date timestamptz,is_late boolean,updated_date timestamptz,UNIQUE(assignment_id,learner_id));
CREATE TABLE college_learner_assignments(LIKE learner_assignments INCLUDING ALL);
CREATE TABLE notifications(id uuid DEFAULT gen_random_uuid(),recipient_id uuid,type text,title text,message text);
CREATE FUNCTION ai_worksheet_eligible_learners(p_user uuid) RETURNS TABLE(id uuid) LANGUAGE sql AS $$ SELECT l.id FROM learners l JOIN organization_members om ON om.user_id=l.user_id WHERE om.organization_id IN (SELECT organization_id FROM organization_members WHERE user_id=p_user AND status='active') AND om.status='active' $$;
`);

  sql(`CREATE FUNCTION ai_worksheet_educator_scope(p_user uuid) RETURNS TABLE(organization_id uuid) LANGUAGE sql AS $$ SELECT organization_id FROM organization_members WHERE user_id=p_user AND status='active' LIMIT 1 $$;`);
  for(const file of ['20270219021100_course_content_index.sql','20270219021200_ai_saved_assignments.sql']) sql(readFileSync(new URL(`../supabase/migrations/${file}`,import.meta.url),'utf8'));
  sql(`DO $$
DECLARE teacher uuid:=gen_random_uuid(); student uuid:=gen_random_uuid(); outsider uuid:=gen_random_uuid(); school uuid:=gen_random_uuid(); class_id uuid:=gen_random_uuid(); learner uuid:=gen_random_uuid(); course uuid:=gen_random_uuid(); material uuid; recipient uuid; submission uuid:=gen_random_uuid(); result uuid; question uuid:=gen_random_uuid(); conv uuid:=gen_random_uuid(); msg uuid:=gen_random_uuid(); amount integer; deadline timestamptz:=now()+interval '1 day'; storage text;
BEGIN
 INSERT INTO users VALUES(teacher,'school_educator'),(student,'learner'),(outsider,'learner');
 INSERT INTO organization_members VALUES(school,teacher,'active'),(school,student,'active');
 INSERT INTO school_classes VALUES(class_id,school); INSERT INTO school_educators VALUES(gen_random_uuid(),teacher,'active',school);
 INSERT INTO learners(id,user_id,school_class_id) VALUES(learner,student,class_id);
 INSERT INTO courses(course_id,educator_id) VALUES(course,teacher);
 INSERT INTO ai_assignments(course_id,title,content,grading_rules,request_fingerprint,context_fingerprint) VALUES(course,'Saved worksheet',jsonb_build_object('questions',jsonb_build_array(jsonb_build_object('id',question,'prompt','Choose A','maxMarks',2))),'[]','request','context') RETURNING id INTO material;
 BEGIN UPDATE ai_assignments SET title='Changed' WHERE id=material; RAISE EXCEPTION 'Immutable assignment changed'; EXCEPTION WHEN OTHERS THEN IF SQLERRM='Immutable assignment changed' THEN RAISE; END IF; END;
 amount:=allocate_saved_ai_assignment(teacher,material,ARRAY[learner],deadline);
 PERFORM allocate_saved_ai_assignment(teacher,material,ARRAY[learner],deadline);
 IF amount<>1 OR (SELECT count(*) FROM assignments WHERE saved_ai_assignment_id=material)<>1 OR (SELECT count(*) FROM ai_assignment_learners)<>1 THEN RAISE EXCEPTION 'Duplicate allocation'; END IF;
 SELECT id INTO recipient FROM ai_assignment_learners WHERE assignment_id=material;
 BEGIN UPDATE learner_assignments SET status='submitted'; RAISE EXCEPTION 'Submission bypass'; EXCEPTION WHEN OTHERS THEN IF SQLERRM='Submission bypass' THEN RAISE; END IF; END;
 storage:='courses/'||course||'/ai-assignments/'||material||'/submissions/'||recipient||'/'||submission||'/file.txt';
 BEGIN PERFORM commit_ai_submission(outsider,recipient,submission,storage,'answer.txt','text/plain'); RAISE EXCEPTION 'Unauthorized submission'; EXCEPTION WHEN OTHERS THEN IF SQLERRM='Unauthorized submission' THEN RAISE; END IF; END;
 PERFORM commit_ai_submission(student,recipient,submission,storage,'answer.txt','text/plain');
 IF (SELECT status FROM learner_assignments LIMIT 1)<>'submitted' THEN RAISE EXCEPTION 'Missing submission mirror'; END IF;
 SELECT id INTO result FROM ai_assignment_results WHERE submission_id=submission;
 BEGIN UPDATE learner_assignments SET status='graded',grade_received=2; RAISE EXCEPTION 'Premature grade'; EXCEPTION WHEN OTHERS THEN IF SQLERRM='Premature grade' THEN RAISE; END IF; END;
 UPDATE ai_assignment_results SET status='review_required',question_results='[]' WHERE id=result;
 BEGIN PERFORM release_saved_ai_result(outsider,result,jsonb_build_array(jsonb_build_object('questionId',question,'marks',1,'reason','Reviewed')),'Feedback'); RAISE EXCEPTION 'Unauthorized release'; EXCEPTION WHEN OTHERS THEN IF SQLERRM='Unauthorized release' THEN RAISE; END IF; END;
 PERFORM release_saved_ai_result(teacher,result,jsonb_build_array(jsonb_build_object('questionId',question,'marks',1,'reason','Reviewed answer')),'Improve detail');
 IF (SELECT grade_received FROM learner_assignments LIMIT 1)<>1 OR (SELECT status FROM ai_assignment_results WHERE id=result)<>'released' THEN RAISE EXCEPTION 'Released result not synchronized'; END IF;
 BEGIN UPDATE learner_assignments SET grade_received=99; RAISE EXCEPTION 'Grade bypass'; EXCEPTION WHEN OTHERS THEN IF SQLERRM='Grade bypass' THEN RAISE; END IF; END;
 INSERT INTO tutor_conversations VALUES(conv,teacher,course,jsonb_build_array(jsonb_build_object('id',msg,'role','assistant')));
 IF set_ai_material_choice(outsider,conv,msg,'{}') THEN RAISE EXCEPTION 'Unauthorized save choice'; END IF;
 IF NOT set_ai_material_choice(teacher,conv,msg,'{"state":"deferred"}') THEN RAISE EXCEPTION 'Choice not persisted'; END IF;
 IF has_table_privilege('authenticated','ai_assignments','SELECT') OR has_table_privilege('anon','ai_assignment_results','SELECT') THEN RAISE EXCEPTION 'Private records exposed'; END IF;
END $$;`);
  sql(`DO $$
DECLARE teacher uuid:=gen_random_uuid(); student uuid:=gen_random_uuid(); college uuid:=gen_random_uuid(); dep uuid:=gen_random_uuid(); program uuid:=gen_random_uuid(); section uuid:=gen_random_uuid(); learner uuid:=gen_random_uuid(); course uuid; material uuid; recipient uuid; submission uuid:=gen_random_uuid(); result uuid; question uuid:=gen_random_uuid(); deadline timestamptz:=now()+interval '2 days'; key text;
BEGIN
 SELECT course_id INTO course FROM courses LIMIT 1;
 INSERT INTO users VALUES(teacher,'college_educator'),(student,'learner');
 INSERT INTO organization_members VALUES(college,teacher,'active'),(college,student,'active');
 INSERT INTO college_lecturers VALUES(teacher,college,'active'); INSERT INTO departments VALUES(dep,college); INSERT INTO program_sections VALUES(section,dep,program,'active');
 INSERT INTO learners(id,user_id,program_section_id) VALUES(learner,student,section);
 INSERT INTO ai_assignments(course_id,title,content,grading_rules,request_fingerprint,context_fingerprint) VALUES(course,'College worksheet',jsonb_build_object('questions',jsonb_build_array(jsonb_build_object('id',question,'prompt','Answer','maxMarks',3))),'[]','college','context') RETURNING id INTO material;
 PERFORM allocate_saved_ai_assignment(teacher,material,ARRAY[learner],deadline);
 PERFORM allocate_saved_ai_assignment(teacher,material,ARRAY[learner],deadline);
 IF (SELECT count(*) FROM college_assignments WHERE saved_ai_assignment_id=material)<>1 THEN RAISE EXCEPTION 'Duplicate college task'; END IF;
 SELECT id INTO recipient FROM ai_assignment_learners WHERE assignment_id=material;
 key:='courses/'||course||'/ai-assignments/'||material||'/submissions/'||recipient||'/'||submission||'/file.txt';
 PERFORM commit_ai_submission(student,recipient,submission,key,'answer.txt','text/plain');
 SELECT id INTO result FROM ai_assignment_results WHERE submission_id=submission;
 UPDATE ai_assignment_results SET status='failed' WHERE id=result;
 PERFORM release_saved_ai_result(teacher,result,jsonb_build_array(jsonb_build_object('questionId',question,'marks',2,'reason','Manually checked after extraction failed')),'Reviewed');
 IF (SELECT grade_received FROM college_learner_assignments WHERE learner_id=student)<>2 THEN RAISE EXCEPTION 'College grade not synchronized'; END IF;
END $$;`);
  console.log('PASS: five-table migration, immutable materials, idempotent school/college allocation, owned file submission, grade guards, review/release, regular task synchronization and privacy.');
} finally { docker(['exec',container,'dropdb','-U','postgres',database]); }
