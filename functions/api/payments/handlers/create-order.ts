/**
 * Create Order Handler
 *
 * POST /api/payments/create-order
 *
 * Creates a Razorpay order via the payment-worker.
 * Requires SSO authentication.
 */

import { withAuth } from '../../../lib/auth';
import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { callPaymentWorker } from '../lib/serviceJwt';

export const onRequestPost = withAuth(async (context: AuthenticatedContext) => {
  return handleCreateOrder(context);
});

export async function handleCreateOrder(context: AuthenticatedContext): Promise<Response> {
  const user = context.data.user;
  const env = context.env as Record<string, string>;

  try {
    // Parse request body
    let body: Record<string, unknown>;
    try {
      body = (await context.request.json()) as Record<string, unknown>;
    } catch {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    if (!body.amount || typeof body.amount !== 'number') {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'amount is required and must be a number' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Enforce user context from SSO — always use verified identity, never trust frontend
    const enhancedBody = {
      ...body,
      user_id: user.sub,
      user_email: user.email,
      org_id: user.org_id,
    };

    // Call payment-worker with Service JWT
    const response = await callPaymentWorker(
      '/create-order',
      {
        method: 'POST',
        body: JSON.stringify(enhancedBody),
      },
      env
    );

    // Return the response from the worker, enhanced with the Razorpay key ID
    // The worker returns { success, order: { id, amount, currency, ... } }
    // but the frontend expects flat access: orderData.key, orderData.amount, orderData.id
    // Flatten the response for frontend compatibility
    if (!env.RAZORPAY_KEY_ID) {
      throw new Error('RAZORPAY_KEY_ID environment variable is not configured');
    }

    const data = await response.json();
    const order = data.order || data; // Handle both { success, order } and flat formats
    const flattenedData = {
      ...order,
      key: env.RAZORPAY_KEY_ID,
    };
    return new Response(JSON.stringify(flattenedData), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[CreateOrder] Error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create order',
        },
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
