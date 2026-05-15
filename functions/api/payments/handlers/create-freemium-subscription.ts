/**
 * Create Freemium Subscription Handler
 *
 * POST /api/payments/create-freemium-subscription
 *
 * Creates a Freemium (pay_as_you_go) subscription without payment processing.
 * This endpoint bypasses Razorpay and directly creates an active subscription
 * record for users selecting the ₹0 Freemium tier.
 *
 * Requires SSO authentication.
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { getServiceClient } from '../../../lib/supabase';
import { apiSuccess, apiError, apiDbError, apiValidationError } from '../../../lib/response';
// Cache invalidation removed - KV dependency eliminated
import { validateCreateFreemiumRequest } from '../../../shared/lib/validation';
import { verifyPlanExists } from '../../../shared/lib/server-feature-gating';
// Rate limiting removed - KV dependency eliminated

interface CreateFreemiumRequest {
  userId: string;
  email: string;
}

export async function handleCreateFreemiumSubscription(context: AuthenticatedContext): Promise<Response> {
  const startTime = Date.now();
  const user = context.data.user;
  const env = context.env as { SUPABASE_URL: string; SUPABASE_SERVICE_ROLE_KEY: string };

  try {
    // Rate limiting removed - rely on database-level constraints and unique indexes for protection

    // Parse request body
    let body: CreateFreemiumRequest;
    try {
      body = await context.request.json();
    } catch {
      return apiError(400, 'INVALID_JSON', 'Request body must be valid JSON', context.request, { startTime });
    }

    // Validate request
    const validation = validateCreateFreemiumRequest(body);
    if (!validation.valid) {
      return apiValidationError(validation.issues!, context.request);
    }

    // Verify userId matches authenticated user
    if (body.userId !== user.sub) {
      return apiError(403, 'FORBIDDEN', 'Cannot create subscription for another user', context.request, { startTime });
    }

    const supabase = getServiceClient(env);

    // Ensure user exists in shadow table (for FK constraints)
    const { data: existingShadowUser } = await supabase
      .from('users_shadow')
      .select('id')
      .eq('id', body.userId)
      .maybeSingle();

    if (!existingShadowUser) {
      // Create shadow user record
      const { error: shadowUserError } = await supabase
        .from('users_shadow')
        .insert({
          id: body.userId,
          email: body.email,
        });

      if (shadowUserError) {
        console.error('[CreateFreemiumSubscription] Error creating shadow user:', shadowUserError);
        return apiDbError(shadowUserError, context.request, { startTime });
      }
    }

    // Verify plan exists and is active (server-side validation)
    const { exists: planExists, plan } = await verifyPlanExists(supabase, 'pay_as_you_go');

    if (!planExists || !plan) {
      console.error('[CreateFreemiumSubscription] Freemium plan not found or inactive');
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        userId: body.userId,
        errorType: 'FREEMIUM_CREATION_ERROR',
        errorMessage: 'Freemium plan not found or inactive in database',
        context: {
          planCode: 'pay_as_you_go',
          endpoint: '/api/payments/create-freemium-subscription',
          statusCode: 404,
        },
      }));

      return apiError(404, 'PLAN_NOT_FOUND', 'Freemium plan not found or inactive', context.request, { startTime });
    }

    // Create subscription record - rely on database unique constraint to prevent duplicates
    // This eliminates TOCTOU race condition by using database-level atomicity
    const now = new Date().toISOString();
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: body.userId,
        plan_id: plan.id,
        full_name: user.name || 'Freemium User',
        email: body.email,
        phone: null,
        plan_type: 'pay_as_you_go',
        plan_amount: 0,
        billing_cycle: 'lifetime',
        status: 'active',
        subscription_start_date: now,
        subscription_end_date: null, // Lifetime subscription
        auto_renew: false,
        created_at: now,
        updated_at: now,
      })
      .select(`
        id,
        user_id,
        plan_id,
        status,
        subscription_start_date,
        subscription_end_date,
        auto_renew,
        created_at
      `)
      .single();

    // Handle unique constraint violation (23505 = duplicate key)
    if (subError?.code === '23505') {
      console.log('[CreateFreemiumSubscription] User already has active subscription (race condition caught)');
      return apiError(409, 'SUBSCRIPTION_EXISTS', 'User already has an active subscription', context.request, { startTime });
    }

    if (subError) {
      console.error('[CreateFreemiumSubscription] Error creating subscription:', subError);
      // Log error with context
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        userId: body.userId,
        errorType: 'FREEMIUM_CREATION_ERROR',
        errorMessage: 'Failed to create subscription record',
        context: {
          planCode: 'pay_as_you_go',
          endpoint: '/api/payments/create-freemium-subscription',
          statusCode: 500,
          dbError: subError.message,
        },
      }));

      return apiDbError(subError, context.request, { startTime });
    }

    // Cache invalidation removed - KV dependency eliminated
    // Client-side queries will refetch data as needed

    // Return subscription details
    return apiSuccess(
      {
        id: subscription.id,
        userId: subscription.user_id,
        planId: subscription.plan_id,
        planCode: 'pay_as_you_go',
        planName: plan.name,
        status: subscription.status,
        startDate: subscription.subscription_start_date,
        endDate: subscription.subscription_end_date,
        autoRenew: subscription.auto_renew,
        createdAt: subscription.created_at,
      },
      context.request,
      { startTime }
    );
  } catch (error) {
    console.error('[CreateFreemiumSubscription] Unexpected error:', error);
    // Log error with context
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      userId: user?.sub || 'unknown',
      errorType: 'FREEMIUM_CREATION_ERROR',
      errorMessage: 'Unexpected error during subscription creation',
      context: {
        planCode: 'pay_as_you_go',
        endpoint: '/api/payments/create-freemium-subscription',
        statusCode: 500,
        error: error instanceof Error ? error.message : String(error),
      },
      stackTrace: error instanceof Error ? error.stack : undefined,
    }));
    return apiError(500, 'INTERNAL_ERROR', 'An internal error occurred', context.request, { startTime });
  }
}
