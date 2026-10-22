import {beforeEach,expect,it,vi} from 'vitest';
const f=vi.hoisted(()=>({request:vi.fn(),entitled:vi.fn()}));
vi.mock('../../lib/learning-eligibility',async()=>{const actual=await vi.importActual<any>('../../lib/learning-eligibility');return {...actual,learningServiceRequest:f.request};});
vi.mock('../../lib/entitlements',()=>({hasFeatureEntitlement:f.entitled}));
import {evaluateIndependentEvidence,dispatchIndependentEvaluations} from '../../lib/learning-ai-equivalency';
const item={id:'request',learner_id:'learner',version:1,level_id:'level',fingerprint:'fp',evidence_content:'Actual work'};
function database(claimError?:any){const rpc=vi.fn(async(name:string)=>name==='claim_learning_ai_equivalency'?{data:claimError?null:{...item,version:2},error:claimError}:name==='due_learning_ai_equivalencies'?{data:[item],error:null}:{data:{...item,status:'approved'},error:null});return {rpc,from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{user_id:'owner'},error:null})})})})} as any;}
beforeEach(()=>{vi.clearAllMocks();f.entitled.mockResolvedValue(true);f.request.mockResolvedValue({decision:'approved',feedback:'Valid work',model:'fixture',score:90,fingerprint:'fp'});});
it('records a validated evaluation under the claimed version',async()=>{
 const db=database();expect(await evaluateIndependentEvidence(db,{},'owner',item)).toMatchObject({status:'approved'});
 expect(db.rpc).toHaveBeenCalledWith('record_learning_ai_equivalency',expect.objectContaining({p_version:2,p_user:'owner'}));
});
it('releases failed provider leases and leaves recoverable pending evidence',async()=>{
 f.request.mockRejectedValue(new Error('Provider unavailable'));const db=database();
 expect(await evaluateIndependentEvidence(db,{},'owner',item)).toMatchObject({evaluationPending:true,ai_lease_until:null});
 expect(db.rpc).toHaveBeenCalledWith('fail_learning_ai_equivalency',{p_id:'request',p_version:2});
 expect(db.rpc.mock.calls.some((c:any)=>c[0]==='record_learning_ai_equivalency')).toBe(false);
});
it('defers a concurrent evaluation without calling AI',async()=>{
 const db=database({message:'AI_CONCURRENT_EVALUATION'});
 await expect(evaluateIndependentEvidence(db,{},'owner',item)).rejects.toMatchObject({code:'EVALUATION_BUSY',status:409});
 expect(f.request).not.toHaveBeenCalled();expect(db.rpc).toHaveBeenCalledWith('defer_learning_ai_equivalency',expect.objectContaining({p_delay:60}));
});
it('the automatic worker evaluates due evidence with the verified owner',async()=>{
 const db=database();await dispatchIndependentEvaluations(db,{});
 expect(db.rpc).toHaveBeenCalledWith('claim_learning_ai_equivalency',expect.objectContaining({p_user:'owner'}));expect(f.request).toHaveBeenCalledOnce();
});
it('the automatic worker postpones requests without subscription access',async()=>{
 f.entitled.mockResolvedValue(false);const db=database();await dispatchIndependentEvaluations(db,{});
 expect(f.request).not.toHaveBeenCalled();expect(db.rpc).toHaveBeenCalledWith('defer_learning_ai_equivalency',expect.objectContaining({p_delay:3600}));
});

it('reports scheduling database outages without misclassifying them as a busy evaluation',async()=>{
 const db=database({message:'Database unavailable'});
 await expect(evaluateIndependentEvidence(db,{},'owner',item)).rejects.toMatchObject({code:'LEARNING_UNAVAILABLE',status:503});
 expect(f.request).not.toHaveBeenCalled();
});

it('sends the immutable assessed snapshot instead of mutable or copied evidence fields',async()=>{
 const db=database();db.rpc.mockImplementation(async(name:string)=>name==='claim_learning_ai_equivalency'?{data:{...item,evidence_format:2,evidence_content:'Untrusted duplicate',assessed_evidence:{content:'Assessed source revision'}},error:null}:{data:{...item,status:'approved'},error:null});
 await evaluateIndependentEvidence(db,{},'owner',item);
 expect(f.request).toHaveBeenCalledWith({},expect.any(String),expect.objectContaining({evidenceContent:'Assessed source revision'}),35000);
});
it('rejects a stale source claim without sending evidence to the model',async()=>{
 const db=database({message:'EVIDENCE_SOURCE_CHANGED'});
 await expect(evaluateIndependentEvidence(db,{},'owner',item)).rejects.toMatchObject({code:'EVIDENCE_SOURCE_CHANGED',status:409});expect(f.request).not.toHaveBeenCalled();
});
