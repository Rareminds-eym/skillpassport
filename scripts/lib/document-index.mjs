/** Generic bounded indexing loop. Source adapters validate documents and embedding spaces. */
export async function indexDocuments({pending,store,embed,validateDocument,validateEmbedding,execute=false,after='',limit=10}){
 if(!Number.isInteger(limit)||limit<1||limit>25||typeof after!=='string'||after.length>80||
  typeof validateDocument!=='function'||typeof validateEmbedding!=='function')throw new Error('Invalid indexing bounds or adapter');
 const documents=await pending({p_after:after,p_limit:limit});
 if(!Array.isArray(documents)||documents.length>limit)throw new Error('Invalid catalog response');
 const report={mode:execute?'execute':'dry-run',examined:documents.length,indexed:0,conflicts:0,next:after};
 for(const doc of documents){
  if(!doc||typeof doc.cursor!=='string'||doc.cursor<=report.next||typeof doc.text!=='string'||
   doc.text.length<10||doc.text.length>6000||!validateDocument(doc))throw new Error('Invalid catalog document');
  if(execute){
   const result=await embed(doc.text);
   if(!validateEmbedding(result))throw new Error('Incompatible document embedding; stopped without retry');
   const stored=await store(doc,result);
   if(stored===true)report.indexed++;else if(stored===false)report.conflicts++;
   else throw new Error('Unconfirmed index write; reconcile before retry');
  }
  report.next=doc.cursor;
 }
 return report;
}
