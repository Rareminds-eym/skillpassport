import {beforeEach,describe,it,expect,vi} from 'vitest';
vi.mock('../lib/db',()=>({createDb:vi.fn()}));
import {handleCandidateProjection,handleCandidateProjectionReadiness} from '../lib/zoho-candidate-projection';
import type {PagesEnv} from '../lib/types';
const id='10000000-0000-4000-8000-000000000001';
const target='10000000-0000-4000-8000-000000000002';
const reference={operationId:id,sourceHash:'a'.repeat(64),emailPolicy:'forbidden'};
const snapshot=JSON.stringify({...reference,targetId:target,amount:100.50});
let projectionHash:string;
beforeEach(async()=>{projectionHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(snapshot)))).map(v=>v.toString(16).padStart(2,'0')).join('');});
function fixture(){
 const proof={...reference,projectionHash,projectionReceiptId:id};
 const source={getProjectionSnapshot:vi.fn(async()=>({operationId:id,sourceHash:reference.sourceHash,targetId:target,projectionHash,snapshot})),
  confirmProjection:vi.fn(async()=>({...reference,state:'completed',targetId:target,receiptId:id}))};
 const rpc=vi.fn(async()=>({data:proof,error:null}));
 const database=vi.fn(()=>({rpc}));
 const env={ZOHO_PROJECTION_DELIVERY_ENABLED:'true',INTERNAL_WEBHOOK_SECRET:'fixture-secret',ZOHO_CANDIDATE_SOURCE:source} as PagesEnv;
 const request=(value:unknown={action:'project',data:reference},secret='fixture-secret')=>new Request('https://app.fixture.example/sync/zoho-candidate',{
  method:'POST',headers:{Authorization:`Bearer ${secret}`},body:JSON.stringify(value)});
 return {env,source,rpc,database,request,proof};
}
describe('silent candidate projection endpoint',()=>{
 it('defaults off before authentication, storage or canonical reads',async()=>{
  const f=fixture();const response=await handleCandidateProjection({env:{...f.env,ZOHO_PROJECTION_DELIVERY_ENABLED:'false'},request:f.request()},f.database as never);
  expect(response.status).toBe(503);expect(f.database).not.toHaveBeenCalled();expect(f.source.getProjectionSnapshot).not.toHaveBeenCalled();
 });
 it('requires the existing webhook secret and an exact bounded reference',async()=>{
  const f=fixture();
  expect((await handleCandidateProjection({env:f.env,request:f.request(undefined,'wrong')},f.database as never)).status).toBe(401);
  for(const data of [{...reference,planCode:'premium'},{...reference,emailPolicy:'allowed'},{...reference,email:'private@fixture.example'},'x'.repeat(5000)])
   expect((await handleCandidateProjection({env:f.env,request:f.request({action:'project',data})},f.database as never)).status).toBe(400);
  expect(f.database).not.toHaveBeenCalled();expect(f.source.getProjectionSnapshot).not.toHaveBeenCalled();
 });
 it('fetches canonical text independently, applies it exactly and confirms before success',async()=>{
  const f=fixture(); const response=await handleCandidateProjection({env:f.env,request:f.request()},f.database as never);
  expect(response.status).toBe(200);expect(await response.json()).toEqual({success:true,data:{...reference,completed:true}});
  expect(f.source.getProjectionSnapshot).toHaveBeenCalledExactlyOnceWith(reference);
  expect(f.rpc).toHaveBeenCalledExactlyOnceWith('zoho_apply_candidate_projection',{p_snapshot:snapshot,p_projection_hash:projectionHash});
  expect(f.source.confirmProjection).toHaveBeenCalledExactlyOnceWith(f.proof);
  expect(f.rpc.mock.invocationCallOrder[0]).toBeLessThan(f.source.confirmProjection.mock.invocationCallOrder[0]);
 });
 it('rejects mismatched digests and references without application writes',async()=>{
  for(const changed of [{projectionHash:'b'.repeat(64)},{sourceHash:'b'.repeat(64)},{targetId:id},{snapshot:'x'.repeat(131073)}]){
   const f=fixture();f.source.getProjectionSnapshot.mockResolvedValue({operationId:id,sourceHash:reference.sourceHash,targetId:target,projectionHash,snapshot,...changed});
   expect((await handleCandidateProjection({env:f.env,request:f.request()},f.database as never)).status).toBe(503);
   expect(f.rpc).not.toHaveBeenCalled();expect(f.source.confirmProjection).not.toHaveBeenCalled();
  }
 });
 it('retains committed but unconfirmed work for replay',async()=>{
  const f=fixture();f.source.confirmProjection.mockRejectedValue(new Error('Private dependency detail'));
  const response=await handleCandidateProjection({env:f.env,request:f.request()},f.database as never);
  expect(response.status).toBe(503);expect(await response.text()).not.toContain('Private');expect(f.rpc).toHaveBeenCalledOnce();
 });
 it('never confirms failed storage or mismatched application receipts',async()=>{
  const f=fixture();f.rpc.mockResolvedValue({data:{...f.proof,sourceHash:'b'.repeat(64)},error:null});
  expect((await handleCandidateProjection({env:f.env,request:f.request()},f.database as never)).status).toBe(503);
  expect(f.source.confirmProjection).not.toHaveBeenCalled();
 });
 it('retains storage failures without invoking canonical completion',async()=>{
  const f=fixture();f.rpc.mockRejectedValue(new Error('Private SQL detail'));
  const response=await handleCandidateProjection({env:f.env,request:f.request()},f.database as never);
  expect(response.status).toBe(503);expect(await response.text()).not.toContain('Private');expect(f.source.confirmProjection).not.toHaveBeenCalled();
 });
 it('times out independent confirmation without reporting completion',async()=>{
  const f=fixture();f.source.confirmProjection.mockImplementation(()=>new Promise(()=>{}));
  vi.useFakeTimers();
  try {
   const pending=handleCandidateProjection({env:f.env,request:f.request()},f.database as never);
   // crypto and body reads need real event-loop turns before starting dependency timers.
   await vi.waitFor(()=>expect(f.source.confirmProjection).toHaveBeenCalled());
   await vi.advanceTimersByTimeAsync(5000);
   expect((await pending).status).toBe(503);
  } finally {vi.useRealTimers();}
 });
});

