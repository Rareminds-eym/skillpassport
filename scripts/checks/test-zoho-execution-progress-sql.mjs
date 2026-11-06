import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const root=new URL('../../',import.meta.url), container=process.argv[2]||'supabase_db_skillpassport';
if(!/^[a-zA-Z0-9_-]+$/.test(container))throw new Error('Invalid local container');
const database=`zoho_execution_progress_test_${process.pid}_${Date.now()}`;
function run(args,input){
 const result=spawnSync('docker',['exec',...(input?['-i']:[]),container,...args],{input,encoding:'utf8',timeout:60000,maxBuffer:1000000});
 if(result.error||result.status!==0)throw new Error(result.error?.message||result.stderr||'SQL fixture failed');
 return result.stdout;
}
run(['createdb','-U','postgres',database]);
try{
 const setup=`CREATE TABLE public.zoho_staged_records(id uuid,connection_id uuid,module text);
 CREATE TABLE public.zoho_approved_operations(record_id uuid,state text,action text,last_error text,lease_expires_at timestamptz,
 expires_at timestamptz,execution_attempts integer,next_attempt_at timestamptz,id uuid DEFAULT gen_random_uuid(),lease_token uuid DEFAULT gen_random_uuid(),source_hash text DEFAULT repeat('a',64),expected_target_id uuid,next_reconcile_at timestamptz DEFAULT now());
 GRANT SELECT ON public.zoho_staged_records,public.zoho_approved_operations TO service_role;`;
 const migration=readFileSync(new URL('supabase/migrations/20270224000000_zoho_execution_progress.sql',root),'utf8');
 const recovery=readFileSync(new URL('supabase/migrations/20270225000000_zoho_recovery_throughput.sql',root),'utf8');
 const checks=readFileSync(new URL('functions/__tests__/sql/zoho-execution-progress.sql',root),'utf8');
 run(['psql','-U','postgres','-d',database,'-X','-v','ON_ERROR_STOP=1'],setup+'\n'+migration+'\n'+recovery+'\n'+checks);
 process.stdout.write('Zoho execution progress SQL: passed (isolated synthetic database).\n');
}finally{run(['dropdb','-U','postgres',database]);}
