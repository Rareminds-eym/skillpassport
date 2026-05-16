/**
 * Payments API Route Dispatcher
 *
 * Routes payment requests to dedicated handlers via Cloudflare Service Binding RPC.
 * All routes require SSO authentication except health check.
 *
 * Routes:
 * - POST /api/payments/create-order
 * - POST /api/payments/verify-payment
 * - GET  /api/payments/payment/:id
 * - POST /api/payments/subscription/:id/cancel
 * - GET  /api/payments/get-subscription
 * - GET  /api/payments/check-subscription-access
 * - GET  /api/payments/subscription-plans
 * - GET  /api/payments/subscription-plan
 * - GET  /api/payments/subscription-features
 * - POST /api/payments/deactivate-subscription
 * - POST /api/payments/pause-subscription
 * - POST /api/payments/resume-subscription
 * - POST /api/payments/update-event-payment-status
 * - POST /api/payments/create-addon-order
 * - POST /api/payments/verify-addon-payment
 * - POST /api/payments/create-bundle-order
 * - POST /api/payments/verify-bundle-payment
 * - POST /api/payments/create-event-order
 * - POST /api/payments/create-org-order
 * - POST /api/payments/verify-org-payment
 * - POST /api/payments/org-subscriptions/purchase
 * - POST /api/payments/create-freemium-subscription
 * - GET  /api/payments/health
 */

import { withAuth } from '../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';

// Dedicated handlers — all routes use RPC or Supabase-direct (no proxy)
import { handleCreateOrder } from './handlers/create-order';
import { handleVerifyPayment } from './handlers/verify-payment';
import { handleGetPayment } from './handlers/get-payment';
import { handleCancelSubscription } from './handlers/cancel-subscription';
import { handleGetSubscription } from './handlers/get-subscription';
import { handleGetActiveSubscription } from './handlers/get-active-subscription';
import { handleGetUserSubscriptions } from './handlers/get-user-subscriptions';
import { handleGetSubscriptionPayments } from './handlers/get-subscription-payments';
import { handleGetUserPayments } from './handlers/get-user-payments';
import { handleCheckSubscriptionAccess } from './handlers/check-subscription-access';
import { handleGetUsageStatistics } from './handlers/usage-statistics';
import { handleOrganizationQueries } from './handlers/organization-queries';
import { handleLicensePoolQueries } from './handlers/license-pool-queries';
import { handleMigrationOperations } from './handlers/migration-operations';
import { handleAddonCatalog } from './handlers/addon-catalog';
import { handleAddonAnalytics } from './handlers/addon-analytics';
import { handleAddonOrders } from './handlers/addon-orders';
import { handleGetUserEntitlements } from './handlers/get-user-entitlements';
import { handleHasFeatureAccess } from './handlers/has-feature-access';
import { handleGetAvailableAddons } from './handlers/get-available-addons';
import { handleGetAddonByFeatureKey } from './handlers/get-addon-by-feature-key';
import { handleCancelAddon } from './handlers/cancel-addon';
import { handleToggleAddonAutoRenew } from './handlers/toggle-addon-autorenew';
import { handleSubscriptionPlans } from './handlers/subscription-plans';
import { handleSubscriptionPlan } from './handlers/subscription-plan';
import { handleSubscriptionFeatures } from './handlers/subscription-features';
import { handleDeactivateSubscription } from './handlers/deactivate-subscription';
import { handlePauseSubscription } from './handlers/pause-subscription';
import { handleResumeSubscription } from './handlers/resume-subscription';
import { handleUpdateEventPaymentStatus } from './handlers/update-event-payment-status';
import { handleCreateAddonOrder } from './handlers/create-addon-order';
import { handleVerifyAddonPayment } from './handlers/verify-addon-payment';
import { handleCreateBundleOrder } from './handlers/create-bundle-order';
import { handleVerifyBundlePayment } from './handlers/verify-bundle-payment';
import { handleCreateEventOrder } from './handlers/create-event-order';
import { handleCreateOrgOrder } from './handlers/create-org-order';
import { handleVerifyOrgPayment } from './handlers/verify-org-payment';
import { handleOrgSubscriptionsPurchase } from './handlers/org-subscriptions-purchase';
import { handleCreateFreemiumSubscription } from './handlers/create-freemium-subscription';

