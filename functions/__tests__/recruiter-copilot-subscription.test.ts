import { SKILLPASSPORT_PRODUCT_ID } from '../lib/subscription-config';
// @vitest-environment node
import {beforeEach, describe, expect, it, vi} from 'vitest';
const mocks=vi.hoisted(()=>({from:vi.fn(),rpc:vi.fn(),discover:vi.fn(),current:vi.fn(),action:vi.fn(),projection:vi.fn(),notify:vi.fn(),prepareCredit:vi.fn()}));
const actor='10000000-0000-4000-8000-000000000001',org='20000000-0000-4000-8000-000000000001';
const product = SKILLPASSPORT_PRODUCT_ID,subscription='40000000-0000-4000-8000-000000000001';
const plan='50000000-0000-4000-8000-000000000001',revision='60000000-0000-4000-8000-000000000001';
vi.mock('../lib/auth',()=>({withAuth:(handler:unknown)=>handler,getContextUser:()=>({id:actor,sub:actor,org_id:org})}));
vi.mock('../lib/supabase',()=>({getServiceClient:()=>({from:mocks.from,rpc:mocks.rpc}),getAuthToken:()=> 'synthetic-signed-token'}));
vi.mock('../lib/subscriptions/publication',()=>({readApplicationPlanProjection:mocks.projection}));
vi.mock('../lib/subscriptions/catalog-inventory',()=>({catalogInventoryDatabase:()=>({}),
 readApplicationFeatureInventory:async()=>[{key:'contact_unlocks',type:'metered'}],applicationFeatureDefinition:(value:unknown)=>value}));
vi.mock('../lib/permissions',()=>({verifyOrgAccess:async()=>({allowed:true}),PERMISSIONS:{VIEW_CANDIDATES:'view_candidates',MANAGE_CANDIDATES:'manage_candidates'}}));
vi.mock('../lib/pipelineNotifications',()=>({notifyLearnerOfPipelineChange:mocks.notify}));
vi.mock('../lib/org-ownership',()=>({getActiveOrgId:async()=>org,getOrgMemberUserIds:async()=>[actor],getOrgOwnedOpportunityIds:async()=>['job'],assertInterviewAccess:vi.fn(),getInterviewRow:vi.fn(),ALLOWED_REQUISITION_STATUSES:['draft','open','closed','on_hold']}));

import {onRequestPost} from '../api/recruiter-copilot';
import {unlockRecruiterCandidateContact} from '../shared/lib/subscription-access';

const legacy={id:'70000000-0000-4000-8000-000000000001',user_id:'80000000-0000-4000-8000-000000000001',name:'Public Learner',email:'public@fixture.example',contact_number:'123'};
const privateRow={id:'70000000-0000-4000-8000-000000000002',user_id:'80000000-0000-4000-8000-000000000002',name:'Private Learner',email:'private@fixture.example',contact_number:'456'};
const pipelineCandidate='90000000-0000-4000-8000-000000000001';
const history={id:'90000000-0000-4000-8000-000000000002',candidate_uuid:pipelineCandidate,activity_type:'stage_change'};
const state={id:subscription,planId:plan,revisionId:revision,productId:product,version:1,subject:{kind:'organization',id:org},status:'active',
 periodStartsAt:100,periodEndsAt:1000,trialEndsAt:null,renewalEnabled:true,cancelledAt:null,paymentFailedAt:null,scheduledChange:null};
