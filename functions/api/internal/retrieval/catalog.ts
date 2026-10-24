import type { SupabaseClient } from '@supabase/supabase-js';
import { RetrievalReferenceSchema } from '@rareminds-eym/ai-protocol';
import { z } from 'zod';
import { VectorResult, SearchResult } from './catalog-contract';
import { EvidenceAuthError } from '../evidence-auth';
import { runRetrieval,withinDeadline } from './engine';

export type RetrievalScope={product:string;task:string;actorId:string;tenantId?:string};
type Source={kind:'role'|'course'};
const sources:Readonly<Record<string,Source>>=Object.freeze({
 'catalog.roles':Object.freeze({kind:'role'}),
 'catalog.courses':Object.freeze({kind:'course'}),
});
type Embedder={embedText(text:string,task:'RETRIEVAL_QUERY',policy:{deadlineMs:number;maxAttempts:1}):Promise<unknown>};

function allowed(scope:RetrievalScope,keys:readonly string[],policies:Readonly<Record<string,readonly string[]>>) {
 if(!z.string().uuid().safeParse(scope.actorId).success||
   !Object.hasOwn(policies,scope.task)||keys.some(key=>!Object.hasOwn(sources,key)||!policies[scope.task]?.includes(key))) {
  throw new EvidenceAuthError('Retrieval source is not allowed for this task','FORBIDDEN',403);
 }
}
/** Factory is server-only: adding a task policy does not activate a public task/route. */
export function createCatalogRetriever(policies:Readonly<Record<string,readonly string[]>>){
 const frozen=Object.fromEntries(Object.entries(policies).map(([task,keys])=>[task,Object.freeze([...keys])]));
 return async function retrieve(db:SupabaseClient,embedder:Embedder,scope:RetrievalScope,raw:unknown,signal:AbortSignal,
  authorize:()=>Promise<boolean>,queryText?:string){
  return runRetrieval(raw,signal,{
   assertAllowed:keys=>allowed(scope,keys,frozen),
   authorize:async()=>{
    if(!await authorize())throw new EvidenceAuthError('Retrieval scope is not authorized','FORBIDDEN',403);
    return true;
   },
   embed:(query,policy)=>embedder.embedText(query,'RETRIEVAL_QUERY',policy),
   parseVector:rawVector=>{
    const vector=VectorResult.safeParse(rawVector);
    if(!vector.success||!vector.data.embedding.some(value=>value!==0))throw new Error('Retrieval embedding space is incompatible');
    return vector.data.embedding;
   },
   search:async(sourceKey,vector,query,limit)=>{
    const source=sources[sourceKey]!;
    const result=await db.rpc('rag_search',{
     p_actor_id:scope.actorId,p_source:sourceKey,p_query:JSON.stringify(vector),
     p_query_text:(queryText??query).slice(0,2200),p_limit:limit,
    });
    if(result.error)throw new Error('Retrieval store is unavailable');
    const parsed=SearchResult.safeParse(result.data);
    if(!parsed.success||parsed.data.status==='index_unavailable')throw new Error('Retrieval index is unavailable');
    if(parsed.data.items.some(hit=>hit.kind!==source.kind)||(parsed.data.status==='no_matches')!==(parsed.data.items.length===0))throw new Error('Retrieval result is malformed');
    return parsed.data;
   },
  });
 };
}


export function createCatalogVerifier(policies:Readonly<Record<string,readonly string[]>>){
 const frozen=Object.fromEntries(Object.entries(policies).map(([task,keys])=>[task,Object.freeze([...keys])]));
 return async function verify(db:SupabaseClient,scope:RetrievalScope,raw:unknown,signal:AbortSignal){
  const references=z.array(RetrievalReferenceSchema).max(6).parse(raw);
  allowed(scope,[...new Set(references.map(ref=>ref.sourceKey))],frozen);
  const result=await withinDeadline(()=>db.rpc('rag_verify',{p_actor_id:scope.actorId,p_references:references}),signal,Date.now()+3500);
  if(result.error)throw new Error('Catalog replay authorization is unavailable');
  if(result.data!==true)throw new EvidenceAuthError('Catalog records changed or are no longer available','FORBIDDEN',403);
 };
}

