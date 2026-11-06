import type {SupabaseClient} from '@supabase/supabase-js';
import {learningDecisions} from './learning-eligibility';

/** A bounded, leased batch. Partial delivery is safe because receipts are atomic. */
async function dispatchNotificationPage(db:SupabaseClient,env:Record<string,any>,deadline:number){
 const {data:work,error}=await db.rpc('claim_learning_job_notification_work');
 if(error)throw new Error('Learning notification work unavailable');
 if(!work?.id)return false;
 try{
  let query=work.learner_id?db.from('opportunities').select('*').eq('status','open').eq('is_active',true):db.from('learners').select('id,user_id').eq('is_deleted',false);
  if(work.cursor_id)query=query.gt('id',work.cursor_id);
  const {data:rows,error:readError}=await query.order('id').limit(25);
  if(readError)throw new Error('Learning notification page unavailable');
  let fixedLearner:any,fixedJob:any;
  if(work.learner_id){const result=await db.from('learners').select('id,user_id').eq('id',work.learner_id).maybeSingle();if(result.error)throw new Error('Learner unavailable');fixedLearner=result.data;}
  else {const result=await db.from('opportunities').select('*').eq('id',work.opportunity_id).maybeSingle();if(result.error)throw new Error('Opening unavailable');fixedJob=result.data;}
  let processed=0;
  for(let start=0;start<(rows||[]).length;start+=5){
   if(Date.now()+20000>=deadline)break;
   await Promise.all((rows||[]).slice(start,start+5).map(async(row:any)=>{
    const learner=work.learner_id?fixedLearner:row,job=work.learner_id?row:fixedJob;
    if(!learner?.user_id||!job?.learning_requirements?.length||job.status!=='open'||!job.is_active)return;
    const [result]=await learningDecisions(db,env,learner.user_id,learner.id,[job]);
    if(result.learning_eligibility?.state==='unknown')throw new Error('Authoritative learning evidence unavailable');
    if(result.learning_eligibility?.state!=='eligible')return;
    const {error}=await db.rpc('record_learning_job_notification',{p_learner:learner.id,p_job:job.id,p_version:job.learning_requirements_version});
    if(error)throw new Error('Notification could not be recorded');
   }));
   processed=Math.min(start+5,(rows||[]).length);
  }
  const {error:finishError}=await db.rpc('finish_learning_job_notification_work',{p_id:work.id,p_token:work.lease_token,p_cursor:processed?rows![processed-1].id:work.cursor_id,p_done:processed===(rows||[]).length&&(rows||[]).length<25,p_error:null});
  if(finishError)throw new Error('Notification checkpoint unavailable');
  return true;
 }catch{
  await db.rpc('finish_learning_job_notification_work',{p_id:work.id,p_token:work.lease_token,p_cursor:work.cursor_id,p_done:false,p_error:'Learning notification delivery failed; retry scheduled.'});
  throw new Error('Learning notification batch will retry');
 }
}

/** Drain within the edge request budget; a queue continuation handles backlog. */
export async function dispatchLearningJobNotifications(db:SupabaseClient,env:Record<string,any>){
 const deadline=Date.now()+40000;let pages=0;
 while(pages<20&&Date.now()+20000<deadline){if(!await dispatchNotificationPage(db,env,deadline))break;pages++;}
 const {data:hasMore,error}=await db.rpc('has_learning_job_notification_work');
 if(error)throw new Error('Notification backlog unavailable');
 return {pages,hasMore:hasMore===true};
}
