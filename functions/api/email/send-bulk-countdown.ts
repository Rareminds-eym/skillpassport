import type { PagesFunction } from '../../lib/types';
import { apiError } from '../../lib/response';
import { handleBulkCountdownEmail } from './handlers/bulk-countdown';
import { createSupabaseClient } from '../../lib/supabase';

export const onRequestPost: PagesFunction = async (context) => {
  const body: any = await context.request.json().catch(() => null);
  if (!body) return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON in request body', context.request);
  const supabase = createSupabaseClient(context.env);
  return await handleBulkCountdownEmail(body, context.env as any, supabase);
};
