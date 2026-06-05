/**
 * POST /api/credits/expire-subscription
 *
 * Internal/cron only — NOT accessible to frontend users.
 * Protected by X-Cron-Secret / X-Internal-Secret header.
 *
 * Expires unused subscription-granted credits for users whose
 * subscription_end_date has passed.
 *
 * Logic (in DB function expire_subscription_credits):
 *   - Joins ai_credit_accounts → subscription_cache via subscription_id
 *   - Finds accounts where subscription_end_date < now() AND credit_balance > 0
 *   - Skips lifetime/freemium plans (billing_cycle = 'lifetime')
 *   - Expires only subscription-granted credits — purchased credits are NEVER expired
 *   - Each expiry is recorded as an 'expiry' transaction in ai_credit_transactions
 *
 * Idempotent — safe to run multiple times per day. Accounts already at 0
 * balance or with active subscriptions are silently skipped.
 *
 * Recommended schedule: daily at 02:00 UTC via Cloudflare Cron Trigger.
 */

import { getServiceClient } from '../../lib/supabase';

interface ExpireEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  CRON_SECRET?: string;
}

export async function handleExpireSubscriptionCredits(
  request: Request,
  env: ExpireEnv
): Promise<Response> {
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  // ── Security ───────────────────────────────────────────────────────────────
  const secret =
    request.headers.get('X-Cron-Secret') ??
    request.headers.get('X-Internal-Secret');

  if (env.CRON_SECRET && secret !== env.CRON_SECRET) {
    return json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Unauthorized.' } },
      403
    );
  }

  const supabase = getServiceClient(env);

  try {
    // expire_subscription_credits() returns TABLE(expired_count, total_credits_expired)
    const { data, error } = await supabase.rpc('expire_subscription_credits');

    if (error) {
      console.error('[credits/expire-subscription] RPC error:', error.message);
      return json(
        {
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Credit expiry job failed.' },
        },
        500
      );
    }

    // data is an array of rows from the TABLE return type
    const row = Array.isArray(data) ? data[0] : data;

    const expiredCount   = row?.expired_count        ?? 0;
    const totalExpired   = parseFloat(row?.total_credits_expired ?? '0');

    console.log('[credits/expire-subscription] Completed:', {
      expired_count:         expiredCount,
      total_credits_expired: totalExpired,
    });

    return json({
      success:               true,
      expired_count:         expiredCount,
      total_credits_expired: totalExpired,
      executed_at:           new Date().toISOString(),
    });
  } catch (err) {
    console.error('[credits/expire-subscription] Unhandled error:', err);
    return json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Credit expiry job failed.' },
      },
      500
    );
  }
}
