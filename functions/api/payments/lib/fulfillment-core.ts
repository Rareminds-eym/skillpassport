import { ssoRecordTransaction, ssoRecordAddonPurchase, ssoRecordBundlePurchase, ssoCreateSubscription, ssoUpdateSubscriptionField, ssoSyncSubscription } from '../../../lib/sso-client';
import { getServiceClient } from '../../../lib/supabase';
import { syncUserShadow, syncSubscriptionCache } from '../../../lib/sync-shadow';
import type { Fetcher } from '@cloudflare/workers-types';

export interface FulfillmentEnv {
  SSO_SERVICE: Fetcher;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export async function fulfillAddonPurchase(
  env: FulfillmentEnv,
  payload: {
    user_id: string;
    feature_key: string;
    billing_period: string;
    price_at_purchase: number;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    currency?: string;
    payment_method?: string;
  }
) {
  const ssoEnv = env as any;
  let duplicateCaught = false;

  // 1. Record Addon Purchase (Auth DB)
  try {
    await ssoRecordAddonPurchase(ssoEnv, {
      user_id: payload.user_id,
      feature_key: payload.feature_key,
      billing_period: payload.billing_period,
      price_at_purchase: payload.price_at_purchase,
      razorpay_order_id: payload.razorpay_order_id,
      razorpay_payment_id: payload.razorpay_payment_id,
      razorpay_signature: payload.razorpay_signature,
    });
  } catch (err: any) {
    if (err.message?.includes('duplicate key') || err.message?.includes('23505') || err.status === 409) {
      console.log('[FulfillmentCore] Addon purchase already recorded (duplicate caught).');
      duplicateCaught = true;
    } else {
      console.error('[FulfillmentCore] SSO Worker failed to record addon purchase:', err.message);
      throw err;
    }
  }

  if (duplicateCaught) {
    return { success: true, already_fulfilled: true };
  }

  // 2. Grant App DB entitlement locally
  const supabase = getServiceClient(env);
  const endDate = new Date();
  if (payload.billing_period === 'annual') endDate.setFullYear(endDate.getFullYear() + 1);
  else endDate.setMonth(endDate.getMonth() + 1);

  const { data: entitlement, error: entError } = await supabase.from('user_entitlements').upsert({
    user_id: payload.user_id,
    feature_key: payload.feature_key,
    status: 'active',
    billing_period: payload.billing_period,
    price_at_purchase: payload.price_at_purchase,
    razorpay_subscription_id: payload.razorpay_order_id,
    start_date: new Date().toISOString(),
    end_date: endDate.toISOString()
  }, { onConflict: 'user_id, feature_key' }).select().single();

  if (entError) {
    console.error('[FulfillmentCore] Failed to create user entitlement:', entError);
  }

  // 3. Record transaction in auth DB
  try {
    await ssoRecordTransaction(ssoEnv, {
      user_id: payload.user_id,
      razorpay_payment_id: payload.razorpay_payment_id,
      razorpay_order_id: payload.razorpay_order_id,
      razorpay_signature: payload.razorpay_signature || undefined,
      amount: payload.price_at_purchase,
      currency: payload.currency || 'INR',
      status: 'completed',
      transaction_type: 'addon',
      payment_method: payload.payment_method,
      metadata: { feature_key: payload.feature_key },
    });
  } catch (txError: any) {
    if (txError.message?.includes('duplicate key') || txError.message?.includes('23505') || txError.status === 409) {
      console.log('[FulfillmentCore] Transaction already recorded (duplicate caught).');
    } else {
      console.error('[FulfillmentCore] Transaction recording failed:', txError);
    }
  }

  return { success: true, entitlement, already_fulfilled: false };
}

export async function fulfillBundlePurchase(
  env: FulfillmentEnv,
  payload: {
    user_id: string;
    bundle_id: string;
    billing_period: string;
    price_at_purchase: number;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    currency?: string;
    payment_method?: string;
  }
) {
  const ssoEnv = env as any;
  let duplicateCaught = false;

  // 1. Record Bundle Purchase (Auth DB)
  try {
    await ssoRecordBundlePurchase(ssoEnv, {
      user_id: payload.user_id,
      bundle_id: payload.bundle_id,
      billing_period: payload.billing_period,
      price_at_purchase: payload.price_at_purchase,
      razorpay_order_id: payload.razorpay_order_id,
      razorpay_payment_id: payload.razorpay_payment_id,
      razorpay_signature: payload.razorpay_signature,
    });
  } catch (err: any) {
    if (err.message?.includes('duplicate key') || err.message?.includes('23505') || err.status === 409) {
      console.log('[FulfillmentCore] Bundle purchase already recorded (duplicate caught).');
      duplicateCaught = true;
    } else {
      console.error('[FulfillmentCore] SSO Worker failed to record bundle purchase:', err.message);
      throw err;
    }
  }

  if (duplicateCaught) {
    return { success: true, already_fulfilled: true };
  }

  // 2. Grant App DB entitlements locally
  const supabase = getServiceClient(env);
  const endDate = new Date();
  if (payload.billing_period === 'annual') endDate.setFullYear(endDate.getFullYear() + 1);
  else endDate.setMonth(endDate.getMonth() + 1);

  const { data: features } = await supabase
    .from('bundle_features')
    .select('feature_key')
    .eq('bundle_id', payload.bundle_id);

  let entitlementToReturn = null;
  if (features && features.length > 0) {
    const entitlementsToInsert = features.map(f => ({
      user_id: payload.user_id,
      feature_key: f.feature_key,
      bundle_id: payload.bundle_id,
      status: 'active',
      billing_period: payload.billing_period,
      price_at_purchase: payload.price_at_purchase,
      razorpay_subscription_id: payload.razorpay_order_id,
      start_date: new Date().toISOString(),
      end_date: endDate.toISOString()
    }));

    const { data: inserted, error } = await supabase
      .from('user_entitlements')
      .upsert(entitlementsToInsert, { onConflict: 'user_id, feature_key' })
      .select();
      
    if (error) {
      console.error('[FulfillmentCore] Failed to create user entitlements:', error);
    } else if (inserted && inserted.length > 0) {
      entitlementToReturn = inserted[0];
    }
  }

  // 3. Record transaction
  try {
    await ssoRecordTransaction(ssoEnv, {
      user_id: payload.user_id,
      razorpay_payment_id: payload.razorpay_payment_id,
      razorpay_order_id: payload.razorpay_order_id,
      razorpay_signature: payload.razorpay_signature || undefined,
      amount: payload.price_at_purchase,
      currency: payload.currency || 'INR',
      status: 'completed',
      transaction_type: 'bundle',
      payment_method: payload.payment_method,
      metadata: { bundle_id: payload.bundle_id },
    });
  } catch (txError: any) {
    if (txError.message?.includes('duplicate key') || txError.message?.includes('23505') || txError.status === 409) {
      console.log('[FulfillmentCore] Transaction already recorded (duplicate caught).');
    } else {
      console.error('[FulfillmentCore] Transaction recording failed:', txError);
    }
  }

  return { success: true, entitlement: entitlementToReturn, already_fulfilled: false };
}

export async function fulfillOrgSubscription(
  env: FulfillmentEnv,
  payload: {
    user_id: string;
    org_id: string;
    plan_id: string;
    plan_name: string;
    plan_code: string;
    seat_count: number;
    billing_cycle: string;
    amount: number;
    currency?: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature?: string;
    payment_method?: string;
    user_email?: string;
    user_name?: string;
  }
) {
  const ssoEnv = env as any;
  const supabase = getServiceClient(env);
  let duplicateCaught = false;
  let subscription: any = null;

  try {
    subscription = await ssoCreateSubscription(ssoEnv, {
      user_id: payload.user_id,
      plan_id: payload.plan_id,
      plan_code: payload.plan_code || payload.plan_name,
      plan_type: payload.plan_name,
      plan_amount: payload.amount,
      billing_cycle: payload.billing_cycle,
      features: [],
      full_name: payload.user_name || payload.user_email || '',
      email: payload.user_email || '',
      razorpay_order_id: payload.razorpay_order_id,
      razorpay_payment_id: payload.razorpay_payment_id,
      organization_id: payload.org_id,
      seat_count: payload.seat_count,
      is_organization_subscription: true,
      is_bulk_purchase: true,
      purchased_by: payload.user_id,
    });
  } catch (createError: any) {
    if (createError.message?.includes('duplicate key') || createError.message?.includes('23505') || createError.status === 409) {
      console.log('[FulfillmentCore] Org Subscription already created (duplicate caught).');
      duplicateCaught = true;
    } else {
      throw createError;
    }
  }

  if (duplicateCaught) {
    return { success: true, already_fulfilled: true };
  }

  // Record transaction
  try {
    await ssoRecordTransaction(ssoEnv, {
      subscription_id: subscription?.id as string,
      user_id: payload.user_id,
      razorpay_payment_id: payload.razorpay_payment_id,
      razorpay_order_id: payload.razorpay_order_id,
      razorpay_signature: payload.razorpay_signature,
      amount: payload.amount,
      currency: payload.currency || 'INR',
      status: 'completed',
      transaction_type: 'subscription',
      payment_method: payload.payment_method,
      organization_id: payload.org_id,
      is_bulk_purchase: true,
      seat_count: payload.seat_count,
    });
  } catch (txError: any) {
    if (txError.message?.includes('duplicate key') || txError.message?.includes('23505') || txError.status === 409) {
      console.log('[FulfillmentCore] Transaction already recorded (duplicate caught).');
    }
  }

  // Sync shadow
  try {
    await syncUserShadow(supabase, payload.user_id, payload.user_email || '');
    const syncData = await ssoSyncSubscription(ssoEnv, payload.user_id);
    if (syncData.subscription) {
      await syncSubscriptionCache(supabase, syncData.subscription, syncData.plan);
    }
  } catch (syncError) {
    console.error('[FulfillmentCore] Shadow sync failed:', syncError);
  }

  return { success: true, subscription, already_fulfilled: false };
}

export async function fulfillEventRegistration(
  env: FulfillmentEnv,
  payload: {
    registration_id: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    plan_name?: string;
  }
) {
  const supabase = getServiceClient(env);
  
  const PLAN_TABLE_MAP: Record<string, string> = {
    event: 'event_registrations',
    workshop: 'workshop_registrations',
    webinar: 'webinar_registrations',
    bootcamp: 'bootcamp_registrations',
  };
  const tableName = (payload.plan_name && PLAN_TABLE_MAP[payload.plan_name.toLowerCase()]) || 'event_registrations';

  const { error: updateError } = await supabase
    .from(tableName)
    .update({
      payment_status: 'completed',
      updated_at: new Date().toISOString(),
      razorpay_order_id: payload.razorpay_order_id,
      razorpay_payment_id: payload.razorpay_payment_id,
    })
    .eq('id', payload.registration_id);

  if (updateError) throw updateError;
  return { success: true };
}

export async function fulfillPreRegistration(
  env: FulfillmentEnv,
  payload: {
    registration_id: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
  }
) {
  const supabase = getServiceClient(env);

  const { data: currentRecord, error: fetchError } = await supabase
    .from('pre_registrations')
    .select('payment_history')
    .eq('id', payload.registration_id)
    .single();

  if (fetchError) throw fetchError;

  const paymentHistoryEntry = {
    timestamp: new Date().toISOString(),
    status: 'completed',
    razorpay_order_id: payload.razorpay_order_id,
    razorpay_payment_id: payload.razorpay_payment_id,
    error: null,
  };

  const updatedPaymentHistory = [
    ...(currentRecord.payment_history || []),
    paymentHistoryEntry,
  ];

  const { error: updateError } = await supabase
    .from('pre_registrations')
    .update({
      payment_status: 'completed',
      updated_at: new Date().toISOString(),
      payment_history: updatedPaymentHistory,
      razorpay_order_id: payload.razorpay_order_id,
      razorpay_payment_id: payload.razorpay_payment_id,
    })
    .eq('id', payload.registration_id);

  if (updateError) throw updateError;
  return { success: true };
}

export async function fulfillLearnerSubscription(
  env: FulfillmentEnv,
  payload: {
    user_id: string;
    plan_id: string;
    plan_name: string;
    plan_code: string;
    amount: number;
    currency?: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature?: string;
    payment_method?: string;
    user_email?: string;
    user_name?: string;
    features?: any[];
  }
) {
  const ssoEnv = env as any;
  const supabase = getServiceClient(env);
  let duplicateCaught = false;
  let subscription: any = null;
  let isUpgrade = false;

  const { data: existingCache } = await supabase
    .from('subscription_cache')
    .select('id, status, plan_id, plan_code, plan_amount')
    .eq('user_id', payload.user_id)
    .in('status', ['active', 'pending', 'grace_period'])
    .maybeSingle();

  const now = new Date();
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + 12); // Default to annual for learners

