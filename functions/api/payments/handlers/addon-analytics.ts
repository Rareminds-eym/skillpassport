import { getContextUser } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiError } from '../../../lib/response';

export async function handleAddonAnalytics(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
  const user = getContextUser(context);
  const userId = user.id;

  try {
    const body = await context.request.json() as any;
    const { action } = body;
    const supabase = getServiceClient(env);

    const checkIsAdmin = async () => {
      const { data } = await supabase.from('admin_users').select('id').eq('user_id', userId).maybeSingle();
      return !!data;
    };

    if (action !== 'trackEvent') {
      if (!(await checkIsAdmin())) {
        return apiError(403, 'FORBIDDEN', 'Admin access required for analytics', context.request);
      }
    }

    if (action === 'trackEvent') {
      const { eventType, featureKey, metadata } = body;
      const validEventTypes = ['view', 'purchase', 'activation', 'cancellation', 'renewal', 'expiry', 'upgrade_prompt', 'bundle_view', 'bundle_purchase', 'discount_applied', 'payment_failed', 'grace_period_started', 'grace_period_ended', 'migration_opted_out', 'notification_scheduled'];
      if (!validEventTypes.includes(eventType)) return apiError(200, 'ERROR', 'Invalid event type', context.request);

      const eventData: any = { user_id: userId || null, event_type: eventType, feature_key: featureKey || null, metadata: { ...metadata, timestamp: new Date().toISOString() } };
      if (metadata?.bundleId) eventData.bundle_id = metadata.bundleId;

      const { data, error } = await supabase.from('addon_events').insert(eventData).select().single();
      if (error) throw error;
      return apiSuccess(data, context.request);
    }

    if (action === 'getAddOnRevenue') {
      const { options } = body;
      const start = new Date(options?.startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).toISOString();
      const end = new Date(options?.endDate || new Date()).toISOString();

      const { data: entitlements, error: entError } = await supabase.from('user_entitlements').select('feature_key, price_at_purchase, billing_period, created_at, bundle_id').gte('created_at', start).lte('created_at', end);
      if (entError) throw entError;

      const totalRevenue = (entitlements || []).reduce((sum, ent) => sum + (parseFloat(ent.price_at_purchase) ?? 0), 0);
      return apiSuccess({ period: { startDate: start, endDate: end }, totalRevenue, totalTransactions: entitlements?.length || 0 }, context.request);
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

      return apiSuccess({ featureKey: featureKey || 'all', activeAtStart, cancellations, churnRate, retentionRate: 100 - churnRate }, context.request);
    }

    if (action === 'getCohortAnalysis') {
      return apiSuccess({ message: "Simplified for backend" }, context.request);
    }

    if (action === 'getFeatureUsage') {
      return apiSuccess({ message: "Simplified for backend" }, context.request);
    }

    if (action === 'getAdoptionMetrics') {
      const { data: entitlements } = await supabase.from('user_entitlements').select('feature_key, billing_period, bundle_id, status').in('status', ['active', 'grace_period']);
      const totalActiveEntitlements = entitlements?.length || 0;
      return apiSuccess({ totalActiveEntitlements }, context.request);
    }

    return apiError(400, 'VALIDATION_ERROR', 'Invalid action or missing params', context.request);
  } catch (error) {
    console.error('[AddonAnalytics] Error:', error);
    return apiError(200, 'ERROR', error instanceof Error ? error.message : 'Unknown error', context.request);
  }
}
