import {getServiceClient} from './supabase';
import {ownQuestionLearner} from './assessment-question-owner';
import {sanitizeLearnerQuestions} from './assessment-question-safety';
const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const failure=(status:number)=>Response.json({success:false,error:status===503?'Session authority unavailable':status===400?'Invalid session request':'Session not found'},{status,headers:{'Cache-Control':'no-store'}});

/** Derive the learner from the authenticated subject before any handler can
 * load questions, mutate a session, or enumerate another learner's results. */
export async function authorizeAdaptiveSession(context:any,path:string,method:string):Promise<{context:any}|Response>{
 let sessionId:string|undefined;let reference:string|undefined;let body:any;
 const session=path.match(/^\/(next-question|complete|results|resume|abandon)\/([^/]+)$/);
 const learner=path.match(/^\/(results\/learner|find-in-progress)\/([^/]+)$/);
 if(session)sessionId=session[2];
 if(learner)reference=learner[2];
 if(method==='POST'&&(path==='/initialize'||path==='/submit-answer')){
  try{const raw=await context.request.clone().text();if(new TextEncoder().encode(raw).byteLength>65536)return failure(400);body=JSON.parse(raw);}
  catch{return failure(400);}
  if(!body||typeof body!=='object'||Array.isArray(body))return failure(400);
  if(body.learnerId!==undefined){if(typeof body.learnerId!=='string')return failure(400);reference=body.learnerId;}
  if(path==='/submit-answer')sessionId=body.sessionId;
 }
 if((sessionId!==undefined&&(typeof sessionId!=='string'||!uuid.test(sessionId)))||
  (path==='/submit-answer'&&sessionId===undefined)||(reference!==undefined&&!uuid.test(reference)))return failure(400);
 try{const guard=await getServiceClient(context.env).rpc('assert_private_adaptive_assessment_grants',{});if(guard.error)return failure(503);}catch{return failure(503);}
 let ownedLearner:string;
 try{ownedLearner=await ownQuestionLearner(context,reference);}
 catch{return failure(404);}
 if(sessionId){
  try{const result=await getServiceClient(context.env).from('adaptive_aptitude_sessions').select('id')
   .eq('id',sessionId.toLowerCase()).eq('learner_id',ownedLearner).maybeSingle();
   if(result.error)return failure(503);if(!result.data)return failure(404);
  }catch{return failure(503);}
 }
 if(learner){
  // Existing callers may use their SSO ID. Only the verified learner ID enters
  // downstream queries; a foreign reference was already rejected above.
  const url=new URL(context.request.url);url.pathname=url.pathname.slice(0,-learner[2].length)+ownedLearner;
  return {context:{...context,request:new Request(url,context.request)}};
 }
 return {context};
}

/** Only question-shaped objects lose answer keys. Session correctness totals
 * and feedback on already submitted answers retain their normal contract. */
export function sanitizeAdaptivePayload(value:any):any{
 if(Array.isArray(value))return value.map(sanitizeAdaptivePayload);
 if(!value||typeof value!=='object')return value;
 const looksLikeQuestion=!!value.options&&typeof value.options==='object'&&
  ['text','question','questionText','question_text'].some(key=>typeof value[key]==='string');
 if(looksLikeQuestion)return sanitizeLearnerQuestions(value);
 return Object.fromEntries(Object.entries(value).map(([key,item])=>{
  if(['question','currentQuestion','firstQuestion','questions','currentPhaseQuestions','current_phase_questions','diagnosticQuestions','stabilityQuestions'].includes(key))
   return [key,sanitizeLearnerQuestions(item)];
  return [key,sanitizeAdaptivePayload(item)];
 }));
}
export async function privateAdaptiveResponse(response:Response){
 if(!response.headers.get('Content-Type')?.includes('json')||response.status===204)return response;
 let body:any;try{body=await response.json();}catch{return failure(503);}
 const headers=new Headers(response.headers);headers.set('Cache-Control','no-store');headers.delete('Content-Length');
 return new Response(JSON.stringify(sanitizeAdaptivePayload(body)),{status:response.status,statusText:response.statusText,headers});
}
