// @vitest-environment node
import { SKILLPASSPORT_PRODUCT_ID } from '../lib/subscription-config';
import {beforeEach,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({rpc:vi.fn(),from:vi.fn(),sections:vi.fn(),eq:vi.fn(),profileError:null as any,update:vi.fn(),updateError:null as any,
 discover:vi.fn(),current:vi.fn(),action:vi.fn(),projection:vi.fn(),retake:vi.fn()}));
vi.mock('../lib/auth',()=>({withAuth:(handler:any)=>handler}));
vi.mock('../lib/supabase',()=>({getServiceClient:()=>({rpc:mocks.rpc,from:mocks.from}),getAuthToken:()=> 'synthetic-signed-token'}));
vi.mock('../lib/subscriptions/publication',()=>({readApplicationPlanProjection:mocks.projection}));
vi.mock('../lib/subscriptions/catalog-inventory',()=>({catalogInventoryDatabase:()=>({}),readApplicationFeatureInventory:vi.fn(),applicationFeatureDefinition:vi.fn()}));
vi.mock('../lib/logger',()=>({createLogger:()=>({info:vi.fn(),warn:vi.fn(),error:vi.fn()})}));
vi.mock('../api/assessment/utils/question-loader',()=>({loadSectionsWithQuestions:mocks.sections}));
import {onRequestPost} from '../api/assessment-attempts';
import {startHandler} from '../api/assessment/handlers/start';
const owner='10000000-0000-4000-8000-000000000001',learner='20000000-0000-4000-8000-000000000001';
const subscription='40000000-0000-4000-8000-000000000001',plan='50000000-0000-4000-8000-000000000001',revision='60000000-0000-4000-8000-000000000001';
const product = SKILLPASSPORT_PRODUCT_ID,operation='80000000-0000-4000-8000-000000000001';
const state={id:subscription,planId:plan,revisionId:revision,productId:product,version:1,subject:{kind:'user',id:owner},status:'active',
 periodStartsAt:100,periodEndsAt:1000,trialEndsAt:null,renewalEnabled:true,cancelledAt:null,paymentFailedAt:null,scheduledChange:null};
const signedContext=()=>({schemaVersion:1,actorId:owner,state,access:'full',audience:'synthetic',activatedAt:100,subscriptionEndsAt:2000});
const attempt={id:'30000000-0000-4000-8000-000000000001',learner_id:learner,status:'in_progress',grade_level:'after12',stream_id:'bca',all_responses:{},timer_remaining:0};
const ctx=(body:unknown,sub=owner)=>({request:new Request('https://fixture.invalid/api/assessment-attempts',{
 method:'POST',body:typeof body==='string'?body:JSON.stringify(body)}),env:{SSO_SERVICE:{
 listSubscriptionExecutions:mocks.discover,getCurrentSubscriptionExecution:mocks.current,getSubscriptionActionContext:mocks.action,
 prepareSubscriptionRetakeSettlement:mocks.retake}},data:{user:{sub}}}) as any;
