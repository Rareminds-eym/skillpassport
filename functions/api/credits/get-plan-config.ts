/**
 * GET /api/credits/plan-config
 *
 * Returns the authenticated user's plan AI credit configuration:
 * - Credit grant (credits added on each monthly reset)
 * - Welcome bonus credits
 * - Credits per 1000 tokens rate
 *
 * Resolves plan_id from ai_credit_accounts → subscription_cache → plans_cache.
 * Note: monthly_credit_limit (per-session cap) was removed in schema simplification.
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { jsonResponse } from '../../../src/functions-lib/response';
import { getServiceClient } from '../../lib/supabase';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export async function handleGetPlanConfig(context: AuthenticatedContext): Promise<Response> {
  const userId = context.data.user.sub;
  const env = context.env as unknown as Env;
  const supabase = getServiceClient(env);

  try {
    // 1. Resolve plan_id — prefer ai_credit_accounts, fall back to subscription_cache
    let planId: string | null = null;

    const { data: account } = await supabase
      .from('ai_credit_accounts')
      .select('plan_id')
      .eq('user_id', userId)
      .maybeSingle();

    planId = account?.plan_id ?? null;

    if (!planId) {
      // Fall back to subscription_cache
      const { data: sub } = await supabase
        .from('subscription_cache')
        .select('plan_id, plan_code, status')
        .eq('user_id', userId)
        .in('status', ['active', 'pending'])
        .maybeSingle();

      planId = sub?.plan_id ?? null;
    }

    if (!planId) {
      return jsonResponse(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'No active subscription found. Cannot determine plan configuration.',
          },
        },
        400
      );
    }

    // 2. Fetch plan credit config via RPC
    const { data: planConfig, error: planError } = await supabase.rpc('get_plan_credit_config', {
      p_plan_id: planId,
    });

    if (planError) {
      console.error('[credits/plan-config] RPC error:', planError.message);
      return jsonResponse(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch plan config.' } },
        500
      );
    }

    if (!planConfig) {
      return jsonResponse(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Plan AI configuration not found. Contact support.',
          },
        },
        404
      );
    }

    // 3. Enrich with plan name from plans_cache
    const { data: plan } = await supabase
      .from('plans_cache')
      .select('plan_code, name')
      .eq('id', planId)
      .maybeSingle();

    return jsonResponse({
      success: true,
      data: {
        plan_id: planId,
        plan_code: plan?.plan_code ?? null,
        plan_name: plan?.name ?? null,
        ...planConfig,
      },
    });
  } catch (err) {
    console.error('[credits/plan-config] Error:', err);
    return jsonResponse(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch plan config.' } },
      500
    );
  }
}
