import type { PagesFunction } from '../../lib/types';
import { apiError } from '../../lib/response';
import { handleInvitationEmail } from './handlers/invitation';

export const onRequestPost: PagesFunction = async (context) => {
  const body: any = await context.request.json().catch(() => null);
  if (!body) return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON in request body', context.request);
  return await handleInvitationEmail(body, context.env as any);
};
