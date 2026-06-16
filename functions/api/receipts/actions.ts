import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getContextUser, withAuth } from '../../lib/auth';
import { apiDbError, apiError, apiMethodNotAllowed, apiSuccess } from '../../lib/response';
import { getServiceClient } from '../../lib/supabase';
import { ssoGetUserTransactions, ssoGetUserSubscription } from '../../lib/sso-client';

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

  // Helper to fetch user details
  const getUserDetails = async () => {
    const { data } = await supabase.from('users_shadow').select('email').eq('id', user.id).maybeSingle();
    const { data: learner } = await supabase.from('learners').select('name, phone').eq('user_id', user.id).maybeSingle();
    return {
      name: learner?.name || user.email,
      email: data?.email || user.email,
      phone: learner?.phone
    };
  };

  const getSsoReceiptData = async (filterFn: (tx: any) => boolean) => {
    try {
      const transactions = await ssoGetUserTransactions(env as any, user.id);
      const tx = transactions.find(filterFn);
      if (!tx) return null;

      const { subscription } = await ssoGetUserSubscription(env as any, user.id);
      const userDetails = await getUserDetails();

      return {
        id: tx.id || tx.subscription_id,
        payment_id: tx.razorpay_payment_id || tx.payment_id,
        razorpay_order_id: tx.razorpay_order_id,
        amount: tx.amount,
        status: tx.status,
        created_at: tx.created_at,
        plan_type: subscription?.plan_type || 'Subscription',
        billing_cycle: subscription?.billing_cycle || 'Annual',
        user_name: userDetails.name,
        user_email: userDetails.email,
        user_phone: userDetails.phone
      };
    } catch (e) {
      console.error('[receipts] SSO fetch failed:', e);
      return null;
    }
  };

  if (action === 'get-receipt-by-order-id') {
    const { orderId } = body;
    
    // First try SSO worker for payment transactions
    const ssoData = await getSsoReceiptData(tx => tx.razorpay_order_id === orderId);
    if (ssoData) return apiSuccess(ssoData, context.request);

    // Fallback to pre_registrations for older data
    const { data: preRegData, error: preRegError } = await supabase
      .from('pre_registrations')
      .select('*')
      .eq('razorpay_order_id', orderId)
      .maybeSingle();
    
    if (preRegError) return apiDbError(preRegError, context.request);
    return apiSuccess(preRegData, context.request);
  }

  if (action === 'get-receipt-by-payment-id') {
    const { paymentId } = body;
    
    // First try SSO worker
    const ssoData = await getSsoReceiptData(tx => tx.razorpay_payment_id === paymentId || tx.payment_id === paymentId);
    if (ssoData) return apiSuccess(ssoData, context.request);

    // Fallback to pre_registrations
    const { data: preRegData, error: preRegError } = await supabase
      .from('pre_registrations')
      .select('*')
      .eq('payment_id', paymentId)
      .maybeSingle();
    
    if (preRegError) return apiDbError(preRegError, context.request);
    return apiSuccess(preRegData, context.request);
  }

  if (action === 'get-receipt-by-id') {
    const { id } = body;
    
    // First try SSO worker
    // The frontend may pass either a transaction ID or a subscription ID
    const ssoData = await getSsoReceiptData(tx => tx.id === id || tx.subscription_id === id);
    if (ssoData) return apiSuccess(ssoData, context.request);

    // Fallback to pre_registrations
    const { data: preRegData, error: preRegError } = await supabase
      .from('pre_registrations')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (preRegError) return apiDbError(preRegError, context.request);
    return apiSuccess(preRegData, context.request);
  }

  return apiError(400, 'BAD_REQUEST', `Unknown action: ${action}`, context.request);
});
