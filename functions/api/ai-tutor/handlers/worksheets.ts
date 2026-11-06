import { z } from 'zod';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, getServiceClient } from '../../../lib/auth';
import type { PagesEnv } from '../../../lib/types';
import { apiSuccess, apiError } from '../../../lib/response';

/** Teaching context only. Assignments are managed by /materials and /assignment-submission. */
export async function handleWorksheets(context: AuthenticatedContext) {
  const { request, env } = context;
  const user = getContextUser(context);
  const db = getServiceClient(env as unknown as PagesEnv);
  const fail = (status:number,message:string)=>apiError(status,'WORKSHEET_ERROR',message,request);
  try {
    const {action}=z.object({action:z.string()}).parse(await request.json());
    if(action!=='context')return fail(410,'This worksheet flow has been retired. Use course assignments.');
    const profile=await db.from('users').select('role').eq('id',user.id).single();
    if(profile.error)throw profile.error;
    if(!['educator','school_educator','college_educator'].includes(profile.data?.role))return fail(403,'Educator access required.');
    const result=await db.rpc('ai_worksheet_context',{p_user_id:user.id});
    if(result.error)throw result.error;
    if(!result.data?.organization?.id)return fail(409,'An active teaching mapping is required.');
    return apiSuccess(result.data,request);
  } catch(error) {
    if(error instanceof z.ZodError||error instanceof SyntaxError)return fail(400,'Invalid teaching context request.');
    return fail(503,'Teaching context is unavailable. Please try again.');
  }
}
