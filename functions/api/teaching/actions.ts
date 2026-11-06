import { withAuth, getContextUser } from '../../lib/auth';
import { getServiceClient } from '../../lib/supabase';
import { apiError, apiSuccess } from '../../lib/response';
import { parseTeachingRequest, PLATFORM_TEACHING_ADMIN_ACTIONS, teachingFailure, teachingRpcName } from '../../lib/teaching-contract';

export const onRequestPost = withAuth(async context => {
  let operation;
  try { operation = parseTeachingRequest(await context.request.json()); }
  catch { return apiError(400,'VALIDATION_ERROR','Invalid teaching request',context.request); }
  const user=getContextUser(context);
  const adminRoles=['admin','super_admin','rm_admin','rm_manager'];
  if (PLATFORM_TEACHING_ADMIN_ACTIONS.has(operation.action) && !user.roles?.some(role=>adminRoles.includes(role))) {
    return apiError(403,'FORBIDDEN','Platform administration required',context.request);
  }
  const db=getServiceClient(context.env);
  if(operation.action==='course_content'){
    const access=await db.rpc('external_educator_action',{p_actor:user.id,p_action:'courses',p_payload:{}});
    if(access.error||!access.data?.some((course:any)=>course.course_id===operation.payload.courseId))return apiError(403,'FORBIDDEN','Course is not assigned',context.request);
    const content=await db.from('course_modules').select('*,lessons(*,lesson_resources(*))').eq('course_id',operation.payload.courseId).order('order_index');
    if(content.error)return apiError(503,'CONTENT_UNAVAILABLE','Course content is unavailable',context.request);
    return apiSuccess(content.data||[],context.request);
  }
  const {data,error}=await db.rpc(teachingRpcName(operation.action),{
    p_actor:user.id,p_action:operation.action,p_payload:operation.payload,
  });
  if(error){const failure=teachingFailure(error);return apiError(failure.status,failure.code,failure.message,context.request);}
  return apiSuccess(data,context.request);
});
