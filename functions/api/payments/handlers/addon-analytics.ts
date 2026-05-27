import { getContextUser } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';

export async function handleAddonAnalytics(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
  const user = getContextUser(context);
  const userId = user.id;

  try {
    const body = await context.request.json() as any;
    const { action } = body;
    const supabase = getServiceClient(env);

    if (action === 'trackEvent') {
      const { eventType, featureKey, metadata } = body;
      const validEventTypes = ['view', 'purchase', 'activation', 'cancellation', 'renewal', 'expiry', 'upgrade_prompt', 'bundle_view', 'bundle_purchase', 'discount_applied', 'payment_failed', 'grace_period_started', 'grace_period_ended', 'migration_opted_out', 'notification_scheduled'];
      if (!validEventTypes.includes(eventType)) return new Response(JSON.stringify({ success: false, error: 'Invalid event type' }), { status: 200 });

      const eventData: any = { user_id: userId || null, event_type: eventType, feature_key: featureKey || null, metadata: { ...metadata, timestamp: new Date().toISOString() } };
      if (metadata?.bundleId) eventData.bundle_id = metadata.bundleId;

      const { data, error } = await supabase.from('addon_events').insert(eventData).select().single();
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), { status: 200 });
    }

    if (action === 'getAddOnRevenue') {
      const { options } = body;
      const start = new Date(options?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).toISOString();
      const end = new Date(options?.endDate || new Date()).toISOString();

      const { data: entitlements, error: entError } = await supabase.from('user_entitlements').select('feature_key, price_at_purchase, billing_period, created_at, bundle_id').gte('created_at', start).lte('created_at', end);
      if (entError) throw entError;

      const totalRevenue = (entitlements || []).reduce((sum, ent) => sum + (parseFloat(ent.price_at_purchase) ?? 0), 0);
      return new Response(JSON.stringify({ success: true, data: { period: { startDate: start, endDate: end }, totalRevenue, totalTransactions: entitlements?.length || 0 } }), { status: 200 });
    }

    if (action === 'getChurnRate') {
      const { featureKey, options } = body;
      const start = new Date(options?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).toISOString();
      const end = new Date(options?.endDate || new Date()).toISOString();

      let query = supabase.from('user_entitlements').select('id, status, created_at, cancelled_at, feature_key');
      if (featureKey) query = query.eq('feature_key', featureKey);
      const { data: entitlements, error } = await query;
      if (error) throw error;

      const activeAtStart = (entitlements || []).filter(ent => new Date(ent.created_at) < new Date(start) && (ent.status === 'active' || ent.status === 'grace_period' || (ent.cancelled_at && new Date(ent.cancelled_at) > new Date(start)))).length;
      const cancellations = (entitlements || []).filter(ent => ent.cancelled_at && new Date(ent.cancelled_at) >= new Date(start) && new Date(ent.cancelled_at) <= new Date(end)).length;
      const churnRate = activeAtStart > 0 ? Math.round((cancellations / activeAtStart) * 10000) / 100 : 0;

      return new Response(JSON.stringify({ success: true, data: { featureKey: featureKey || 'all', activeAtStart, cancellations, churnRate, retentionRate: 100 - churnRate } }), { status: 200 });
    }

    if (action === 'getCohortAnalysis') {
      return new Response(JSON.stringify({ success: true, data: { message: "Simplified for backend" } }), { status: 200 });
    }

    if (action === 'getFeatureUsage') {
      return new Response(JSON.stringify({ success: true, data: { message: "Simplified for backend" } }), { status: 200 });
    }

    if (action === 'getAdoptionMetrics') {
      const { data: entitlements } = await supabase.from('user_entitlements').select('feature_key, billing_period, bundle_id, status').in('status', ['active', 'grace_period']);
      const totalActiveEntitlements = entitlements?.length || 0;
      return new Response(JSON.stringify({ success: true, data: { totalActiveEntitlements } }), { status: 200 });
    }

    return new Response(JSON.stringify({ success: false, error: 'Invalid action or missing params' }), { status: 400 });
  } catch (error) {
    console.error('[AddonAnalytics] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 200 }
    );
  }
}
