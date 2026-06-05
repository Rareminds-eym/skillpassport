/**
 * POST /api/credits/reset-monthly
 *
 * Service-role / cron only — NOT accessible to frontend users.
 * Protected by CRON_SECRET header.
 *
 * Calls reset_credits_by_subscription_cycle() which re-grants subscription
 * credits based on each user's OWN billing cycle (subscription_start_date),
 * NOT a fixed calendar date (1st of month).
 *
 * Logic:
 *   - Joins ai_credit_accounts → subscription_cache → plan_ai_credit_config
 *   - Finds users whose subscription_start_date has passed but no
 *     subscription_grant transaction exists after that date yet
 *   - Grants credit_grant amount for that cycle
 *   - Skips lifetime plans and already-granted accounts (idempotent)
 *
 * Run hourly via cron ("0 * * * *") so renewals are picked up within 1 hour.
 */

import { getServiceClient } from '../../lib/supabase';

interface ResetEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  CRON_SECRET?: string;
}

export async function handleResetMonthly(
  request: Request,
  env: ResetEnv
): Promise<Response> {
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  // ── Security ───────────────────────────────────────────────────────────────
  const secret = request.headers.get('X-Cron-Secret') ?? request.headers.get('X-Internal-Secret');
  if (env.CRON_SECRET && secret !== env.CRON_SECRET) {
    return json({ success: false, error: { code: 'FORBIDDEN', message: 'Unauthorized.' } }, 403);
  }

  const supabase = getServiceClient(env);

  try {
    // reset_credits_by_subscription_cycle() returns TABLE(regrant_count integer)
    const { data, error } = await supabase.rpc('reset_credits_by_subscription_cycle');

    if (error) {
      console.error('[credits/reset-monthly] RPC error:', error.message);
      return json(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Credit cycle reset failed.' } },
        500
      );
    }

    const row = Array.isArray(data) ? data[0] : data;

    console.log('[credits/reset-monthly] Completed:', row);

    return json({
      success:       true,
      regrant_count: row?.regrant_count ?? 0,
      executed_at:   new Date().toISOString(),
    });
  } catch (err) {
    console.error('[credits/reset-monthly] Error:', err);
    return json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Credit cycle reset failed.' } },
      500
    );
  }
}