  if (existingCache) {
    isUpgrade = true;
    try {
      subscription = await ssoUpdateSubscriptionField(ssoEnv, existingCache.id, {
        plan_id: payload.plan_id,
        plan_code: payload.plan_code,
        plan_type: payload.plan_name,
        plan_amount: payload.amount,
        billing_cycle: 'annual',
        razorpay_order_id: payload.razorpay_order_id,
        razorpay_payment_id: payload.razorpay_payment_id,
        subscription_start_date: now.toISOString(),
        subscription_end_date: endDate.toISOString(),
        auto_renew: true,
        status: 'active',
      });
    } catch (upgradeError: any) {
      if (upgradeError.message?.includes('duplicate key') || upgradeError.message?.includes('23505') || upgradeError.status === 409) {
        console.log('[FulfillmentCore] Subscription already updated (duplicate caught).');
        duplicateCaught = true;
      } else {
        throw upgradeError;
      }
    }
  } else {
    try {
      subscription = await ssoCreateSubscription(ssoEnv, {
        user_id: payload.user_id,
        plan_id: payload.plan_id,
        plan_code: payload.plan_code,
        plan_type: payload.plan_name,
        plan_amount: payload.amount,
        billing_cycle: 'annual', 
        features: payload.features || [],
        full_name: payload.user_name || payload.user_email || '',
        email: payload.user_email || '',
        razorpay_order_id: payload.razorpay_order_id,
        razorpay_payment_id: payload.razorpay_payment_id,
      });
    } catch (createError: any) {
      if (createError.message?.includes('duplicate key') || createError.message?.includes('23505') || createError.status === 409) {
        console.log('[FulfillmentCore] Subscription already created (duplicate caught).');
        duplicateCaught = true;
      } else {
        throw createError;
      }
    }
  }

