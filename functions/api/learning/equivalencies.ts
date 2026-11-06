import { z } from 'zod';
import { withAuth,getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { apiSuccess,apiError,apiDbError } from '../../lib/response';
import { hasFeatureEntitlement } from '../../lib/entitlements';
import { LearningError,readLearningSnapshot,refreshLearningCatalog,learningEvaluationPolicy } from '../../lib/learning-eligibility';
import {presentLearningEvidence} from '../../lib/learning-evidence';
import {evaluateIndependentEvidence} from '../../lib/learning-ai-equivalency';
const submission=z.object({levelId:z.string().uuid(),sourceKind:z.enum(['training','certificate','experience','project']),sourceId:z.string().uuid()}).strict();
const review=z.object({id:z.string().uuid(),version:z.number().int().positive(),decision:z.enum(['approved','rejected','revoked']),feedback:z.string().trim().min(1).max(4000)}).strict();

export const onRequestGet=withAuth(async context=>{
 const db=getServiceClient(context.env as any),user=getContextUser(context),url=new URL(context.request.url);
 const offset=Number(url.searchParams.get('offset')||0);
 if(!Number.isInteger(offset)||offset<0||offset>100000) return apiError(400,'VALIDATION_ERROR','Invalid page offset.',context.request);
 const {data,error}=await db.rpc('list_learning_equivalencies',{p_user:user.id,p_offset:offset,p_review:url.searchParams.get('review')==='true'});
 if(error) return apiDbError(error,context.request);
 const own=await db.from('learners').select('id').eq('user_id',user.id).maybeSingle();
 let evaluationPolicy='human';
 if(own.data){try{evaluationPolicy=await learningEvaluationPolicy(db,user.id,own.data.id);}catch{return apiError(503,'LEARNING_UNAVAILABLE','Evaluation policy is temporarily unavailable.',context.request);}}
 const response=apiSuccess({items:(data||[]).map(presentLearningEvidence),nextOffset:(data||[]).length===25?offset+25:null,evaluationPolicy},context.request);
 response.headers.set('Cache-Control','private, no-store');return response;
});
export const onRequestPost=withAuth(async context=>{
 const db=getServiceClient(context.env as any),user=getContextUser(context);
 let body:any; try{const raw=await context.request.text();if(raw.length>20000)return apiError(413,'VALIDATION_ERROR','Evidence request is too large.',context.request);body=JSON.parse(raw);}catch{return apiError(400,'VALIDATION_ERROR','Invalid JSON.',context.request);}
 if(body?.action==='review'){
  const parsed=review.safeParse(body.review);
  if(!parsed.success) return apiError(400,'VALIDATION_ERROR','Provide a review decision and feedback.',context.request);
  const r=parsed.data;
  const {data,error}=await db.rpc('review_learning_equivalency',{p_id:r.id,p_reviewer:user.id,p_version:r.version,p_decision:r.decision,p_feedback:r.feedback});
  if(error?.code==='40001')return apiError(409,'REVIEW_CHANGED','This evidence request changed. Refresh before reviewing again.',context.request);
  if(error?.code==='22023')return apiError(400,'VALIDATION_ERROR','This review transition or feedback is invalid.',context.request);
  if(error?.code==='P0002')return apiError(404,'NOT_FOUND','Evidence request not found.',context.request);
  return error?apiDbError(error,context.request):apiSuccess({item:presentLearningEvidence(data)},context.request);
 }
 if(!await hasFeatureEntitlement(db,user.id,'ai_job_matching'))return apiError(403,'FEATURE_ACCESS_DENIED','Your plan does not include learning equivalency requests.',context.request);
 if(body?.action==='retry-ai'||body?.action==='requeue-ai'){
  const id=z.string().uuid().safeParse(body.id);if(!id.success)return apiError(400,'VALIDATION_ERROR','Invalid evidence request.',context.request);
  const owner=await db.from('learners').select('id').eq('user_id',user.id).maybeSingle();
  if(owner.error||!owner.data)return apiError(403,'FORBIDDEN','A learner profile is required.',context.request);
  const {data:item,error}=await db.from('learning_equivalencies').select('*').eq('id',id.data).eq('learner_id',owner.data.id).maybeSingle();
  if(error||!item)return apiError(404,'NOT_FOUND','Evidence request not found.',context.request);
  if(body.action==='requeue-ai'){
   const result=await db.rpc('requeue_learning_ai_equivalency',{p_id:item.id,p_user:user.id,p_version:item.version});
   return result.error?apiError(409,'REQUEUE_NOT_AVAILABLE','Refresh the request and wait until the one-day recovery cooldown has passed.',context.request):apiSuccess({item:presentLearningEvidence(result.data)},context.request);
  }
  try{return apiSuccess({item:presentLearningEvidence(await evaluateIndependentEvidence(db,context.env as any,user.id,item))},context.request);}catch(e){return e instanceof LearningError?apiError(e.status,e.code,e.message,context.request):apiError(503,'LEARNING_UNAVAILABLE','Evaluation is unavailable.',context.request);}
 }
 const parsed=submission.safeParse(body);
 if(!parsed.success)return apiError(400,'VALIDATION_ERROR','Select a published learning level and an existing profile evidence record.',context.request);
 const {data:learner,error:ownerError}=await db.from('learners').select('id').eq('user_id',user.id).maybeSingle();
 if(ownerError)return apiError(503,'LEARNING_UNAVAILABLE','Your learner profile could not be verified.',context.request);
 if(!learner)return apiError(403,'FORBIDDEN','A learner profile is required.',context.request);
 try{
  const policy=await learningEvaluationPolicy(db,user.id,learner.id);
  const snapshot=await readLearningSnapshot(context.env as any,null,[parsed.data.levelId]);
  const level=snapshot.levels[0]; if(!level)return apiError(409,'CATALOG_CHANGED','This learning level is no longer published.',context.request);
  await refreshLearningCatalog(db,snapshot);
  const {data,error}=await db.rpc('submit_learning_equivalency',{p_user:user.id,p_level:level.levelId,p_fingerprint:level.fingerprint,p_kind:parsed.data.sourceKind,p_source:parsed.data.sourceId});
  if(error?.code==='22023')return apiError(400,'EVIDENCE_SOURCE_INCOMPLETE','Complete the evidence title and description in your profile. AI evaluation requires at least 200 characters of actual evidence content.',context.request);
  if(error?.code==='42501')return apiError(403,'EVIDENCE_SOURCE_UNAVAILABLE','Select your own enabled, unexpired evidence record.',context.request);
  if(error?.code==='40001')return apiError(409,'EVIDENCE_CHANGED','The learning content or evidence changed. Refresh before submitting.',context.request);
  if(error)return apiDbError(error,context.request);
  const item=data?.item;
  if(!item?.id)return apiError(503,'LEARNING_UNAVAILABLE','Evidence submission could not be confirmed.',context.request);
  return apiSuccess({item:presentLearningEvidence(policy==='ai'&&!data.duplicate?await evaluateIndependentEvidence(db,context.env as any,user.id,item):item),duplicate:data.duplicate===true},context.request);
 }catch(e){return e instanceof LearningError?apiError(e.status,e.code,e.message,context.request):apiError(503,'LEARNING_UNAVAILABLE','Equivalent evidence could not be submitted.',context.request);}
});
