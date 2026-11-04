import {beforeEach,describe,it,expect,vi} from 'vitest';
const m=vi.hoisted(()=>({rpc:vi.fn(),insert:vi.fn(),update:vi.fn(),session:null as any}));
const owner='10000000-0000-4000-8000-000000000001',sessionId='30000000-0000-4000-8000-000000000001';
vi.mock('../lib/auth',()=>({getContextUser:()=>({id:owner})}));
vi.mock('../lib/supabase',()=>({createSupabaseAdminClient:()=>({rpc:m.rpc,from:(table:string)=>{
 const query={select:()=>query,eq:()=>query,order:async()=>({data:[]}),insert:m.insert,update:m.update,single:async()=>({data:table==='learners'?{user_id:owner}:m.session})};return query;
}})}));
import {submitAnswerHandler} from '../api/adaptive-session/handlers/submit-answer';
const context=(body:any)=>({env:{},data:{user:{sub:owner}},request:new Request('https://fixture.invalid/submit-answer',{method:'POST',body:JSON.stringify(body)})}) as any;
const body={sessionId,questionId:'first',selectedAnswer:'A',responseTimeMs:100};
beforeEach(()=>{
 vi.clearAllMocks();m.session={id:sessionId,learner_id:'20000000-0000-4000-8000-000000000001',status:'in_progress',grade_level:'middle_school',current_phase:'diagnostic_screener',
  current_question_index:0,current_difficulty:3,difficulty_path:[],questions_answered:0,correct_answers:0,all_responses:[],provisional_band:null,
  current_phase_questions:[{id:'first',text:'Choose',options:{A:'One',B:'Two'},correctAnswer:'A',subtag:'numerical_reasoning'},{id:'second',correctAnswer:'B'}]};
 m.rpc.mockImplementation(async(_name,args)=>args.p_read_only?{data:{recorded:false}}:{data:{recorded:true,replayed:false,isCorrect:true,previousDifficulty:3,session:{...m.session,questions_answered:1,correct_answers:1,current_question_index:1}}});
});
describe('adaptive answer atomic commit contract',()=>{
 it('commits through the owner/version RPC and never splits response insertion from session mutation',async()=>{
  const response=await submitAnswerHandler(context(body));expect(response.status).toBe(200);
  expect(m.rpc).toHaveBeenLastCalledWith('commit_owned_adaptive_answer',expect.objectContaining({p_owner:owner,p_session:sessionId,p_question:'first',p_answer:'A',p_read_only:false,
   p_expected_index:0,p_expected_answered:0,p_expected_phase:'diagnostic_screener',p_new_difficulty:3,p_test_complete:false}));
  expect(m.insert).not.toHaveBeenCalled();expect(m.update).not.toHaveBeenCalled();
 });
 it('returns a matching replay using persisted state without a second commit',async()=>{
  m.rpc.mockResolvedValue({data:{recorded:true,replayed:true,isCorrect:true,previousDifficulty:3,session:{...m.session,current_question_index:1,questions_answered:1,correct_answers:1}}});
  const response=await submitAnswerHandler(context(body));expect(response.status).toBe(200);expect(m.rpc).toHaveBeenCalledOnce();expect(JSON.stringify(await response.json())).toContain('"replayed":true');
 });
 it('rejects a different pool question before commit',async()=>{
  expect((await submitAnswerHandler(context({...body,questionId:'second'}))).status).toBe(404);
  expect(m.rpc).toHaveBeenCalledOnce();expect(m.rpc.mock.calls[0][1].p_read_only).toBe(true);expect(m.insert).not.toHaveBeenCalled();
 });
 it('turns a race or conflicting replay into a non-mutating conflict',async()=>{
  m.rpc.mockImplementation(async(_name,args)=>args.p_read_only?{data:{recorded:false}}:{error:{code:'40001'}});
  expect((await submitAnswerHandler(context(body))).status).toBe(409);expect(m.insert).not.toHaveBeenCalled();expect(m.update).not.toHaveBeenCalled();
 });
 it('rejects invalid response timing and terminal sessions',async()=>{
  expect((await submitAnswerHandler(context({...body,responseTimeMs:-1}))).status).toBe(400);expect(m.rpc).not.toHaveBeenCalled();
  m.session.status='completed';expect((await submitAnswerHandler(context(body))).status).toBe(409);expect(m.rpc).toHaveBeenCalledOnce();
 });
});
