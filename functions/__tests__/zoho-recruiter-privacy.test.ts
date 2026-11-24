import { SKILLPASSPORT_PRODUCT_ID } from '../lib/subscription-config';
// @vitest-environment node
import {beforeEach, describe, expect, it, vi} from 'vitest';
const mocks=vi.hoisted(()=>({from:vi.fn(),rpc:vi.fn(),discover:vi.fn(),current:vi.fn(),action:vi.fn(),projection:vi.fn(),notify:vi.fn()}));
const actor='10000000-0000-4000-8000-000000000001',org='20000000-0000-4000-8000-000000000001';
const product = SKILLPASSPORT_PRODUCT_ID,subscription='40000000-0000-4000-8000-000000000001';
const plan='50000000-0000-4000-8000-000000000001',revision='60000000-0000-4000-8000-000000000001';
vi.mock('../lib/auth',()=>({withAuth:(handler:unknown)=>handler,getContextUser:()=>({id:actor,sub:actor,org_id:org})}));
vi.mock('../lib/supabase',()=>({getServiceClient:()=>({from:mocks.from,rpc:mocks.rpc}),getAuthToken:()=> 'synthetic-signed-token'}));
vi.mock('../lib/subscriptions/publication',()=>({readApplicationPlanProjection:mocks.projection}));
vi.mock('../lib/subscriptions/catalog-inventory',()=>({catalogInventoryDatabase:()=>({})}));
vi.mock('../lib/permissions',()=>({verifyOrgAccess:async()=>({allowed:true}),PERMISSIONS:{VIEW_CANDIDATES:'view_candidates',MANAGE_CANDIDATES:'manage_candidates'}}));
vi.mock('../lib/pipelineNotifications',()=>({notifyLearnerOfPipelineChange:mocks.notify}));
vi.mock('../lib/org-ownership',()=>({getActiveOrgId:async()=>org,getOrgMemberUserIds:async()=>[actor],getOrgOwnedOpportunityIds:async()=>['job'],assertInterviewAccess:vi.fn(),getInterviewRow:vi.fn(),ALLOWED_REQUISITION_STATUSES:['draft','open','closed','on_hold']}));
import {onRequest} from '../api/recruiter/actions';
import {onRequestPost} from '../api/recruiter-copilot';
import {onRequest as pipeline} from '../api/recruiter-pipeline/[[path]]';
const legacy={id:'70000000-0000-4000-8000-000000000001',user_id:'80000000-0000-4000-8000-000000000001',name:'Public Learner',email:'public@fixture.example',contact_number:'123'};
const privateRow={id:'70000000-0000-4000-8000-000000000002',user_id:'80000000-0000-4000-8000-000000000002',name:'Private Learner',email:'private@fixture.example',contact_number:'456'};
const pipelineCandidate='90000000-0000-4000-8000-000000000001';
const history={id:'90000000-0000-4000-8000-000000000002',candidate_uuid:pipelineCandidate,activity_type:'stage_change'};
const state={id:subscription,planId:plan,revisionId:revision,productId:product,version:1,subject:{kind:'organization',id:org},status:'active',
 periodStartsAt:100,periodEndsAt:1000,trialEndsAt:null,renewalEnabled:true,cancelledAt:null,paymentFailedAt:null,scheduledChange:null};
