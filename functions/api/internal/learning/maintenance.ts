import {dispatchIndependentEvaluations} from '../../../lib/learning-ai-equivalency';
import {getServiceClient} from '../../../lib/supabase';
import {dispatchLearningJobNotifications} from '../../../lib/learning-job-notifications';
export const onRequestPost=async(context:any)=>{
 const secret=context.env.LTE_CATALOG_SYNC_SECRET,timestamp=String(context.request.headers.get('x-lte-timestamp')||''),signature=String(context.request.headers.get('x-lte-signature')||'');
 if(typeof secret!=='string'||secret.length<32)return Response.json({error:'Learning maintenance unavailable'},{status:503});
 if(!/^\d{13}$/.test(timestamp)||Math.abs(Date.now()-Number(timestamp))>60000||!/^[a-f0-9]{64}$/.test(signature))return Response.json({error:'Unauthorized'},{status:401});
 try{
  const body=await context.request.text();if(body.length>1024)return Response.json({error:'Request too large'},{status:413});
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);
  const valid=await crypto.subtle.verify('HMAC',key,Uint8Array.from(signature.match(/../g)!,v=>parseInt(v,16)),new TextEncoder().encode(`POST\n${new URL(context.request.url).pathname}\n${timestamp}\n${body}`));
  if(!valid)return Response.json({error:'Unauthorized'},{status:401});
  const command=JSON.parse(body);
  if(!command||typeof command!=='object'||Array.isArray(command)||Object.keys(command).some(k=>k!=='task')||(command.task!==undefined&&command.task!=='notifications'))return Response.json({error:'Invalid maintenance task'},{status:400});
  const db=getServiceClient(context.env);
  const {error}=await db.rpc('purge_unused_learning_verifications');
  if(error)throw new Error('Verification maintenance unavailable');
  const [notifications,evaluations]=await Promise.allSettled([dispatchLearningJobNotifications(db,context.env),command.task==='notifications'?Promise.resolve():dispatchIndependentEvaluations(db,context.env)]);
  if(notifications.status==='rejected'||evaluations.status==='rejected')throw new Error('Learning maintenance will retry.');
  return Response.json({ok:true,notifications:notifications.value},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Learning maintenance unavailable'},{status:503});}
};