describe('authenticated projection dependency readiness',()=>{
 function fixtureReadiness(){
  const f=fixture();
  const policy=vi.fn(async()=>({version:1,genericSyncAllowed:true}));
  f.env.ZOHO_CANDIDATE_SOURCE={...f.source,getSubjectSyncPolicy:policy};
  f.rpc.mockResolvedValue({data:true,error:null} as never);
  const request=(secret='fixture-secret')=>new Request('https://app.fixture.example/sync/zoho-candidate',{headers:{Authorization:`Bearer ${secret}`}});
  return {...f,policy,request};
 }
 it('verifies real dependencies while delivery is off without granting write authority',async()=>{
  const f=fixtureReadiness();f.env.ZOHO_PROJECTION_DELIVERY_ENABLED='false';
  const response=await handleCandidateProjectionReadiness({request:f.request(),env:f.env},f.database as never);
  expect(response.status).toBe(200);expect(await response.json()).toEqual({version:1,dependenciesReady:true,readOnly:true,emailPolicy:'forbidden',deliveryEnabled:false});
  expect(f.policy).toHaveBeenCalledExactlyOnceWith({userId:'00000000-0000-4000-8000-000000000000'});
  expect(f.rpc).toHaveBeenCalledExactlyOnceWith('zoho_candidate_projection_ready',{});
  expect(f.source.getProjectionSnapshot).not.toHaveBeenCalled();expect(f.source.confirmProjection).not.toHaveBeenCalled();
  expect(f.env.ZOHO_PROJECTION_DELIVERY_ENABLED).toBe('false');
 });
 it('reports delivery state separately after restart',async()=>{
  const f=fixtureReadiness();const response=await handleCandidateProjectionReadiness({request:f.request(),env:f.env},f.database as never);
  expect(response.status).toBe(200);expect((await response.json()).deliveryEnabled).toBe(true);
 });
 it('rejects invalid credentials before consulting dependencies',async()=>{
  const f=fixtureReadiness();
  expect((await handleCandidateProjectionReadiness({request:f.request('wrong'),env:f.env},f.database as never)).status).toBe(401);
  expect(f.database).not.toHaveBeenCalled();expect(f.policy).not.toHaveBeenCalled();
 });
 it.each(['missing','incomplete'])('rejects a %s canonical binding',async(kind)=>{
  const f=fixtureReadiness();f.env.ZOHO_CANDIDATE_SOURCE=kind==='missing'?undefined:{getProjectionSnapshot:f.source.getProjectionSnapshot,confirmProjection:f.source.confirmProjection};
  expect((await handleCandidateProjectionReadiness({request:f.request(),env:f.env},f.database as never)).status).toBe(503);
  expect(f.database).not.toHaveBeenCalled();
 });
 it.each([false,null,'true'])('rejects noncanonical database readiness %j',async(data)=>{
  const f=fixtureReadiness();f.rpc.mockResolvedValue({data,error:null} as never);
  expect((await handleCandidateProjectionReadiness({request:f.request(),env:f.env},f.database as never)).status).toBe(503);
 });
 it('does not disclose dependency errors or accept malformed canonical policy',async()=>{
  const f=fixtureReadiness();f.policy.mockRejectedValue(new Error('private dependency details'));
  const response=await handleCandidateProjectionReadiness({request:f.request(),env:f.env},f.database as never);
  expect(response.status).toBe(503);expect(await response.text()).not.toContain('private');
  f.policy.mockResolvedValue({version:2,genericSyncAllowed:true});
  expect((await handleCandidateProjectionReadiness({request:f.request(),env:f.env},f.database as never)).status).toBe(503);
 });
});
