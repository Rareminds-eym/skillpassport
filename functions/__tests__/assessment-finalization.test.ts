// @vitest-environment node
import {beforeEach, expect, it, vi} from 'vitest';
const mocks = vi.hoisted(() => ({rpc: vi.fn()}));
vi.mock('../lib/supabase', () => ({getServiceClient: () => ({rpc: mocks.rpc})}));
import {saveResultsHandler} from '../api/assessment/handlers/save-results';
import {submitHandler} from '../api/assessment/handlers/submit';
const owner='10000000-0000-4000-8000-000000000001';
const attempt='20000000-0000-4000-8000-0000000000aa';
const result='30000000-0000-4000-8000-000000000001';
const ctx=(body: unknown,sub=owner)=>({request:new Request('https://fixture.invalid/api/assessment',{method:'POST',
  body:typeof body==='string'?body:JSON.stringify(body)}),env:{},data:{user:{sub}}}) as any;
beforeEach(()=>{vi.clearAllMocks();mocks.rpc.mockResolvedValue({data:{attemptId:attempt,resultId:result},error:null});});
it('submits using one owner-derived transaction without a read/write gap',async()=>{
 expect((await submitHandler(ctx({attemptId:attempt,answers:{q:1}}))).status).toBe(200);
 expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('finalize_owned_assessment',{
  p_owner:owner,p_attempt:attempt,p_action:'submit',p_payload:{answers:{q:1}},
 });
});
it('saves reports using one atomic transaction and accepts omitted/null stream context',async()=>{
 const response=await saveResultsHandler(ctx({attemptId:attempt,geminiResults:{overallSummary:'report'},streamId:null,sectionTimings:null}));
 expect(response.status).toBe(200);expect(response.headers.get('Cache-Control')).toBe('no-store');
 expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('finalize_owned_assessment',{
  p_owner:owner,p_attempt:attempt,p_action:'results',p_payload:{geminiResults:{overallSummary:'report'},streamId:null},
 });
});
it('normalizes uppercase request IDs before checking the canonical receipt',async()=>{
 expect((await submitHandler(ctx({attemptId:attempt.toUpperCase()}))).status).toBe(200);
 expect(mocks.rpc.mock.calls[0][1].p_attempt).toBe(attempt);
});
it.each([null,[], '{',{attemptId:'bad'}, {attemptId:attempt,answers:[]},{attemptId:attempt,answers:null},
 {attemptId:attempt,owner},{attemptId:attempt,status:'completed'}])('rejects malformed/privileged submission %j',async body=>{
 expect((await submitHandler(ctx(body))).status).toBe(400);expect(mocks.rpc).not.toHaveBeenCalled();
});
it.each([{geminiResults:null},{geminiResults:{}},{geminiResults:[]},{geminiResults:{x:1},learnerId:'bad'},
 {geminiResults:{x:1},sectionTimings:[]},{geminiResults:{x:1},sectionTimings:{q:-1}},
 {geminiResults:{x:1},adaptiveAptitudeSessionId:'bad'},{geminiResults:{x:1},owner}])('rejects malformed/privileged report %j',async patch=>{
 expect((await saveResultsHandler(ctx({attemptId:attempt,...patch}))).status).toBe(400);expect(mocks.rpc).not.toHaveBeenCalled();
});
it('returns absence for missing/foreign attempts without a result write fallback',async()=>{
 mocks.rpc.mockResolvedValue({data:null,error:null});
 expect((await saveResultsHandler(ctx({attemptId:attempt,geminiResults:{x:1}}))).status).toBe(404);
 expect(mocks.rpc).toHaveBeenCalledOnce();
});
it.each([['42501',403],['P0001',409],['22023',400],['XX000',503],['PGRST202',503]])('never acknowledges denied, terminal or failed finalization %s',async(code,status)=>{
 mocks.rpc.mockResolvedValue({data:null,error:{code,message:'private error'}});
 const response=await saveResultsHandler(ctx({attemptId:attempt,geminiResults:{x:1}}));
 expect(response.status).toBe(status);expect(await response.text()).not.toContain('private error');
 expect(response.headers.get('Cache-Control')).toBe('no-store');
});
it('does not acknowledge a failed attempt update through the atomic RPC',async()=>{
 mocks.rpc.mockRejectedValue(new Error('synthetic parent update failure'));
 expect((await saveResultsHandler(ctx({attemptId:attempt,geminiResults:{x:1}}))).status).toBe(503);
});
it.each([{attemptId:owner,resultId:result},{attemptId:attempt,resultId:'bad'},[]])('rejects mismatched receipts %j',async data=>{
 mocks.rpc.mockResolvedValue({data,error:null});
 expect((await submitHandler(ctx({attemptId:attempt}))).status).toBe(503);
});
it('requires a verified subject',async()=>{
 expect((await submitHandler(ctx({attemptId:attempt},''))).status).toBe(401);expect(mocks.rpc).not.toHaveBeenCalled();
});
it('bounds report input before storage',async()=>{
 expect((await saveResultsHandler(ctx(' '.repeat(262145)))).status).toBe(413);expect(mocks.rpc).not.toHaveBeenCalled();
});
