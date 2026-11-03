import {z} from 'zod';
import type {SupabaseClient} from '@supabase/supabase-js';
import {LearningError,learningServiceRequest} from './learning-eligibility';
import {learningEvidenceContent} from './learning-evidence';
import {hasFeatureEntitlement} from './entitlements';
const resultSchema=z.object({decision:z.enum(['approved','rejected','pending']),feedback:z.string().min(1).max(4000),model:z.string().min(1),score:z.number().int().min(0).max(100),fingerprint:z.string()});
export async function evaluateIndependentEvidence(db:SupabaseClient,env:Record<string,any>,userId:string,item:any){
 const {data:claimed,error}=await db.rpc('claim_learning_ai_equivalency',{p_id:item.id,p_user:userId,p_version:item.version});
 if(error?.message==='EVIDENCE_SOURCE_CHANGED'||error?.message==='EVIDENCE_SOURCE_UNAVAILABLE')throw new LearningError('EVIDENCE_SOURCE_CHANGED','Your evidence changed or is unavailable. Submit its current revision for evaluation.',409);
 if(error&&error.message!=='AI_CONCURRENT_EVALUATION')throw new LearningError('LEARNING_UNAVAILABLE','Evaluation scheduling is temporarily unavailable.');
 if(error||!claimed?.id){
  const deferred=await db.rpc('defer_learning_ai_equivalency',{p_id:item.id,p_version:item.version,p_delay:60,p_error:'Evaluation deferred until its lease, cooldown, or current evaluation completes.'});
  if(deferred.error)throw new LearningError('LEARNING_UNAVAILABLE','Evaluation scheduling is temporarily unavailable.');
  throw new LearningError('EVALUATION_BUSY','Evaluation is running, scheduled to retry, or awaiting the recovery cooldown.',409);
 }
 try{
  const result=resultSchema.parse(await learningServiceRequest(env,'/api/v1/internal/learning/equivalence',{levelId:claimed.level_id,fingerprint:claimed.fingerprint,evidenceContent:learningEvidenceContent(claimed)},35000));
  if(result.fingerprint!==claimed.fingerprint)throw new Error('Catalog changed');
  const {data,error}=await db.rpc('record_learning_ai_equivalency',{p_id:claimed.id,p_user:userId,p_version:claimed.version,p_decision:result.decision,p_feedback:result.feedback,p_model:result.model,p_score:result.score});
  if(error||!data)throw new Error('Evaluation changed');
  return data;
 }catch{
  const failed=await db.rpc('fail_learning_ai_equivalency',{p_id:claimed.id,p_version:claimed.version});
  return {...claimed,ai_lease_until:failed.error?claimed.ai_lease_until:null,evaluationPending:true};
 }
}
/** Bounded model concurrency; leases and due times live in SQL. */
export async function dispatchIndependentEvaluations(db:SupabaseClient,env:Record<string,any>){
 const {data:items,error}=await db.rpc('due_learning_ai_equivalencies');
 if(error)throw new Error('AI recovery queue unavailable');
 await Promise.all((items||[]).map(async(item:any)=>{
  const {data:learner,error}=await db.from('learners').select('user_id').eq('id',item.learner_id).maybeSingle();
  if(error)throw new Error('AI recovery owner unavailable');
  if(!learner?.user_id||!await hasFeatureEntitlement(db,learner.user_id,'ai_job_matching')){
   await db.rpc('defer_learning_ai_equivalency',{p_id:item.id,p_version:item.version,p_delay:3600,p_error:'Subscription access unavailable; evaluation postponed.'});return;
  }
  try{await evaluateIndependentEvidence(db,env,learner.user_id,item);}catch(e){if(!(e instanceof LearningError)||e.status!==409)throw e;}
 }));
}
