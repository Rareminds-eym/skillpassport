import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';

export const onRequestGet = withAuth(async (context: AuthenticatedContext) => {
  return handleAddonOrders(context);
});

export async function handleAddonOrders(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
  const userId = context.data.user.sub;
  const url = new URL(context.request.url);
  const action = url.searchParams.get('action');

  try {
    const supabase = getServiceClient(env);

    if (action === 'getAddonPurchaseHistory') {
      const { data, error } = await supabase
        .from('addon_pending_orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data: data || [], error: null }), { status: 200 });
    }

    if (action === 'getPendingAddonOrder') {
      const featureKey = url.searchParams.get('featureKey');
      if (!featureKey) return new Response(JSON.stringify({ success: false, error: 'Feature key required' }), { status: 400 });

      const { data, error } = await supabase
        .from('addon_pending_orders')
        .select('*')
        .eq('user_id', userId)
        .eq('addon_feature_key', featureKey)
        .eq('status', 'pending')
        .maybeSingle();

      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data, error: null }), { status: 200 });
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action or missing params' }), { status: 400 });
  } catch (error) {
    console.error('[AddonOrders] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 200 }
    );
  }
}
