import {indexDocuments} from './document-index.mjs';
const MODEL='google/gemini-embedding-2-preview';
/** Catalog source adapter: vector compatibility and entity/document validation live here. */
function indexCatalogDocuments({pending,store,...options}){
 return indexDocuments({...options,pending,
  validateDocument:doc=>['role','course'].includes(doc.kind)&&typeof doc.id==='string'&&
   /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(doc.id)&&
   typeof doc.revision==='string'&&/^[a-f0-9]{64}$/.test(doc.revision)&&doc.cursor===doc.kind+':'+doc.id,
  validateEmbedding:result=>Boolean(result&&result.model===MODEL&&result.dimensions===1536&&result.task_type==='RETRIEVAL_DOCUMENT'&&
   Array.isArray(result.embedding)&&result.embedding.length===1536&&result.embedding.every(Number.isFinite)&&result.embedding.some(value=>value!==0)),
  store:(doc,result)=>store({p_kind:doc.kind,p_id:doc.id,p_revision:doc.revision,p_embedding:JSON.stringify(result.embedding),p_model:result.model}),
 });
}

const sources=Object.freeze({'catalog.roles':'role','catalog.courses':'course'});
/** Source-specific operator adapter; validation/iteration belongs to the shared core. */
export async function indexCatalogSource({sourceKey,rpc,...options}){
 if(!Object.hasOwn(sources,sourceKey))throw new Error('Unknown retrieval source');
 const kind=sources[sourceKey];
 if(options.after!==undefined&&options.after!==''&&(typeof options.after!=='string'||!options.after.startsWith(kind+':')))
  throw new Error('Cursor does not belong to the selected source');
 return indexCatalogDocuments({...options,pending:async args=>{
  const docs=await rpc('rag_pending',{p_source:sourceKey,...args});
  if(!Array.isArray(docs)||docs.some(doc=>doc?.kind!==kind))throw new Error('Unexpected indexing source');
  return docs;
 },store:async ({p_kind,...args})=>{
  if(p_kind!==kind)throw new Error('Unexpected indexing source');
  return rpc('rag_store',{p_source:sourceKey,...args});
 }});
}
