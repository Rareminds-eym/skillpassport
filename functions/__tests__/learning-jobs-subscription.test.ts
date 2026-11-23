import { beforeEach, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ discover: vi.fn(), current: vi.fn(), projection: vi.fn(), from: vi.fn(), rpc: vi.fn(), snapshot: vi.fn(), policy: vi.fn(), equivalents: vi.fn(), evaluate: vi.fn(), withAuth: vi.fn((handler: unknown) => handler) }));
const actor='10000000-0000-4000-8000-000000000001', product='20000000-0000-4000-8000-000000000001';
const subscription='30000000-0000-4000-8000-000000000001', plan='40000000-0000-4000-8000-000000000001', revision='50000000-0000-4000-8000-000000000001';
const subject={kind:'user',id:actor};
vi.mock('../lib/auth',()=>({withAuth:m.withAuth,getContextUser:(context: {data:{user:unknown}})=>context.data.user}));
vi.mock('../lib/supabase',()=>({getAuthToken:()=> 'synthetic-token',getServiceClient:()=>({from:m.from,rpc:m.rpc})}));
vi.mock('../lib/subscriptions/publication',()=>({readApplicationPlanProjection:m.projection}));
vi.mock('../lib/subscriptions/catalog-inventory',()=>({catalogInventoryDatabase:()=>({})}));
vi.mock('../lib/learning-eligibility',async()=>({...await vi.importActual('../lib/learning-eligibility'),readLearningSnapshot:m.snapshot,learningEvaluationPolicy:m.policy,readLearningEquivalents:m.equivalents,evaluateLearning:m.evaluate}));
import { onRequestGet } from '../api/learning/jobs';
import { requireSubscriptionAccess } from '../shared/lib/subscription-access';
function context() {return {request:new Request('https://fixture.invalid/api/learning/jobs?state=eligible'),env:{SKILLPASSPORT_PRODUCT_ID:product,SSO_SERVICE:{listSubscriptionExecutions:m.discover,getCurrentSubscriptionExecution:m.current}},data:{user:{id:actor,roles:['learner']}}} as never;}
function grant(value: string, enabled=true) {m.projection.mockResolvedValue({projection:{bundle:{draft:{audiences:['learner'],features:[{key:'opportunity_access',type:'enum',enabled,value}]}}}});}
beforeEach(()=>{
 for (const [key, mock] of Object.entries(m)) if (key !== 'withAuth') mock.mockClear();
 m.discover.mockImplementation(async(_token,_product,cursor)=>({schemaVersion:1,actorId:actor,productId:product,items:cursor===null?[{id:subscription,subject,productId:product,kind:'initialized'}]:[],nextCursor:cursor===null?subscription:null}));
 m.current.mockResolvedValue({schemaVersion:1,actorId:actor,state:{id:subscription,planId:plan,revisionId:revision,productId:product,subject,version:1,status:'active',periodStartsAt:1,periodEndsAt:1000,trialEndsAt:null,renewalEnabled:true,cancelledAt:null,paymentFailedAt:null,scheduledChange:null},access:'full',audience:'learner',activatedAt:1,subscriptionEndsAt:1000,pools:[]});
 grant('matched_opportunities');
 m.from.mockReturnValue({select:()=>({eq:()=>({maybeSingle:async()=>({data:{id:'synthetic-learner'},error:null})})})});
 m.policy.mockResolvedValue({});m.snapshot.mockResolvedValue({levels:[{levelId:'level',fingerprint:'fingerprint',approved:true}],revision:1});m.equivalents.mockResolvedValue([]);m.evaluate.mockReturnValue({state:'eligible'});
 m.rpc.mockResolvedValue({data:{jobs:[{id:'job',learning_requirements:[]}],total:1},error:null});
});
it.each(['matched_opportunities','priority_matching_and_advanced_alerts'])('allows the published %s tier and retains actual learning evaluation',async value=>{
 grant(value);const response=await onRequestGet(context());expect(response.status).toBe(200);expect((await response.json()).data.jobs).toHaveLength(1);
 expect(m.projection).toHaveBeenCalledWith({},plan,revision,product);
 expect(m.snapshot).toHaveBeenCalledWith(expect.anything(),actor,null,{});
 expect(m.rpc).toHaveBeenCalledWith('learning_job_feed',expect.objectContaining({p_user:actor,p_learner:'synthetic-learner',p_approved:[{levelId:'level',fingerprint:'fingerprint'}]}));
 expect(m.evaluate).toHaveBeenCalledOnce();
});
it.each(['limited_view','basic_opportunity_access'])('denies matching for %s without denying ordinary subscription reads',async value=>{
 grant(value);const response=await onRequestGet(context());expect(response.status).toBe(403);expect((await response.json()).error.code).toBe('FEATURE_ACCESS_DENIED');expect(m.from).not.toHaveBeenCalled();
 const c=context() as unknown as {env:never;request:Request};expect(await requireSubscriptionAccess({...c,actorId:actor,subject:{kind:'user',id:actor},mode:'read'})).not.toBeInstanceOf(Response);
});
it('denies disabled matched opportunity terms',async()=>{grant('matched_opportunities',false);expect((await onRequestGet(context())).status).toBe(403);expect(m.rpc).not.toHaveBeenCalled();});
it.each([{features:[]},{features:[{key:'ai_job_matching',type:'boolean',enabled:true}]},{features:[{key:'opportunity_access',type:'boolean',enabled:true}]}])('does not turn missing or legacy boolean terms into matching access: %j',async ({features})=>{
 m.projection.mockResolvedValue({projection:{bundle:{draft:{audiences:['learner'],features}}}});expect((await onRequestGet(context())).status).toBe(503);expect(m.rpc).not.toHaveBeenCalled();
});
it('reports an unavailable projection as temporary service failure',async()=>{m.projection.mockRejectedValue(new Error('private owner failure'));const r=await onRequestGet(context());expect(r.status).toBe(503);expect(JSON.stringify(await r.json())).not.toContain('private owner');expect(m.rpc).not.toHaveBeenCalled();});
it('reports legacy subscriptions as setup required and never changes their records',async()=>{
 m.discover.mockImplementation(async(_token,_product,cursor)=>({schemaVersion:1,actorId:actor,productId:product,items:cursor===null?[{id:subscription,subject,productId:product,kind:'uninitialized'}]:[],nextCursor:cursor===null?subscription:null}));
 const r=await onRequestGet(context());expect(r.status).toBe(409);expect((await r.json()).error.code).toBe('SUBSCRIPTION_SETUP_REQUIRED');expect(r.headers.get('Cache-Control')).toContain('no-store');expect(m.current).not.toHaveBeenCalled();expect(m.from).not.toHaveBeenCalled();expect(m.rpc).not.toHaveBeenCalled();
});
it('reports missing subscriptions distinctly',async()=>{m.discover.mockResolvedValue({schemaVersion:1,actorId:actor,productId:product,items:[],nextCursor:null});const r=await onRequestGet(context());expect(r.status).toBe(403);expect((await r.json()).error.code).toBe('SUBSCRIPTION_REQUIRED');});
it('requires owner review for multiple initialized subscriptions',async()=>{m.discover.mockImplementation(async(_token,_product,cursor)=>({schemaVersion:1,actorId:actor,productId:product,items:cursor===null?[subscription,'30000000-0000-4000-8000-000000000002'].map(id=>({id,subject,productId:product,kind:'initialized'})):[],nextCursor:cursor===null?'30000000-0000-4000-8000-000000000002':null}));const r=await onRequestGet(context());expect(r.status).toBe(409);expect((await r.json()).error.code).toBe('SUBSCRIPTION_REVIEW_REQUIRED');expect(m.current).not.toHaveBeenCalled();});
it('does not borrow another subject subscription',async()=>{m.discover.mockImplementation(async(_token,_product,cursor)=>({schemaVersion:1,actorId:actor,productId:product,items:cursor===null?[{id:subscription,subject:{kind:'organization',id:actor},productId:product,kind:'initialized'}]:[],nextCursor:cursor===null?subscription:null}));expect((await onRequestGet(context())).status).toBe(403);expect(m.current).not.toHaveBeenCalled();});
it('rejects a mismatched owner response',async()=>{const current=await m.current();m.current.mockResolvedValue({...current,actorId:plan});expect((await onRequestGet(context())).status).toBe(503);expect(m.rpc).not.toHaveBeenCalled();});
it('keeps suspended subscriptions denied',async()=>{const current=await m.current();m.current.mockResolvedValue({...current,access:'suspended'});expect((await onRequestGet(context())).status).toBe(403);expect(m.rpc).not.toHaveBeenCalled();});
it('keeps authentication wrapped and validates filters before owner reads',async()=>{expect(m.withAuth).toHaveBeenCalled();const c=context() as unknown as {request:Request};c.request=new Request('https://fixture.invalid/api/learning/jobs?offset=-1');expect((await onRequestGet(c as never)).status).toBe(400);expect(m.discover).not.toHaveBeenCalled();});
