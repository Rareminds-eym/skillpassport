import {withAuth,getContextUser} from '../../lib/auth';
import {getServiceClient} from '../../lib/supabase';
import {apiSuccess,apiError,apiDbError} from '../../lib/response';
import {hasFeatureEntitlement} from '../../lib/entitlements';
import {LearningError,readLearningSnapshot,evaluateLearning,requirementsSchema,learningEvaluationPolicy,readLearningEquivalents} from '../../lib/learning-eligibility';
export const onRequestGet=withAuth(async context=>{
 const db=getServiceClient(context.env as any),user=getContextUser(context),url=new URL(context.request.url);
 const offset=Number(url.searchParams.get('offset')||0),state=url.searchParams.get('state')||'eligible',search=(url.searchParams.get('search')||'').trim();
 if(!Number.isInteger(offset)||offset<0||offset>100000||!['eligible','not_yet_eligible','all'].includes(state)||search.length>100)
  return apiError(400,'VALIDATION_ERROR','Invalid learning jobs filter.',context.request);
 if(!await hasFeatureEntitlement(db,user.id,'ai_job_matching'))return apiError(403,'FEATURE_ACCESS_DENIED','Your subscription does not include learning-based job matching.',context.request);
 const {data:learner,error:learnerError}=await db.from('learners').select('id').eq('user_id',user.id).maybeSingle();
 if(learnerError||!learner)return apiError(503,'LEARNING_UNAVAILABLE','Your learner profile could not be verified.',context.request);
 try{
  const policy=await learningEvaluationPolicy(db,user.id,learner.id);
  const snapshot=await readLearningSnapshot(context.env as any,user.id,null,policy);
  const equivalents=await readLearningEquivalents(db,learner.id,policy);
  const approved=[...snapshot.levels.filter(l=>l.approved).map(l=>({levelId:l.levelId,fingerprint:l.fingerprint})),...equivalents.map(e=>({levelId:e.level_id,fingerprint:e.fingerprint}))];
  const {data,error}=await db.rpc('learning_job_feed',{p_user:user.id,p_learner:learner.id,p_catalog:snapshot.levels.map(l=>({levelId:l.levelId,fingerprint:l.fingerprint})),p_approved:approved,p_state:state,p_search:search,p_offset:offset});
  if(error)return apiDbError(error,context.request);
  const jobs=(data?.jobs||[]).map((j:any)=>({...j,learning_eligibility:evaluateLearning(requirementsSchema.parse(j.learning_requirements),snapshot,equivalents)}));
  const response=apiSuccess({jobs,total:data?.total||0,offset,pageSize:12,evidenceRevision:snapshot.revision,evaluationPolicy:policy},context.request);
  response.headers.set('Cache-Control','private, no-store');return response;
 }catch(e){return e instanceof LearningError?apiError(e.status,e.code,e.message,context.request):apiError(503,'LEARNING_UNAVAILABLE','Learning-based openings are temporarily unavailable.',context.request);}
});
