/**
 * Payments API - Cloudflare Pages Function
 * Business logic layer on top of razorpay-api worker.
 *
 * Endpoints:
 * GET  /api/payments/plans              - All subscription plans
 * GET  /api/payments/plan               - Single plan by planCode
 * GET  /api/payments/features           - Features comparison
 * GET  /api/payments/addon-catalog      - Add-on & bundle catalog
 * GET  /api/payments/user-entitlements  - User's active entitlements
 * GET  /api/payments/check-addon-access - Check feature access
 * POST /api/payments/create-addon-order
 * POST /api/payments/verify-addon-payment
 * POST /api/payments/cancel-addon
 * POST /api/payments/create-bundle-order
 * POST /api/payments/verify-bundle-payment
 * POST /api/payments/expire-entitlements          (cron / internal)
 * POST /api/payments/send-renewal-reminders       (cron / internal)
 * POST /api/payments/process-auto-renewals        (cron / internal)
 * POST /api/payments/process-entitlement-lifecycle (cron / internal)
 */

import type { PagesFunction } from '../../../src/functions-lib/types';
import { corsHeaders, jsonResponse, createSupabaseAdminClient, authenticateRequest } from '../../../src/functions-lib';
import { handleGetPlans, handleGetPlan, handleGetFeatures } from './handlers/plans';
import {
  handleGetAddonCatalog,
  handleGetUserEntitlements,
  handleCheckAddonAccess,
  handleCreateAddonOrder,
  handleVerifyAddonPayment,
  handleCancelAddon,
  handleCreateBundleOrder,
  handleVerifyBundlePayment,
} from './handlers/addons';
import {
  handleExpireEntitlements,
  handleSendRenewalReminders,
  handleProcessAutoRenewals,
  handleProcessEntitlementLifecycle,
} from './handlers/entitlements';
import {
  handleCreateOrder,
  handleVerifyPayment,
  handleGetSubscription,
  handleCheckSubscriptionAccess,
  handleCancelSubscription,
  handleDeactivateSubscription,
  handlePauseSubscription,
  handleResumeSubscription,
} from './handlers/subscriptions';

// Routes that require user auth (Bearer token)
const AUTH_REQUIRED = new Set([
  '/user-entitlements',
  '/check-addon-access',
  '/create-addon-order',
  '/verify-addon-payment',
  '/cancel-addon',
  '/create-bundle-order',
  '/verify-bundle-payment',
  '/create-order',
  '/verify-payment',
  '/get-subscription',
  '/check-subscription-access',
  '/cancel-subscription',
  '/deactivate-subscription',
  '/pause-subscription',
  '/resume-subscription',
]);

// Internal/cron routes — require CRON_SECRET header
const CRON_ROUTES = new Set([
  '/expire-entitlements',
  '/send-renewal-reminders',
  '/process-auto-renewals',
  '/process-entitlement-lifecycle',
]);

export const onRequest: PagesFunction = async (context) => {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/payments/, '') || '/';

  try {
    // ── Public GET routes ──────────────────────────────────────────────────
    if (request.method === 'GET') {
      const supabase = createSupabaseAdminClient(env);

      if (path === '/plans') return await handleGetPlans(url, supabase);
      if (path === '/plan') return await handleGetPlan(url, supabase);
      if (path === '/features') return await handleGetFeatures(supabase);
      if (path === '/addon-catalog') return await handleGetAddonCatalog(url, supabase);

      // Auth-required GET routes
      if (AUTH_REQUIRED.has(path)) {
        const auth = await authenticateRequest(request, env);
        if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);
        const adminSupabase = createSupabaseAdminClient(env);

        if (path === '/user-entitlements') return await handleGetUserEntitlements(auth.user.id, adminSupabase);
        if (path === '/check-addon-access') return await handleCheckAddonAccess(url, auth.user.id, adminSupabase);
        if (path === '/get-subscription') return await handleGetSubscription(auth.user.id, env);
        if (path === '/check-subscription-access') return await handleCheckSubscriptionAccess(auth.user.id, env);
      }

      return jsonResponse({ error: 'Not found' }, 404);
    }

    // ── POST routes ────────────────────────────────────────────────────────
    if (request.method === 'POST') {
      // Cron / internal routes
      if (CRON_ROUTES.has(path)) {
        const cronSecret = request.headers.get('X-Cron-Secret');
        if (env.CRON_SECRET && cronSecret !== env.CRON_SECRET) {
          return jsonResponse({ error: 'Unauthorized' }, 401);
        }
        const supabase = createSupabaseAdminClient(env);
        if (path === '/expire-entitlements') return await handleExpireEntitlements(supabase, env);
        if (path === '/send-renewal-reminders') return await handleSendRenewalReminders(supabase, env);
        if (path === '/process-auto-renewals') return await handleProcessAutoRenewals(supabase, env);
        if (path === '/process-entitlement-lifecycle') return await handleProcessEntitlementLifecycle(supabase, env);
      }

      // Auth-required POST routes
      if (AUTH_REQUIRED.has(path)) {
        const auth = await authenticateRequest(request, env);
        if (!auth) return jsonResponse({ error: 'Unauthorized' }, 401);

        const body = await request.json().catch(() => ({}));
        const supabase = createSupabaseAdminClient(env);

        if (path === '/create-addon-order') return await handleCreateAddonOrder(body, auth.user.id, supabase, env);
        if (path === '/verify-addon-payment') return await handleVerifyAddonPayment(body, supabase, env);
        if (path === '/cancel-addon') return await handleCancelAddon(body, auth.user.id, supabase);
        if (path === '/create-bundle-order') return await handleCreateBundleOrder(body, auth.user.id, supabase, env);
        if (path === '/verify-bundle-payment') return await handleVerifyBundlePayment(body, auth.user.id, supabase, env);

        // Subscription routes
        if (path === '/create-order') return await handleCreateOrder(body, auth.user.id, env);
        if (path === '/verify-payment') return await handleVerifyPayment(body, auth.user.id, env);
        if (path === '/cancel-subscription') return await handleCancelSubscription(body, auth.user.id, env);
        if (path === '/deactivate-subscription') return await handleDeactivateSubscription(body, auth.user.id, env);
        if (path === '/pause-subscription') return await handlePauseSubscription(body, auth.user.id, env);
        if (path === '/resume-subscription') return await handleResumeSubscription(body, auth.user.id, env);
      }

      return jsonResponse({ error: 'Not found' }, 404);
    }

    return jsonResponse({ error: 'Method not allowed' }, 405);

  } catch (error: any) {
    console.error('[payments-api]', error);
    return jsonResponse({ error: error.message || 'Internal server error' }, 500);
  }
};
