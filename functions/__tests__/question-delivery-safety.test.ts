import {beforeEach,describe,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({rpc:vi.fn(),owner:vi.fn(),generate:vi.fn(),lookup:vi.fn()}));
vi.mock('../lib/supabase',()=>({getServiceClient:()=>({rpc:mocks.rpc}),createSupabaseAdminClient:()=>({from:()=>({select:()=>({eq:()=>({eq:()=>({maybeSingle:mocks.lookup})})})})})}));
vi.mock('../lib/assessment-question-owner',()=>({ownQuestionLearner:mocks.owner}));
vi.mock('../api/question-generation/handlers/career-aptitude',()=>({generateAptitudeQuestions:mocks.generate}));
import {sanitizeLearnerQuestions,deliverGeneratedQuestions} from '../lib/assessment-question-safety';
import {handleStreamingAptitude} from '../api/question-generation/handlers/streaming';
const owner='10000000-0000-4000-8000-000000000001',attempt='20000000-0000-4000-8000-000000000001';
const context={env:{},data:{user:{sub:owner}}};
beforeEach(()=>{vi.clearAllMocks();mocks.owner.mockResolvedValue(owner);mocks.lookup.mockResolvedValue({data:{id:'bca',grade_level:'after12'}});});
describe('server question keys remain private during learner delivery',()=>{
 it('recursively strips all correctness and explanation aliases while preserving display fields',()=>{
  const questions=[{id:'1',question:'Choose',options:{A:{text:'One',isCorrect:true,explanation:'secret'},B:'Two'},correct_answer:'A',correctAnswer:'A',correct:'A',correctOptionIndex:0,answerKey:'A',solution:'secret',rationale:'secret',description:'Answer explanation',explanations:['secret'],metadata:{scoring_weights:[1,0],difficulty:'easy'}}];
  expect(sanitizeLearnerQuestions(questions)).toEqual([{id:'1',question:'Choose',options:{A:{text:'One'},B:'Two'},metadata:{difficulty:'easy'}}]);
  expect(questions[0].correct_answer).toBe('A');
 });
 it('returns the exact canonical set bound to this owner rather than a concurrent generated set',async()=>{
  mocks.rpc.mockResolvedValue({data:{questions:[{id:'canonical',correct_answer:'A',text:'Canonical'}],bound:true}});
  const result=await deliverGeneratedQuestions(context,{attemptId:attempt,streamId:'bca',questionType:'aptitude',questions:[{id:'racing',correct_answer:'B'}]});
  expect(result).toEqual([{id:'canonical',text:'Canonical'}]);expect(mocks.rpc).toHaveBeenCalledWith('snapshot_generated_assessment_questions',{p_owner:owner,p_attempt:attempt,p_stream:'bca',p_type:'aptitude'});
 });
 it('does not attest legacy sets or deliveries without an attempt',async()=>{
  const questions=[{id:'legacy',correct:'B'}];mocks.rpc.mockResolvedValue({data:{questions,bound:false}});
  expect(await deliverGeneratedQuestions(context,{attemptId:attempt,streamId:'bca',questionType:'knowledge',questions})).toEqual([{id:'legacy'}]);
  mocks.rpc.mockClear();expect(await deliverGeneratedQuestions(context,{streamId:'bca',questionType:'knowledge',questions})).toEqual([{id:'legacy'}]);expect(mocks.rpc).not.toHaveBeenCalled();
 });
 it('rejects invalid owners and failed question binding before delivery',async()=>{
  await expect(deliverGeneratedQuestions({data:{user:{sub:'bad'}}},{attemptId:attempt,streamId:'bca',questionType:'aptitude',questions:[]})).rejects.toThrow();
  expect(mocks.rpc).not.toHaveBeenCalled();mocks.rpc.mockResolvedValue({error:{code:'P0001'}});
  await expect(deliverGeneratedQuestions(context,{attemptId:attempt,streamId:'bca',questionType:'aptitude',questions:[]})).rejects.toThrow('binding unavailable');
 });
 it('binds canonical questions before emitting keyless SSE events',async()=>{
  mocks.generate.mockResolvedValue([{id:'racing',correct:'A'}]);mocks.rpc.mockResolvedValue({data:{questions:[{id:'canonical',correct_answer:'B',explanation:'secret'}],bound:true}});
  const request=new Request('https://fixture.invalid/stream',{method:'POST',body:JSON.stringify({streamId:'bca',learnerId:owner,attemptId:attempt})});
  const response=await handleStreamingAptitude(request,{} as any,context);const body=await response.text();
  expect(response.status).toBe(200);expect(response.headers.get('Content-Type')).toBe('text/event-stream');
  expect(body).toContain('canonical');expect(body).not.toContain('racing');expect(body).not.toContain('correct');expect(body).not.toContain('secret');expect(body).toContain('"type":"complete"');
 });
 it('returns an HTTP failure instead of streaming unbound questions on ownership or storage failure',async()=>{
  const request=()=>new Request('https://fixture.invalid/stream',{method:'POST',body:JSON.stringify({streamId:'bca',attemptId:attempt})});
  mocks.owner.mockRejectedValueOnce(new Error('foreign'));expect((await handleStreamingAptitude(request(),{} as any,context)).status).toBe(403);expect(mocks.generate).not.toHaveBeenCalled();
  mocks.generate.mockResolvedValue([{id:'generated',correct:'A'}]);mocks.rpc.mockResolvedValue({error:{code:'P0001'}});
  const response=await handleStreamingAptitude(request(),{} as any,context);expect(response.status).toBe(503);expect(await response.text()).not.toContain('generated');
 });
});