  if (duplicateCaught) {
    return { success: true, already_fulfilled: true, isUpgrade };
  }

  try {
    await ssoRecordTransaction(ssoEnv, {
      subscription_id: subscription?.id as string,
      user_id: payload.user_id,
      razorpay_payment_id: payload.razorpay_payment_id,
      razorpay_order_id: payload.razorpay_order_id,
      razorpay_signature: payload.razorpay_signature,
      amount: payload.amount,
      currency: payload.currency || 'INR',
      status: 'completed',
      transaction_type: isUpgrade ? 'upgrade' : 'subscription',
      payment_method: payload.payment_method,
    });
  } catch (txError: any) {
    if (txError.message?.includes('duplicate key') || txError.message?.includes('23505') || txError.status === 409) {
      console.log('[FulfillmentCore] Transaction already recorded (duplicate caught).');
    }
  }

  try {
    await syncUserShadow(supabase, payload.user_id, payload.user_email || '');
    const syncData = await ssoSyncSubscription(ssoEnv, payload.user_id);
    if (syncData.subscription) {
      await syncSubscriptionCache(supabase, syncData.subscription, syncData.plan);
    }
  } catch (syncError) {
    console.error('[FulfillmentCore] Shadow sync failed:', syncError);
  }

  return { success: true, subscription, isUpgrade, already_fulfilled: false };
}
