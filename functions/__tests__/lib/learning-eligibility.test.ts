import {webcrypto} from 'node:crypto';
import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
vi.mock('../../lib/entitlements',()=>({hasFeatureEntitlement:vi.fn()}));
import {hasFeatureEntitlement} from '../../lib/entitlements';
import {evaluateLearning,readLearningSnapshot,validateLearningRequirements,verifyLearningApplication,type LearningRequirement,type LearningSnapshot} from '../../lib/learning-eligibility';
const levelId='10000000-0000-4000-8000-000000000001';
const req:LearningRequirement={levelId,fingerprint:'a'.repeat(32),capabilityName:'Frontend',title:'React fundamentals',levelNumber:2,version:1,mandatory:true};
const level={...req,capabilityId:'10000000-0000-4000-8000-000000000002',code:'FE-L2',approved:false,evidence:[]};
const snapshot:LearningSnapshot={schemaVersion:1,revision:'current',levels:[level]};
const env={LTE_APP_URL:'http://127.0.0.1:8789',LTE_INTERNAL_SECRET:'x'.repeat(32)};
function db(){const insert=vi.fn();const q:any={select:()=>q,eq:()=>q,in:()=>q,order:()=>q,range:()=>q,upsert:()=>Promise.resolve({error:null}),insert:(data:any)=>{insert(data);return q;},single:async()=>({data:{id:'private-proof'},error:null}),then:(r:any)=>Promise.resolve({data:[],error:null}).then(r)};return{from:()=>q,insert,rpc:async(name:string)=>({data:name==='job_learning_evaluation_policy'?'human':[],error:null})};}
beforeEach(()=>{vi.stubGlobal('crypto',webcrypto);vi.mocked(hasFeatureEntitlement).mockResolvedValue(true);vi.stubGlobal('fetch',vi.fn().mockImplementation(async()=>Response.json(snapshot)));});
afterEach(()=>{vi.unstubAllGlobals();vi.clearAllMocks();});
describe('deterministic reviewer-approved learning',()=>{
 it('does not count content progress as reviewer approval',()=>{expect(evaluateLearning([req],snapshot)).toMatchObject({state:'not_yet_eligible',canApply:false});});
 it('accepts authoritative human-approved exact levels',()=>{expect(evaluateLearning([req],{...snapshot,levels:[{...level,approved:true}]})).toMatchObject({state:'eligible',canApply:true});});
 it('does not conflate current level, seniority, or another capability with earned evidence',()=>{expect(evaluateLearning([req],{...snapshot,levels:[{...level,levelId:'10000000-0000-4000-8000-000000000003',approved:true}]})).toMatchObject({state:'unknown',canApply:false});});
 it('accepts reviewed equivalent work/certification/course evidence only for the pinned level',()=>{expect(evaluateLearning([req],snapshot,[{id:'eq',level_id:levelId,fingerprint:req.fingerprint,status:'approved',version:2}])).toMatchObject({state:'eligible',criteria:[{reason:'APPROVED_EQUIVALENT'}]});});
 it.each(['pending','rejected','revoked'])('does not accept %s equivalencies',status=>{expect(evaluateLearning([req],snapshot,[{level_id:levelId,fingerprint:req.fingerprint,status}]).canApply).toBe(false);});
 it('does not use an old approval after catalog content changes',()=>{expect(evaluateLearning([req],{...snapshot,levels:[{...level,fingerprint:'b'.repeat(32),approved:true}]})).toMatchObject({state:'unknown',canApply:false});});
 it('preferred gaps do not block applications',()=>{expect(evaluateLearning([{...req,mandatory:false}],snapshot)).toMatchObject({state:'eligible',canApply:true});});
 it('legacy jobs remain explicitly unspecified',()=>{expect(evaluateLearning([],snapshot).state).toBe('requirements_unspecified');});
 it('accepts AI-approved equivalent evidence only for independently resolved AI policy',()=>{const evidence=[{id:'ai',level_id:levelId,fingerprint:req.fingerprint,status:'approved',evaluation_type:'ai',version:2}];expect(evaluateLearning([req],snapshot,evidence).canApply).toBe(false);expect(evaluateLearning([req],{...snapshot,evaluationPolicy:'ai'},evidence)).toMatchObject({state:'eligible',criteria:[{reason:'AI_EVALUATED_EQUIVALENT'}]});});
});
describe('service boundary and application proof',()=>{
 it('authenticates learning requests with the shared internal gateway key',async()=>{
  await readLearningSnapshot(env,'verified-user',[levelId]);
  const [url,init]=vi.mocked(fetch).mock.calls[0];
  const headers=new Headers(init?.headers);
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(env.LTE_INTERNAL_SECRET),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  const signature=Uint8Array.from(headers.get('x-lte-signature')!.match(/../g)!,value=>parseInt(value,16));
  expect(await crypto.subtle.verify('HMAC',key,signature,new TextEncoder().encode(`POST\n${new URL(String(url)).pathname}\n${headers.get('x-lte-timestamp')}\n${init?.body}`))).toBe(true);
 });
 it('fails closed before calling LTE when the shared internal secret is missing',async()=>{
  await expect(readLearningSnapshot({LTE_APP_URL:env.LTE_APP_URL},null,null)).rejects.toMatchObject({code:'LEARNING_UNAVAILABLE'});
  expect(fetch).not.toHaveBeenCalled();
 });
 it('signs the exact server-generated path, actor and evaluation policy',async()=>{await readLearningSnapshot(env,'verified-user',[levelId]);const [url,init]=vi.mocked(fetch).mock.calls[0];expect(String(url)).toContain('/api/v1/internal/learning/qualifications');expect(JSON.parse(String(init?.body))).toEqual({userId:'verified-user',levelIds:[levelId],evaluationPolicy:'human'});expect((init?.headers as any)['x-lte-signature']).toMatch(/^[a-f0-9]{64}$/);});
 it('rejects upstream evidence evaluated under a different policy',async()=>{vi.mocked(fetch).mockResolvedValue(Response.json({...snapshot,evaluationPolicy:'ai'}));await expect(readLearningSnapshot(env,'verified-user',[levelId],'human')).rejects.toMatchObject({code:'LEARNING_UNAVAILABLE'});});
 it('rejects redirects without forwarding the signed request',async()=>{vi.mocked(fetch).mockResolvedValue(new Response(null,{status:302,headers:{Location:'https://other.invalid'}}));await expect(readLearningSnapshot(env,null,null)).rejects.toMatchObject({code:'LEARNING_UNAVAILABLE'});expect(vi.mocked(fetch).mock.calls[0][1]?.redirect).toBe('manual');});
 it('fails closed on malformed or unavailable authoritative evidence',async()=>{vi.mocked(fetch).mockResolvedValue(Response.json({levels:[]}));await expect(readLearningSnapshot(env,null,[levelId])).rejects.toMatchObject({code:'LEARNING_UNAVAILABLE'});});
 it('does not contact an insecure remote endpoint',async()=>{await expect(readLearningSnapshot({...env,LTE_APP_URL:'http://remote.invalid'},null,null)).rejects.toMatchObject({code:'LEARNING_UNAVAILABLE'});expect(fetch).not.toHaveBeenCalled();});
 it('canonicalizes recruiter labels from the signed catalog',async()=>{const database=db();const result=await validateLearningRequirements(database as any,env,[{...req,title:'Forged label'}]);expect(result[0].title).toBe(level.title);});
 it('rejects stale catalog selections before any job write',async()=>{await expect(validateLearningRequirements(db() as any,env,[{...req,fingerprint:'b'.repeat(32)}])).rejects.toMatchObject({status:409});});
 it('denies subscription access before contacting the evidence service',async()=>{vi.mocked(hasFeatureEntitlement).mockResolvedValue(false);await expect(verifyLearningApplication(db() as any,env,'user','learner',{id:'job',learning_requirements:[req]})).rejects.toMatchObject({code:'FEATURE_ACCESS_DENIED',status:403});expect(fetch).not.toHaveBeenCalled();});
 it('does not issue application proof for an unapproved level',async()=>{const database=db();await expect(verifyLearningApplication(database as any,env,'user','learner',{id:'job',learning_requirements:[req]})).rejects.toMatchObject({code:'REQUIRED_LEVEL_NOT_APPROVED'});expect(database.insert).not.toHaveBeenCalled();});
 it('issues private version-bound proof only after authoritative approval',async()=>{vi.mocked(fetch).mockResolvedValue(Response.json({...snapshot,levels:[{...level,approved:true}]}));const database=db();expect(await verifyLearningApplication(database as any,env,'user','learner',{id:'job',learning_requirements:[req],learning_requirements_version:3})).toBe('private-proof');expect(database.insert).toHaveBeenCalledWith(expect.objectContaining({user_id:'user',learner_id:'learner',requirements_version:3,evidence:expect.objectContaining({state:'eligible'})}));});
});
