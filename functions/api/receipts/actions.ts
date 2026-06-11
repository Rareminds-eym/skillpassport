import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, withAuth } from '../../lib/auth';
import { apiDbError, apiError, apiMethodNotAllowed, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';

export const onRequest = async (context: any) => {
  if (context.request.method === 'POST') return onRequestPost(context);
  return apiMethodNotAllowed();
};

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  const user = getContextUser(context);
  const env = context.env as Record<string, string>;
  const supabase = getServiceClient(env as any);

  let body: Record<string, any>;
  try {
    body = await context.request.json();
  } catch {
    return apiError(400, 'VALIDATION_ERROR', 'Invalid JSON body', context.request);
  }

  const { action } = body;

  if (action === 'get-receipt-by-order-id') {
    const { orderId } = body;
    const { data, error } = await supabase
      .from('pre_registrations')
      .select('*')
      .eq('razorpay_order_id', orderId)
      .maybeSingle();
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data, context.request);
  }

  if (action === 'get-receipt-by-id') {
    const { id } = body;
    const { data, error } = await supabase
      .from('pre_registrations')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) return apiDbError(error, context.request);
    return apiSuccess(data, context.request);
  }

  return apiError(400, 'BAD_REQUEST', `Unknown action: ${action}`, context.request);
});
