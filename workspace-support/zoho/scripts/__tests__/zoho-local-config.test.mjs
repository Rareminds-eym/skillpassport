import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {createRequire} from 'node:module';
import { isLocalDatabaseUrl, planLocalEnable, replaceLocalFiles, requireDashboardRuntime, verifyLocalProjection, serializeLocalVars, localRecoverySchedule, localRecoveryTickUrl } from '../lib/zoho-local-config.mjs';
import { ZOHO_DEFAULTS } from '../../sp-dash/lib/zoho/config.js';

test('local schedule generation and manual ticking use the application cadence',()=>{
  const schedule=localRecoverySchedule();
  assert.deepEqual(JSON.parse(schedule.split('crons=')[1].trim()),[ZOHO_DEFAULTS.recoveryCron]);
  const url=new URL(localRecoveryTickUrl());
  assert.equal(url.origin,'http://127.0.0.1:8896');assert.equal(url.pathname,'/__scheduled');
  assert.equal(url.searchParams.get('cron'),ZOHO_DEFAULTS.recoveryCron);
});

test('local variables preserve JSON keyrings and multiline credentials through dotenv parsing', () => {
  const require = createRequire(new URL('../../sp-dash/package.json',import.meta.url));
  const values = {ZOHO_TOKEN_ENCRYPTION_KEYS:JSON.stringify({'local-v2':'a'.repeat(43)+'='}),JWT_PRIVATE_KEY:'-----BEGIN KEY-----\nfixture\n-----END KEY-----',FIXTURE_PATH:'literal\\nvalue',FIXTURE_QUOTE:"operator's value"};
  const parsed = require('dotenv').parse(serializeLocalVars(values));
  assert.deepEqual(parsed,values);
  assert.deepEqual(JSON.parse(parsed.ZOHO_TOKEN_ENCRYPTION_KEYS),JSON.parse(values.ZOHO_TOKEN_ENCRYPTION_KEYS));
});

