import { handleCorsPreflightRequest } from '../../lib/cors';
import { apiError } from '../../lib/response';
import type { PagesFunction, PagesEnv } from '../../lib/types';
import { onRequestPost } from './actions';

export const onRequest: PagesFunction<PagesEnv> = async (context) => {
  if (context.request.method === 'OPTIONS') return handleCorsPreflightRequest(context.request);
  if (context.request.method === 'POST') return onRequestPost(context);
  return apiError(405, 'METHOD_NOT_ALLOWED', 'Method not allowed', context.request);
};
