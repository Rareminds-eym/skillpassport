/**
 * POST /api/credits/provision
 *
 * Internal/service-role only — NOT accessible to frontend users.
 * Protected by CRON_SECRET header.
 *
 * Called after successful payment verification and subscription shadow sync.
 * Creates ai_credit_accounts and grants welcome bonus + initial monthly credits.
 *
 * Flow:
 *   1. New subscription  → create account + grant welcome_bonus_credits + initial credit_grant
 *   2. Plan upgrade      → reset balance counters + grant new plan's welcome bonus + credit_grant
 *   3. Same plan renewal → just update subscription_id, no credit change
 *
 * Idempotent by eventId — uses ai_credit_transactions.metadata->>'event_id'
 *
 * Note: monthly_credit_limit and monthly_credits_consumed columns were removed in the
 * schema simplification. Monthly usage is now derived from ai_credit_transactions.
 * credit_grant replaces monthly_credit_grant.
 *
 * Body:
 * {
 *   userId: string,
 *   subscriptionId: string,
 *   planId: string,
 *   eventId: string   // payment provider event/transaction ID
 * }
 */

import { getServiceClient } from '../../lib/supabase';

interface ProvisionEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  CRON_SECRET?: string;
}

interface ProvisionBody {
  userId: string;
  subscriptionId: string;
  planId: string;
  eventId: string;
}

