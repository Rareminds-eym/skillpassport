import {retrieveCatalog,verifyCatalogReferences} from '../retrieval/skillpassport';
import { describe,it,expect,vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createCatalogRetriever,createCatalogVerifier } from '../retrieval/catalog';
const actor='11111111-1111-4111-8111-111111111111';
const scope={product:'skillpassport',task:'career-talent-strategist.chat',actorId:actor};
const request=()=>({version:1,sourceKeys:['catalog.courses'],query:'SQL',limit:3,deadlineMs:Date.now()+3500});
function setup(){
 const rpc=vi.fn().mockResolvedValue({data:{status:'no_matches',items:[]},error:null});
 const db={rpc} as unknown as SupabaseClient;
 const embedText=vi.fn().mockResolvedValue({embedding:Array(1536).fill(.1),model:'google/gemini-embedding-2-preview',dimensions:1536,task_type:'RETRIEVAL_QUERY'});
 const authorize=vi.fn().mockResolvedValue(true);
 return {db,rpc,embedder:{embedText},authorize};
}
describe('shared retrieval policies',()=>{
 it('two server-registered task policies reuse the same source/RPC without persona SQL',async()=>{
  const service=createCatalogRetriever({'career-talent-strategist.chat':['catalog.courses'],'educator-fixture.explain':['catalog.courses']});
  const s=setup();
  for(const task of ['career-talent-strategist.chat','educator-fixture.explain']){
   const result=await service(s.db,s.embedder,{...scope,task},request(),new AbortController().signal,s.authorize);
   expect(result[0]!.sourceKey).toBe('catalog.courses');
  }
  expect(s.rpc.mock.calls.map(([name,args])=>[name,args.p_source,args.p_actor_id])).toEqual([
   ['rag_search','catalog.courses',actor],['rag_search','catalog.courses',actor],
  ]);
 });
 it.each([{task:'educator-fixture.explain'},{product:'lte'},{tenantId:'foreign'},{actorId:'invalid'}])('denies unregistered runtime scope before embedding %j',async override=>{
  const s=setup();await expect(retrieveCatalog(s.db,s.embedder,{...scope,...override},request(),new AbortController().signal,s.authorize)).rejects.toThrow('not allowed');
  expect(s.embedder.embedText).not.toHaveBeenCalled();expect(s.rpc).not.toHaveBeenCalled();
 });
 it('denies failed current authorization before any paid work',async()=>{
  const s=setup();s.authorize.mockResolvedValue(false);
  await expect(retrieveCatalog(s.db,s.embedder,scope,request(),new AbortController().signal,s.authorize)).rejects.toThrow('not authorized');
  expect(s.embedder.embedText).not.toHaveBeenCalled();
 });
 it('denies unknown sources and arbitrary filters before authorization',async()=>{
  const s=setup();
  for(const raw of [{...request(),sourceKeys:['private.guides']},{...request(),filters:{sql:'anything'}}])
   await expect(retrieveCatalog(s.db,s.embedder,scope,raw,new AbortController().signal,s.authorize)).rejects.toThrow();
  expect(s.authorize).not.toHaveBeenCalled();
 });
 it('shares one compatible query vector across requested corpora',async()=>{
  const s=setup();await retrieveCatalog(s.db,s.embedder,scope,{...request(),sourceKeys:['catalog.roles','catalog.courses']},new AbortController().signal,s.authorize);
  expect(s.embedder.embedText).toHaveBeenCalledTimes(1);expect(s.rpc).toHaveBeenCalledTimes(2);
  expect(s.rpc.mock.calls[0]![1].p_query).toBe(s.rpc.mock.calls[1]![1].p_query);
 });
 it('honors an expired deadline before dispatch',async()=>{
  const s=setup();await expect(retrieveCatalog(s.db,s.embedder,scope,{...request(),deadlineMs:Date.now()-1},new AbortController().signal,s.authorize)).rejects.toThrow('timed out');
  expect(s.authorize).not.toHaveBeenCalled();expect(s.embedder.embedText).not.toHaveBeenCalled();
 });
 it('reauthorizes references with the generic SQL boundary, without embedding',async()=>{
  const s=setup();s.rpc.mockResolvedValue({data:false,error:null});
  await expect(verifyCatalogReferences(s.db,scope,[{sourceKey:'catalog.courses',id:actor,revision:'a'.repeat(64)}],new AbortController().signal)).rejects.toThrow('no longer available');
  expect(s.rpc).toHaveBeenCalledWith('rag_verify',expect.objectContaining({p_actor_id:actor}));expect(s.embedder.embedText).not.toHaveBeenCalled();
 });
 it('allows empty no-match replay pins while still checking task scope and database actor',async()=>{
  const s=setup();s.rpc.mockResolvedValue({data:true,error:null});
  await verifyCatalogReferences(s.db,scope,[],new AbortController().signal);
  expect(s.rpc).toHaveBeenCalledWith('rag_verify',{p_actor_id:actor,p_references:[]});
  await expect(verifyCatalogReferences(s.db,{...scope,task:'unknown'},[],new AbortController().signal)).rejects.toThrow('not allowed');
 });
 it('shares current-reference verification with a second registered task without activating it globally',async()=>{
  const s=setup();s.rpc.mockResolvedValue({data:true,error:null});
  const verify=createCatalogVerifier({'educator-fixture.explain':['catalog.courses']});
  await verify(s.db,{...scope,task:'educator-fixture.explain'},[{sourceKey:'catalog.courses',id:actor,revision:'a'.repeat(64)}],new AbortController().signal);
  expect(s.rpc).toHaveBeenCalledTimes(1);expect(s.embedder.embedText).not.toHaveBeenCalled();
 });
});
