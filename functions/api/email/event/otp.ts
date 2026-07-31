import type { PagesFunction } from '../../../lib/types';
import { apiError } from '../../../lib/response';
import { handleEventOTP } from '../handlers/event-registration';

export const onRequestPost: PagesFunction = async (context) => {
  const body: any = await context.request.json().catch(() => null);
  if (!body) return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON in request body', context.request);
  return await handleEventOTP(body, context.env);
};
