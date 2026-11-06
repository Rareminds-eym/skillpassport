import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({rpc:vi.fn(),from:vi.fn(),entitled:vi.fn(),policy:vi.fn(),snapshot:vi.fn(),refresh:vi.fn(),evaluate:vi.fn()}));
vi.mock('../../lib/auth',()=>({withAuth:(handler:any)=>handler,getContextUser:()=>({id:'owner'})}));
vi.mock('../../lib/supabase',()=>({getServiceClient:()=>({rpc:f.rpc,from:f.from})}));
vi.mock('../../lib/entitlements',()=>({hasFeatureEntitlement:f.entitled}));
vi.mock('../../lib/learning-eligibility',async()=>({...await vi.importActual<any>('../../lib/learning-eligibility'),learningEvaluationPolicy:f.policy,readLearningSnapshot:f.snapshot,refreshLearningCatalog:f.refresh}));
vi.mock('../../lib/learning-ai-equivalency',()=>({evaluateIndependentEvidence:f.evaluate}));
import {onRequestGet as sources} from '../../api/learning/evidence-sources';
import {onRequestGet as list,onRequestPost as submit} from '../../api/learning/equivalencies';
import {presentLearningEvidence} from '../../lib/learning-evidence';
const id='11111111-1111-4111-8111-111111111111',level='22222222-2222-4222-8222-222222222222';
const item={id,evidence_format:2,assessed_evidence:{schemaVersion:1,title:'Assessed source',content:'Actual evidence',url:null},version:1};
function context(path:string,body?:any){return {request:new Request('https://fixture.invalid/api/learning/'+path,{method:body?'POST':'GET',...(body?{body:JSON.stringify(body)}:{})}),env:{}} as any;}
beforeEach(()=>{vi.clearAllMocks();f.entitled.mockResolvedValue(true);f.policy.mockResolvedValue('ai');f.snapshot.mockResolvedValue({levels:[{levelId:level,fingerprint:'a'.repeat(32)}]});f.refresh.mockResolvedValue(undefined);f.evaluate.mockResolvedValue({...item,status:'approved'});f.rpc.mockResolvedValue({data:{item,duplicate:false},error:null});f.from.mockReturnValue({select:()=>({eq:()=>({maybeSingle:async()=>({data:{id:'learner'},error:null})})})});});
it('validates source category and page before reading the database',async()=>{
 expect((await sources(context('evidence-sources?kind=users'))).status).toBe(400);expect(f.rpc).not.toHaveBeenCalled();
});
it('scopes source selection to the authenticated owner and disables caching',async()=>{
 f.rpc.mockResolvedValue({data:{items:[],total:0},error:null});const response=await sources(context('evidence-sources?kind=project&offset=50'));
 expect(response.status).toBe(200);expect(response.headers.get('Cache-Control')).toBe('private, no-store');expect(f.rpc).toHaveBeenCalledWith('list_learning_evidence_sources',{p_user:'owner',p_kind:'project',p_offset:50});
});
it('rejects copied evidence fields and client-selected policy',async()=>{
 expect((await submit(context('equivalencies',{levelId:level,sourceKind:'project',sourceId:id,evidenceContent:'Forged payload',evaluationType:'ai'}))).status).toBe(400);expect(f.evaluate).not.toHaveBeenCalled();
});
it('submits only typed source identity with an authoritative target fingerprint',async()=>{
 const response=await submit(context('equivalencies',{levelId:level,sourceKind:'project',sourceId:id}));expect(response.status).toBe(200);
 expect(f.rpc).toHaveBeenCalledWith('submit_learning_equivalency',{p_user:'owner',p_level:level,p_fingerprint:'a'.repeat(32),p_kind:'project',p_source:id});expect(f.evaluate).toHaveBeenCalledWith(expect.anything(),{},'owner',item);
});
it('does not call AI again for a duplicate evidence request',async()=>{
 f.rpc.mockResolvedValue({data:{item,duplicate:true},error:null});expect((await submit(context('equivalencies',{levelId:level,sourceKind:'project',sourceId:id}))).status).toBe(200);expect(f.evaluate).not.toHaveBeenCalled();
});
it('routes institution-linked submissions to human review',async()=>{
 f.policy.mockResolvedValue('human');expect((await submit(context('equivalencies',{levelId:level,sourceKind:'project',sourceId:id}))).status).toBe(200);expect(f.evaluate).not.toHaveBeenCalled();
});
it('denies missing entitlement before evaluating or submitting evidence',async()=>{
 f.entitled.mockResolvedValue(false);expect((await submit(context('equivalencies',{levelId:level,sourceKind:'project',sourceId:id}))).status).toBe(403);expect(f.rpc).not.toHaveBeenCalled();expect(f.evaluate).not.toHaveBeenCalled();
});
it('does not present expired normalized certificates as currently approved',()=>{
 expect(presentLearningEvidence({...item,status:'approved',assessed_evidence:{...item.assessed_evidence,expiresOn:'2000-01-01'}})).toMatchObject({status:'expired',title:'Assessed source',evidence_content:'Actual evidence'});
});
it('preserves historical standalone evidence presentation',()=>{
 const legacy={title:'Legacy',evidence_url:'https://example.invalid',description:'Original'};expect(presentLearningEvidence(legacy)).toBe(legacy);
});
it('presents assessed snapshots in the review list without exposing another owner',async()=>{
 f.rpc.mockResolvedValue({data:[item],error:null});const response=await list(context('equivalencies?review=true'));
 expect(response.status).toBe(200);expect((await response.json() as any).data.items[0].title).toBe('Assessed source');expect(f.rpc).toHaveBeenCalledWith('list_learning_equivalencies',{p_user:'owner',p_offset:0,p_review:true});
});

it('does not offer an empty next page when exactly fifty sources exist',async()=>{
 f.rpc.mockResolvedValue({data:{items:Array.from({length:50},()=>({id})),total:50},error:null});
 const response=await sources(context('evidence-sources?kind=project'));
 expect((await response.json() as any).data.nextOffset).toBeNull();
});
it('offers the next source page when more sources exist',async()=>{
 f.rpc.mockResolvedValue({data:{items:Array.from({length:50},()=>({id})),total:51},error:null});
 const response=await sources(context('evidence-sources?kind=project'));
 expect((await response.json() as any).data.nextOffset).toBe(50);
});
