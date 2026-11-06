import { getServiceClient } from './supabase';

const uuid=/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const hidden=(key:string)=>{
 const normalized=key.replace(/[^a-z0-9]/gi,'').toLowerCase();
 return normalized.startsWith('correct')||normalized.startsWith('explanation')||normalized.startsWith('solution')||
  normalized.startsWith('rationale')||normalized.startsWith('answer')||normalized==='description'||normalized==='iscorrect'||
  normalized.startsWith('scoring')||normalized.startsWith('rubric');
};
/** Apply at the HTTP boundary, including cached and streaming delivery. Keys
 * stay in the server snapshot; nested option correctness must not leak either. */
export function sanitizeLearnerQuestions(value:any):any {
 if(Array.isArray(value))return value.map(sanitizeLearnerQuestions);
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value)
  .filter(([key])=>!hidden(key)).map(([key,item])=>[key,sanitizeLearnerQuestions(item)]));
 return value;
}
/** Persist the actual owned attempt's canonical question/key version BEFORE
 * delivery. Historical unattested sets can be displayed but remain advisory. */
export async function deliverGeneratedQuestions(context:any,input:{attemptId?:unknown;streamId:string;questionType:'aptitude'|'knowledge';questions:any[]}) {
 if(!Array.isArray(input.questions))throw new Error('Generated questions unavailable');
 if(input.attemptId===undefined||input.attemptId===null)return sanitizeLearnerQuestions(input.questions);
 const owner=context.data?.user?.sub;
 if(typeof owner!=='string'||!uuid.test(owner)||typeof input.attemptId!=='string'||!uuid.test(input.attemptId))throw new Error('Owned question attempt required');
 const result=await getServiceClient(context.env).rpc('snapshot_generated_assessment_questions',{
  p_owner:owner,p_attempt:input.attemptId,p_stream:input.streamId,p_type:input.questionType,
 });
 if(result.error||!result.data||!Array.isArray(result.data.questions)||typeof result.data.bound!=='boolean')throw new Error('Question version binding unavailable');
 // A concurrent generator may have returned another set. Always deliver what
 // the database bound, never certify one set while showing another one.
 return sanitizeLearnerQuestions(result.data.questions);
}
