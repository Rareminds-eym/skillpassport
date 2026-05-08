/**
 * Generic Proxy Handler
 *
 * Handles all payment API endpoints that don't have dedicated handlers.
 * Validates SSO token, creates Service JWT, and forwards to payment-worker.
 *
 * Supported endpoints:
 * - POST /create-addon-order
 * - POST /create-bundle-order
 * - POST /verify-addon-payment
 * - POST /verify-bundle-payment
 * - POST /create-event-order
 * - POST /update-event-payment-status
 * - POST /create-org-order
 * - POST /verify-org-payment
 * - POST /org-subscriptions/purchase
 * - GET  /org-billing/invoice/:id/download
 * - GET  /subscription-plans
 * - GET  /subscription-plan
 * - GET  /subscription-features
 * - POST /deactivate-subscription
 * - POST /pause-subscription
 * - POST /resume-subscription
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { callPaymentWorker } from '../lib/serviceJwt';

export const handleProxy = async (context: AuthenticatedContext, workerPath: string): Promise<Response> => {
  const user = context.data.user;
  const env = context.env as Record<string, string>;
  const method = context.request.method;
  let resolvedPath = workerPath;

  try {
    // Build the request options — no Content-Type for GET requests
    const fetchOptions: RequestInit = {
      method,
    };

    // For POST/PUT/PATCH requests, forward the body with user context
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      let body: Record<string, unknown> = {};
      try {
        body = (await context.request.json()) as Record<string, unknown>;
      } catch {
        // No body or invalid JSON
      }

      // Enforce user context from SSO token — always use verified identity, never trust frontend
      body.user_id = user.sub;
      body.user_email = user.email;
      body.org_id = user.org_id;

      fetchOptions.body = JSON.stringify(body);
      fetchOptions.headers = { 'Content-Type': 'application/json' };
    }

    // For GET requests, append user_id/org_id as query params so worker knows whose data to fetch
    if (method === 'GET') {
      const separator = resolvedPath.includes('?') ? '&' : '?';
      resolvedPath = `${resolvedPath}${separator}user_id=${encodeURIComponent(user.sub)}&org_id=${encodeURIComponent(user.org_id || '')}`;
    }

    // Call payment-worker with Service JWT
    const response = await callPaymentWorker(resolvedPath, fetchOptions, env);

    // For binary responses (like PDF downloads), pass through directly
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/pdf') || contentType.includes('octet-stream')) {
      const blob = await response.blob();
      return new Response(blob, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': response.headers.get('Content-Disposition') || '',
        },
      });
    }

    // For JSON responses, return the data
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(`[Proxy:${resolvedPath}] Error:`, error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Request failed',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
