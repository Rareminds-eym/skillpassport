/**
 * Subscription management handlers
 */

import type { Env, SubscriptionAccessResponse } from '../types';
import { jsonResponse } from '../../../../src/functions-lib';
import { authenticateUser } from '../utils/auth';
import { createSupabaseAdmin } from '../utils/supabase';
import { getRazorpayCredentials } from '../utils/razorpay';
import { GRACE_PERIOD_DAYS } from '../config';

/**
 * GET /get-subscription - Get user's active subscription
 */
export async function handleGetSubscription(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, supabase } = auth;

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['active', 'paused'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return jsonResponse({ error: 'Failed to fetch subscription' }, 500);
  }

  if (!subscription) {
    const { data: recentSub } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return jsonResponse({
      success: true,
      has_active_subscription: false,
      subscription: recentSub || null,
    });
  }

  return jsonResponse({
    success: true,
    has_active_subscription: true,
    subscription,
  });
}

/**
 * GET /check-subscription-access - Check subscription access with grace period
 */
export async function handleCheckSubscriptionAccess(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) {
    return jsonResponse({
      success: false,
      hasAccess: false,
      accessReason: 'no_subscription',
      subscription: null,
      showWarning: false,
      error: 'Unauthorized'
    }, 401);
  }

  const { user, supabase } = auth;
  const now = new Date();

  // Check for organization license first
  const { data: licenseAssignment } = await supabase
    .from('license_assignments')
    .select(`
      id,
      status,
      expires_at,
      organization_subscriptions!inner (
        id,
        status,
        end_date,
        subscription_plans (name, plan_code)
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (licenseAssignment) {
    const orgSub = licenseAssignment.organization_subscriptions as any;
    if (orgSub && orgSub.status === 'active' && new Date(orgSub.end_date) > now) {
      return jsonResponse({
        success: true,
        hasAccess: true,
        accessReason: 'active',
        subscription: {
          ...orgSub,
          is_organization_license: true,
        },
        showWarning: false,
      });
    }
  }

  // Check individual subscription
  const gracePeriodDate = new Date(now);
  gracePeriodDate.setDate(gracePeriodDate.getDate() - GRACE_PERIOD_DAYS);

  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['active', 'paused', 'cancelled'])
    .gte('subscription_end_date', gracePeriodDate.toISOString())
    .order('status', { ascending: true })
    .order('subscription_end_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return jsonResponse({
      success: false,
      hasAccess: false,
      accessReason: 'no_subscription',
      subscription: null,
      showWarning: false,
      error: 'Failed to check subscription'
    }, 500);
  }

  if (!subscription) {
    return jsonResponse({
      success: true,
      hasAccess: false,
      accessReason: 'no_subscription',
      subscription: null,
      showWarning: false,
    });
  }

  const endDate = new Date(subscription.subscription_end_date);
  const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Paused subscription
  if (subscription.status === 'paused') {
    return jsonResponse({
      success: true,
      hasAccess: true,
      accessReason: 'paused',
      subscription,
      showWarning: true,
      warningType: 'paused',
      warningMessage: `Your subscription is paused`,
      daysUntilExpiry,
      expiresAt: subscription.subscription_end_date,
    });
  }

  // Cancelled but not expired
  if (subscription.status === 'cancelled' && endDate > now) {
    return jsonResponse({
      success: true,
      hasAccess: true,
      accessReason: 'cancelled',
      subscription,
      showWarning: true,
      warningType: 'expiring_soon',
      warningMessage: `Your subscription was cancelled. Access ends in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}.`,
      daysUntilExpiry,
      expiresAt: subscription.subscription_end_date,
    });
  }

  // Active and not expired
  if (subscription.status === 'active' && endDate > now) {
    const showWarning = daysUntilExpiry <= 7;
    return jsonResponse({
      success: true,
      hasAccess: true,
      accessReason: 'active',
      subscription,
      showWarning,
      warningType: showWarning ? 'expiring_soon' : undefined,
      warningMessage: showWarning ? `Your subscription expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}` : undefined,
      daysUntilExpiry,
      expiresAt: subscription.subscription_end_date,
    });
  }

  // Grace period
  if (daysUntilExpiry >= -GRACE_PERIOD_DAYS) {
    const daysLeftInGrace = GRACE_PERIOD_DAYS + daysUntilExpiry;
    return jsonResponse({
      success: true,
      hasAccess: true,
      accessReason: 'grace_period',
      subscription,
      showWarning: true,
      warningType: 'grace_period',
      warningMessage: `Your subscription expired. You have ${daysLeftInGrace} day${daysLeftInGrace !== 1 ? 's' : ''} left to renew.`,
      daysUntilExpiry,
      expiresAt: subscription.subscription_end_date,
    });
  }

  // Expired
  return jsonResponse({
    success: true,
    hasAccess: false,
    accessReason: 'expired',
    subscription,
    showWarning: false,
    daysUntilExpiry,
    expiresAt: subscription.subscription_end_date,
  });
}

/**
 * POST /cancel-subscription - Cancel Razorpay subscription
 */
export async function handleCancelSubscription(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, supabase } = auth;
  const { keyId, keySecret } = getRazorpayCredentials(env);

  const body = await request.json() as { subscription_id?: string; cancel_at_cycle_end?: boolean };
  const { subscription_id, cancel_at_cycle_end = false } = body;

  if (!subscription_id) {
    return jsonResponse({ error: 'Missing subscription_id' }, 400);
  }

  const razorpayAuth = btoa(`${keyId}:${keySecret}`);
  const razorpayResponse = await fetch(
    `https://api.razorpay.com/v1/subscriptions/${subscription_id}/cancel`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${razorpayAuth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cancel_at_cycle_end }),
    }
  );

  if (!razorpayResponse.ok && razorpayResponse.status !== 404) {
    return jsonResponse({ error: 'Failed to cancel subscription' }, 500);
  }

  await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      auto_renew: false,
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', subscription_id)
    .eq('user_id', user.id);

  return jsonResponse({
    success: true,
    message: 'Subscription cancelled successfully',
  });
}