function configurations() {
  return {
    'sp-dash': { SKILLPASSPORT_SUPABASE_URL:'http://127.0.0.1:54321', ZOHO_EXECUTION_ENABLED:'false', ZOHO_DISCOVERY_ENABLED:'false' },
    'sso-worker': { SUPABASE_URL:'http://127.0.0.1:54331', ZOHO_CANDIDATE_PROVISIONING_ENABLED:'false' },
    skillpassport: { SUPABASE_URL:'http://127.0.0.1:54321', INTERNAL_WEBHOOK_SECRET:'local-test', ZOHO_PROJECTION_DELIVERY_ENABLED:'false', GOOGLE_OAUTH_ENABLED:'false' },
    'auth-sync-consumer': { SKILLPASSPORT_SYNC_URL:'http://127.0.0.1:8898', SYNC_API_SECRET:'local-test' },
  };
}
test('a later nonlocal configuration rejects the whole enable plan without modifying input', () => {
  const input=configurations(); input['sso-worker'].SUPABASE_URL='https://outside.invalid';
  const before=structuredClone(input);
  assert.throws(()=>planLocalEnable(input),/Nonlocal database/);
  assert.deepEqual(input,before);
});
test('checks every database alias, not only the first valid URL', () => {
  const input=configurations();input['sp-dash'].SUPABASE_URL='https://outside.invalid';
  assert.throws(()=>planLocalEnable(input),/Nonlocal database/);
  for(const url of ['ftp://localhost','http://user:pass@localhost','http://localhost/other','http://localhost?target=remote']) assert.equal(isLocalDatabaseUrl(url),false);
});
test('selects the local code profile and removes obsolete settings without altering secrets', () => {
  const input=configurations(), result=planLocalEnable(input);
  assert.equal(result['sp-dash'].ZOHO_DISCOVERY_ENABLED,undefined);
  assert.equal(result['sp-dash'].ENVIRONMENT,'development');
  assert.equal(result['sso-worker'].ZOHO_CANDIDATE_PROVISIONING_ENABLED,undefined);
  assert.equal(result['sso-worker'].ENVIRONMENT,'development');
  assert.equal(result.skillpassport.GOOGLE_OAUTH_ENABLED,'false');
  assert.equal(result.skillpassport.INTERNAL_WEBHOOK_SECRET,'local-test');
  assert.equal(input.skillpassport.ZOHO_PROJECTION_DELIVERY_ENABLED,'false');
});
test('rejects mail configuration and mismatched secrets before enabling', () => {
  const input=configurations();input['auth-sync-consumer'].SYNC_API_SECRET='different';
  assert.throws(()=>planLocalEnable(input),/sync wiring/);
  input['auth-sync-consumer'].SYNC_API_SECRET='local-test';input['sp-dash'].EMAIL_QUEUE='mail';
  assert.throws(()=>planLocalEnable(input),/Mail configuration/);
});
test('restores an earlier file if a later replacement fails', () => {
  const directory=fs.mkdtempSync(join(tmpdir(),'zoho-config-test-'));
  try {
    const files=['dashboard','sso','application'].map(name=>({path:join(directory,name),contents:'enabled'}));
    for(const file of files) fs.writeFileSync(file.path,'disabled');
    let failed=false;
    const io={...fs,renameSync:(from,to)=>{
      if(to===files[1].path&&!failed){failed=true;throw new Error('Injected replacement failure');}
      fs.renameSync(from,to);
    }};
    assert.throws(()=>replaceLocalFiles(files,io),/Injected replacement failure/);
    for(const file of files) assert.equal(fs.readFileSync(file.path,'utf8'),'disabled');
    assert.equal(fs.readdirSync(directory).length,3);
    replaceLocalFiles(files);
    for(const file of files) assert.equal(fs.readFileSync(file.path,'utf8'),'enabled');
    assert.equal(fs.readdirSync(directory).length,3);
  } finally {fs.rmSync(directory,{recursive:true,force:true});}
});
test('reads every original before staging writes', () => {
  const directory=fs.mkdtempSync(join(tmpdir(),'zoho-config-test-'));
  try {
    const path=join(directory,'dashboard');fs.writeFileSync(path,'disabled');
    assert.throws(()=>replaceLocalFiles([{path,contents:'enabled'},{path:join(directory,'missing'),contents:'enabled'}]),/ENOENT/);
    assert.equal(fs.readFileSync(path,'utf8'),'disabled');
    assert.deepEqual(fs.readdirSync(directory),['dashboard']);
  } finally {fs.rmSync(directory,{recursive:true,force:true});}
});
test('fresh background startup requires the local runtime adapter with a preparation remedy', () => {
  assert.throws(()=>requireDashboardRuntime('/fixture',()=>false),/build-dashboard/);
  assert.doesNotThrow(()=>requireDashboardRuntime('/fixture',path=>path.endsWith('/dashboard-runtime.mjs')));
  assert.doesNotThrow(()=>requireDashboardRuntime('/fixture',()=>true));
});

const readiness={version:1,dependenciesReady:true,readOnly:true,emailPolicy:'forbidden',deliveryEnabled:false};
test('projection preflight authenticates to the fixed local route and accepts dependencies with delivery off',async()=>{
 let request;
 const result=await verifyLocalProjection('fixture-secret',{fetchImpl:async(url,options)=>{request={url,options};return Response.json(readiness);}});
 assert.equal(result.deliveryEnabled,false);assert.equal(request.url,'http://127.0.0.1:8898/sync/zoho-candidate');
 assert.equal(request.options.method,'GET');assert.equal(request.options.headers.Authorization,'Bearer fixture-secret');assert.equal(request.options.redirect,'manual');
});
test('projection preflight rejects routing, authentication, redirects and unavailable dependencies',async()=>{
 for(const status of [400,401,503,302]) await assert.rejects(verifyLocalProjection('fixture-secret',{fetchImpl:async()=>new Response(null,{status})}),/unavailable/);
});
test('projection preflight requires positive versioned no-email read-only evidence',async()=>{
 for(const patch of [{dependenciesReady:false},{version:2},{readOnly:false},{emailPolicy:'allowed'},{deliveryEnabled:'true'}])
  await assert.rejects(verifyLocalProjection('fixture-secret',{fetchImpl:async()=>Response.json({...readiness,...patch})}),/not verified/);
});
test('post-restart projection verification requires delivery to be enabled',async()=>{
 await assert.rejects(verifyLocalProjection('fixture-secret',{requireDelivery:true,fetchImpl:async()=>Response.json(readiness)}),/not verified/);
 await verifyLocalProjection('fixture-secret',{requireDelivery:true,fetchImpl:async()=>Response.json({...readiness,deliveryEnabled:true})});
});
