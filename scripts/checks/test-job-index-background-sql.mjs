import { spawn, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const container = process.env.TEST_POSTGRES_CONTAINER || 'supabase_db_skillpassport';
const database = `job_index_test_${process.pid}`;
function sql(query, db = database) {
  const result = spawnSync('docker', ['exec','-i',container,'psql','-U','postgres','-d',db,'-Atq','-v','ON_ERROR_STOP=1'], { input:query,encoding:'utf8',timeout:30000 });
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message || 'SQL failed');
  return result.stdout;
}
const read = path => readFileSync(new URL(`../../${path}`, import.meta.url),'utf8');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
function session(applicationName, query) {
  const child = spawn('docker', ['exec','-e',`PGAPPNAME=${applicationName}`,container,'psql','-U','postgres','-d',database,'-Atq','-v','ON_ERROR_STOP=1','-c',`SET statement_timeout='12s'; ${query}`]);
  let output='', errors='';
  const done = new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{child.kill();reject(new Error(`${applicationName} timed out`));},15000);
    child.stdout.on('data',v=>output+=v);
    child.stderr.on('data',v=>errors+=v);
    child.once('error',e=>{clearTimeout(timer);reject(e);});
    child.once('close',code=>{clearTimeout(timer);code===0?resolve(output):reject(new Error(errors || `${applicationName} failed`));});
  });
  // A failing session may finish before the coordinator is ready to await it.
  done.catch(()=>{});
  child.stdin.on('error',()=>{});

  return { child, done, output:()=>output, errors:()=>errors };
}
async function until(predicate, label) {
  const expires=Date.now()+6000;
  while(Date.now()<expires) {
    if(predicate())return;
    await delay(50);
  }
  throw new Error(`Timed out waiting for ${label}`);
}
async function publicationUpdateRace(expectDeadlock = false) {
  // Test-only gate pauses publication after it holds the catalogue row. An
  // ordinary UPDATE then waits either on the prelocked second job (correct)
  // or the catalogue row (old implementation). Releasing the independent gate
  // completes the correct order and deterministically deadlocks the old one.
  const first='00000000-0000-4000-8000-000000000001';
  const second='00000000-0000-4000-8000-000000000002';
  sql(`DROP TRIGGER IF EXISTS test_pause_index_publication ON public.recommendation_catalog_revision;
DROP FUNCTION IF EXISTS public.test_pause_index_publication();
DROP TABLE IF EXISTS public.test_index_batch;
DELETE FROM public.embeddings WHERE entity_type='opportunity' AND entity_id IN ('${first}','${second}');
DELETE FROM public.opportunities;
INSERT INTO public.opportunities(id,title,employment_type) VALUES('${first}','Batch A','job'),('${second}','Batch B','job');
CREATE TABLE public.test_index_batch(payload jsonb);
INSERT INTO public.test_index_batch SELECT jsonb_agg(jsonb_build_object('id',c.id,'input_hash',c.input_hash,'lease_token',c.lease_token,
 'embedding','['||array_to_string(array_fill(1,ARRAY[1536]),',')||']')) FROM public.claim_job_index('google/gemini-embedding-2-preview',8) c;
CREATE FUNCTION public.test_pause_index_publication() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF current_setting('application_name')='job_index_finish_race' THEN PERFORM pg_advisory_xact_lock(1707030801); END IF;
 RETURN NULL;
END $$;
CREATE TRIGGER test_pause_index_publication AFTER UPDATE ON public.recommendation_catalog_revision
 FOR EACH STATEMENT EXECUTE FUNCTION public.test_pause_index_publication();`);
  const gate=session('job_index_gate','SELECT pg_advisory_lock(1707030801); SELECT pg_sleep(20);');
  let finish, update;
  try {
    await until(()=>sql("SELECT count(*) FROM pg_locks l JOIN pg_stat_activity a ON a.pid=l.pid WHERE a.datname=current_database() AND a.application_name='job_index_gate' AND l.locktype='advisory' AND l.granted").trim().split('\n').includes('1'),'publication gate');
    finish=session('job_index_finish_race',"SELECT public.finish_job_index_batch('google/gemini-embedding-2-preview',(SELECT payload FROM public.test_index_batch));");
    await until(()=>sql("SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND application_name='job_index_finish_race' AND wait_event_type='Lock' AND wait_event='advisory'").trim().split('\n').includes('1'),'publisher holding catalogue lock');
    update=session('job_index_update_race',`UPDATE public.opportunities SET title=title WHERE id='${second}';`);
    await until(()=>sql("SELECT count(*) FROM pg_stat_activity WHERE datname=current_database() AND application_name='job_index_update_race' AND wait_event_type='Lock'").trim().split('\n').includes('1'),'concurrent source update');
    sql("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname=current_database() AND application_name='job_index_gate'");
    await gate.done.catch(()=>{}); // Expected: releasing the test-only lock holder.
    const outcomes=await Promise.allSettled([finish.done, update.done]);
    if(expectDeadlock) {
      if(!outcomes.some(result=>result.status==='rejected' && /deadlock detected/i.test(String(result.reason))))
        throw new Error('Original implementation did not reproduce the expected deadlock');
      return;
    }
    for(const result of outcomes) if(result.status==='rejected') throw result.reason;
    sql(`DO $$ BEGIN ASSERT (SELECT count(*)=2 FROM public.embeddings WHERE entity_type='opportunity' AND entity_id IN ('${first}','${second}')),
     'concurrent source update prevented batch publication'; END $$;`);
  } catch(error) {
    const activity=sql("SELECT application_name||':'||state||':'||coalesce(wait_event,'') FROM pg_stat_activity WHERE datname=current_database()");
    throw new Error(`${error.message}; gateExit=${gate.child.exitCode}; gateError=${gate.errors()}; gateOutput=${gate.output()}; activity=${activity}`);
  } finally {
    for(const active of [gate,finish,update].filter(Boolean)) active.child.stdin.end();
    await Promise.allSettled([gate,finish,update].filter(Boolean).map(active=>active.done));
  }
}
try {
  sql(`CREATE DATABASE ${database}`, 'postgres');
  sql(`CREATE SCHEMA extensions; CREATE EXTENSION vector WITH SCHEMA extensions;
CREATE TABLE public.opportunities(id uuid PRIMARY KEY,title text,employment_type text,status text DEFAULT 'open',is_active boolean DEFAULT true,deadline timestamptz);
CREATE TABLE public.embeddings(entity_type text,entity_id uuid,embedding extensions.vector(1536),model_version text,input_hash text,updated_at timestamptz,PRIMARY KEY(entity_type,entity_id));
CREATE TABLE public.recommendation_catalog_revision(singleton boolean,revision bigint); INSERT INTO public.recommendation_catalog_revision VALUES(true,1);
CREATE TABLE public.learners(id uuid,user_id uuid);
CREATE TABLE public.learner_recommendation_state(learner_id uuid,embedding extensions.vector,revision bigint,vector_revision bigint,model_version text,valid_until timestamptz);
CREATE TABLE public.opportunity_interactions(learner_id uuid,action text,opportunity_id uuid);
CREATE TABLE public.zoho_staged_records(id uuid PRIMARY KEY,connection_id uuid);
CREATE TABLE public.zoho_job_links(record_id uuid,target_id uuid);
CREATE FUNCTION public.job_matching_text(public.opportunities) RETURNS text LANGUAGE sql IMMUTABLE AS $$ SELECT $1.title $$;
CREATE FUNCTION public.bump_recommendation_catalog_v3() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 UPDATE public.recommendation_catalog_revision SET revision=revision+1 WHERE singleton; RETURN NULL; END $$;
CREATE TRIGGER recommendation_catalog_revision_v3 AFTER INSERT OR UPDATE OR DELETE ON public.opportunities
 FOR EACH STATEMENT EXECUTE FUNCTION public.bump_recommendation_catalog_v3();`);
  sql(read('supabase/migrations/20270121000000_jobs_only_recommendations.sql'));
  sql(read('supabase/migrations/20270307000000_job_matching_background_index.sql'));
  sql(read('supabase/migrations/20270308000000_job_index_hardening.sql'));
  sql(read('functions/__tests__/sql/job-index-background.sql'));
  sql(read('functions/__tests__/sql/job-index-hardening.sql'));
  sql(read('functions/__tests__/sql/job-index-dispatch-scaling.sql'));
  sql(`INSERT INTO public.opportunities(id,title,employment_type) SELECT gen_random_uuid(),'Race '||i,'job' FROM generate_series(1,16) i;`);
  async function race() {
    return new Promise((resolve,reject)=>{
      const child=spawn('docker',['exec',container,'psql','-U','postgres','-d',database,'-At','-v','ON_ERROR_STOP=1','-c',
        "BEGIN; SELECT id FROM public.claim_job_index('google/gemini-embedding-2-preview',8); SELECT pg_sleep(0.2); COMMIT;"]);
      let output='',errors='';const timer=setTimeout(()=>{child.kill();reject(new Error('Claim race timed out'));},15000);
      child.stdout.on('data',v=>output+=v);child.stderr.on('data',v=>errors+=v);
      child.once('error',e=>{clearTimeout(timer);reject(e);});
      child.once('close',code=>{clearTimeout(timer);code===0?resolve(output.split('\n').filter(v=>/^[a-f0-9-]{36}$/.test(v))):reject(new Error(errors));});
    });
  }
  const claimed=await Promise.all([race(),race()]);
  if(claimed.some(ids=>ids.length!==8)||new Set(claimed.flat()).size!==16)throw new Error('Concurrent claims overlapped or lost jobs');
  // Negative control: this exact schedule must expose the old bug, not merely
  // pass because the concurrent sessions failed to overlap.
  const fixed=sql("SELECT pg_get_functiondef('public.finish_job_index_batch(text,jsonb)'::regprocedure)");
  const original=read('supabase/migrations/20270307000000_job_matching_background_index.sql');
  const start=original.indexOf('CREATE FUNCTION public.finish_job_index_batch(');
  const end=original.indexOf('CREATE OR REPLACE FUNCTION public.job_matching_index_status',start);
  sql(original.slice(start,end).replace('CREATE FUNCTION','CREATE OR REPLACE FUNCTION'));
  await publicationUpdateRace(true);
  sql(fixed);
  await publicationUpdateRace();
  // Execute the documented operator transaction against this disposable DB:
  // model rotation must clear failed leases/budgets, rebuild the baseline and
  // retain old vector provenance; a stale operator precondition must roll back.
  const runbook = read('../sp-dash/docs/job-indexing.md').match(/```sql\n([\s\S]*?)```/)?.[1]?.replace(/^   /gm, '');
  if (!runbook) throw new Error('Model-change SQL runbook missing');
  const configuredModel = 'google/gemini-embedding-2-preview';
  sql("UPDATE public.job_index_work SET state='failed',attempts=8,lease_token=NULL,lease_expires_at=NULL;");
  const rotation = (oldModel, newModel) => sql(`\\set old_model '${oldModel}'\n\\set new_model '${newModel}'\n${runbook}`);
  rotation(configuredModel, 'fixture/replacement-model');
  sql(`DO $$ BEGIN
    IF NOT EXISTS(SELECT 1 FROM public.job_index_control WHERE model='fixture/replacement-model' AND baseline_completed_at IS NULL)
      THEN RAISE EXCEPTION 'Rotation did not reset baseline/model'; END IF;
    IF EXISTS(SELECT 1 FROM public.job_index_work WHERE state<>'queued' OR attempts<>0 OR lease_token IS NOT NULL)
      THEN RAISE EXCEPTION 'Rotation retained old failures or leases'; END IF;
    IF NOT EXISTS(SELECT 1 FROM public.job_index_work) THEN RAISE EXCEPTION 'Rotation did not enqueue eligible jobs'; END IF;
    IF NOT EXISTS(SELECT 1 FROM public.embeddings WHERE model_version='${configuredModel}')
      OR EXISTS(SELECT 1 FROM public.embeddings WHERE model_version='fixture/replacement-model')
      THEN RAISE EXCEPTION 'Rotation relabeled or removed old vectors'; END IF;
  END $$;`);
  let rejected = false;
  try { rotation('wrong/old-model', 'fixture/must-not-commit'); } catch { rejected = true; }
  if (!rejected) throw new Error('Rotation accepted wrong old-model precondition');
  sql("DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM public.job_index_control WHERE model='fixture/replacement-model') THEN RAISE EXCEPTION 'Failed rotation changed contract'; END IF; END $$;");
  rotation('fixture/replacement-model', configuredModel);
  console.log('Background job index SQL regression, concurrent claim, publication/update and documented rotation/rollback checks passed.');
} finally { sql(`DROP DATABASE IF EXISTS ${database} WITH (FORCE)`, 'postgres'); }
