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
 * - GET  /api/payments/health
 */

import { withAuth, getContextUser } from '../../lib/auth';
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
import { handleCreateRegistrationOrder } from './handlers/create-registration-order';
import { handleUpdateRegistrationPaymentStatus } from './handlers/update-registration-payment-status';
import { handleCreateOrgOrder } from './handlers/create-org-order';
import { handleVerifyOrgPayment } from './handlers/verify-org-payment';
import { handleOrgSubscriptionsPurchase } from './handlers/org-subscriptions-purchase';


import { apiSuccess, apiError } from '../../lib/response';

function methodNotAllowed(request: Request): Response {
  return apiError(405, 'ERROR', 'Method not allowed', request);
}

function notFound(request: Request): Response {
  return apiError(404, 'NOT_FOUND', 'Not found', request);
}

/**
 * Route dispatcher for payments API.
 *
 * Health check and create-registration-order are handled WITHOUT auth.
 * All other endpoints require SSO authentication via withAuth.
 */
export async function onRequest(context: { request: Request; env: Record<string, unknown>; data?: any }) {
  const url = new URL(context.request.url);
  const path = url.pathname.replace('/api/payments', '').replace(/\/$/, '');
  const method = context.request.method;

  // Health check — no auth required (monitoring systems don't have SSO tokens)
  // The service binding itself proves connectivity to the payment-worker
  if (path === '/health') {
    return apiSuccess({
      status: 'ok',
      service: 'payments-gateway',
      timestamp: new Date().toISOString(),
      binding: 'PAYMENT_WORKER',
    }, context.request);
  }

  // Create registration order — no auth required (for /register/learner and /register/corporate)
  // Automatically generates registrationId and stores in pre_registrations table
  if (path === '/create-registration-order') {
    if (method !== 'POST') return methodNotAllowed(context.request);
    return handleCreateRegistrationOrder(context as any);
  }

  // Update registration payment status — no auth required (called after Razorpay payment)
  if (path === '/update-registration-payment-status') {
    if (method !== 'POST') return methodNotAllowed(context.request);
    return handleUpdateRegistrationPaymentStatus(context as any);
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
  const user = getContextUser(context);
  console.log(`[Payments:${requestId}] ${method} ${path} user=${user.id}`);

  // --- POST routes ---

  if (path === '/create-order') {
    if (method !== 'POST') return methodNotAllowed(context.request);
    return handleCreateOrder(context);
  }

  if (path === '/verify-payment') {
    if (method !== 'POST') return methodNotAllowed(context.request);
    return handleVerifyPayment(context);
  }

  if (path === '/deactivate-subscription') {
    if (method !== 'POST') return methodNotAllowed(context.request);
    return handleDeactivateSubscription(context);
  }

  if (path === '/pause-subscription') {
    if (method !== 'POST') return methodNotAllowed(context.request);
    return handlePauseSubscription(context);
  }

  if (path === '/resume-subscription') {
    if (method !== 'POST') return methodNotAllowed(context.request);
    return handleResumeSubscription(context);
  }

  if (path === '/update-event-payment-status') {
    if (method !== 'POST') return methodNotAllowed(context.request);
    return handleUpdateEventPaymentStatus(context);
  }

  if (path === '/create-addon-order') {
    if (method !== 'POST') return methodNotAllowed(context.request);
    return handleCreateAddonOrder(context);
  }

  if (path === '/cancel-addon') {
    if (method !== 'POST') return methodNotAllowed(context.request);
    return handleCancelAddon(context);
  }

  if (path === '/toggle-addon-autorenew') {
    if (method !== 'POST') return methodNotAllowed(context.request);
    return handleToggleAddonAutoRenew(context);
  }

  if (path === '/verify-addon-payment') {
    if (method !== 'POST') return methodNotAllowed(context.request);
    return handleVerifyAddonPayment(context);
  }

  if (path === '/create-bundle-order') {
    if (method !== 'POST') return methodNotAllowed(context.request);
    return handleCreateBundleOrder(context);
  }

  if (path === '/verify-bundle-payment') {
    if (method !== 'POST') return methodNotAllowed(context.request);
    return handleVerifyBundlePayment(context);
  }

  if (path === '/create-event-order') {
    if (method !== 'POST') return methodNotAllowed(context.request);
    return handleCreateEventOrder(context);
  }

  if (path === '/migration-operations') {
    if (method !== 'POST') return methodNotAllowed(context.request);
    return handleMigrationOperations(context);
  }

  if (path === '/addon-analytics') {
    if (method !== 'POST') return methodNotAllowed(context.request);
    return handleAddonAnalytics(context);
  }

  if (path === '/create-org-order') {
    if (method !== 'POST') return methodNotAllowed(context.request);
    return handleCreateOrgOrder(context);
  }

  if (path === '/verify-org-payment') {
    if (method !== 'POST') return methodNotAllowed(context.request);
    return handleVerifyOrgPayment(context);
  }

  if (path === '/org-subscriptions/purchase') {
    if (method !== 'POST') return methodNotAllowed(context.request);
    return handleOrgSubscriptionsPurchase(context);
  }



  // --- GET routes ---

  if (path === '/get-subscription') {
    if (method !== 'GET') return methodNotAllowed(context.request);
    return handleGetSubscription(context);
  }

  if (path === '/get-active-subscription') {
    if (method !== 'GET') return methodNotAllowed(context.request);
    return handleGetActiveSubscription(context);
  }

  if (path === '/check-subscription-access') {
    if (method !== 'GET') return methodNotAllowed(context.request);
    return handleCheckSubscriptionAccess(context);
  }

  if (path === '/get-user-subscriptions') {
    if (method !== 'GET') return methodNotAllowed(context.request);
    return handleGetUserSubscriptions(context);
  }

  if (path === '/get-subscription-payments') {
    if (method !== 'GET') return methodNotAllowed(context.request);
    return handleGetSubscriptionPayments(context);
  }

  if (path === '/get-user-payments') {
    if (method !== 'GET') return methodNotAllowed(context.request);
    return handleGetUserPayments(context);
  }

  if (path === '/usage-statistics') {
    if (method !== 'GET') return methodNotAllowed(context.request);
    return handleGetUsageStatistics(context);
  }

  if (path === '/organization-queries') {
    if (method !== 'GET') return methodNotAllowed(context.request);
    return handleOrganizationQueries(context);
  }

  if (path === '/license-pool-queries') {
    if (method !== 'GET') return methodNotAllowed(context.request);
    return handleLicensePoolQueries(context);
  }

  if (path === '/addon-catalog') {
    if (method !== 'GET') return methodNotAllowed(context.request);
    return handleAddonCatalog(context);
  }

  if (path === '/get-user-entitlements') {
    if (method !== 'GET') return methodNotAllowed(context.request);
    return handleGetUserEntitlements(context);
  }

  if (path === '/has-feature-access') {
    if (method !== 'GET') return methodNotAllowed(context.request);
    return handleHasFeatureAccess(context);
  }

  if (path === '/get-available-addons') {
    if (method !== 'GET') return methodNotAllowed(context.request);
    return handleGetAvailableAddons(context);
  }

  if (path === '/get-addon-by-feature-key') {
    if (method !== 'GET') return methodNotAllowed(context.request);
    return handleGetAddonByFeatureKey(context);
  }

  if (path === '/subscription-plans') {
    if (method !== 'GET') return methodNotAllowed(context.request);
    return handleSubscriptionPlans(context);
  }

  if (path === '/subscription-plan') {
    if (method !== 'GET') return methodNotAllowed(context.request);
    return handleSubscriptionPlan(context);
  }

  if (path === '/subscription-features') {
    if (method !== 'GET') return methodNotAllowed(context.request);
    return handleSubscriptionFeatures(context);
  }

  // --- Dynamic path routes ---

  // GET /api/payments/payment/:id
  const paymentMatch = path.match(/^\/payment\/([^/]+)$/);
  if (paymentMatch) {
    if (method !== 'GET') return methodNotAllowed(context.request);
    return handleGetPayment(context, paymentMatch[1]);
  }

  // POST /api/payments/subscription/:id/cancel
  const cancelMatch = path.match(/^\/subscription\/([^/]+)\/cancel$/);
  if (cancelMatch) {
    if (method !== 'POST') return methodNotAllowed(context.request);
    return handleCancelSubscription(context, cancelMatch[1]);
  }

  return notFound(context.request);
});