/**
 * POST /deactivate-subscription - Deactivate subscription in DB
 */
export async function handleDeactivateSubscription(request: Request, env: Env): Promise<Response> {
  const auth = await authenticateUser(request, env);
  if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

  const { user, supabase } = auth;

  const body = await request.json() as {
    subscription_id?: string;
    cancellation_reason?: string;
  };
  const { subscription_id, cancellation_reason = 'other' } = body;

  if (!subscription_id) {
    return jsonResponse({ error: 'subscription_id is required' }, 400);
  }

  const { data: subscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscription_id)
    .maybeSingle();

  if (fetchError || !subscription) {
    return jsonResponse({ error: 'Subscription not found' }, 404);
  }

  if (subscription.user_id !== user.id) {
    return jsonResponse({ error: 'Permission denied' }, 403);
  }

  if (subscription.status === 'cancelled') {
    return jsonResponse({
      success: true,
      message: 'Subscription is already cancelled',
      subscription,
      already_cancelled: true,
    });
  }

  const now = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'cancelled',
      auto_renew: false,
      cancelled_at: now,
      cancellation_reason,
      updated_at: now,
    })
    .eq('id', subscription_id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (updateError) {
    return jsonResponse({ error: 'Failed to cancel subscription' }, 500);
  }

  return jsonResponse({
    success: true,
    message: 'Subscription cancelled successfully',
    subscription: updated,
  });
}

/**
 * POST /pause-subscription - Pause subscription (1-3 months)
 */
export async function handlePauseSubscription(request: Request, env: Env, user: any, supabase: any): Promise<Response> {
  const body = await request.json() as {
    subscription_id?: string;
    pause_months?: number;
  };
  const { subscription_id, pause_months = 1 } = body;

  if (!subscription_id) {
    return jsonResponse({ error: 'subscription_id is required' }, 400);
  }

  if (pause_months < 1 || pause_months > 3) {
    return jsonResponse({ error: 'Pause duration must be between 1 and 3 months' }, 400);
  }

  const { data: subscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscription_id)
    .maybeSingle();

  if (fetchError || !subscription) {
    return jsonResponse({ error: 'Subscription not found' }, 404);
  }

  if (subscription.user_id !== user.id) {
    return jsonResponse({ error: 'Permission denied' }, 403);
  }

  if (subscription.status === 'paused') {
    return jsonResponse({
      success: true,
      message: 'Subscription is already paused',
      subscription,
      already_paused: true,
    });
  }

  if (subscription.status !== 'active') {
    return jsonResponse({ error: `Cannot pause subscription with status '${subscription.status}'` }, 400);
  }

  const now = new Date();
  const pausedUntil = new Date(now);
  pausedUntil.setMonth(pausedUntil.getMonth() + pause_months);

  const currentEndDate = new Date(subscription.subscription_end_date);
  currentEndDate.setMonth(currentEndDate.getMonth() + pause_months);

  const { data: updated, error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'paused',
      paused_at: now.toISOString(),
      paused_until: pausedUntil.toISOString(),
      subscription_end_date: currentEndDate.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', subscription_id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (updateError) {
    return jsonResponse({ error: 'Failed to pause subscription' }, 500);
  }

  return jsonResponse({
    success: true,
    message: `Subscription paused for ${pause_months} month(s)`,
    subscription: updated,
    paused_until: pausedUntil.toISOString(),
  });
}

/**
 * POST /resume-subscription - Resume paused subscription
 */
export async function handleResumeSubscription(request: Request, env: Env, user: any, supabase: any): Promise<Response> {
  const body = await request.json() as {
    subscription_id?: string;
  };
  const { subscription_id } = body;

  if (!subscription_id) {
    return jsonResponse({ error: 'subscription_id is required' }, 400);
  }

  const { data: subscription, error: fetchError } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscription_id)
    .maybeSingle();

  if (fetchError || !subscription) {
    return jsonResponse({ error: 'Subscription not found' }, 404);
  }

  if (subscription.user_id !== user.id) {
    return jsonResponse({ error: 'Permission denied' }, 403);
  }

  if (subscription.status === 'active') {
    return jsonResponse({
      success: true,
      message: 'Subscription is already active',
      subscription,
      already_active: true,
    });
  }

  if (subscription.status !== 'paused') {
    return jsonResponse({ error: `Cannot resume subscription with status '${subscription.status}'` }, 400);
  }

  const now = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      paused_at: null,
      paused_until: null,
      updated_at: now,
    })
    .eq('id', subscription_id)
    .eq('user_id', user.id)
    .select('*')
    .single();

  if (updateError) {
    return jsonResponse({ error: 'Failed to resume subscription' }, 500);
  }

  return jsonResponse({
    success: true,
    message: 'Subscription resumed successfully',
    subscription: updated,
  });
}
