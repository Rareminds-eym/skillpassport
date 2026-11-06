import {readFileSync} from 'node:fs';
import {spawn,spawnSync} from 'node:child_process';
const root=new URL('../../',import.meta.url),container=process.argv[2]||'supabase_db_skillpassport';
if(!/^[a-zA-Z0-9_-]+$/.test(container))throw new Error('Invalid local container');
const database=`adaptive_answer_test_${process.pid}_${Date.now()}`;
const read=path=>readFileSync(new URL(path,root),'utf8');
function docker(args,input){const r=spawnSync('docker',['exec',...(input?['-i']:[]),container,...args],{input,encoding:'utf8',timeout:120000,maxBuffer:2000000});if(r.error||r.status!==0)throw new Error(r.error?.message||r.stderr);return r.stdout;}
const psql=['psql','-U','postgres','-d',database,'-v','ON_ERROR_STOP=1'];
let created=false;
try{
 docker(['createdb','-U','postgres','--template=template0',database]);created=true;
 const baseline=read('supabase/migrations/20260526000000_schema.sql');
 const enums=['grade_level','test_phase','question_subtag','tier_classification','session_status'].map(name=>{
  const definition=baseline.match(new RegExp(`CREATE TYPE "public"\\."${name}" AS ENUM \\([\\s\\S]*?\\n\\);`))?.[0];if(!definition)throw new Error('Actual adaptive enum missing');return definition;
 }).join('\n');
 const tables=['adaptive_aptitude_sessions','adaptive_aptitude_responses'].map(name=>{
  const definition=baseline.match(new RegExp(`CREATE TABLE IF NOT EXISTS "public"\\."${name}" \\([\\s\\S]*?\\n\\);`))?.[0];if(!definition)throw new Error('Actual adaptive table missing');return definition;
 }).join('\n');
 docker(psql,`${enums} CREATE TABLE public.learners(id uuid PRIMARY KEY,user_id uuid UNIQUE);${tables}
 ALTER TABLE public.adaptive_aptitude_sessions ADD PRIMARY KEY(id);
 ALTER TABLE public.adaptive_aptitude_responses ADD PRIMARY KEY(id);
 ALTER TABLE public.adaptive_aptitude_responses ADD FOREIGN KEY(session_id) REFERENCES public.adaptive_aptitude_sessions(id);
 GRANT SELECT,INSERT,UPDATE ON public.learners,public.adaptive_aptitude_sessions,public.adaptive_aptitude_responses TO service_role;`);
 docker(psql,read('supabase/migrations/20270217070000_adaptive_owned_answer_commit.sql'));
 docker(psql,read('functions/__tests__/sql/adaptive-owned-answer-commit.sql'));
 const statement=`SELECT public.commit_owned_adaptive_answer('10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000002','race-question','A',100,false,0,0,'diagnostic_screener',3,NULL,false);`;
 const race=()=>new Promise((resolve,reject)=>{
  const child=spawn('docker',['exec',container,...psql,'-At','-c',`BEGIN;SET LOCAL ROLE service_role;${statement} SELECT pg_sleep(0.1);COMMIT;`]);let output='',error='';
  const timer=setTimeout(()=>{child.kill();reject(new Error('Adaptive answer race timed out'));},15000);
  child.stdout.on('data',value=>output+=value);child.stderr.on('data',value=>error+=value);child.on('error',reject);
  child.on('close',code=>{clearTimeout(timer);if(code!==0){reject(new Error(error));return;}try{resolve(JSON.parse(output.split('\n').find(line=>line.startsWith('{'))));}catch(e){reject(e);}});
 });
 const results=await Promise.all([race(),race()]);
 if(results.filter(x=>x.replayed===false).length!==1||results.filter(x=>x.replayed===true).length!==1)throw new Error('Concurrent adaptive answers were not serialized idempotently');
 docker(psql,`DO $$ BEGIN ASSERT(SELECT count(*)=1 FROM public.adaptive_aptitude_responses WHERE session_id='30000000-0000-4000-8000-000000000002');
 ASSERT(SELECT questions_answered=1 AND correct_answers=1 AND current_question_index=1 FROM public.adaptive_aptitude_sessions WHERE id='30000000-0000-4000-8000-000000000002');END $$;`);
 console.log('Adaptive owned answer SQL passed: current-question/version fencing, deterministic replay, no historical cleanup and real two-session atomic commit.');
}finally{if(created)docker(['dropdb','-U','postgres','--force',database]);}
