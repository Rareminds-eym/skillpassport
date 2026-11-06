import {readFileSync, existsSync} from 'node:fs';
import {spawn,spawnSync} from 'node:child_process';
const root=new URL('../../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const container=process.argv[2]||'supabase_db_skillpassport';
if(!/^[a-zA-Z0-9_-]+$/.test(container)) throw new Error('Invalid container');
const name=`zoho_job_test_${process.pid}_${Date.now()}`;
function docker(args,input){const r=spawnSync('docker',['exec',...(input?['-i']:[]),container,...args],{input,encoding:'utf8',timeout:120000,maxBuffer:2000000});if(r.error||r.status!==0)throw new Error(r.error?.message||r.stderr);return r.stdout;}
let created=false;
try{
 docker(['createdb','-U','postgres','--template=template0',name]);created=true;
 const args=['psql','-U','postgres','-d',name,'-v','ON_ERROR_STOP=1'];
 const baseline=read('supabase/migrations/20260526000000_schema.sql');
 const opportunity=baseline.match(/CREATE TABLE IF NOT EXISTS "public"\."opportunities" \([\s\S]*?\n\);/)?.[0].replace('"extensions"."vector"(1536)','text');
 if(!opportunity)throw new Error('Actual opportunity schema unavailable');
 const notifications=read('supabase/migrations/20261022115000_learning_job_notifications.sql');
 const notificationFunction=notifications.match(/CREATE FUNCTION public\.enqueue_learning_job_notification\(\)[\s\S]*?END \$\$;/)?.[0];
 if(!notificationFunction)throw new Error('Actual notification function unavailable');
 docker(args,`CREATE TABLE public.organizations(id uuid PRIMARY KEY);
 ${opportunity} ALTER TABLE public.opportunities ADD PRIMARY KEY(id), ADD COLUMN organization_id uuid REFERENCES public.organizations(id), ADD COLUMN learning_requirements jsonb NOT NULL DEFAULT '[]',ADD COLUMN learning_requirements_version bigint NOT NULL DEFAULT 1;
 CREATE TABLE public.features(id uuid PRIMARY KEY,feature_key text UNIQUE);
 CREATE TABLE public.tenant_entitlement_overrides(tenant_id uuid,feature_id uuid,value_numeric numeric,is_enabled boolean,expires_at timestamptz,updated_at timestamptz);
 CREATE TABLE public.subscription_cache(plan_id uuid,plan_code text,organization_id uuid,user_id uuid,status text,created_at timestamptz);
 CREATE TABLE public.plans_cache(id uuid,plan_code text,parent_plan_id uuid);
 CREATE TABLE public.plan_entitlements(plan_id uuid,feature_id uuid,value_numeric numeric,is_enabled boolean);
 CREATE FUNCTION public.get_addon_numeric_grants(uuid) RETURNS TABLE(feature_key text,quantity numeric) LANGUAGE sql AS 'SELECT NULL::text,NULL::numeric WHERE false';
 CREATE TABLE public.learning_job_notification_work(dedupe_key text UNIQUE,opportunity_id uuid,learner_id uuid);
 ${notificationFunction}
 CREATE TRIGGER enqueue_learning_opening AFTER INSERT OR UPDATE OF learning_requirements,status,is_active ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.enqueue_learning_job_notification();
 GRANT USAGE ON SCHEMA public TO service_role;
 ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
 `);
 for(const migration of ['20270128000000_zoho_recruit_approval_control_plane.sql','20270129000000_zoho_recruit_execution_ledger.sql','20270130000000_zoho_recruit_discovery_authority.sql','20270131000000_zoho_recruit_record_recovery.sql','20270201000000_zoho_recruit_live_execution_authority.sql','20270202000000_zoho_recruit_decision_recovery.sql','20270209000000_zoho_candidate_review_binding.sql','20270210000000_zoho_job_publisher.sql','20270211000000_zoho_job_no_effect_receipts.sql','20270212000000_zoho_discovery_incremental.sql','20270214000000_zoho_source_privacy.sql','20270215000000_zoho_payload_retention_fences.sql','20270217010000_zoho_source_lifecycle.sql','20270217011000_zoho_bulk_read.sql','20270217012000_zoho_deleted_scan_cursor.sql']){
  if(existsSync(new URL(`supabase/migrations/${migration}`,root)))docker(args,read(`supabase/migrations/${migration}`));
 }
 docker(args,read('functions/__tests__/sql/zoho-job-publisher.sql'));
 const race=async n=>new Promise((resolve,reject)=>{
  const child=spawn('docker',['exec',container,...args,'-t','-A','-c',`BEGIN; SET LOCAL ROLE service_role; SELECT public.zoho_apply_job_operation(grant_value) FROM public.fixture_concurrent_job_grants WHERE n=${n}; SELECT pg_sleep(0.1); COMMIT;`]);
  let stderr='';let stdout='';const timer=setTimeout(()=>{child.kill();reject(new Error('Quota race timed out'));},15000);
  child.stdout.on('data',value=>stdout+=value);child.stderr.on('data',value=>stderr+=value);
  child.on('error',error=>{clearTimeout(timer);reject(error);});child.on('close',code=>{clearTimeout(timer);resolve({code,stderr,stdout});});
 });
 const results=await Promise.all([race(1),race(2)]);
 if(results.some(result=>result.code!==0)) throw new Error(JSON.stringify(results));
 const outcomes=results.map(result=>JSON.parse(result.stdout.split('\n').find(line=>line.trim().startsWith('{'))||'null'));
 if(outcomes.filter(result=>result?.state==='completed').length!==1 || outcomes.filter(result=>result?.state==='not_applied'&&result.reviewRequired===true&&result.reasonCode==='JOB_REVIEW_REQUIRED').length!==1) throw new Error(JSON.stringify(outcomes));
 docker(args,`DO $$ BEGIN ASSERT (SELECT count(*)=1 FROM public.opportunities WHERE status='open' AND is_active); ASSERT (SELECT count(*)=3 FROM public.zoho_job_receipts); ASSERT NOT EXISTS(SELECT 1 FROM public.learning_job_notification_work); END $$;`);
 docker(args,read('functions/__tests__/sql/zoho-job-no-effect.sql'));
 docker(args,read('functions/__tests__/sql/zoho-bulk-source-lifecycle.sql'));
 console.log('Zoho job publisher SQL: approval/receipt/version/ownership/quota/no-email and cross-connection quota-race assertions passed.');
}finally{if(created)docker(['dropdb','-U','postgres','--force',name]);}
