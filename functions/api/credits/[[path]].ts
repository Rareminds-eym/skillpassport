/**
 * Credits API — Cloudflare Pages Function
 *
 * Routes:
 *   GET  /api/credits/balance              — User's token balance + monthly stats
 *   GET  /api/credits/transactions         — Paginated transaction history
 *   GET  /api/credits/usage                — Usage summary by feature
 *   GET  /api/credits/plan-config          — Plan AI token config + per-feature limits
 *   POST /api/credits/provision            — Internal: provision credits after payment
 *   POST /api/credits/reset-monthly        — Internal: monthly cron reset
 *   POST /api/credits/expire-subscription  — Internal: daily cron — expire ended-subscription credits
 *
 * User endpoints require JWT auth via withAuth.
 * Internal endpoints require X-Cron-Secret / X-Internal-Secret header.
 */

import { jsonResponse } from '../../../src/functions-lib/response';
import type { PagesFunction, PagesEnv } from '../../../src/functions-lib/types';
import { withAuth } from '../../lib/auth';
import { handleGetBalance } from './get-balance';
import { handleGetTransactions } from './get-transactions';
import { handleGetUsage } from './get-usage';
import { handleGetPlanConfig } from './get-plan-config';
import { handleProvision } from './provision';
import { handleResetMonthly } from './reset-ai-credits';
import { handlePurchaseCredits } from './purchase';
import { handleExpireSubscriptionCredits } from './expire-subscription';

export const onRequest: PagesFunction<PagesEnv> = async (context) => {
  const { request, env } = context;

  // ── CORS preflight ──────────────────────────────────────────────────────────
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret, x-internal-secret',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  }

  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/credits/, '') || '/';

  try {
    // ── Health check ────────────────────────────────────────────────────────
    if ((path === '' || path === '/' || path === '/health') && request.method === 'GET') {
      return jsonResponse({
        status: 'ok',
        service: 'credits-api',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: [
          'GET  /api/credits/balance',
          'GET  /api/credits/transactions',
          'GET  /api/credits/usage',
          'GET  /api/credits/plan-config',
          'POST /api/credits/provision             [internal]',
          'POST /api/credits/purchase              [internal]',
          'POST /api/credits/reset-monthly         [internal]',
          'POST /api/credits/expire-subscription   [internal]',
        ],
      });
    }

    // ── User endpoints (auth required) ──────────────────────────────────────

    if (path === '/balance' && request.method === 'GET') {
      return withAuth(handleGetBalance)(context);
    }

    if (path === '/transactions' && request.method === 'GET') {
      return withAuth(handleGetTransactions)(context);
    }

    if (path === '/usage' && request.method === 'GET') {
      return withAuth(handleGetUsage)(context);
    }

    if (path === '/plan-config' && request.method === 'GET') {
      return withAuth(handleGetPlanConfig)(context);
    }

    // ── Internal endpoints (service secret required) ─────────────────────────

    if (path === '/provision' && request.method === 'POST') {
      return handleProvision(request, env as unknown as Parameters<typeof handleProvision>[1]);
    }

    if (path === '/purchase' && request.method === 'POST') {
      return handlePurchaseCredits(request, env as unknown as Parameters<typeof handlePurchaseCredits>[1]);
    }

    if (path === '/reset-monthly' && request.method === 'POST') {
      return handleResetMonthly(request, env as unknown as Parameters<typeof handleResetMonthly>[1]);
    }

    if (path === '/expire-subscription' && request.method === 'POST') {
      return handleExpireSubscriptionCredits(request, env as unknown as Parameters<typeof handleExpireSubscriptionCredits>[1]);
    }

    // ── 404 ─────────────────────────────────────────────────────────────────
    return jsonResponse(
      {
        error: 'Not found',
        message: `Unknown endpoint: ${request.method} /api/credits${path}`,
        available_endpoints: [
          'GET  /api/credits/balance',
          'GET  /api/credits/transactions',
          'GET  /api/credits/usage',
          'GET  /api/credits/plan-config',
          'POST /api/credits/provision',
          'POST /api/credits/purchase',
          'POST /api/credits/reset-monthly',
          'POST /api/credits/expire-subscription',
        ],
      },
      404
    );
  } catch (err: unknown) {
    console.error('[credits-api] Unhandled error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return jsonResponse({ success: false, error: { code: 'INTERNAL_ERROR', message } }, 500);
  }
};
