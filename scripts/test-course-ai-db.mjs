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
CREATE TABLE organization_members(organization_id uuid,user_id uuid,status text);
CREATE TABLE courses(course_id uuid PRIMARY KEY,educator_id uuid,deleted_at timestamptz,status text DEFAULT 'Active',school_id uuid,title text DEFAULT 'Course',code text DEFAULT 'CODE');
CREATE TABLE course_modules(module_id uuid PRIMARY KEY,course_id uuid);
CREATE TABLE lessons(lesson_id uuid PRIMARY KEY,module_id uuid,content text);
CREATE TABLE video_summaries(lesson_id uuid,transcript text,summary text,processing_status text);
CREATE TABLE lesson_resources(resource_id uuid PRIMARY KEY,lesson_id uuid,name text,type text,url text,content text);
CREATE TABLE school_educators(id uuid,user_id uuid,account_status text,school_id uuid);
CREATE TABLE college_lecturers(user_id uuid,"collegeId" uuid,"accountStatus" text);
CREATE TABLE organization_staff(user_id uuid,organization_id uuid,account_status text);
CREATE TABLE course_enrollments(course_id uuid,learner_id uuid,educator_id uuid,status text);
`);
  sql(readFileSync(new URL('../supabase/migrations/20261103090000_course_content_index.sql', import.meta.url), 'utf8'));
  sql(`DO $$
DECLARE u uuid:=gen_random_uuid(); outsider uuid:=gen_random_uuid(); student uuid:=gen_random_uuid(); learner uuid:=gen_random_uuid();
 c uuid:=gen_random_uuid(); module uuid:=gen_random_uuid(); lesson uuid:=gen_random_uuid(); analysis uuid; lease uuid; embedding text;
 other_course uuid:=gen_random_uuid(); other_module uuid:=gen_random_uuid(); other_lesson uuid:=gen_random_uuid();
BEGIN
 INSERT INTO users(id) VALUES(u),(student); INSERT INTO courses(course_id,educator_id) VALUES(c,u); INSERT INTO course_modules VALUES(module,c); INSERT INTO lessons VALUES(lesson,module,'Text');
 IF can_access_course_ai(outsider,c) THEN RAISE EXCEPTION 'Unauthorized course access'; END IF;
 analysis:=enqueue_course_source(u,c,lesson,NULL,'hash','google/gemini-embedding-2-preview','v1');
 IF analysis<>enqueue_course_source(u,c,lesson,NULL,'hash','google/gemini-embedding-2-preview','v1') THEN RAISE EXCEPTION 'Duplicate enqueue'; END IF;
 IF analysis<>enqueue_course_source(NULL,c,lesson,NULL,'hash','google/gemini-embedding-2-preview','v1') THEN RAISE EXCEPTION 'Trusted import not idempotent'; END IF;
 SELECT lease_token INTO lease FROM claim_course_source(c);
 embedding:='['||array_to_string(array_fill(0.1::real,ARRAY[1536]),',')||']';
 IF finish_course_source(analysis,gen_random_uuid(),'Text','hash','{}',jsonb_build_array(jsonb_build_object('chunk_index',0,'content','Text','embedding',embedding,'token_count',1))) THEN RAISE EXCEPTION 'Stale lease accepted'; END IF;
 IF NOT finish_course_source(analysis,lease,'Text','hash','{}',jsonb_build_array(jsonb_build_object('chunk_index',0,'content','Text','embedding',embedding,'token_count',1))) THEN RAISE EXCEPTION 'Index completion failed'; END IF;
 IF (SELECT count(*) FROM search_course_chunks(u,c,embedding::extensions.vector))<>1 THEN RAISE EXCEPTION 'Search failed'; END IF;
 INSERT INTO courses(course_id,educator_id) VALUES(other_course,u); INSERT INTO course_modules VALUES(other_module,other_course); INSERT INTO lessons VALUES(other_lesson,other_module,'Other');
 PERFORM enqueue_course_source(NULL,other_course,other_lesson,NULL,'other','google/gemini-embedding-2-preview','v1');
 IF EXISTS(SELECT 1 FROM claim_course_source(c)) THEN RAISE EXCEPTION 'Claim escaped selected course'; END IF;
 IF NOT EXISTS(SELECT 1 FROM claim_course_source(other_course)) THEN RAISE EXCEPTION 'Other course lost its queued job'; END IF;
 INSERT INTO video_summaries VALUES(lesson,'Video evidence',NULL,'completed');
 IF EXISTS(SELECT 1 FROM course_resource_analysis WHERE id=analysis AND is_current) THEN RAISE EXCEPTION 'Video change did not invalidate evidence'; END IF;
 DELETE FROM video_summaries WHERE lesson_id=lesson;
 BEGIN PERFORM search_course_chunks(outsider,c,embedding::extensions.vector); RAISE EXCEPTION 'Search authorization missing'; EXCEPTION WHEN OTHERS THEN IF SQLERRM='Search authorization missing' THEN RAISE; END IF; END;

 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE proname='claim_course_source' AND pronargs=1) THEN RAISE EXCEPTION 'Missing course-scoped claim'; END IF;
 IF has_table_privilege('authenticated','course_content_chunks','SELECT') OR has_table_privilege('anon','course_resource_analysis','SELECT') THEN RAISE EXCEPTION 'Private source data exposed'; END IF;
END $$;`);
  console.log('PASS: course indexing migration, authorization, idempotent enqueue, scoped vector retrieval, lease ownership, source invalidation and private tables.');
} finally { docker(['exec',container,'dropdb','-U','postgres',database]); }
