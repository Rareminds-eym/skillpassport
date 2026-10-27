import { withAuth,getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { apiSuccess,apiError } from '../../lib/response';
import { hasFeatureEntitlement } from '../../lib/entitlements';
import { LearningError,readLearningSnapshot,refreshLearningCatalog } from '../../lib/learning-eligibility';

export const onRequestGet=withAuth(async context=>{
  const user=getContextUser(context), db=getServiceClient(context.env as any);
  const staff=user.roles?.some((r:string)=>['recruiter','company_admin','educator','school_educator','college_educator','lecturer'].includes(r));
  if(!staff&&!await hasFeatureEntitlement(db,user.id,'ai_job_matching')) return apiError(403,'FEATURE_ACCESS_DENIED','Your plan does not include learning-based job matching.',context.request);
  try {
    const snapshot=await readLearningSnapshot(context.env as any,null,null);
    await refreshLearningCatalog(db,snapshot);
    return apiSuccess({levels:snapshot.levels.map(({approved,evidence,...level})=>level)},context.request);
  } catch(e) { return e instanceof LearningError ? apiError(e.status,e.code,e.message,context.request) : apiError(503,'LEARNING_UNAVAILABLE','Learning catalog is temporarily unavailable.',context.request); }
});
