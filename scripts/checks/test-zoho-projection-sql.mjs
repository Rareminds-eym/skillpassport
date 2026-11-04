import {readFileSync} from 'node:fs';
import {spawn,spawnSync} from 'node:child_process';
import {candidateAdministrationTables} from './zoho-candidate-administration-fixture.mjs';
const root=new URL('../../',import.meta.url);
const container=process.argv[2]||'supabase_db_skillpassport';
if(!/^[a-zA-Z0-9_-]+$/.test(container))throw new Error('Invalid fixture container');
const name=`zoho_projection_test_${process.pid}_${Date.now()}`;
const read=path=>readFileSync(new URL(path,root),'utf8');
const genericDto=process.argv[3];
if(genericDto&&!/^[A-Za-z0-9+/=]{1,16384}$/.test(genericDto))throw new Error('Invalid synthetic generic DTO');
function docker(args,input){
 const result=spawnSync('docker',['exec',...(input?['-i']:[]),container,...args],{input,encoding:'utf8',timeout:120000,maxBuffer:2_000_000});
 if(result.error||result.status!==0)throw new Error(result.error?.message||result.stderr||'Projection fixture failed');
 return result.stdout;
}
function concurrent(psql,statement){
 return new Promise((resolve,reject)=>{
  const child=spawn('docker',['exec',container,...psql,'-At','-c',`BEGIN; ${statement}; SELECT pg_sleep(0.1); COMMIT;`]);
  let output='',errors='';const timer=setTimeout(()=>{child.kill();reject(new Error('Concurrent projection timed out'));},15000);
  child.stdout.on('data',d=>{output+=d;});child.stderr.on('data',d=>{errors+=d;});
  child.on('error',e=>{clearTimeout(timer);reject(e);});child.on('close',code=>{
   clearTimeout(timer);if(code!==0){reject(new Error(errors||'Concurrent projection failed'));return;}
   try{resolve(JSON.parse(output.split('\n').find(line=>line.startsWith('{'))));}catch(e){reject(e);}
  });
 });
}
let created=false;
try{
 docker(['createdb','-U','postgres','--template=template0',name]);created=true;
 const psql=['psql','-U','postgres','-d',name,'-v','ON_ERROR_STOP=1'];
 const baseline=read('supabase/migrations/20260526000000_schema.sql');
 const tables=['users','learners','users_shadow','plans_cache','subscription_cache'];
 const definitions=tables.map(table=>{
  const match=baseline.match(new RegExp(`CREATE TABLE IF NOT EXISTS "public"\\."${table}" \\([\\s\\S]*?\\n\\);`));
  if(!match)throw new Error(`Missing table ${table}`);return match[0];
 });
 const constraints=[...baseline.matchAll(/ALTER TABLE ONLY "public"\."([^"]+)"\s+ADD CONSTRAINT [\s\S]*?;/g)].filter(m=>tables.includes(m[1])).map(m=>m[0]);
 const parentNames=new Set(constraints.flatMap(s=>[...s.matchAll(/REFERENCES "public"\."([^"]+)"/g)].map(m=>m[1])).filter(t=>!tables.includes(t)));
 const types=['user_role','user_approval_status'].map(type=>baseline.match(new RegExp(`CREATE TYPE "public"\\."${type}" AS ENUM \\([\\s\\S]*?\\n\\);`))?.[0]);
 if(types.some(t=>!t))throw new Error('Missing actual enums');
 const functions=['auto_assign_license_to_member','generate_learner_id','update_grade_on_program_mapping','validate_aadhar_number','trigger_validate_aadhar'].map(fn=>baseline.match(new RegExp(`CREATE OR REPLACE FUNCTION "public"\\."${fn}"[\\s\\S]*?\\$\\$;`))?.[0]);
 if(functions.some(f=>!f))throw new Error('Missing baseline learner trigger');
 const triggers=[...baseline.matchAll(/CREATE OR REPLACE TRIGGER [\s\S]*?;/g)].map(m=>m[0]).filter(t=>t.includes(' ON "public"."learners"')&&t.includes(' INSERT ')&&!t.includes('invalidate_job_matches'));
 const view=baseline.match(/CREATE OR REPLACE VIEW "public"\."learner_applications_with_pipeline"[\s\S]*?;/)?.[0];
 if(!view)throw new Error('Missing baseline application view');
 // Activity rows must use the actual learner-key contracts, including the
 // interviews.user_id reference and real RESTRICT/CASCADE deletion behavior.
 const activityTables=['pipeline_candidates','applied_jobs','interviews','shortlist_candidates','trainings','certificates','skills'];
 const activityKeys=[...baseline.matchAll(/ALTER TABLE ONLY "public"\."([^"\n]+)"\s+ADD CONSTRAINT [\s\S]*?;/g)]
  .filter(m=>activityTables.includes(m[1])&&/FOREIGN KEY \("learner_id"\) REFERENCES "public"\."learners"/.test(m[0])).map(m=>m[0]);
 if(activityKeys.length!==activityTables.length)throw new Error('Missing actual activity learner foreign keys');
 const interviews=baseline.match(/CREATE TABLE IF NOT EXISTS "public"\."interviews" \([\s\S]*?\n\);/)?.[0];
 if(!interviews)throw new Error('Missing actual interviews definition');
 const viewGrants=baseline.split('\n').filter(line=>line.includes('"learner_applications_with_pipeline"')&&(line.startsWith('GRANT ')||line.startsWith('ALTER VIEW ')));
 docker(psql,[
  'CREATE SCHEMA extensions; CREATE EXTENSION vector WITH SCHEMA extensions; GRANT USAGE ON SCHEMA extensions TO service_role;',
  ...types,...[...parentNames].map(t=>`CREATE TABLE public."${t}"(id uuid PRIMARY KEY);`),...definitions,...constraints,
  'CREATE SEQUENCE public.learner_id_seq;',...functions,...triggers,
  ...['users','learners','users_shadow'].map(t=>`ALTER TABLE public.${t} DISABLE ROW LEVEL SECURITY; GRANT SELECT,INSERT,UPDATE,DELETE ON public.${t} TO anon,authenticated,service_role;`),
  'CREATE TABLE public.pipeline_candidates(learner_id uuid,opportunity_id_old bigint,stage text,status text,added_at timestamptz,stage_changed_at timestamptz,next_action text,next_action_date date);',
  'CREATE TABLE public.opportunities(id_old bigint,title text,company_name text,requisition_id text);',
  'GRANT SELECT ON public.pipeline_candidates,public.opportunities TO anon,authenticated,service_role;',
  'CREATE VIEW public.pipeline_candidates_detailed AS SELECT * FROM public.pipeline_candidates;',
  ...['applied_jobs','shortlist_candidates','trainings','certificates','skills'].map(t=>`CREATE TABLE public.${t}(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),learner_id uuid,candidate_name text,candidate_email text);`),
  interviews,...activityKeys,
  view,...viewGrants,
  read('supabase/migrations/20270203000000_zoho_candidate_projection.sql'),
  read('supabase/migrations/20270204000000_zoho_projection_view_privacy.sql'),
  read('supabase/migrations/20270213000000_zoho_candidate_projection_readiness.sql'),
  read('supabase/migrations/20270216000000_zoho_generic_identity_sync_guard.sql'),
  read('functions/__tests__/sql/zoho-candidate-projection.sql').split('DO $$')[0],
  read('functions/__tests__/sql/zoho-private-boundary-preflight.sql'),
  read('functions/__tests__/sql/zoho-candidate-projection.sql'),
 ].join('\n'));
 const fixtures=read('functions/__tests__/sql/zoho-candidate-projection.sql').split('DO $$')[0].replaceAll('pg_temp.','fixture.');
 docker(psql,'CREATE SCHEMA fixture;\n'+fixtures);
 const fresh="replace(replace(replace(fixture.snapshot(),'10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000006'),'10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000007'),'10000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000008')";
 const statement=`SELECT public.zoho_apply_candidate_projection(s,encode(sha256(convert_to(s,'UTF8')),'hex')) FROM (SELECT replace(${fresh},'projection@fixture.example','concurrent-projection@fixture.example') AS s) fixture_snapshot`;
 const settled=await Promise.allSettled([concurrent(psql,statement),concurrent(psql,statement)]);
 if(settled.some(r=>r.status==='rejected'))throw new Error('Concurrent projection failed: '+settled.filter(r=>r.status==='rejected').map(r=>r.reason?.message).join('; '));
 const results=settled.map(r=>r.value);
 if(results[0].projectionReceiptId!==results[1].projectionReceiptId)throw new Error('Concurrent projection receipts differed');
 docker(psql,"DO $$ BEGIN ASSERT (SELECT count(*)=1 FROM public.learners WHERE user_id='10000000-0000-4000-8000-000000000006'); ASSERT (SELECT count(*)=1 FROM public.zoho_candidate_projections WHERE target_id='10000000-0000-4000-8000-000000000006'); END $$;");
 if(genericDto){
  // The real generic handler supplies this synthetic DTO in the contract test.
  docker(psql,`DO $$ DECLARE d jsonb:=convert_from(decode('${genericDto}','base64'),'UTF8')::jsonb; BEGIN
   ASSERT d->>'id'='10000000-0000-4000-8000-000000000008' AND d->>'user_id'='10000000-0000-4000-8000-000000000006';
   UPDATE public.subscription_cache c SET plan_id=r.plan_id,plan_code=r.plan_code,plan_type=r.plan_type,plan_name=r.plan_name,
    plan_amount=r.plan_amount,billing_cycle=r.billing_cycle,status=r.status,features=r.features,
    subscription_start_date=r.subscription_start_date,subscription_end_date=r.subscription_end_date,
    organization_id=r.organization_id,is_organization_subscription=r.is_organization_subscription,
    seat_count=r.seat_count,assigned_seats=r.assigned_seats,product_id=r.product_id,auth_updated_at=r.auth_updated_at
    FROM jsonb_populate_record(NULL::public.subscription_cache,d) r WHERE c.id=r.id AND c.user_id=r.user_id;
  END $$;`);
 }
 docker(psql,(genericDto?"SELECT set_config('zoho.real_generic','true',false);\n":'')+read('functions/__tests__/sql/zoho-projection-compatibility.sql'));
 docker(psql,read('functions/__tests__/sql/zoho-private-readers.sql'));
 docker(psql,read('functions/__tests__/sql/zoho-projection-readiness.sql'));
 docker(psql,candidateAdministrationTables(read));
 const administrationMigration=read('supabase/migrations/20270217040000_zoho_candidate_context_privacy.sql').trim();
 if(!administrationMigration.startsWith('BEGIN;')||!administrationMigration.endsWith('COMMIT;'))throw new Error('Administration transaction envelope missing');
 // Deployed local schemas also use a text role column without the historical
 // enum. Both supported shapes must execute the same projection/privacy suite.
 for(const textRole of [false,true])docker(psql,['BEGIN;',
  ...(textRole?['ALTER TABLE public.users ALTER COLUMN role TYPE text USING role::text; DROP TYPE public.user_role;']:[]),
  administrationMigration.slice('BEGIN;'.length,-'COMMIT;'.length),
  read('functions/__tests__/sql/zoho-candidate-context-privacy.sql'),
  read('supabase/migrations/20270218020000_zoho_operator_history.sql').trim().slice('BEGIN;'.length,-'COMMIT;'.length),
  read('supabase/seed/dev/20270218020000_seed_zoho_operator_history.sql').trim().slice('BEGIN;'.length,-'COMMIT;'.length),
  read('functions/__tests__/sql/zoho-operator-history.sql'),
  read('supabase/migrations/20270218030000_zoho_administration_order.sql').trim().slice('BEGIN;'.length,-'COMMIT;'.length),
  read('functions/__tests__/sql/zoho-administration-order.sql'),'ROLLBACK;'].join('\n'));
 console.log('Projection SQL atomicity, server-only boundary and filtered-reader privacy, label compatibility, access preservation, version, deletion and two-session idempotency regressions passed.');
}finally{if(created)docker(['dropdb','-U','postgres',name]);}