export async function handleProvision(
  request: Request,
  env: ProvisionEnv
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

  // ── Parse body ─────────────────────────────────────────────────────────────
  let body: ProvisionBody;
  try {
    body = (await request.json()) as ProvisionBody;
  } catch {
    return json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Invalid JSON body.' } }, 400);
  }

  const { userId, subscriptionId, planId, eventId } = body;

  if (!userId || !subscriptionId || !planId || !eventId) {
    return json(
      { success: false, error: { code: 'INVALID_REQUEST', message: 'userId, subscriptionId, planId, and eventId are required.' } },
      400
    );
  }

  const supabase = getServiceClient(env);

  try {
    // ── Idempotency: check if this eventId was already processed ───────────
    // Use RPC or raw filter — PostgREST JSONB filter syntax: column->>key=value
    const { data: existingTx } = await supabase
      .from('ai_credit_transactions')
      .select('id, balance_after')
      .eq('user_id', userId)
      .filter('metadata->>event_id', 'eq', eventId)
      .maybeSingle();

    if (existingTx) {
      return json({
        success: true,
        idempotent: true,
        message: 'Credits already provisioned for this event.',
        balance: existingTx.balance_after,
      });
    }

    // ── Fetch plan credit config ────────────────────────────────────────────
    const { data: planConfig } = await supabase
      .from('plan_ai_credit_config')
      .select('credit_grant, welcome_bonus_credits, credits_per_1000_tokens')
      .eq('plan_id', planId)
      .eq('is_active', true)
      .maybeSingle();

    if (!planConfig) {
      console.error(`[credits/provision] No plan config found for plan_id: ${planId}`);
      return json(
        { success: false, error: { code: 'INVALID_REQUEST', message: `No active credit config found for plan ${planId}.` } },
        400
      );
    }

    const creditGrant  = planConfig.credit_grant  ?? null;
    const welcomeBonus = planConfig.welcome_bonus_credits ?? 0;

    // ── Check existing account ──────────────────────────────────────────────
    const { data: existing } = await supabase
      .from('ai_credit_accounts')
      .select('user_id, credit_balance, plan_id')
      .eq('user_id', userId)
      .maybeSingle();

    const isNewAccount = !existing;
    const isPlanChange = !!existing && existing.plan_id !== planId;

    // ── Plan upgrade: reset balance counters first ─────────────────────────
    // Note: monthly_credit_limit and monthly_credits_consumed columns no longer exist.
    if (isPlanChange) {
      await supabase
        .from('ai_credit_accounts')
        .update({
          subscription_id:        subscriptionId,
          plan_id:                planId,
          credit_balance:         0,
          total_credits_granted:  0,
          total_credits_consumed: 0,
          updated_at:             new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    // ── Grant welcome bonus via add_ai_credits RPC ─────────────────────────
    // add_ai_credits auto-creates the account if it doesn't exist (isNewAccount).
    // For plan upgrades the account already exists with zeroed balance above.
    //
    // Guard against double-award: the DB trigger _award_welcome_bonus_on_new_subscription
    // fires on subscription_cache INSERT (before this code runs) and may have already
    // granted the welcome bonus. Check for an existing welcome_bonus transaction first.
    // For plan upgrades (isPlanChange) we always re-grant because the trigger only fires
    // on INSERT, not on plan changes handled here.
    let welcomeBonusGranted = 0;
    if (welcomeBonus > 0) {
      let alreadyGranted = false;

      if (!isPlanChange) {
        const { data: existingBonus } = await supabase
          .from('ai_credit_transactions')
          .select('id')
          .eq('user_id', userId)
          .eq('transaction_type', 'welcome_bonus')
          .maybeSingle();

        alreadyGranted = !!existingBonus;
        if (alreadyGranted) {
          console.log('[credits/provision] Welcome bonus already granted by DB trigger — skipping duplicate.');
        }
      }

      if (!alreadyGranted) {
        const { error: bonusError } = await supabase.rpc('add_ai_credits', {
          p_user_id:          userId,
          p_amount:           welcomeBonus,
          p_transaction_type: 'welcome_bonus',
          p_metadata: {
            event_id:        eventId,
            subscription_id: subscriptionId,
            plan_id:         planId,
          },
          p_notes:   isPlanChange
            ? 'Welcome bonus on plan upgrade'
            : 'Welcome bonus on subscription activation',
          p_plan_id: planId,
        });

        if (bonusError) {
          console.error('[credits/provision] Welcome bonus RPC error:', bonusError.message);
          return json(
            { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to grant welcome bonus.' } },
            500
          );
        }

        welcomeBonusGranted = welcomeBonus;
      }
    }

    // ── Grant first monthly credit allocation immediately on activation ─────
    // The monthly cron handles subsequent months. This ensures the user has
    // credits available right away without waiting for the cron to run.
    if (creditGrant && creditGrant > 0) {
      const { error: grantError } = await supabase.rpc('add_ai_credits', {
        p_user_id:          userId,
        p_amount:           creditGrant,
        p_transaction_type: 'subscription_grant',
        p_metadata: {
          event_id:        eventId,
          subscription_id: subscriptionId,
          plan_id:         planId,
          initial_grant:   true,
        },
        p_notes:   isPlanChange
          ? 'Monthly credit grant on plan upgrade'
          : 'Monthly credit grant on subscription activation',
        p_plan_id: planId,
      });

      if (grantError) {
        console.error('[credits/provision] Monthly grant RPC error:', grantError.message);
        // Non-fatal — welcome bonus already granted, log and continue
        console.warn('[credits/provision] Monthly grant failed but welcome bonus succeeded');
      }
    }

    // If no welcome bonus and no credit grant — still create account with event recorded
    if (welcomeBonus === 0 && (!creditGrant || creditGrant === 0)) {
      const { error: initError } = await supabase.rpc('add_ai_credits', {
        p_user_id:          userId,
        p_amount:           0,
        p_transaction_type: 'subscription_grant',
        p_metadata: {
          event_id:        eventId,
          subscription_id: subscriptionId,
          plan_id:         planId,
          no_credits:      true,
        },
        p_notes:   'Account created — no credits configured for this plan',
        p_plan_id: planId,
      });

      if (initError) {
        console.error('[credits/provision] Account init RPC error:', initError.message);
        return json(
          { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to initialise credit account.' } },
          500
        );
      }
    }

    // ── Ensure subscription_id is always up to date ────────────────────────
    // add_ai_credits doesn't set subscription_id, so patch it here
    await supabase
      .from('ai_credit_accounts')
      .update({ subscription_id: subscriptionId, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    // ── Fetch final state ──────────────────────────────────────────────────
    const { data: finalAccount } = await supabase
      .from('ai_credit_accounts')
      .select('credit_balance')
      .eq('user_id', userId)
      .maybeSingle();

    return json({
      success: true,
      idempotent:            false,
      provisioned:           true,
      is_new_account:        isNewAccount,
      is_plan_change:        isPlanChange,
      welcome_bonus_granted: welcomeBonusGranted,
      monthly_grant_given:   creditGrant ?? 0,
      credit_grant:          creditGrant,
      balance:               finalAccount?.credit_balance ?? 0,
    });

  } catch (err) {
    console.error('[credits/provision] Unhandled error:', err);
    return json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to provision credits.' } },
      500
    );
  }
}
