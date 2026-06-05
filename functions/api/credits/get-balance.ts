/**
 * GET /api/credits/balance
 *
 * Returns the authenticated user's AI credit balance and subscription/plan context.
 * Monthly consumption is derivable from ai_credit_transactions (no longer a column).
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { jsonResponse } from '../../../src/functions-lib/response';
import { getServiceClient } from '../../lib/supabase';
import { getCreditBalance } from '../_shared/ai-credits';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export async function handleGetBalance(context: AuthenticatedContext): Promise<Response> {
  const userId = context.data.user.sub;
  const env = context.env as unknown as Env;
  const supabase = getServiceClient(env);

  try {
    // Fetch balance via RPC
    const balance = await getCreditBalance(supabase, userId);

    // Enrich with subscription/plan context from shadow tables
    // Note: last_monthly_reset_at and monthly_credits_consumed columns were removed
    // in the schema simplification — monthly usage is now derived from ai_credit_transactions.
    const { data: account } = await supabase
      .from('ai_credit_accounts')
      .select('subscription_id, plan_id, created_at')
      .eq('user_id', userId)
      .maybeSingle();

    // Next reset date = first day of next month (informational only)
    const now = new Date();
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return jsonResponse({
      success: true,
      data: {
        ...balance,
        subscription_id:      account?.subscription_id ?? null,
        plan_id:              account?.plan_id ?? null,
        next_monthly_reset_at: nextReset.toISOString(),
        account_created_at:   account?.created_at ?? null,
      },
    });
  } catch (err) {
    console.error('[credits/balance] Error:', err);
    return jsonResponse(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch credit balance.' } },
      500
    );
  }
}