function methodNotAllowed(): Response {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}

function notFound(): Response {
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Route dispatcher for payments API.
 *
 * Health check is handled WITHOUT auth — monitoring systems don't have SSO tokens.
 * All other endpoints require SSO authentication via withAuth.
 */
export async function onRequest(context: { request: Request; env: Record<string, unknown>; data?: any }) {
  const url = new URL(context.request.url);
  const path = url.pathname.replace('/api/payments', '').replace(/\/$/, '');

  // Health check — no auth required (monitoring systems don't have SSO tokens)
  // The service binding itself proves connectivity to the payment-worker
  if (path === '/health') {
    return new Response(
      JSON.stringify({
        status: 'ok',
        service: 'payments-gateway',
        timestamp: new Date().toISOString(),
        binding: 'PAYMENT_WORKER',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // All other endpoints require SSO authentication
  return handleAuthenticatedRequest(context as AuthenticatedContext);
}

const handleAuthenticatedRequest = withAuth(async (context: AuthenticatedContext) => {
  const url = new URL(context.request.url);
  const path = url.pathname.replace('/api/payments', '').replace(/\/$/, '');
  const method = context.request.method;

  // Generate request ID for correlation
  const requestId = crypto.randomUUID();
  console.log(`[Payments:${requestId}] ${method} ${path} user=${context.data.user?.sub}`);

  // --- POST routes ---

  if (path === '/create-order') {
    if (method !== 'POST') return methodNotAllowed();
    return handleCreateOrder(context);
  }

  if (path === '/verify-payment') {
    if (method !== 'POST') return methodNotAllowed();
    return handleVerifyPayment(context);
  }

  if (path === '/deactivate-subscription') {
    if (method !== 'POST') return methodNotAllowed();
    return handleDeactivateSubscription(context);
  }

  if (path === '/pause-subscription') {
    if (method !== 'POST') return methodNotAllowed();
    return handlePauseSubscription(context);
  }

  if (path === '/resume-subscription') {
    if (method !== 'POST') return methodNotAllowed();
    return handleResumeSubscription(context);
  }

  if (path === '/update-event-payment-status') {
    if (method !== 'POST') return methodNotAllowed();
    return handleUpdateEventPaymentStatus(context);
  }

  if (path === '/create-addon-order') {
    if (method !== 'POST') return methodNotAllowed();
    return handleCreateAddonOrder(context);
  }

  if (path === '/cancel-addon') {
    if (method !== 'POST') return methodNotAllowed();
    return handleCancelAddon(context);
  }

  if (path === '/toggle-addon-autorenew') {
    if (method !== 'POST') return methodNotAllowed();
    return handleToggleAddonAutoRenew(context);
  }

  if (path === '/verify-addon-payment') {
    if (method !== 'POST') return methodNotAllowed();
    return handleVerifyAddonPayment(context);
  }

  if (path === '/create-bundle-order') {
    if (method !== 'POST') return methodNotAllowed();
    return handleCreateBundleOrder(context);
  }

  if (path === '/verify-bundle-payment') {
    if (method !== 'POST') return methodNotAllowed();
    return handleVerifyBundlePayment(context);
  }

  if (path === '/create-event-order') {
    if (method !== 'POST') return methodNotAllowed();
    return handleCreateEventOrder(context);
  }

  if (path === '/migration-operations') {
    if (method !== 'POST') return methodNotAllowed();
    return handleMigrationOperations(context);
  }

  if (path === '/addon-analytics') {
    if (method !== 'POST') return methodNotAllowed();
    return handleAddonAnalytics(context);
  }

  if (path === '/create-org-order') {
    if (method !== 'POST') return methodNotAllowed();
    return handleCreateOrgOrder(context);
  }

  if (path === '/verify-org-payment') {
    if (method !== 'POST') return methodNotAllowed();
    return handleVerifyOrgPayment(context);
  }

  if (path === '/org-subscriptions/purchase') {
    if (method !== 'POST') return methodNotAllowed();
    return handleOrgSubscriptionsPurchase(context);
  }

  if (path === '/create-freemium-subscription') {
    if (method !== 'POST') return methodNotAllowed();
    return handleCreateFreemiumSubscription(context);
  }

  // --- GET routes ---

  if (path === '/get-subscription') {
    if (method !== 'GET') return methodNotAllowed();
    return handleGetSubscription(context);
  }

  if (path === '/get-active-subscription') {
    if (method !== 'GET') return methodNotAllowed();
    return handleGetActiveSubscription(context);
  }

  if (path === '/check-subscription-access') {
    if (method !== 'GET') return methodNotAllowed();
    return handleCheckSubscriptionAccess(context);
  }

  if (path === '/get-user-subscriptions') {
    if (method !== 'GET') return methodNotAllowed();
    return handleGetUserSubscriptions(context);
  }

  if (path === '/get-subscription-payments') {
    if (method !== 'GET') return methodNotAllowed();
    return handleGetSubscriptionPayments(context);
  }

  if (path === '/get-user-payments') {
    if (method !== 'GET') return methodNotAllowed();
    return handleGetUserPayments(context);
  }

  if (path === '/usage-statistics') {
    if (method !== 'GET') return methodNotAllowed();
    return handleGetUsageStatistics(context);
  }

  if (path === '/organization-queries') {
    if (method !== 'GET') return methodNotAllowed();
    return handleOrganizationQueries(context);
  }

  if (path === '/license-pool-queries') {
    if (method !== 'GET') return methodNotAllowed();
    return handleLicensePoolQueries(context);
  }

  if (path === '/addon-catalog') {
    if (method !== 'GET') return methodNotAllowed();
    return handleAddonCatalog(context);
  }

  if (path === '/addon-orders') {
    if (method !== 'GET') return methodNotAllowed();
    return handleAddonOrders(context);
  }

  if (path === '/get-user-entitlements') {
    if (method !== 'GET') return methodNotAllowed();
    return handleGetUserEntitlements(context);
  }

  if (path === '/has-feature-access') {
    if (method !== 'GET') return methodNotAllowed();
    return handleHasFeatureAccess(context);
  }

  if (path === '/get-available-addons') {
    if (method !== 'GET') return methodNotAllowed();
    return handleGetAvailableAddons(context);
  }

  if (path === '/get-addon-by-feature-key') {
    if (method !== 'GET') return methodNotAllowed();
    return handleGetAddonByFeatureKey(context);
  }

  if (path === '/subscription-plans') {
    if (method !== 'GET') return methodNotAllowed();
    return handleSubscriptionPlans(context);
  }

  if (path === '/subscription-plan') {
    if (method !== 'GET') return methodNotAllowed();
    return handleSubscriptionPlan(context);
  }

  if (path === '/subscription-features') {
    if (method !== 'GET') return methodNotAllowed();
    return handleSubscriptionFeatures(context);
  }

  // --- Dynamic path routes ---

  // GET /api/payments/payment/:id
  const paymentMatch = path.match(/^\/payment\/([^/]+)$/);
  if (paymentMatch) {
    if (method !== 'GET') return methodNotAllowed();
    return handleGetPayment(context, paymentMatch[1]);
  }

  // POST /api/payments/subscription/:id/cancel
  const cancelMatch = path.match(/^\/subscription\/([^/]+)\/cancel$/);
  if (cancelMatch) {
    if (method !== 'POST') return methodNotAllowed();
    return handleCancelSubscription(context, cancelMatch[1]);
  }

  return notFound();
});
