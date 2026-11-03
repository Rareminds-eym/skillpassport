import {readFileSync} from 'node:fs';
import {spawn, spawnSync} from 'node:child_process';
const root = new URL('../../', import.meta.url);
const container = process.argv[2] || 'supabase_db_skillpassport';
if (!/^[a-zA-Z0-9_-]+$/.test(container)) throw new Error('Invalid test container');
const name = `assessment_progress_test_${process.pid}_${Date.now()}`;
const read = path => readFileSync(new URL(path, root), 'utf8');
function docker(args, input) {
  const result = spawnSync('docker', ['exec', ...(input ? ['-i'] : []), container, ...args], {
    input, encoding: 'utf8', timeout: 120000, maxBuffer: 1000000,
  });
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || 'SQL fixture failed');
  return result.stdout;
}
function concurrent(args, patch, attemptId = '30000000-0000-4000-8000-000000000001') {
  return concurrentStatement(args, `SELECT public.patch_owned_assessment_progress(
    '10000000-0000-4000-8000-000000000001','${attemptId}','progress','${JSON.stringify(patch)}');`);
}
function concurrentStatement(args, sql) {
  return new Promise((resolve, reject) => {
    const statement = `BEGIN; SET LOCAL ROLE service_role; ${sql} SELECT pg_sleep(0.1); COMMIT;`;
    const child = spawn('docker', ['exec', container, ...args, '-c', statement]);
    let errors = '';
    const timer = setTimeout(() => {child.kill(); reject(new Error('SQL race timed out'));}, 15000);
    child.stdout.resume(); child.stderr.on('data', chunk => errors += chunk);
    child.on('error', error => {clearTimeout(timer); reject(error);});
    child.on('close', code => {clearTimeout(timer); code === 0 ? resolve() : reject(new Error(errors));});
  });
}
let created = false;
try {
  docker(['createdb', '-U', 'postgres', '--template=template0', name]); created = true;
  const psql = ['psql', '-U', 'postgres', '-d', name, '-v', 'ON_ERROR_STOP=1'];
  const baseline = read('supabase/migrations/20260526000000_schema.sql');
  const attempt = baseline.match(/CREATE TABLE IF NOT EXISTS "public"\."personal_assessment_attempts" \([\s\S]*?\n\);/)?.[0];
  if (!attempt) throw new Error('Actual attempt table definition missing');
  const responses = baseline.match(/CREATE TABLE IF NOT EXISTS "public"\."personal_assessment_responses" \([\s\S]*?\n\);/)?.[0];
  if (!responses) throw new Error('Actual response table definition missing');
  const results = baseline.match(/CREATE TABLE IF NOT EXISTS "public"\."personal_assessment_results" \([\s\S]*?\n\);/)?.[0];
  const restrictions = baseline.match(/CREATE TABLE IF NOT EXISTS "public"\."personal_assessment_restrictions" \([\s\S]*?\n\);/)?.[0];
  const statusEnum = baseline.match(/CREATE TYPE "public"\."assessment_status" AS ENUM \([\s\S]*?\n\);/)?.[0];
  const streams = baseline.match(/CREATE TABLE IF NOT EXISTS "public"\."personal_assessment_streams" \([\s\S]*?\n\);/)?.[0];
  const adaptiveTypes = ['grade_level', 'question_subtag', 'test_phase'].map(type => {
    const definition = baseline.match(new RegExp(`CREATE TYPE "public"\\."${type}" AS ENUM \\([\\s\\S]*?\\n\\);`))?.[0];
    if (!definition) throw new Error('Actual adaptive enum definition missing');
    return definition;
  }).join('\n');
  const adaptivePrivateTables = ['adaptive_aptitude_responses', 'adaptive_aptitude_questions_cache'].map(table => {
    const definition = baseline.match(new RegExp(`CREATE TABLE IF NOT EXISTS "public"\\."${table}" \\([\\s\\S]*?\\n\\);`))?.[0];
    if (!definition) throw new Error('Actual adaptive table definition missing');
    return definition;
  }).join('\n');
  const adaptiveCapabilities = ['append_adaptive_response', 'calculate_session_stats', 'get_available_questions', 'update_question_usage'].map(name => {
    const start = baseline.indexOf(`CREATE OR REPLACE FUNCTION "public"."${name}"(`);
    if (start < 0) throw new Error('Actual adaptive capability definition missing');
    return baseline.slice(start, baseline.indexOf('$$;', start) + 3);
  }).join('\n');
  if (!results || !restrictions || !statusEnum || !streams) throw new Error('Actual assessment schema definitions missing');
  const triggers = ['auto_create_assessment_result', 'create_assessment_restriction'].map(functionName => {
    const start = baseline.indexOf(`CREATE OR REPLACE FUNCTION "public"."${functionName}"()`);
    if (start < 0) throw new Error('Baseline completion trigger missing');
    return baseline.slice(start, baseline.indexOf('$$;', start) + 3);
  }).join('\n');
  docker(psql, `CREATE TABLE public.learners(id uuid PRIMARY KEY,user_id uuid UNIQUE NOT NULL);
    CREATE TABLE public.adaptive_aptitude_sessions(id uuid PRIMARY KEY,learner_id uuid REFERENCES public.learners(id),status text);
    ${attempt}
    ALTER TABLE public.personal_assessment_attempts ADD PRIMARY KEY(id);
    ALTER TABLE public.personal_assessment_attempts ADD FOREIGN KEY(learner_id) REFERENCES public.learners(id);
    ALTER TABLE public.personal_assessment_attempts ADD FOREIGN KEY(adaptive_aptitude_session_id) REFERENCES public.adaptive_aptitude_sessions(id);
    ${responses}
    ALTER TABLE public.personal_assessment_responses ADD PRIMARY KEY(id);
    ALTER TABLE public.personal_assessment_responses ADD UNIQUE(attempt_id,question_id);
    ALTER TABLE public.personal_assessment_responses ADD FOREIGN KEY(attempt_id) REFERENCES public.personal_assessment_attempts(id) ON DELETE CASCADE;
    ${streams}
    CREATE TABLE public.personal_assessment_sections(id uuid PRIMARY KEY,name text NOT NULL,grade_level text NOT NULL,is_active boolean DEFAULT true,is_stream_specific boolean DEFAULT false);
    CREATE TABLE public.personal_assessment_questions(id uuid PRIMARY KEY,section_id uuid REFERENCES public.personal_assessment_sections(id),
      stream_id text,correct_answer jsonb,is_active boolean DEFAULT true,order_number integer DEFAULT 0);
    CREATE TABLE public.career_assessment_ai_questions(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),stream_id text,grade_level text,
      question_type text,questions jsonb,learner_id uuid,is_active boolean DEFAULT true,created_at timestamptz DEFAULT now());
    ${adaptiveTypes}
    ${adaptivePrivateTables}
    ${adaptiveCapabilities}
    CREATE VIEW public.adaptive_session_grant_fixture AS SELECT id,learner_id FROM public.adaptive_aptitude_sessions;
    CREATE VIEW public.adaptive_nested_grant_fixture AS SELECT id FROM public.adaptive_session_grant_fixture;
    GRANT ALL ON public.adaptive_aptitude_sessions,public.adaptive_aptitude_responses,public.adaptive_aptitude_questions_cache TO anon,authenticated,service_role;
    GRANT SELECT ON public.adaptive_session_grant_fixture TO PUBLIC;
    GRANT SELECT(id) ON public.adaptive_nested_grant_fixture TO anon,authenticated;
    ALTER TABLE public.personal_assessment_streams ADD PRIMARY KEY(id);
    INSERT INTO public.personal_assessment_streams(id,label,grade_level,is_active) VALUES('bca','BCA','after12',true),('college','College','college',true),('inactive','Inactive','college',false);
    CREATE TABLE public.adaptive_aptitude_results(session_id uuid PRIMARY KEY REFERENCES public.adaptive_aptitude_sessions(id),
      learner_id uuid REFERENCES public.learners(id),overall_accuracy numeric(5,2),accuracy_by_subtag jsonb NOT NULL DEFAULT '{}');
    GRANT ALL ON public.adaptive_aptitude_results TO anon,authenticated,service_role;
    ${statusEnum}
    ${results}
    ${read('supabase/migrations/20260526000001_add_strength_scores_column.sql')}
    ${read('supabase/migrations/20260527105616_add_learning_preferences_column.sql')}
    ALTER TABLE public.personal_assessment_results ADD PRIMARY KEY(id);
    ALTER TABLE public.personal_assessment_results ADD UNIQUE(attempt_id);
    ALTER TABLE public.personal_assessment_results ADD FOREIGN KEY(attempt_id) REFERENCES public.personal_assessment_attempts(id);
    ALTER TABLE public.personal_assessment_results ADD FOREIGN KEY(learner_id) REFERENCES public.learners(id);
    ALTER TABLE public.personal_assessment_results ADD FOREIGN KEY(stream_id) REFERENCES public.personal_assessment_streams(id);
    ALTER TABLE public.personal_assessment_results ADD FOREIGN KEY(adaptive_aptitude_session_id) REFERENCES public.adaptive_aptitude_results(session_id);
    ${restrictions}
    ALTER TABLE public.personal_assessment_restrictions ADD UNIQUE(learner_id,grade_level);
    ${triggers}
    CREATE TRIGGER completion_result AFTER UPDATE ON public.personal_assessment_attempts FOR EACH ROW EXECUTE FUNCTION public.auto_create_assessment_result();
    CREATE TRIGGER completion_restriction AFTER UPDATE ON public.personal_assessment_attempts FOR EACH ROW EXECUTE FUNCTION public.create_assessment_restriction();
    GRANT USAGE ON SCHEMA public TO service_role;
    GRANT SELECT,UPDATE ON ALL TABLES IN SCHEMA public TO service_role;
    GRANT INSERT ON public.personal_assessment_responses TO service_role;
    GRANT INSERT ON public.personal_assessment_results,public.personal_assessment_restrictions TO service_role;
    GRANT INSERT ON public.personal_assessment_attempts TO service_role;
    ${read('supabase/migrations/20270205000000_assessment_owner_progress.sql')}
    ${read('supabase/migrations/20270206000000_assessment_owner_response.sql')}
    ${read('supabase/migrations/20270207000000_assessment_owner_finalization.sql')}
    ${read('supabase/migrations/20270208000000_assessment_owner_start.sql')}
    ${read('functions/__tests__/sql/assessment-owner-progress.sql')}
    ${read('functions/__tests__/sql/assessment-owner-response.sql')}
    ${read('functions/__tests__/sql/assessment-owner-finalization.sql')}
    ${read('functions/__tests__/sql/assessment-owner-start.sql')}
    ${read('supabase/migrations/20270217050000_assessment_owned_context.sql')}
    ${read('supabase/migrations/20270217060000_assessment_grading_provenance.sql')}
    ${read('functions/__tests__/sql/assessment-adaptive-private-grants.sql')}
    ${read('functions/__tests__/sql/assessment-grading-provenance.sql')}`);
  await Promise.all([
    concurrent(psql, {all_responses: {race_a: 1}, section_timings: {values: 10}}),
    concurrent(psql, {all_responses: {race_b: 2}, section_timings: {employability: 20}}),
  ]);
  // Both sessions are owned and completed. The attempt lock permits only one
  // initial link; the competing transaction must observe its immutable result.
  const links = await Promise.allSettled([
    concurrent(psql, {adaptive_aptitude_session_id: '40000000-0000-4000-8000-000000000003'}, '30000000-0000-4000-8000-000000000005'),
    concurrent(psql, {adaptive_aptitude_session_id: '40000000-0000-4000-8000-000000000005'}, '30000000-0000-4000-8000-000000000005'),
  ]);
  if (links.filter(result => result.status === 'fulfilled').length !== 1
    || !links.some(result => result.status === 'rejected' && String(result.reason).includes('completed_adaptive_link_is_immutable'))) {
    throw new Error('Competing completed adaptive links did not serialize safely');
  }
  await Promise.all(['"A"', '"B"'].map(answer => concurrentStatement(psql, `SELECT public.save_owned_assessment_response(
    '10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001',
    '50000000-0000-4000-8000-000000000002','${answer}');`)));
  const terminalRace = await Promise.allSettled([
    concurrentStatement(psql, `SELECT public.save_owned_assessment_response(
      '10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000006',
      '50000000-0000-4000-8000-000000000003','1');`),
    concurrentStatement(psql, `SELECT public.patch_owned_assessment_progress(
      '10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000006','abandon','{}');`),
  ]);
  if (terminalRace[1].status !== 'fulfilled'
    || (terminalRace[0].status === 'rejected' && !String(terminalRace[0].reason).includes('assessment_not_in_progress'))) {
    throw new Error('Response and abandonment did not serialize safely');
  }
  const submitRace = await Promise.allSettled([
    concurrentStatement(psql, `SELECT public.finalize_owned_assessment(
      '10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000014','submit','{"answers":{"final":1}}');`),
    concurrentStatement(psql, `SELECT public.save_owned_assessment_response(
      '10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000014',
      '50000000-0000-4000-8000-000000000014','1');`),
  ]);
  if (submitRace[0].status !== 'fulfilled'
    || (submitRace[1].status === 'rejected' && !String(submitRace[1].reason).includes('assessment_not_in_progress'))) {
    throw new Error('Submission and answer save did not serialize safely');
  }
  const reportRace = await Promise.allSettled(['A','B'].map(label => concurrentStatement(psql,
    `SELECT public.finalize_owned_assessment('10000000-0000-4000-8000-000000000001',
      '30000000-0000-4000-8000-000000000015','results','{"geminiResults":{"overallSummary":"${label}"}}');`)));
  if (reportRace.filter(item => item.status === 'fulfilled').length !== 1
    || !reportRace.some(item => item.status === 'rejected' && String(item.reason).includes('Completed report is immutable'))) {
    throw new Error('Competing reports did not preserve completed report immutability');
  }
  await Promise.all([1,2].map(()=>concurrentStatement(psql,`SELECT public.start_owned_assessment(
    '10000000-0000-4000-8000-000000000005','bca','college',NULL,NULL,true);`)));
  const starts=await Promise.allSettled([1,2].map(()=>concurrentStatement(psql,`SELECT public.start_owned_assessment(
    '10000000-0000-4000-8000-000000000006',NULL,'college',NULL,NULL,false);`)));
  if(starts.filter(item=>item.status==='fulfilled').length!==1
    ||!starts.some(item=>item.status==='rejected'&&String(item.reason).includes('Resume or abandon'))) {
    throw new Error('Explicit new-attempt creation did not serialize safely');
  }
  docker(psql, `DO $$ DECLARE r record; BEGIN
    SELECT * INTO r FROM public.personal_assessment_attempts WHERE id='30000000-0000-4000-8000-000000000001';
    ASSERT r.all_responses @> '{"original":1,"race_a":1,"race_b":2}'::jsonb;
    ASSERT r.section_timings @> '{"values":10,"employability":20}'::jsonb;
    ASSERT EXISTS(SELECT 1 FROM public.personal_assessment_attempts
      WHERE id='30000000-0000-4000-8000-000000000005'
        AND adaptive_aptitude_session_id IN ('40000000-0000-4000-8000-000000000003','40000000-0000-4000-8000-000000000005'));
    ASSERT NOT EXISTS(SELECT 1 FROM pg_class WHERE relnamespace='public'::regnamespace AND relrowsecurity);
    ASSERT (SELECT count(*) FROM public.personal_assessment_attempts WHERE learner_id='20000000-0000-4000-8000-000000000005' AND status='in_progress')=1;
    ASSERT (SELECT count(*) FROM public.personal_assessment_attempts WHERE learner_id='20000000-0000-4000-8000-000000000006' AND status='in_progress')=1;
    ASSERT EXISTS(SELECT 1 FROM public.personal_assessment_attempts WHERE id='30000000-0000-4000-8000-000000000014'
      AND status='completed' AND all_responses @> '{"final":1}');
    ASSERT (SELECT count(*) FROM public.personal_assessment_results WHERE attempt_id='30000000-0000-4000-8000-000000000015')=1;
    ASSERT (SELECT count(*) FROM public.personal_assessment_responses
      WHERE attempt_id='30000000-0000-4000-8000-000000000001'
        AND question_id='50000000-0000-4000-8000-000000000002' AND is_correct IS NULL)=1;
    ASSERT EXISTS(SELECT 1 FROM public.personal_assessment_attempts
      WHERE id='30000000-0000-4000-8000-000000000006' AND status='abandoned');
    BEGIN
      PERFORM public.save_owned_assessment_response('10000000-0000-4000-8000-000000000001',
        '30000000-0000-4000-8000-000000000006','50000000-0000-4000-8000-000000000003','2');
      RAISE EXCEPTION USING ERRCODE='XX000', MESSAGE='Terminal response was accepted';
    EXCEPTION WHEN SQLSTATE 'P0001' THEN NULL;
    END;
  END; $$;`);
  console.log('Assessment owner SQL: creation/reuse, ownership, grants, validation, terminal states, adaptive binding, real completion triggers, rollback and concurrent start/merge/upsert/link/abandon/submit/report races pass (RLS disabled).');
} finally {
  if (created) docker(['dropdb', '-U', 'postgres', name]);
}
