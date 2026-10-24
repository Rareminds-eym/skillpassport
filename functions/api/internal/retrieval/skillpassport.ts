import type { SupabaseClient } from '@supabase/supabase-js';
import { EvidenceAuthError } from '../evidence-auth';
import { createCatalogRetriever,createCatalogVerifier,type RetrievalScope } from './catalog';

// This adapter owns product and actor-scope restrictions. Other products need their own adapter.
const policies=Object.freeze({
 'career-talent-strategist.chat':Object.freeze(['catalog.roles','catalog.courses']),
});
function assertScope(scope:RetrievalScope){
 if(scope.product!=='skillpassport'||scope.tenantId!==undefined){
  throw new EvidenceAuthError('Retrieval source is not allowed for this task','FORBIDDEN',403);
 }
}
const retrieve=createCatalogRetriever(policies);
const verify=createCatalogVerifier(policies);
export const retrieveCatalog:typeof retrieve=async(db,embedder,scope,...args)=>{
 assertScope(scope);
 return retrieve(db,embedder,scope,...args);
};
export async function verifyCatalogReferences(db:SupabaseClient,scope:RetrievalScope,raw:unknown,signal:AbortSignal){
 assertScope(scope);
 return verify(db,scope,raw,signal);
}
