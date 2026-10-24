import {CATALOG_EMBEDDING_MODEL as RAG_MODEL,CATALOG_INDEX_VERSION as RAG_VERSION} from '../retrieval/catalog-contract';
import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildCareerRagEvidence } from '../../career/context/rag';

const now=Date.now();
const input={actorId:'11111111-1111-4111-8111-111111111111',query:'Suggest data analyst roles and courses',
  kinds:['learner.profile','learner.skills','roles.recommended','courses.recommended'],resources:[]};
const base=()=>({learnerId:'learner',forbiddenResources:[],bundle:{evidence:[
  {kind:'learner.profile',reference:'learner:learner',text:'Name: Private Name',source:'learners',gatheredAt:new Date(now).toISOString()},
  {kind:'learner.skills',reference:'skill:python',text:'Python (technical skill)',source:'skills',gatheredAt:new Date(now).toISOString()},
],sources:['learners','skills'],missing:[],absent:[],stale:[],invalid:[],gatheredAt:new Date(now).toISOString()}});
const hit=(kind:string)=>({id:'22222222-2222-4222-8222-222222222222',kind,title:'Data analysis',description:'SQL and data analysis',
 revision:'a'.repeat(64),model:RAG_MODEL,index_version:RAG_VERSION,indexed_at:new Date(now).toISOString(),similarity:0.8,retrieval_score:0.7});
function setup(){
 const embedText=vi.fn().mockResolvedValue({embedding:Array(1536).fill(0.1),model:RAG_MODEL,dimensions:1536,task_type:'RETRIEVAL_QUERY'});
 const rpc=vi.fn(async (_name:string,args:{p_source:string})=>({data:{status:'matches',items:[hit(args.p_source==='catalog.roles'?'role':'course')]},error:null}));
 const env={EMBEDDING_SERVICE:{embedText}} as unknown as Parameters<typeof buildCareerRagEvidence>[3];
 const projection=vi.fn().mockResolvedValue(base());
 return {embedText,rpc,env,projection,db:{rpc} as unknown as SupabaseClient};
}
describe('Career RAG authorized evidence',()=>{
 it('reauthorizes frozen catalog results without a second embedding, rejecting revocation',async()=>{
  const s=setup();s.rpc.mockResolvedValue({data:true,error:null} as never);
  const replay={...input,catalogPins:[{kind:'course' as const,id:'22222222-2222-4222-8222-222222222222',revision:'a'.repeat(64)}]};
  await buildCareerRagEvidence(s.db,replay,now,s.env,new AbortController().signal,s.projection);
  expect(s.embedText).not.toHaveBeenCalled();expect(s.rpc).toHaveBeenCalledWith('rag_verify',expect.objectContaining({p_references:replay.catalogPins.map(pin=>({sourceKey:'catalog.courses',id:pin.id,revision:pin.revision}))}));
  s.rpc.mockResolvedValue({data:false,error:null} as never);
  await expect(buildCareerRagEvidence(s.db,replay,now,s.env,new AbortController().signal,s.projection)).rejects.toThrow('no longer available');
 });
 it('embeds once after authorization and returns bounded source-backed role/course records',async()=>{
  const s=setup();const result=await buildCareerRagEvidence(s.db,input,now,s.env,new AbortController().signal,s.projection);
  expect(s.projection.mock.calls[0][1].kinds).toEqual(['learner.profile','learner.skills']);
  expect(s.embedText).toHaveBeenCalledTimes(1);expect(s.embedText.mock.calls[0][0]).toContain('Python');
  expect(s.embedText.mock.calls[0][0]).not.toContain('Private Name');expect(s.embedText.mock.calls[0][1]).toBe('RETRIEVAL_QUERY');
  expect(s.embedText.mock.calls[0][2]).toEqual({deadlineMs:now+3500,maxAttempts:1});
  expect(s.rpc).toHaveBeenCalledWith('rag_search',expect.objectContaining({p_actor_id:input.actorId,p_source:'catalog.courses',p_limit:3}));
  const course=result.bundle.evidence.find(item=>item.kind==='courses.recommended')!;
  expect(JSON.parse(course.text).items[0].catalogUrl).toBe('/learner/courses');
  expect(JSON.parse(course.text).items[0]).not.toHaveProperty('embedding');expect(result.bundle.evidence.every(item=>item.text.length<=4000)).toBe(true);
 });
 it.each(['foreign','missing','no-skills'])('does not embed or query the catalog for %s base evidence',async mode=>{
  const s=setup();const value=base();
  if(mode==='foreign')value.forbiddenResources.push('learner:foreign');
  if(mode==='missing')value.learnerId=null as unknown as string;
  if(mode==='no-skills')value.bundle.evidence=value.bundle.evidence.filter(item=>item.kind!=='learner.skills');
  s.projection.mockResolvedValue(value);
  await buildCareerRagEvidence(s.db,input,now,s.env,new AbortController().signal,s.projection);
  expect(s.embedText).not.toHaveBeenCalled();expect(s.rpc).not.toHaveBeenCalled();
 });
 it.each(['wrong-model','wrong-size','nonfinite','zero','wrong-task'])('rejects %s embeddings before database search',async mode=>{
  const s=setup();const value={embedding:Array(1536).fill(0.1),model:RAG_MODEL,dimensions:1536,task_type:'RETRIEVAL_QUERY'};
  if(mode==='wrong-model')value.model='other';if(mode==='wrong-size')value.embedding=[1];
  if(mode==='nonfinite')value.embedding[0]=Infinity;if(mode==='zero')value.embedding.fill(0);
  if(mode==='wrong-task')value.task_type='RETRIEVAL_DOCUMENT';s.embedText.mockResolvedValue(value);
  await expect(buildCareerRagEvidence(s.db,input,now,s.env,new AbortController().signal,s.projection)).rejects.toThrow('incompatible');
  expect(s.rpc).not.toHaveBeenCalled();
 });
 it('represents a valid empty search distinctly from an unavailable index',async()=>{
  const s=setup();s.rpc.mockResolvedValue({data:{status:'no_matches',items:[]},error:null});
  const result=await buildCareerRagEvidence(s.db,input,now,s.env,new AbortController().signal,s.projection);
  expect(JSON.parse(result.bundle.evidence.at(-1)!.text).status).toBe('no_matches');
  s.rpc.mockResolvedValue({data:{status:'index_unavailable',items:[]},error:null});
  await expect(buildCareerRagEvidence(s.db,input,now,s.env,new AbortController().signal,s.projection)).rejects.toThrow('unavailable');
 });
 it('rejects a missing embedding binding without invoking embeddings',async()=>{
  const s=setup();delete s.env.EMBEDDING_SERVICE;
  await expect(buildCareerRagEvidence(s.db,input,now,s.env,new AbortController().signal,s.projection)).rejects.toThrow('unavailable');
  expect(s.embedText).not.toHaveBeenCalled();
 });
 it('bounds an uncertain embedding call with the request signal and never retries it',async()=>{
  const s=setup();s.embedText.mockImplementation(()=>new Promise(()=>{}));const controller=new AbortController();
  const promise=buildCareerRagEvidence(s.db,input,now,s.env,controller.signal,s.projection);
  await vi.waitFor(()=>expect(s.embedText).toHaveBeenCalledTimes(1));controller.abort();
  await expect(promise).rejects.toThrow('timed out');expect(s.rpc).not.toHaveBeenCalled();
 });
});
