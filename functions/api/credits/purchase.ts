/**
 * POST /api/credits/purchase
 *
 * Internal/service-role only — NOT accessible to frontend users directly.
 * Protected by X-Internal-Secret / X-Cron-Secret header.
 *
 * Called by verify-credit-payment.ts after Razorpay signature verification.
 * Calls add_ai_credits(type='purchase') which:
 *   - Adds p_amount to credit_balance
 *   - Increments total_credits_purchased by p_amount
 *   - Records a 'purchase' transaction in ai_credit_transactions
 *   - Auto-creates ai_credit_accounts row if it doesn't exist yet
 *
 * Idempotent by eventId (razorpay_payment_id) — safe to retry on network failure.
 *
 * Body:
 * {
 *   userId:    string,
 *   amount:    number,   // credits to add (NOT paise)
 *   eventId:   string,   // razorpay_payment_id — idempotency key
 *   packageId: string,   // for metadata/audit
 *   priceInr:  number,   // rupees paid — for metadata/audit
 *   label:     string,   // e.g. "500 Credits"
 * }
 *
 * Response:
 * {
 *   success:        true,
 *   idempotent:     boolean,
 *   transaction_id: string,
 *   balance_before: number,
 *   balance_after:  number,
 *   credits_added:  number,
 * }
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { getServiceClient } from '../../lib/supabase';

interface PurchaseEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  CRON_SECRET?: string;
}

interface AddCreditsParams {
  userId:    string;
  amount:    number;
  eventId:   string;
  packageId: string;
  priceInr:  number;
  label:     string;
}

interface AddCreditsResult {
  success:        boolean;
  idempotent:     boolean;
  transaction_id: string;
  balance_before: number;
  balance_after:  number;
  credits_added:  number;
}

// ─── Numeric coercion (Supabase returns numeric columns as strings) ────────────
function n(v: unknown): number {
  if (v === null || v === undefined) return 0;
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  if (typeof v === 'string') { const p = parseFloat(v); return isNaN(p) ? 0 : p; }
  return 0;
}

// ─── Core function — reusable by verify-credit-payment.ts ────────────────────

/**
 * Atomically add purchased credits to a user's account.
 * Uses add_ai_credits(type='purchase') which increments both
 * credit_balance and total_credits_purchased.
 *
 * Idempotent: if the same eventId was already processed, returns the
 * existing transaction without double-crediting.
 */
export async function addCredits(
  supabase: SupabaseClient,
  params: AddCreditsParams
): Promise<AddCreditsResult> {
  const { userId, amount, eventId, packageId, priceInr, label } = params;

  // ── Idempotency check ───────────────────────────────────────────────────────
  // Check if this payment was already processed by looking for a 'purchase'
  // transaction with the same eventId in metadata.
  const { data: existingTx } = await supabase
    .from('ai_credit_transactions')
    .select('id, balance_after, amount')
    .eq('user_id', userId)
    .eq('transaction_type', 'purchase')
    .filter('metadata->>event_id', 'eq', eventId)
    .maybeSingle();

  if (existingTx) {
    console.log('[credits/purchase] Idempotent — already processed eventId:', eventId);
    return {
      success:        true,
      idempotent:     true,
      transaction_id: existingTx.id as string,
      balance_before: n(existingTx.balance_after) - n(existingTx.amount),
      balance_after:  n(existingTx.balance_after),
      credits_added:  n(existingTx.amount),
    };
  }

  // ── Call add_ai_credits RPC with type='purchase' ────────────────────────────
  // This is the ONLY path that increments total_credits_purchased.
  const { data, error } = await supabase.rpc('add_ai_credits', {
    p_user_id:          userId,
    p_amount:           amount,
    p_transaction_type: 'purchase',
    p_metadata: {
      event_id:   eventId,
      package_id: packageId,
      price_inr:  priceInr,
      label,
    },
    p_notes:   `Credit purchase: ${label} (₹${priceInr})`,
    p_plan_id: null,
  });

  if (error) {
    console.error('[credits/purchase] add_ai_credits RPC error:', error.message);
    throw Object.assign(new Error(error.message), { code: 'CREDIT_ADD_FAILED', status: 500 });
  }

  const raw = data as Record<string, unknown>;
  return {
    success:        raw.success === true,
    idempotent:     false,
    transaction_id: typeof raw.transaction_id === 'string' ? raw.transaction_id : '',
    balance_before: n(raw.balance_before),
    balance_after:  n(raw.balance_after),
    credits_added:  n(raw.credits_added),
  };
}

// ─── HTTP handler (internal endpoint) ────────────────────────────────────────

export async function handlePurchaseCredits(
  request: Request,
  env: PurchaseEnv
): Promise<Response> {
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  // ── Security ────────────────────────────────────────────────────────────────
  const secret = request.headers.get('X-Internal-Secret') ?? request.headers.get('X-Cron-Secret');
  if (env.CRON_SECRET && secret !== env.CRON_SECRET) {
    return json({ success: false, error: { code: 'FORBIDDEN', message: 'Unauthorized.' } }, 403);
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: Partial<AddCreditsParams>;
  try {
    body = (await request.json()) as Partial<AddCreditsParams>;
  } catch {
    return json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Invalid JSON body.' } }, 400);
  }

  const { userId, amount, eventId, packageId, priceInr, label } = body;

  if (!userId || !eventId || !packageId || !label) {
    return json(
      { success: false, error: { code: 'INVALID_REQUEST', message: 'userId, amount, eventId, packageId, and label are required.' } },
      400
    );
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return json(
      { success: false, error: { code: 'INVALID_REQUEST', message: 'amount must be a positive number (credits, not paise).' } },
      400
    );
  }

  const supabase = getServiceClient(env);

  try {
    const result = await addCredits(supabase, {
      userId,
      amount,
      eventId,
      packageId,
      priceInr: priceInr ?? 0,
      label,
    });

    return json({ success: true, ...result });
  } catch (err) {
    console.error('[credits/purchase] Unhandled error:', err);
    const message = err instanceof Error ? err.message : 'Failed to add credits.';
    return json({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
  }
}
