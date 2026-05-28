import { getContextUser } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';
import { ssoFetch } from '../../../lib/sso-client';
import { apiSuccess, apiError } from '../../../lib/response';

async function trackEvent(supabase: ReturnType<typeof getServiceClient>, userId: string, eventType: string, metadata: Record<string, unknown> = {}): Promise<void> {
  try {
    await supabase.from('addon_events').insert({ user_id: userId, event_type: eventType, metadata: { ...metadata, source: 'migration_service' } });
  } catch {
    // Non-critical, ignore
  }
}

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
      await trackEvent(supabase, userId, 'migration_opted_out', { migration_id: migration.id });
      return apiSuccess({ migrationId: migration.id, status: 'opted_out' }, context.request);
    }

    if (action === 'migrateUser') {
      const { targetUserId, preservePricing = false } = body;
      const migrateId = targetUserId || userId;

      const { data: subscription, error: subError } = await supabase.from('subscription_cache').select('id, plan_id, plan_code, status, subscription_end_date, plan_amount').eq('user_id', migrateId).in('status', ['active', 'pending']).single();
      if (subError) {
        if (subError.code === 'PGRST116') return apiError(200, 'ERROR', 'NO_ACTIVE_SUBSCRIPTION', context.request);
        throw subError;
      }

      const { data: plan, error: planError } = await supabase.from('plans_cache').select('id, plan_code, name').eq('id', subscription.plan_id).single();
      if (planError || !plan) return apiError(200, 'ERROR', 'PLAN_NOT_FOUND', context.request);

      const mappingResp = await ssoFetch(env as any, new Request('http://sso-worker/api/addon-catalog', { method: 'GET' }));
      if (!mappingResp.ok) throw new Error(`SSO Worker addons error: ${mappingResp.status}`);
      const { addons } = await mappingResp.json() as { addons: any[] };
      const features = Array.isArray(plan.base_features) ? plan.base_features : [];
      const addOnMap = new Map((addons || []).map(a => [a.feature_key, a]));
      const relevantAddons = features.filter(f => addOnMap.has(f)).map(f => addOnMap.get(f)!);

      const originalPrice = subscription.plan_amount ?? 0;
      const newPrice = relevantAddons.reduce((sum, a) => sum + (parseFloat(a.price_monthly) ?? 0), 0);
      let priceProtectedUntil = null;
      if (preservePricing && originalPrice < newPrice) {
        const protectedUntil = new Date();
        protectedUntil.setFullYear(protectedUntil.getFullYear() + 1);
        priceProtectedUntil = protectedUntil.toISOString();
      }

      const { data: migration, error: migrationError } = await supabase.from('subscription_migrations').insert({
        user_id: migrateId,
        old_plan_code: plan.plan_code,
        old_subscription_id: subscription.id,
        migrated_feature_keys: features.filter(f => addOnMap.has(f)),
        original_price: originalPrice,
        new_price: newPrice,
        price_protected_until: priceProtectedUntil,
        migration_date: new Date().toISOString(),
        migration_status: 'pending',
      }).select().single();
      if (migrationError) return apiError(200, 'ERROR', migrationError.message, context.request);

      const entitlements = relevantAddons.map(addon => ({
        user_id: migrateId,
        feature_key: addon.feature_key,
        status: 'active',
        billing_period: 'monthly',
        start_date: new Date().toISOString(),
        end_date: subscription.subscription_end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        auto_renew: true,
        price_at_purchase: preservePricing && priceProtectedUntil ? (originalPrice / relevantAddons.length) : (parseFloat(addon.price_monthly) ?? 0),
      }));

      const { error: entError } = await supabase.from('user_entitlements').insert(entitlements).select();
      if (entError) {
        await supabase.from('subscription_migrations').update({ migration_status: 'failed' }).eq('id', migration.id);
        return apiError(200, 'ERROR', entError.message, context.request);
      }

      await supabase.from('subscription_migrations').update({ migration_status: 'completed' }).eq('id', migration.id);
      return apiSuccess({ migrationId: migration.id, entitlements, priceProtected: !!priceProtectedUntil }, context.request);
    }

    if (action === 'scheduleMigrationNotification') {
      const { targetUserId, migrationDate } = body;
      const notifyId = targetUserId || userId;

      if (!migrationDate) return apiError(400, 'VALIDATION_ERROR', 'Migration date is required', context.request);

      const migration = new Date(migrationDate);
      if (isNaN(migration.getTime())) return apiError(400, 'VALIDATION_ERROR', 'Invalid migration date', context.request);

      const notificationDate = new Date(migration);
      notificationDate.setDate(notificationDate.getDate() - 30);
      if (notificationDate < new Date()) {
        notificationDate.setTime(Date.now());
      }

      const { data: existing } = await supabase.from('subscription_migrations').select('id, migration_status, notification_sent_at').eq('user_id', notifyId).in('migration_status', ['pending', 'notified']).single();

      if (existing) {
        const { data: updated, error: updateError } = await supabase.from('subscription_migrations').update({
          migration_date: migration.toISOString(),
          migration_status: 'notified',
          notification_sent_at: notificationDate.toISOString(),
        }).eq('id', existing.id).select().single();

        if (updateError) return apiError(200, 'ERROR', updateError.message, context.request);
        await trackEvent(supabase, notifyId, 'notification_scheduled', { migration_id: existing.id, notification_date: notificationDate.toISOString(), migration_date: migration.toISOString() });

        return apiSuccess({ migrationId: existing.id, notificationDate: notificationDate.toISOString(), migrationDate: migration.toISOString(), status: 'notified', isUpdate: true }, context.request);
      }

      const { data: newMigration, error: insertError } = await supabase.from('subscription_migrations').insert({
        user_id: notifyId,
        old_plan_code: 'pending_migration',
        migrated_feature_keys: [],
        original_price: 0,
        new_price: 0,
        price_protected_until: null,
        migration_date: migration.toISOString(),
        notification_sent_at: notificationDate.toISOString(),
        migration_status: 'notified',
      }).select().single();

      if (insertError) return apiError(200, 'ERROR', insertError.message, context.request);
      await trackEvent(supabase, notifyId, 'notification_scheduled', { migration_id: newMigration.id, notification_date: notificationDate.toISOString(), migration_date: migration.toISOString() });

      return apiSuccess({ migrationId: newMigration.id, notificationDate: notificationDate.toISOString(), migrationDate: migration.toISOString(), status: 'notified', isUpdate: false }, context.request);
    }

    if (action === 'getPendingMigrations') {
      const { limit = 100 } = body;
      const { data, error } = await supabase.from('subscription_migrations').select('*').eq('migration_status', 'pending').lte('migration_date', new Date().toISOString()).order('migration_date', { ascending: true }).limit(limit);
      if (error) throw error;
      return apiSuccess({ migrations: data || [] }, context.request);
    }

    return apiError(400, 'VALIDATION_ERROR', 'Invalid action or missing params', context.request);
  } catch (error) {
    console.error('[MigrationOperations] Error:', error);
    return apiError(200, 'ERROR', error instanceof Error ? error.message : 'Unknown error', context.request);
  }
}