const signed=()=>({schemaVersion:1,actorId:actor,state,access:'full',audience:'synthetic',activatedAt:100,subscriptionEndsAt:2000});
let failure=false;
function chain(table:string){
 const q:any={};let key:unknown;
 for(const method of ['select','in','not','limit','order','ilike','update','delete'])q[method]=vi.fn(()=>q);
 q.eq=vi.fn((_column:string,value:unknown)=>{key=value;return q;});
 const value=()=>({data:failure?null:table==='zoho_recruiter_learners'?(key===privateRow.id||key===privateRow.user_id?[]:[legacy]):table==='learners'?[privateRow,legacy]
  :table==='organization_recruitment_verification'?[{organization_id:org,verification_status:'approved'}]
  :table==='user_settings'?[{user_id:legacy.user_id,privacy_settings:{profileVisibility:'public',allowRecruiterContact:true,showEmail:true,showPhone:true,showInTalentPool:true}}]
  :table==='zoho_recruiter_pipeline_candidates'?[{id:pipelineCandidate,organization_id:org}]
  :table==='pipeline_activities'?[history]:[],error:failure?{code:'XX000',message:'unavailable'}:null});
 q.then=(resolve:any,reject:any)=>Promise.resolve(value()).then(resolve,reject);
 q.single=q.maybeSingle=async()=>{const r=value();return {...r,data:r.data?.[0]??null};};
 return q;
}
async function request(handler:any,body:unknown){return handler({request:new Request('https://app.fixture.example/api/recruiter/actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),
 env:{SSO_SERVICE:{listSubscriptionExecutions:mocks.discover,getCurrentSubscriptionExecution:mocks.current,getSubscriptionActionContext:mocks.action}},data:{user:{}}});}
beforeEach(()=>{
 vi.clearAllMocks();failure=false;mocks.from.mockImplementation(chain);mocks.rpc.mockResolvedValue({data:{success:true},error:null});
 mocks.discover.mockImplementation(async(_token,_product,cursor)=>({schemaVersion:1,actorId:actor,productId:product,
  items:cursor===null?[{id:subscription,subject:state.subject,productId:product,kind:'initialized'}]:[],nextCursor:cursor===null?subscription:null}));
 mocks.current.mockResolvedValue({...signed(),pools:[]});
 mocks.action.mockResolvedValue({...signed(),actions:{schemaVersion:1,bindings:[{actionKey:'recruiter.contact.read',featureKey:'contact_unlocks',mode:'read'}]}});
 mocks.projection.mockResolvedValue({projection:{schemaVersion:1,entitlements:[],bundle:{schemaVersion:1,draft:{schemaVersion:2,id:revision,
  plan:{id:plan,code:'pln_'+'a'.repeat(32),productId:product},revisionNumber:1,name:'Synthetic',audiences:['synthetic'],purchaseMode:'self_service',prices:[],
  features:[{key:'contact_unlocks',type:'metered',enabled:true}]},includedCredits:{schemaVersion:1,id:subscription,revisionId:revision,funding:'included',rules:[]}}}});
});
describe('private imported candidate discovery',()=>{
 it('lists public profiles using the server-only filtered relation',async()=>{
  const response=await request(onRequest,{action:'list-learners'});
  expect(response.status).toBe(200);const body=await response.json();
  expect(body.data).toEqual([{...legacy,email:null,contact_number:null}]);
  expect(JSON.stringify(body)).not.toContain(privateRow.name);
  expect(mocks.from).not.toHaveBeenCalledWith('learners');
 });
 it.each(['get-learner','unlock-candidate-contact','check-candidate-unlocked'])('never reads or unlocks a private profile via %s',async action=>{
  const response=await request(onRequest,{action,learnerId:privateRow.id,candidateId:privateRow.id});
  expect(response.status).toBe(action==='check-candidate-unlocked'?200:404);
  expect(JSON.stringify(await response.json())).not.toContain(privateRow.name);
  expect(mocks.rpc).not.toHaveBeenCalled();
  expect(mocks.from).not.toHaveBeenCalledWith('learners');
 });
 it.each(['fetch-learners','fetch-learners-basic','fetch-learners-enriched'])('keeps private profiles out of copilot %s',async action=>{
  const response=await request(onRequestPost,{action});expect(response.status).toBe(200);
  expect((await response.json()).data).toEqual([expect.objectContaining({name:legacy.name})]);
  expect(mocks.from).toHaveBeenCalledWith('zoho_recruiter_learners');
  expect(mocks.from).not.toHaveBeenCalledWith('learners');
 });
 it('fails closed when the filtered relation is unavailable',async()=>{
  failure=true;const response=await request(onRequest,{action:'list-learners'});
  expect(response.status).toBeGreaterThanOrEqual(400);
  expect(JSON.stringify(await response.json())).not.toContain(privateRow.email);
  expect(mocks.from).not.toHaveBeenCalledWith('learners');
 });
});

it('rich recruiter discovery retains the filtered parent and locked-contact masking',async()=>{
 const response=await request(onRequest,{action:'list-learners',include_details:true});
 expect(response.status).toBe(200);
 expect((await response.json()).data).toEqual([{...legacy,email:null,contact_number:null}]);
 const index=mocks.from.mock.calls.findIndex(call=>call[0]==='zoho_recruiter_learners');
 const query=mocks.from.mock.results[index].value;
 expect(query.select).toHaveBeenCalledWith(expect.stringContaining('skills!skills_learner_id_fkey'));
 expect(query.select.mock.calls[0][0]).not.toMatch(/guardian|alternate_number|date_of_birth/);
 expect(query.eq).toHaveBeenCalledWith('is_deleted',false);
 expect(query.limit).toHaveBeenCalledWith(500);
 expect(mocks.from).not.toHaveBeenCalledWith('learners');
});
it('rejects an invalid rich-discovery flag',async()=>{
 const response=await request(onRequest,{action:'list-learners',include_details:'true'});
 expect(response.status).toBe(400);
 expect(mocks.from).not.toHaveBeenCalledWith('zoho_recruiter_learners');
});
it('denies a suspended subscription before reading candidate relations',async()=>{
 mocks.current.mockResolvedValue({...signed(),access:'suspended',pools:[]});
 const response=await request(onRequest,{action:'list-learners'});
 expect(response.status).toBe(403);expect(mocks.from).not.toHaveBeenCalled();
});
it('rejects a foreign action actor without returning the filtered candidate',async()=>{
 mocks.action.mockResolvedValue({...signed(),actorId:privateRow.user_id,actions:{schemaVersion:1,
  bindings:[{actionKey:'recruiter.contact.read',featureKey:'contact_unlocks',mode:'read'}]}});
 const response=await request(onRequest,{action:'list-learners'});
 expect(response.status).toBe(403);expect(await response.text()).not.toContain(legacy.name);
});
it.each(['fetch-learners','companies-add','semantic-find-for-opportunity'])('denies suspended copilot %s before resource or credit IO',async action=>{
 mocks.current.mockResolvedValue({...signed(),access:'suspended',pools:[]});
 expect((await request(onRequestPost,{action})).status).toBe(403);
 expect(mocks.from).not.toHaveBeenCalled();expect(mocks.rpc).not.toHaveBeenCalled();
});
it.each(['companies-add','companies-update','companies-update-status','companies-delete','semantic-find-for-opportunity'])('blocks read-only copilot mutation %s before IO',async action=>{
 mocks.current.mockResolvedValue({...signed(),access:'read_only',pools:[]});
 expect((await request(onRequestPost,{action})).status).toBe(403);
 expect(mocks.from).not.toHaveBeenCalled();expect(mocks.rpc).not.toHaveBeenCalled();
});
it('preserves read-only copilot discovery without a credit debit',async()=>{
 mocks.current.mockResolvedValue({...signed(),access:'read_only',pools:[]});
 const response=await request(onRequestPost,{action:'fetch-learners'});
 expect(response.status).toBe(200);expect(mocks.rpc).not.toHaveBeenCalled();
});

describe('standalone pipeline real subscription adapter',()=>{
 const mutations=['add-candidate-to-pipeline','move-candidate-to-stage','reject-candidate','update-next-action',
  'update-candidate-rating','assign-candidate','remove-candidate-from-pipeline','bulk-move-candidates','bulk-reject-candidates','log-pipeline-activity'];
 it.each(['get-requisitions','get-candidate-activities',...mutations])('denies suspended %s before resource and notification IO',async action=>{
  mocks.current.mockResolvedValue({...signed(),access:'suspended',pools:[]});
  expect((await request(pipeline,{action,candidate_id:pipelineCandidate})).status).toBe(403);
  expect(mocks.current).toHaveBeenCalledWith('synthetic-signed-token',subscription,product);
  expect(mocks.from).not.toHaveBeenCalled();expect(mocks.rpc).not.toHaveBeenCalled();expect(mocks.notify).not.toHaveBeenCalled();
 });
 it.each(mutations)('denies retained read-only mutation %s before resource and notification IO',async action=>{
  mocks.current.mockResolvedValue({...signed(),access:'read_only',pools:[]});
  expect((await request(pipeline,{action,candidate_id:pipelineCandidate})).status).toBe(403);
  expect(mocks.from).not.toHaveBeenCalled();expect(mocks.rpc).not.toHaveBeenCalled();expect(mocks.notify).not.toHaveBeenCalled();
 });
 it('retains authorized read-only pipeline history using the real signed-current adapter',async()=>{
  mocks.current.mockResolvedValue({...signed(),access:'read_only',pools:[]});
  const response=await request(pipeline,{action:'get-candidate-activities',candidate_id:pipelineCandidate});
  expect(response.status).toBe(200);expect(await response.json()).toMatchObject({data:{activities:[history]}});
  expect(mocks.from).toHaveBeenCalledWith('zoho_recruiter_pipeline_candidates');expect(mocks.from).toHaveBeenCalledWith('pipeline_activities');
  const candidateQuery=mocks.from.mock.results[0].value;
  expect(candidateQuery.eq).toHaveBeenCalledWith('organization_id',org);
  expect(mocks.rpc).not.toHaveBeenCalled();expect(mocks.notify).not.toHaveBeenCalled();
 });
 it('preserves full-access atomic stage changes and their existing notification',async()=>{
  const candidate={id:pipelineCandidate,learner_id:legacy.id,stage:'screened'};
  mocks.rpc.mockResolvedValue({data:{candidates:[candidate]},error:null});
  const response=await request(pipeline,{action:'move-candidate-to-stage',candidate_id:pipelineCandidate,stage:'screened'});
  expect(response.status).toBe(200);expect(await response.json()).toMatchObject({data:{candidate}});
  expect(mocks.rpc).toHaveBeenCalledWith('recruitment_move_pipeline_candidates',expect.objectContaining({p_org:org,p_actor:actor,p_ids:[pipelineCandidate],p_stage:'screened'}));
  expect(mocks.notify).toHaveBeenCalledOnce();expect(mocks.notify).toHaveBeenCalledWith(expect.anything(),legacy.id,'pipeline_stage_changed','Application Screened','Your application is under review.');
 });
 it.each(mutations)('retains the GET 405 guard for %s before subscription or resource IO',async action=>{
  const response=await pipeline({env:{},request:new Request(`https://app.fixture.example/api/recruiter-pipeline?action=${action}`,{method:'GET'})});
  expect(response.status).toBe(405);expect(mocks.discover).not.toHaveBeenCalled();expect(mocks.from).not.toHaveBeenCalled();
  expect(mocks.rpc).not.toHaveBeenCalled();expect(mocks.notify).not.toHaveBeenCalled();
 });
});
