/**
 * Payments API Proxy
 *
 * Proxies payment requests from the frontend to the payment-worker.
 * Validates SSO tokens and creates Service JWTs for secure worker communication.
 *
 * Routes:
 * - POST /api/payments/create-order
 * - POST /api/payments/verify-payment
 * - GET  /api/payments/payment/:id
 * - POST /api/payments/subscription/:id/cancel
 * - GET  /api/payments/get-subscription
 * - GET  /api/payments/check-subscription-access
 * - POST /api/payments/create-addon-order
 * - POST /api/payments/create-bundle-order
 * - POST /api/payments/verify-addon-payment
 * - POST /api/payments/verify-bundle-payment
 * - POST /api/payments/create-event-order
 * - POST /api/payments/update-event-payment-status
 * - POST /api/payments/create-org-order
 * - POST /api/payments/verify-org-payment
 * - POST /api/payments/org-subscriptions/purchase
 * - GET  /api/payments/org-billing/invoice/:id/download
 * - GET  /api/payments/subscription-plans
 * - GET  /api/payments/subscription-plan
 * - GET  /api/payments/subscription-features
 * - POST /api/payments/deactivate-subscription
 * - POST /api/payments/pause-subscription
 * - POST /api/payments/resume-subscription
 * - GET  /api/payments/health
 */

import { withAuth } from '../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { handleCreateOrder } from './handlers/create-order';
import { handleVerifyPayment } from './handlers/verify-payment';
import { handleGetPayment } from './handlers/get-payment';
import { handleCancelSubscription } from './handlers/cancel-subscription';
import { handleGetSubscription } from './handlers/get-subscription';
import { handleCheckSubscriptionAccess } from './handlers/check-subscription-access';
import { handleProxy } from './handlers/proxy';

// Re-export handlers for Pages Functions routing
export { onRequestPost } from './handlers/create-order';

// Endpoints that use the generic proxy (no special handling needed)
const PROXY_POST_ENDPOINTS = [
  '/create-addon-order',
  '/create-bundle-order',
  '/verify-addon-payment',
  '/verify-bundle-payment',
  '/create-event-order',
  '/update-event-payment-status',
  '/create-org-order',
  '/verify-org-payment',
  '/deactivate-subscription',
  '/pause-subscription',
  '/resume-subscription',
];

const PROXY_GET_ENDPOINTS = [
  '/subscription-plans',
  '/subscription-features',
];

function methodNotAllowed(): Response {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Route dispatcher for payments API
 * Uses path-based routing to handle different endpoints
 *
 * Health check is handled WITHOUT auth so monitoring systems can probe it.
 * All other endpoints require SSO authentication via withAuth.
 */
export async function onRequest(context: { request: Request; env: Record<string, string>; data?: any }) {
  const url = new URL(context.request.url);
  const path = url.pathname.replace('/api/payments', '').replace(/\/$/, '');

  // Health check — no auth required (monitoring systems don't have SSO tokens)
  if (path === '/health') {
    const workerUrl = context.env.PAYMENTS_API_URL || context.env.VITE_PAYMENTS_API_URL;
    if (!workerUrl) {
      return new Response(JSON.stringify({ status: 'error', error: 'PAYMENTS_API_URL not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    try {
      const response = await fetch(`${workerUrl}/health`, { method: 'GET' });
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ status: 'error', error: 'Worker unreachable' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // All other endpoints require SSO authentication
  return handleAuthenticatedRequest(context as AuthenticatedContext);
}

const handleAuthenticatedRequest = withAuth(async (context: AuthenticatedContext) => {
  const url = new URL(context.request.url);
  const path = url.pathname.replace('/api/payments', '').replace(/\/$/, '');
  const method = context.request.method;

  // Generate request ID for correlation across Pages Functions → worker
  const requestId = crypto.randomUUID();
  console.log(`[Payments:${requestId}] ${method} ${path} user=${context.data.user?.sub}`);

  // POST /api/payments/create-order
  if (path === '/create-order') {
    if (method !== 'POST') return methodNotAllowed();
    return handleCreateOrder(context);
  }

  // POST /api/payments/verify-payment
  if (path === '/verify-payment') {
    if (method !== 'POST') return methodNotAllowed();
    return handleVerifyPayment(context);
  }

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

  // GET /api/payments/get-subscription
  if (path === '/get-subscription') {
    if (method !== 'GET') return methodNotAllowed();
    return handleGetSubscription(context);
  }

  // GET /api/payments/check-subscription-access
  if (path === '/check-subscription-access') {
    if (method !== 'GET') return methodNotAllowed();
    return handleCheckSubscriptionAccess(context);
  }

  // GET /api/payments/subscription-plan (single plan by query param)
  if (path === '/subscription-plan') {
    if (method !== 'GET') return methodNotAllowed();
    return handleProxy(context, path + url.search);
  }

  // GET /api/payments/org-billing/invoice/:id/download
  const invoiceMatch = path.match(/^\/org-billing\/invoice\/([^/]+)\/download$/);
  if (invoiceMatch) {
    return handleProxy(context, path);
  }

  // POST /api/payments/org-subscriptions/purchase
  if (path === '/org-subscriptions/purchase') {
    if (method !== 'POST') return methodNotAllowed();
    return handleProxy(context, path);
  }

  // Generic proxy POST endpoints
  if (PROXY_POST_ENDPOINTS.includes(path) && method === 'POST') {
    return handleProxy(context, path);
  }

  // Generic proxy GET endpoints
  if (PROXY_GET_ENDPOINTS.includes(path) && method === 'GET') {
    return handleProxy(context, path + url.search);
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
});
