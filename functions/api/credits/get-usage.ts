/**
 * GET /api/credits/usage
 *
 * Returns AI usage summary for the authenticated user.
 *
 * Query params:
 *   days - number of days to look back, default 30, max 365
 */

import type { AuthenticatedContext } from '@rareminds-eym/auth-core';
import { jsonResponse } from '../../../src/functions-lib/response';
import { getServiceClient } from '../../lib/supabase';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export async function handleGetUsage(context: AuthenticatedContext): Promise<Response> {
  const userId = context.data.user.sub;
  const env = context.env as unknown as Env;
  const supabase = getServiceClient(env);

  const url = new URL(context.request.url);
  const days = Math.min(365, Math.max(1, parseInt(url.searchParams.get('days') ?? '30', 10) || 30));

  try {
    // Call the RPC — returns aggregated usage by feature
    const { data, error } = await supabase.rpc('get_user_ai_usage_summary', {
      p_user_id: userId,
      p_days: days,
    });

    if (error) {
      console.error('[credits/usage] RPC error:', error.message);
      return jsonResponse(
        { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch usage summary.' } },
        500
      );
    }

    return jsonResponse({
      success: true,
      data: data ?? {
        total_requests: 0,
        total_tokens: 0,
        total_credits: 0,
        by_feature: {},
        period_start: new Date(Date.now() - days * 86400000).toISOString(),
        period_end: new Date().toISOString(),
      },
      meta: { days },
    });
  } catch (err) {
    console.error('[credits/usage] Error:', err);
    return jsonResponse(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch usage.' } },
      500
    );
  }
}
