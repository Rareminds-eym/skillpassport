import { getContextUser } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';
import { ssoFetch } from '../../../lib/sso-client';
import { apiSuccess, apiError } from '../../../lib/response';

export async function handleMigrationOperations(context: AuthenticatedContext): Promise<Response> {
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };
  const user = getContextUser(context);
  const userId = user.id;

  try {
    const body = await context.request.json() as any;
    const { action } = body;
    const supabase = getServiceClient(env);

    if (action === 'getMigrationMapping') {
      const { planCode } = body;
      const { data: plan, error: planError } = await supabase.from('plans_cache').select('id, plan_code, name, base_features').eq('plan_code', planCode).single();
      if (planError) return apiError(200, 'ERROR', 'PLAN_NOT_FOUND', context.request);

      const addonsResp = await ssoFetch(env as any, new Request('http://sso-worker/api/addon-catalog', { method: 'GET' }));
      if (!addonsResp.ok) throw new Error(`SSO Worker addons error: ${addonsResp.status}`);
      const { addons } = await addonsResp.json() as { addons: any[] };

      const addOnMap = new Map((addons || []).map(a => [a.feature_key, a]));

      const planFeatures = Array.isArray(plan.base_features) ? plan.base_features : [];
      const mappedFeatures = planFeatures.filter(featureKey => addOnMap.has(featureKey)).map(featureKey => {
        const addOn = addOnMap.get(featureKey);
        return { feature_key: featureKey, feature_name: addOn.name || addOn.feature_name, addon_price_monthly: parseFloat(addOn.price_monthly) ?? 0, addon_price_annual: parseFloat(addOn.price_annual) ?? 0 };
      });
      return apiSuccess({ planCode, planName: plan.name, planId: plan.id, features: mappedFeatures }, context.request);
    }

    if (action === 'calculatePriceProtection') {
      const { data: subscription } = await supabase.from('subscription_cache').select('id, plan_id, status, created_at, plan_amount, plan_code, plan_name, features').eq('user_id', userId).eq('status', 'active').single();
      if (!subscription) return apiError(200, 'ERROR', 'NO_ACTIVE_SUBSCRIPTION', context.request);

      const addonsResp = await ssoFetch(env as any, new Request('http://sso-worker/api/addon-catalog', { method: 'GET' }));
      if (!addonsResp.ok) throw new Error(`SSO Worker addons error: ${addonsResp.status}`);
      const { addons } = await addonsResp.json() as { addons: any[] };

      const addOnMap = new Map((addons || []).map(a => [a.feature_key, a]));
      
      const planFeatures = Array.isArray(subscription.features) ? subscription.features : [];
      const newPrice = planFeatures.filter(featureKey => addOnMap.has(featureKey)).reduce((sum, featureKey) => sum + (parseFloat(addOnMap.get(featureKey)?.price_monthly) ?? 0), 0);
      const originalPrice = parseFloat(subscription.plan_amount) ?? 0;
      const eligible = newPrice > originalPrice;
      const protectedUntil = new Date(); protectedUntil.setFullYear(protectedUntil.getFullYear() + 1);

      return apiSuccess({ eligible, originalPrice, newPrice, priceDifference: newPrice - originalPrice, protectedUntil: eligible ? protectedUntil.toISOString() : null, subscriptionStartDate: subscription.created_at }, context.request);
    }

    if (action === 'getMigrationStatus') {
      const { data: migration, error } = await supabase.from('subscription_migrations').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single();
      if (error && error.code === 'PGRST116') return apiSuccess({ hasMigration: false, status: null }, context.request);
      if (error) throw error;
      return apiSuccess({ hasMigration: true, migrationId: migration.id, status: migration.migration_status, migrationDate: migration.migration_date, notificationSentAt: migration.notification_sent_at, originalPrice: migration.original_price, newPrice: migration.new_price, priceProtectedUntil: migration.price_protected_until, migratedFeatures: migration.migrated_feature_keys }, context.request);
    }

    if (action === 'optOutOfMigration') {
      const { data: migration, error } = await supabase.from('subscription_migrations').update({ migration_status: 'opted_out', updated_at: new Date().toISOString() }).eq('user_id', userId).in('migration_status', ['pending', 'notified']).select().single();
      if (error && error.code === 'PGRST116') return apiError(200, 'ERROR', 'NO_PENDING_MIGRATION', context.request);
      if (error) throw error;
      await supabase.from('addon_events').insert({ user_id: userId, event_type: 'migration_opted_out', metadata: { migration_id: migration.id, source: 'migration_service' } });
      return apiSuccess({ migrationId: migration.id, status: 'opted_out' }, context.request);
    }

    return apiError(400, 'VALIDATION_ERROR', 'Invalid action or missing params', context.request);
  } catch (error) {
    console.error('[MigrationOperations] Error:', error);
    return apiError(200, 'ERROR', error instanceof Error ? error.message : 'Unknown error', context.request);
  }
}