const signed=()=>({schemaVersion:1,actorId:actor,state,access:'full',audience:'synthetic',activatedAt:100,subscriptionEndsAt:2000});
let failure=false, visible=true, verified=true, unlocked=false, allowContact=true;
let sourceRows: Record<string, unknown>[]=[];
function chain(table:string){
 const q:any={};let key:unknown;let bounds:[number,number]|null=null;
 for(const method of ['select','in','not','limit','order','ilike','update','delete','or','lt','range'])q[method]=vi.fn(()=>q);
 q.eq=vi.fn((_column:string,value:unknown)=>{key=value;return q;});
 q.range=vi.fn((from:number,to:number)=>{bounds=[from,to];return q;});
 const value=()=>({data:failure?null:table==='zoho_recruiter_learners'?[{...legacy,city:'Public City',state:'Public State',profile:{email:'hidden@fixture.example'},resumeUrl:'https://private.fixture.example'}]
  :table==='organization_recruitment_verification'?[{organization_id:org,verification_status:verified?'approved':'pending'}]
  :table==='user_settings'?[{user_id:legacy.user_id,privacy_settings:{profileVisibility:visible?'public':'private',allowRecruiterContact:allowContact,showEmail:true,showPhone:true,showLocation:visible,showInTalentPool:visible}}]
  :table==='candidate_contact_unlocks'?(unlocked?[{candidate_id:legacy.id}]:[])
  :bounds?sourceRows.slice(bounds[0],bounds[1]+1):sourceRows,error:failure?{code:'XX000',message:'unavailable'}:null});
 q.then=(resolve:any,reject:any)=>Promise.resolve(value()).then(resolve,reject);
 q.single=q.maybeSingle=async()=>{const r=value();return {...r,data:r.data?.[0]??null};};
 return q;
}
async function request(handler:any,body:unknown){return handler({request:new Request('https://app.fixture.example/api/recruiter/actions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}),
 env:{SSO_SERVICE:{listSubscriptionExecutions:mocks.discover,getCurrentSubscriptionExecution:mocks.current,getSubscriptionActionContext:mocks.action,prepareSubscriptionCreditExecution:mocks.prepareCredit}},data:{user:{}}});}
beforeEach(()=>{
 vi.clearAllMocks();failure=false;visible=true;verified=true;unlocked=false;allowContact=true;sourceRows=[];mocks.from.mockImplementation(chain);mocks.rpc.mockResolvedValue({data:{success:true},error:null});
 mocks.discover.mockImplementation(async(_token,_product,cursor)=>({schemaVersion:1,actorId:actor,productId:product,
  items:cursor===null?[{id:subscription,subject:state.subject,productId:product,kind:'initialized'}]:[],nextCursor:cursor===null?subscription:null}));
 mocks.current.mockResolvedValue({...signed(),pools:[]});
 mocks.action.mockResolvedValue({...signed(),actions:{schemaVersion:1,bindings:[{actionKey:'recruiter.contact.read',featureKey:'contact_unlocks',mode:'read'}]}});
 mocks.projection.mockResolvedValue({projection:{schemaVersion:1,entitlements:[],bundle:{schemaVersion:1,draft:{schemaVersion:2,id:revision,
  plan:{id:plan,code:'pln_'+'a'.repeat(32),productId:product},revisionNumber:1,name:'Synthetic',audiences:['synthetic'],purchaseMode:'self_service',prices:[],
  features:[{key:'contact_unlocks',type:'metered',enabled:true}]},includedCredits:{schemaVersion:1,id:subscription,revisionId:revision,funding:'included',rules:[]}}}});
});

describe('Copilot current candidate disclosure',()=>{
 it.each(['fetch-learners','fetch-learners-basic','fetch-learners-enriched'])('projects canonical contacts without nested leakage for %s',async action=>{
  const response=await request(onRequestPost,{action}); expect(response.status).toBe(200);
  const {data}=await response.json();expect(data).toEqual([expect.objectContaining({id:legacy.id,email:null,contact_number:null})]);
  expect(JSON.stringify(data)).not.toMatch(/profile|resumeUrl|hidden@/);
 });
 it('requires current consent even after an unlock',async()=>{
  unlocked=true;allowContact=false;
  const response=await request(onRequestPost,{action:'fetch-learners'});
  expect((await response.json()).data[0]).toMatchObject({email:null,contact_number:null});
 });
 it('reveals only current consented unlocked contact',async()=>{
  unlocked=true;
  const response=await request(onRequestPost,{action:'fetch-learners'});
  expect((await response.json()).data[0]).toMatchObject({email:legacy.email,contact_number:legacy.contact_number});
 });
 it.each(['fetch-learners-with-location','fetch-learners-university','fetch-learners-grad-years','count-learners','count-learners-with-location','count-learners-with-cgpa'])('excludes withdrawn profiles from aggregate %s',async action=>{
  visible=false;const response=await request(onRequestPost,{action});expect(response.status).toBe(200);
  expect((await response.json()).data).toEqual(action.startsWith('count-')?0:[]);
 });
 it.each(['fetch-skills','fetch-skills-learner-ids','fetch-skills-names','count-skills','count-skill-by-name','fetch-trainings','count-trainings','fetch-certificates','count-certificates'])('rechecks the parent consent for %s',async action=>{
  visible=false;sourceRows=[{id:pipelineCandidate,learner_id:legacy.id,name:'Private Skill',trainingName:'Private Training',email:'cached@fixture.example'}];
  const response=await request(onRequestPost,{action,skill_name:'Private Skill',learner_id:legacy.id});expect(response.status).toBe(200);
  expect((await response.json()).data).toEqual(action==='count-skill-by-name'?false:action.startsWith('count-')?0:[]);
 });
 it.each(['fetch-pipeline-candidates','fetch-pipeline-with-learners','fetch-pipeline-with-opportunities','fetch-pipeline-needs-action','fetch-applied-jobs'])('filters withdrawn nested records for %s',async action=>{
  visible=false;sourceRows=[{id:pipelineCandidate,learner_id:legacy.id,learners:{email:'cached@fixture.example'},notes:'cached private contact'}];
  const response=await request(onRequestPost,{action,opportunity_ids:['job']});expect(response.status).toBe(200);
  expect((await response.json()).data).toEqual([]);
 });
 it('projects nested pipeline records without cached fields',async()=>{
  sourceRows=[{id:pipelineCandidate,learner_id:legacy.id,learners:{email:'cached@fixture.example'},notes:'cached private contact',candidate_email:'cached@fixture.example'}];
  const response=await request(onRequestPost,{action:'fetch-pipeline-with-learners',opportunity_ids:['job']});
  const body=await response.json();expect(body.data[0].learners.email).toBeNull();expect(JSON.stringify(body)).not.toContain('cached');
 });
 it('denies unverified recruiters before disclosing candidates',async()=>{
  verified=false;const response=await request(onRequestPost,{action:'fetch-learners'});expect(response.status).toBe(403);
  expect(await response.text()).not.toContain(legacy.name);
 });
 it('surfaces identity/consent query failure',async()=>{
  failure=true;const response=await request(onRequestPost,{action:'fetch-learners'});expect(response.status).toBeGreaterThanOrEqual(400);
  expect(await response.text()).not.toContain(legacy.email);
 });
});

it.each(['fetch-skills','fetch-trainings','fetch-certificates'])('retains visible parent rows with only declared fields for %s',async action=>{
 sourceRows=[{learner_id:legacy.id,name:'Visible Skill',trainingName:'Visible Training',title:'Visible Certificate',email:'hidden@fixture.example',metadata:{phone:'private'}}];
 const response=await request(onRequestPost,{action});expect(response.status).toBe(200);
 const {data}=await response.json();expect(data).toHaveLength(1);expect(data[0].learner_id).toBe(legacy.id);
 expect(JSON.stringify(data)).not.toMatch(/hidden@|metadata|phone/);
});
it('counts every disclosed skill page instead of the first database response window',async()=>{
 sourceRows=Array.from({length:251},(_,index)=>({id:String(index),learner_id:legacy.id}));
 const response=await request(onRequestPost,{action:'count-skills'});expect(response.status).toBe(200);
 expect((await response.json()).data).toBe(251);
 const queries=mocks.from.mock.calls.flatMap((call,index)=>call[0]==='zoho_recruiter_skills'?[mocks.from.mock.results[index].value]:[]);
 expect(queries[0].range).toHaveBeenCalledWith(0,249);expect(queries[1].range).toHaveBeenCalledWith(250,499);
});

const operation='a0000000-0000-4000-8000-000000000001';
function meteredAction(actionKey:string) {
 mocks.action.mockResolvedValue({...signed(),actions:{schemaVersion:1,bindings:[
  {actionKey,featureKey:'contact_unlocks',mode:'write'},
  {actionKey:'recruiter.contact.read',featureKey:'contact_unlocks',mode:'read'},
 ]}});
 const projection=mocks.projection.getMockImplementation();
 mocks.projection.mockImplementation(async(...args)=>{
  const stored=await projection!(...args);
  stored.projection.bundle.includedCredits.rules=[{featureKey:'contact_unlocks',recipient:'organization',audiences:['synthetic'],poolKey:'synthetic_pool'}];
  return stored;
 });
 mocks.prepareCredit.mockResolvedValue({kind:'consume',actorId:actor,command:{productId:product,subscriptionId:subscription,
  recipient:{kind:'organization',id:org},featureKey:'contact_unlocks',poolKey:'synthetic_pool',operationId:operation,
  actionKey,amount:7,spendingOrder:'expires_first'}});
}
it('semantic generation sends only the owner-derived tariff and stable identity to its atomic owner',async()=>{
 meteredAction('recruiter.shortlist.generate');
 const query={opportunity_id:7,match_count:12,min_similarity:0.7};
 mocks.rpc.mockResolvedValue({data:{operationId:operation,query,candidates:[]},error:null});
 const response=await request(onRequestPost,{action:'semantic-find-for-opportunity',...query,requestId:operation});
 expect(response.status).toBe(200);
 expect(mocks.prepareCredit).toHaveBeenCalledWith('synthetic-signed-token',product,expect.objectContaining({kind:'consume',operationId:operation,actionKey:'recruiter.shortlist.generate'}),expect.any(Array));
 expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('generate_subscription_recruiter_shortlist',expect.objectContaining({
  p_query:query,p_credit_command:expect.objectContaining({amount:7,operationId:operation}),
  p_authorization:expect.objectContaining({actorId:actor,revisionId:revision,validUntil:1000}),
 }));
});
it('semantic generation denies owner credit rejection before any transaction',async()=>{
 meteredAction('recruiter.shortlist.generate');mocks.prepareCredit.mockResolvedValue({kind:'forbidden'});
 expect((await request(onRequestPost,{action:'semantic-find-for-opportunity',opportunity_id:7,requestId:operation})).status).toBe(403);
 expect(mocks.rpc).not.toHaveBeenCalled();
});
it('contact unlock passes the signed deadline with canonical debit to the contact owner',async()=>{
 meteredAction('recruiter.contact.unlock');
 mocks.rpc.mockResolvedValue({data:{candidate:{id:legacy.id,name:legacy.name,email:legacy.email,phone:legacy.contact_number},alreadyUnlocked:false},error:null});
 const result=await unlockRecruiterCandidateContact({env:{SSO_SERVICE:{
  listSubscriptionExecutions:mocks.discover,getSubscriptionActionContext:mocks.action,prepareSubscriptionCreditExecution:mocks.prepareCredit,
 }} as never,request:new Request('https://fixture.invalid'),actorId:actor,organizationId:org,database:{from:mocks.from,rpc:mocks.rpc} as never},legacy.id,operation);
 expect(result).not.toBeInstanceOf(Response);
 expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('unlock_subscription_candidate_contact',expect.objectContaining({
  p_candidate_id:legacy.id,p_credit_command:expect.objectContaining({amount:7}),
  p_authorization:{actorId:actor,subject:state.subject,subscriptionId:subscription,productId:product,revisionId:revision,version:1,actionKey:'recruiter.contact.unlock',validUntil:1000},
 }));
});
