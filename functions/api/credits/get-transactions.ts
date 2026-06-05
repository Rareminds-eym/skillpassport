/**
 * GET /api/credits/transactions
 *
 * Returns paginated ai_credit_transactions for the authenticated user.
 *
 * Query params:
 *   page     - page number, default 1
 *   limit    - rows per page, default 20, max 100
 *   type     - filter by transaction_type
 *   feature  - filter by feature
 *   from     - ISO date string, lower bound on created_at
 *   to       - ISO date string, upper bound on created_at
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { jsonResponse } from '../../../src/functions-lib/response';
import { getServiceClient } from '../../lib/supabase';

const VALID_TYPES = [
  'purchase', 'refill', 'deduction', 'refund',
  'subscription_grant', 'admin_adjustment', 'expiry', 'welcome_bonus',
] as const;

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export async function handleGetTransactions(context: AuthenticatedContext): Promise<Response> {
  const userId = context.data.user.sub;
  const env = context.env as unknown as Env;
  const supabase = getServiceClient(env);

  const url = new URL(context.request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20));
  const type = url.searchParams.get('type') ?? null;
  const feature = url.searchParams.get('feature') ?? null;
  const from = url.searchParams.get('from') ?? null;
  const to = url.searchParams.get('to') ?? null;

  // Validate type filter
  if (type && !VALID_TYPES.includes(type as (typeof VALID_TYPES)[number])) {
    return jsonResponse(
      {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`,
        },
      },
      400
    );
  }

  try {
    const offset = (page - 1) * limit;

    // Build query — always scoped to current user (RLS also enforces this)
    let query = supabase
      .from('ai_credit_transactions')
      .select('id, transaction_type, amount, balance_before, balance_after, feature, notes, metadata, created_at', {
        count: 'exact',
      })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) query = query.eq('transaction_type', type);
    if (feature) query = query.eq('feature', feature);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const { data, error, count } = await query;

    if (error) {
      console.error('[credits/transactions] Query error:', error.message);
      return jsonResponse(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch transactions.' } },
        500
      );
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return jsonResponse({
      success: true,
      data: data ?? [],
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1,
      },
    });
  } catch (err) {
    console.error('[credits/transactions] Error:', err);
    return jsonResponse(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch transactions.' } },
      500
    );
  }
}