beforeEach(()=>{
 vi.clearAllMocks();mocks.profileError=null;mocks.updateError=null;mocks.rpc.mockResolvedValue({data:{attempt,created:true},error:null});
 mocks.discover.mockImplementation(async(_token,_product,cursor)=>({schemaVersion:1,actorId:owner,productId:product,
  items:cursor===null?[{id:subscription,subject:state.subject,productId:product,kind:'initialized'}]:[],nextCursor:cursor===null?subscription:null}));
 mocks.current.mockResolvedValue({...signedContext(),pools:[]});
 mocks.action.mockResolvedValue({...signedContext(),actions:{schemaVersion:1,bindings:[{actionKey:'assessment.start',featureKey:'synthetic_attempts',mode:'write',
  quota:{period:'billing_period',countingEvent:'assessment_start'}}]}});
 mocks.projection.mockResolvedValue({projection:{schemaVersion:1,entitlements:[],bundle:{schemaVersion:1,draft:{schemaVersion:2,id:revision,
  plan:{id:plan,code:'pln_'+'a'.repeat(32),productId:product},revisionNumber:1,name:'Synthetic',audiences:['synthetic'],purchaseMode:'self_service',prices:[],
  features:[{key:'synthetic_attempts',type:'numeric_limit',enabled:true,limit:{kind:'finite',value:7}}]},
  includedCredits:{schemaVersion:1,id:operation,revisionId:revision,funding:'included',rules:[]}}}});
 mocks.sections.mockResolvedValue([{name:'Section'}]);
 mocks.from.mockImplementation((table:string)=>{
  if(table!=='learners')throw new Error('Unexpected direct database access');
  const q:any={error:mocks.updateError,update:(data:any)=>{mocks.update(data);return q;},select:()=>q,eq:(...args:any[])=>{mocks.eq(...args);return q;},
   maybeSingle:async()=>({data:{id:learner,course_name:'Bachelor of Computer Applications'},error:mocks.profileError})};return q;
 });
});
it('derives owner authority and makes new creation explicit',async()=>{
 const response=await onRequestPost(ctx({reference:learner.toUpperCase(),streamId:'bca',gradeLevel:'college',operationId:operation}));
 expect(response.status).toBe(201);expect(response.headers.get('Cache-Control')).toBe('no-store');
 expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('start_subscription_assessment',{
  p_owner:owner,p_stream:'bca',p_grade:'college',p_reference:learner,p_context:null,p_reuse:false,
  p_operation:operation,p_authorization:{actorId:owner,subject:state.subject,subscriptionId:subscription,productId:product,revisionId:revision,version:1,
   actionKey:'assessment.start',validUntil:1000},
  p_quota:{operationId:operation,actorId:owner,subject:state.subject,subscriptionId:subscription,productId:product,revisionId:revision,version:1,
   actionKey:'assessment.start',countingEvent:'assessment_start',periodStartsAt:100,periodEndsAt:1000,limit:7},p_source_attempt:null,p_retake_proof:null,
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

it('persists bounded specialization only on the authenticated learner before creating context',async()=>{
 const response=await startHandler(ctx({gradeLevel:'college',streamId:'bca',specialization:'  Data Science  '}));
 expect(response.status).toBe(201);
 expect(mocks.update).toHaveBeenCalledWith({specialization:'Data Science',updated_at:expect.any(String)});
 expect(mocks.eq).toHaveBeenCalledWith('id',learner);expect(mocks.eq).toHaveBeenCalledWith('user_id',owner);
 expect(mocks.rpc.mock.calls[0][1].p_context.specialization).toBe('Data Science');
 expect(mocks.update.mock.invocationCallOrder[0]).toBeLessThan(mocks.rpc.mock.invocationCallOrder[0]);
});
it.each([42,{},'x','x'.repeat(151)])('rejects invalid specialization before accessing storage: %j',async specialization=>{
 expect((await startHandler(ctx({gradeLevel:'college',specialization}))).status).toBe(400);
 expect(mocks.from).not.toHaveBeenCalled();expect(mocks.rpc).not.toHaveBeenCalled();
});
it('does not claim a failed specialization write was persisted',async()=>{
 mocks.updateError={message:'private database error'};
 const response=await startHandler(ctx({gradeLevel:'college',streamId:'bca',specialization:'Data Science'}));
 expect(response.status).toBe(201);expect(mocks.rpc.mock.calls[0][1].p_context.specialization).toBeNull();
 expect(await response.text()).not.toContain('private database error');
});
it('keeps the legacy creation contract closed to specialization updates',async()=>{
 expect((await onRequestPost(ctx({gradeLevel:'college',specialization:'Data Science'}))).status).toBe(400);
 expect(mocks.update).not.toHaveBeenCalled();expect(mocks.rpc).not.toHaveBeenCalled();
});
it.each(['read_only','restricted','suspended'])('direct modern start blocks %s before learner lookup or specialization writes',async access=>{
 mocks.current.mockResolvedValue({...signedContext(),pools:[],access});
 const response=await startHandler(ctx({gradeLevel:'college',streamId:'bca',specialization:'Data Science'}));
 expect(response.status).toBe(403);expect(mocks.from).not.toHaveBeenCalled();expect(mocks.update).not.toHaveBeenCalled();expect(mocks.rpc).not.toHaveBeenCalled();
});
it('does not substitute legacy access for an uninitialized cohort in the actual modern caller',async()=>{
 mocks.discover.mockImplementation(async(_token,_product,cursor)=>({schemaVersion:1,actorId:owner,productId:product,
  items:cursor===null?[{id:subscription,subject:state.subject,productId:product,kind:'uninitialized'}]:[],nextCursor:cursor===null?subscription:null}));
 const response=await startHandler(ctx({gradeLevel:'college',streamId:'bca'}));
 expect(response.status).toBe(409);expect((await response.json()).error.code).toBe('SUBSCRIPTION_SETUP_REQUIRED');
 expect(mocks.current).not.toHaveBeenCalled();expect(mocks.from).not.toHaveBeenCalled();expect(mocks.rpc).not.toHaveBeenCalled();
});
it('binds actual retake creation to the owner-settled source while keeping the learner reference separate',async()=>{
 mocks.action.mockResolvedValue({...signedContext(),actions:{schemaVersion:1,bindings:[{actionKey:'assessment.retake',featureKey:'synthetic_access',mode:'write',paymentRequired:true}]}});
 const terms=await mocks.projection();terms.projection.bundle.draft.features=[{key:'synthetic_access',type:'boolean',enabled:true}];mocks.projection.mockResolvedValue(terms);
 const proof={schemaVersion:1,actorId:owner,subscriptionId:subscription,productId:product,subject:state.subject,stateVersion:1,validUntil:1000,
  settlement:{id:plan,quoteId:revision,subscriptionId:subscription,productId:product,subject:state.subject,purpose:'retake',referenceId:attempt.id,
   providerPaymentId:'pay_synthetic',amountMinor:7,currency:'INR',settledAt:200}};
 mocks.retake.mockResolvedValue(proof);mocks.rpc.mockResolvedValue({data:{attempt:{...attempt,id:'90000000-0000-4000-8000-000000000001'},created:true},error:null});
 const response=await onRequestPost(ctx({reference:learner,streamId:'bca',gradeLevel:'college',operationId:operation,sourceAttemptId:attempt.id,settlementId:plan}));
 expect(response.status).toBe(201);
 expect(mocks.retake).toHaveBeenCalledExactlyOnceWith('synthetic-signed-token',product,{subscriptionId:subscription,settlementId:plan,referenceId:attempt.id});
 expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('start_subscription_assessment',expect.objectContaining({p_reference:learner,p_source_attempt:attempt.id,p_retake_proof:proof,p_quota:null,p_operation:operation}));
});
