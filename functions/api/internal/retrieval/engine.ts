import { RetrievalRequestSchema } from '@rareminds-eym/ai-protocol';

/** Transport/domain independent: product adapters supply authority and source operations. */
export async function withinDeadline<T>(operation:()=>PromiseLike<T>,signal:AbortSignal,deadlineMs:number):Promise<T>{
 if(signal.aborted||deadlineMs<=Date.now())throw new Error('Retrieval timed out');
 return new Promise((resolve,reject)=>{
  const cleanup=()=>{clearTimeout(timer);signal.removeEventListener('abort',abort);};
  const abort=()=>{cleanup();reject(new Error('Retrieval timed out'));};
  const timer=setTimeout(abort,Math.max(0,deadlineMs-Date.now()));
  signal.addEventListener('abort',abort,{once:true});
  Promise.resolve().then(()=>{
   if(signal.aborted||deadlineMs<=Date.now())throw new Error('Retrieval timed out');
   return operation();
  }).then(value=>{cleanup();resolve(value);},error=>{cleanup();reject(error);});
 });
}

export async function runRetrieval<TVector,TResult>(raw:unknown,signal:AbortSignal,adapter:{
 assertAllowed:(sources:readonly string[])=>void;
 authorize:()=>Promise<boolean>;
 embed:(query:string,policy:{deadlineMs:number;maxAttempts:1})=>Promise<unknown>;
 parseVector:(raw:unknown)=>TVector;
 search:(sourceKey:string,vector:TVector,query:string,limit:number)=>PromiseLike<TResult>;
}){
 const request=RetrievalRequestSchema.parse(raw);
 request.deadlineMs=Math.min(request.deadlineMs,Date.now()+3500);
 adapter.assertAllowed(request.sourceKeys);
 if(!await withinDeadline(adapter.authorize,signal,request.deadlineMs))throw new Error('Retrieval scope is not authorized');
 const vector=adapter.parseVector(await withinDeadline(()=>adapter.embed(request.query,{
  deadlineMs:request.deadlineMs,maxAttempts:1,
 }),signal,request.deadlineMs));
 return Promise.all(request.sourceKeys.map(async sourceKey=>({sourceKey,result:await withinDeadline(
  ()=>adapter.search(sourceKey,vector,request.query,request.limit),signal,request.deadlineMs,
 )})));
}
