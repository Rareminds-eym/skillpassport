import type { PagesFunction } from '../../lib/types';
import { apiSuccess, apiError } from '../../lib/response';
import { handleGenericEmail } from './handlers/generic';
import { createSupabaseClient } from '../../lib/supabase';

export const onRequestGet: PagesFunction = async (context) => {
  return apiSuccess({
    status: 'ok',
    service: 'email-api',
    endpoints: [
      '/send', '/verification', '/password-reset', '/invitation',
      '/countdown', '/send-bulk-countdown', '/event-confirmation',
      '/event-otp', '/download-receipt/:orderId',
    ],
    timestamp: new Date().toISOString(),
  }, context.request);
};

export const onRequestPost: PagesFunction = async (context) => {
  const body: any = await context.request.json().catch(() => null);
  if (!body) return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON in request body', context.request);
  const supabase = createSupabaseClient(context.env);
  return await handleGenericEmail(body, context.env as any, supabase);
};
