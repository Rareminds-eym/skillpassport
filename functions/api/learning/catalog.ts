import { withAuth } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { apiSuccess,apiError } from '../../lib/response';
import { LearningError,readLearningSnapshot,refreshLearningCatalog } from '../../lib/learning-eligibility';

export const onRequestGet=withAuth(async context=>{
  const db=getServiceClient(context.env as any);
  try {
    const snapshot=await readLearningSnapshot(context.env as any,null,null);
    await refreshLearningCatalog(db,snapshot);
    return apiSuccess({levels:snapshot.levels.map(({approved,evidence,...level})=>level)},context.request);
  } catch(e) { return e instanceof LearningError ? apiError(e.status,e.code,e.message,context.request) : apiError(503,'LEARNING_UNAVAILABLE','Learning catalog is temporarily unavailable.',context.request); }
});
