/**
 * GET /api/career/credits — Career AI credit balance (30-credit plan).
 *
 * Display-only projection of the SSO-canonical wallet. Reads the local
 * balance cache; `?refresh=1` (or a missing row) pulls the authoritative
 * balance over the SSO_SERVICE binding and refreshes the cache. Never
 * grants, never debits, never authorizes inference. SSO outage → 503
 * (an unavailable ledger is never reported as exhausted).
 */

import { apiSuccess, apiError } from '../../../lib/response';
import { createSupabaseAdminClient } from '../../../lib/supabase';
import type { PagesEnv } from '../../../lib/types';
import { isValidUUID } from '../../../lib/validation';

interface BalanceRow {
  id: string;
  user_id: string;
  product_id: string;
  scope: string;
  granted_credits: string;
  spent_credits: string;
  revision: number;
  updated_at: string;
  synced_at: string;
}

function remainingOf(granted: string, spent: string): string {
  const g = Number(granted);
  const s = Number(spent);
  if (!Number.isFinite(g) || !Number.isFinite(s)) return '0';
  return String(Math.max(0, g - s));
}

export async function handleGetCareerCredits(
  request: Request,
  env: PagesEnv,
  userId: string,
): Promise<Response> {
  if (request.method !== 'GET') {
    return apiError(405, 'ERROR', 'Method not allowed', request);
  }
  const supabase = createSupabaseAdminClient(env as unknown as Record<string, string>);
  const url = new URL(request.url);
  const refresh = url.searchParams.get('refresh') === '1';

  // Canonical refresh over the SSO binding (server-fixed user/product/scope).
  const sso = env.SSO_SERVICE;
  if (!sso || typeof sso.getCareerCredits !== 'function') {
    return apiError(503, 'UNAVAILABLE', 'Credit service is unavailable', request);
  }
  let canonical: Awaited<ReturnType<typeof sso.getCareerCredits>>;
  try {
    canonical = await sso.getCareerCredits(userId);
  } catch {
    return apiError(503, 'UNAVAILABLE', 'Credit service is unavailable', request);
  }
  if (!canonical || canonical.ok !== true || !canonical.account_id || !canonical.product_id || !isValidUUID(canonical.product_id)) {
    return apiError(503, 'UNAVAILABLE', 'Credit service is unavailable', request);
  }
  if (!refresh) {
    // Use SSO identity to select exactly this product/account, never scope alone.
    const { data, error } = await supabase
      .from('user_ai_credit_accounts_cache')
      .select('id,user_id,product_id,scope,granted_credits,spent_credits,revision,updated_at,synced_at')
      .eq('user_id', userId)
      .eq('product_id', canonical.product_id)
      .eq('id', canonical.account_id)
      .eq('scope', 'career_ai')
      .maybeSingle();
    if (!error && data) {
      const row = data as unknown as BalanceRow;
      return apiSuccess({
        granted_credits: String(row.granted_credits),
        spent_credits: String(row.spent_credits),
        remaining_credits: remainingOf(String(row.granted_credits), String(row.spent_credits)),
        revision: row.revision,
        synced_at: row.synced_at,
        fresh: false,
        active_operation_id: canonical.active_operation_id ?? null,
        has_pending_cost: canonical.has_pending_cost ?? false,
      }, request);
    }
  }

  // Refresh the display cache (revision-gated: never restore an older balance).
  // product_id comes from SSO (RPC) or the existing row — never config.
  const { data: existing } = await supabase
    .from('user_ai_credit_accounts_cache')
    .select('revision,product_id')
    .eq('id', canonical.account_id)
    .maybeSingle();
  const existingRow = existing as unknown as { revision?: number; product_id?: string } | null;
  const incomingRevision = canonical.revision ?? 1;
  const existingRevision = existingRow?.revision ?? 0;
  const cacheProductId = canonical.product_id;
  if (cacheProductId && incomingRevision > existingRevision) {
    await supabase.from('user_ai_credit_accounts_cache').upsert(
      {
        id: canonical.account_id,
        user_id: userId,
        product_id: cacheProductId,
        scope: 'career_ai',
        granted_credits: canonical.granted_credits ?? '30',
        spent_credits: canonical.spent_credits ?? '0',
        revision: incomingRevision,
        updated_at: new Date().toISOString(),
        synced_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );
  }
  return apiSuccess({
    granted_credits: String(canonical.granted_credits ?? '30'),
    spent_credits: String(canonical.spent_credits ?? '0'),
    remaining_credits: remainingOf(String(canonical.granted_credits ?? '30'), String(canonical.spent_credits ?? '0')),
    revision: incomingRevision,
    active_operation_id: canonical.active_operation_id ?? null,
    has_pending_cost: canonical.has_pending_cost ?? false,
    synced_at: new Date().toISOString(),
    fresh: true,
  }, request);
}
