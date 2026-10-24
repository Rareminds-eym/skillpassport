import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const container=process.env.RAG_TEST_CONTAINER??'supabase_db_skillpassport';
const database=`career_rag_test_${randomBytes(8).toString('hex')}`;
assert.match(database,/^career_rag_test_[a-f0-9]{16}$/);
let created=false,passed=0;
function sql(query,db=database){
 const result=spawnSync('docker',['exec','-i',container,'psql','-X','-U','postgres','-d',db,'-v','ON_ERROR_STOP=1','-q','-A','-t'],{input:query,encoding:'utf8',windowsHide:true,timeout:30000});
 if(result.error||result.status!==0)throw new Error(result.error?.message??result.stderr.trim());return result.stdout.trim();
}
function test(name,run){run();passed++;console.log(`PASS ${name}`);}
const actor='11111111-1111-4111-8111-111111111111',role='22222222-2222-4222-8222-222222222222',course='33333333-3333-4333-8333-333333333333';
const vector=`'[${[1,...Array(1535).fill(0)].join(',')}]'::extensions.vector`;
const other=`'[${[0,1,...Array(1534).fill(0)].join(',')}]'::extensions.vector`;
const source=kind=>kind==='role'?'catalog.roles':'catalog.courses';
const search=kind=>JSON.parse(sql(`SELECT rag_search('${actor}','${source(kind)}',${vector},'SQL data analysis',3);`));
const store=kind=>sql(`SELECT rag_store('${source(kind)}','${kind==='role'?role:course}',rag_document('${source(kind)}','${kind==='role'?role:course}')->>'revision',${vector},'google/gemini-embedding-2-preview');`);
try{
 sql(`CREATE DATABASE "${database}";`,'postgres');created=true;
 sql(`CREATE SCHEMA extensions;CREATE EXTENSION vector WITH SCHEMA extensions;
 CREATE TABLE learners(id uuid PRIMARY KEY,user_id uuid UNIQUE);
 CREATE TABLE role(id uuid PRIMARY KEY,name text);
 CREATE TABLE role_family_roles(id uuid PRIMARY KEY,role_id uuid,description text,direct_degree_mapping text,degree_gate text,typical_work_activities text,is_active boolean);
 CREATE TABLE embeddings(id uuid DEFAULT gen_random_uuid(),entity_type text CONSTRAINT chk_entity_type CHECK(entity_type='role'),entity_id uuid,embedding extensions.vector(1536),metadata jsonb,updated_at timestamptz,UNIQUE(entity_type,entity_id));
 CREATE TABLE courses(course_id uuid PRIMARY KEY,title text,description text,target_outcomes jsonb,category text,duration text,classification text,university text,status text,deleted_at timestamptz,approval_status text,school_id uuid,embedding extensions.vector(1536));
 INSERT INTO learners VALUES(gen_random_uuid(),'${actor}');
 INSERT INTO role VALUES('${role}','Data analyst');
 INSERT INTO role_family_roles VALUES('${role}','${role}','SQL data analysis','Any degree','Preferred','Analyze data',true);
 INSERT INTO embeddings(entity_type,entity_id,embedding,metadata) VALUES('role','${role}',${vector},'{}');
 INSERT INTO courses(course_id,title,description,target_outcomes,category,duration,status,approval_status,embedding)
 VALUES('${course}','SQL basics','Learn SQL data analysis','["SQL"]','Data','4 weeks','Active','approved',${vector});`);
 sql(readFileSync(new URL('../supabase/migrations/20261023120000_generic_retrieval.sql',import.meta.url),'utf8'));
 test('fresh generic setup needs no legacy migration and installs one canonical trigger',()=>{
  assert.equal(sql(`SELECT to_regprocedure('public.career_rag_invalidate_vector_metadata()') IS NULL;`),'t');
  assert.equal(sql(`SELECT count(*) FROM pg_trigger WHERE tgrelid='public.embeddings'::regclass AND NOT tgisinternal AND tgfoid='public.rag_invalidate_vector_metadata()'::regprocedure;`),'1');
 });
 test('legacy vectors with unknown model are not used',()=>{
  assert.equal(search('role').status,'index_unavailable');assert.equal(search('course').status,'index_unavailable');
 });
 test('completely missing role vectors cannot masquerade as complete coverage',()=>{
  sql(`DELETE FROM embeddings WHERE entity_type='role';`);
  assert.equal(search('role').status,'index_unavailable');
 });
 test('canonical index writes are idempotent and pending excludes current documents',()=>{
  assert.equal(store('role'),'t');assert.equal(store('course'),'t');
  const before=sql(`SELECT metadata->'career_rag'->>'indexed_at' FROM embeddings WHERE entity_id='${role}';`);
  store('role');assert.equal(sql(`SELECT metadata->'career_rag'->>'indexed_at' FROM embeddings WHERE entity_id='${role}';`),before);
  assert.equal(sql(`SELECT (SELECT count(*) FROM rag_pending('catalog.roles','',10))+(SELECT count(*) FROM rag_pending('catalog.courses','',10));`),'0');
 });
 test('role and general public course search return bounded real records',()=>{
  for(const kind of ['role','course']){const result=search(kind);assert.equal(result.status,'matches');assert.equal(result.items.length,1);assert.equal(result.items[0].kind,kind);assert(!('embedding'in result.items[0]));}
 });
 test('changed source cannot accept stale index commit or be returned from search',()=>{
  const old=sql(`SELECT rag_document('catalog.courses','${course}')->>'revision';`);
  sql(`UPDATE courses SET description='New changed course text' WHERE course_id='${course}';`);
  assert.equal(sql(`SELECT rag_store('catalog.courses','${course}','${old}',${vector},'google/gemini-embedding-2-preview');`),'f');
  assert.equal(search('course').status,'index_unavailable');store('course');
 });
 test('publication, institution and degree restrictions are rechecked',()=>{
  sql(`UPDATE courses SET school_id=gen_random_uuid() WHERE course_id='${course}';`);assert.equal(search('course').status,'no_matches');
  sql(`UPDATE courses SET school_id=NULL,classification='college' WHERE course_id='${course}';`);assert.equal(search('course').status,'no_matches');
  sql(`UPDATE courses SET classification=NULL WHERE course_id='${course}';`);store('course');
  sql(`UPDATE role_family_roles SET degree_gate='Mandatory' WHERE id='${role}';`);assert.equal(search('role').status,'no_matches');
  sql(`UPDATE role_family_roles SET degree_gate='Preferred' WHERE id='${role}';`);store('role');
 });
 test('replay checks exact current source and rejects revoked records',()=>{
  const revision=sql(`SELECT rag_document('catalog.courses','${course}')->>'revision';`);
  const pins=JSON.stringify([{sourceKey:'catalog.courses',id:course,revision}]);
  assert.equal(sql(`SELECT rag_verify('${actor}','${pins}');`),'t');
  sql(`UPDATE courses SET status='Draft' WHERE course_id='${course}';`);
  assert.equal(sql(`SELECT rag_verify('${actor}','${pins}');`),'f');
  sql(`UPDATE courses SET status='Active' WHERE course_id='${course}';`);
 });
 test('untracked vector replacement invalidates provenance instead of mixing spaces',()=>{
  sql(`UPDATE embeddings SET embedding=${other} WHERE entity_type='course' AND entity_id='${course}';`);assert.equal(search('course').status,'index_unavailable');
  assert.equal(sql(`SELECT metadata->'career_rag' IS NULL FROM embeddings WHERE entity_type='course' AND entity_id='${course}';`),'t');store('course');
  sql(`UPDATE embeddings SET metadata=jsonb_set(metadata,'{career_rag,model}','"wrong"') WHERE entity_id='${role}';`);
  assert.equal(search('role').status,'index_unavailable');store('role');
 });
 test('course retrieval and replay use only generic embeddings, never the legacy course vector',()=>{
  sql(`UPDATE courses SET embedding=NULL WHERE course_id='${course}';`);
  assert.equal(search('course').status,'matches');
  const revision=sql(`SELECT rag_document('catalog.courses','${course}')->>'revision';`);
  assert.equal(sql(`SELECT rag_verify('${actor}','${JSON.stringify([{sourceKey:'catalog.courses',id:course,revision}])}');`),'t');
  sql(`DELETE FROM embeddings WHERE entity_type='course' AND entity_id='${course}';UPDATE courses SET embedding=${vector} WHERE course_id='${course}';`);
  assert.equal(search('course').status,'index_unavailable');
  store('course');
 });
 test('obsolete Career RPCs are not created and vector rows are not duplicated',()=>{
  assert.equal(sql(`SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname LIKE 'career_rag_%';`),'0');
  assert.equal(sql(`SELECT count(*) FROM embeddings;`),'2');
 });
 test('generic pending pagination is source scoped before applying limit',()=>{
  sql(`UPDATE embeddings SET metadata='{}';`);
  const docs=sql(`SELECT string_agg(value->>'kind',',') FROM rag_pending('catalog.roles','',1) value;`);
  assert.equal(docs,'role');store('role');store('course');
 });
 test('generic references verify current eligibility and reject unknown sources',()=>{
  const revision=sql(`SELECT rag_document('catalog.courses','${course}')->>'revision';`);
  const refs=JSON.stringify([{sourceKey:'catalog.courses',id:course,revision}]);
  assert.equal(sql(`SELECT rag_verify('${actor}','${refs}');`),'t');
  assert.throws(()=>sql(`SELECT rag_document('private.anything','${course}');`),/Unknown retrieval source/);
  assert.throws(()=>sql(`SELECT rag_search('99999999-9999-4999-8999-999999999999','catalog.courses',${vector},'SQL',3);`),/Actor is not a learner/);
  sql(`UPDATE courses SET deleted_at=now() WHERE course_id='${course}';`);
  assert.equal(sql(`SELECT rag_verify('${actor}','${refs}');`),'f');
  sql(`UPDATE courses SET deleted_at=NULL WHERE course_id='${course}';`);
 });
 test('generic facade is service-only and internal implementations are private',()=>{
  assert.equal(sql(`SELECT bool_and(NOT has_function_privilege('anon',p.oid,'EXECUTE') AND NOT has_function_privilege('authenticated',p.oid,'EXECUTE') AND has_function_privilege('service_role',p.oid,'EXECUTE')) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname IN ('rag_document','rag_pending','rag_store','rag_search','rag_verify');`),'t');
  assert.equal(sql(`SELECT bool_and(NOT has_function_privilege('service_role',p.oid,'EXECUTE')) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.proname LIKE 'rag_catalog_%';`),'t');
 });
 test('dimension provenance corruption is pending, rejects replay and can be repaired',()=>{
  sql(`UPDATE embeddings SET metadata=jsonb_set(metadata,'{career_rag,dimensions}','768') WHERE entity_type='course';`);
  assert.equal(sql(`SELECT count(*) FROM rag_pending('catalog.courses','',10);`),'1');
  const revision=sql(`SELECT rag_document('catalog.courses','${course}')->>'revision';`);
  assert.equal(sql(`SELECT rag_verify('${actor}','${JSON.stringify([{sourceKey:'catalog.courses',id:course,revision}])}');`),'f');
  store('course');assert.equal(sql(`SELECT count(*) FROM rag_pending('catalog.courses','',10);`),'0');
 });
 console.log(`${passed} isolated generic RAG SQL checks passed.`);
}finally{
 if(created){assert.match(database,/^career_rag_test_[a-f0-9]{16}$/);sql(`DROP DATABASE "${database}" WITH (FORCE);`,'postgres');console.log('Disposable RAG database removed.');}
}
