// @vitest-environment node
import {beforeEach,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({rpc:vi.fn(),from:vi.fn(),sections:vi.fn(),eq:vi.fn(),profileError:null as any}));
vi.mock('../lib/auth',()=>({withAuth:(handler:any)=>handler}));
vi.mock('../lib/supabase',()=>({getServiceClient:()=>({rpc:mocks.rpc,from:mocks.from})}));
vi.mock('../lib/logger',()=>({createLogger:()=>({info:vi.fn(),warn:vi.fn(),error:vi.fn()})}));
vi.mock('../api/assessment/utils/question-loader',()=>({loadSectionsWithQuestions:mocks.sections}));
import {onRequestPost} from '../api/assessment-attempts';
import {startHandler} from '../api/assessment/handlers/start';
const owner='10000000-0000-4000-8000-000000000001',learner='20000000-0000-4000-8000-000000000001';
const attempt={id:'30000000-0000-4000-8000-000000000001',learner_id:learner,status:'in_progress',grade_level:'after12',stream_id:'bca',all_responses:{},timer_remaining:0};
const ctx=(body:unknown,sub=owner)=>({request:new Request('https://fixture.invalid/api/assessment-attempts',{
 method:'POST',body:typeof body==='string'?body:JSON.stringify(body)}),env:{},data:{user:{sub}}}) as any;
beforeEach(()=>{
 vi.clearAllMocks();mocks.profileError=null;mocks.rpc.mockResolvedValue({data:{attempt,created:true},error:null});
 mocks.sections.mockResolvedValue([{name:'Section'}]);
 mocks.from.mockImplementation((table:string)=>{
  if(table!=='learners')throw new Error('Unexpected direct database access');
  const q:any={select:()=>q,eq:(...args:any[])=>{mocks.eq(...args);return q;},
   maybeSingle:async()=>({data:{id:learner,course_name:'Bachelor of Computer Applications'},error:mocks.profileError})};return q;
 });
});
it('derives owner authority and makes new creation explicit',async()=>{
 const response=await onRequestPost(ctx({reference:learner.toUpperCase(),streamId:'bca',gradeLevel:'college'}));
 expect(response.status).toBe(201);expect(response.headers.get('Cache-Control')).toBe('no-store');
 expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('start_owned_assessment',{
  p_owner:owner,p_stream:'bca',p_grade:'college',p_reference:learner,p_context:null,p_reuse:false,
 });expect(mocks.from).not.toHaveBeenCalled();
});
it('supports a valid null-stream attempt',async()=>{
 mocks.rpc.mockResolvedValue({data:{attempt:{...attempt,stream_id:null,grade_level:'college'},created:true},error:null});
 expect((await onRequestPost(ctx({gradeLevel:'college',streamId:null}))).status).toBe(201);
});
it('uses canonical stream grade for modern question loading and binds server profile context',async()=>{
 const response=await startHandler(ctx({gradeLevel:'college',streamId:'bca'}));
 expect(response.status).toBe(201);expect(mocks.eq).toHaveBeenCalledWith('user_id',owner);
 expect(mocks.rpc.mock.calls[0][1]).toMatchObject({p_reference:learner,p_reuse:true,p_context:{programName:'Bachelor of Computer Applications'}});
 expect(mocks.sections.mock.calls[0].slice(1,3)).toEqual(['after12','bca']);
});
it('preserves responses and an expired zero timer when modern start resumes',async()=>{
 mocks.rpc.mockResolvedValue({data:{attempt:{...attempt,all_responses:{q:1}},created:false},error:null});
 const response=await startHandler(ctx({gradeLevel:'college',streamId:'bca'}));
 expect(response.status).toBe(200);expect(await response.json()).toMatchObject({isResumed:true,attempt:{all_responses:{q:1},timer_remaining:0}});
});
it.each([null,[], '{',{gradeLevel:'bad'},{gradeLevel:'college',streamId:''},{gradeLevel:'college',streamId:1},
 {gradeLevel:'college',owner},{gradeLevel:'college',learnerId:learner},{gradeLevel:'college',reference:'bad'},
 {gradeLevel:'college',reuse:true},{gradeLevel:'college',learnerContext:{x:1}}])('rejects malformed/privileged creation %j',async body=>{
 expect((await onRequestPost(ctx(body))).status).toBe(400);expect(mocks.rpc).not.toHaveBeenCalled();
});
it('does not accept client learner references through the modern route',async()=>{
 expect((await startHandler(ctx({gradeLevel:'college',reference:learner}))).status).toBe(400);
 expect(mocks.rpc).not.toHaveBeenCalled();
});
it('keeps profile storage errors distinct from absence and avoids creation',async()=>{
 mocks.profileError={message:'private error'};const response=await startHandler(ctx({gradeLevel:'college'}));
 expect(response.status).toBe(503);expect(await response.text()).not.toContain('private error');expect(mocks.rpc).not.toHaveBeenCalled();
});
it('does not turn a question-load failure into a successful start or raw fallback',async()=>{
 mocks.sections.mockRejectedValueOnce(new Error('private provider failure'));
 const response=await startHandler(ctx({gradeLevel:'college',streamId:'bca'}));
 expect(response.status).toBe(500);expect(await response.text()).not.toContain('private provider failure');
 expect(mocks.rpc).toHaveBeenCalledOnce();
});
it.each([['22023',400],['42501',403],['P0001',409],['PGRST202',503],['XX000',503]])('sanitizes failed creation %s',async(code,status)=>{
 mocks.rpc.mockResolvedValue({data:null,error:{code,message:'private error'}});
 const response=await onRequestPost(ctx({gradeLevel:'college'}));expect(response.status).toBe(status);
 expect(await response.text()).not.toContain('private error');expect(response.headers.get('Cache-Control')).toBe('no-store');
});
it('does not claim success for missing owner rows',async()=>{
 mocks.rpc.mockResolvedValue({data:null,error:null});
 expect((await onRequestPost(ctx({gradeLevel:'college'}))).status).toBe(404);
});
it.each([{attempt:{...attempt,status:'completed'},created:true},{attempt:{...attempt,id:'bad'},created:true},
 {attempt:{...attempt,stream_id:'college'},created:true},{attempt,created:'true'},{attempt,created:false}])('rejects malformed/wrong-context receipts %j',async data=>{
 mocks.rpc.mockResolvedValue({data,error:null});expect((await onRequestPost(ctx({gradeLevel:'college',streamId:'bca'}))).status).toBe(503);
});
it('requires the authenticated subject',async()=>{
 expect((await onRequestPost(ctx({gradeLevel:'college'},''))).status).toBe(401);expect(mocks.rpc).not.toHaveBeenCalled();
});
it('bounds creation input',async()=>{
 expect((await onRequestPost(ctx(' '.repeat(65537)))).status).toBe(413);expect(mocks.rpc).not.toHaveBeenCalled();
});
