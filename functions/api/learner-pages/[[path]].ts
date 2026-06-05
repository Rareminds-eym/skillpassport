import { handleCorsPreflightRequest } from '../../lib/cors';
import { apiMethodNotAllowed } from '../../lib/response';
import type { PagesFunction, PagesEnv } from '../../lib/types';
import { onRequestPost as handleLearnerPagesActions } from './actions';

export const onRequest: PagesFunction<PagesEnv> = async (context) => {
  const { request } = context;

  if (request.method === 'OPTIONS') {
    return handleCorsPreflightRequest(request);
  }

  if (request.method === 'POST') {
    return handleLearnerPagesActions(context);
  }

  return apiMethodNotAllowed(request);
};
