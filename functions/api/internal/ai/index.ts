/**
 * AI internal gateway endpoint (service-token authenticated).
 * Worker â†” SkillPassport internal gateway â€” THE single door for ai-worker data.
 *
 * POST /api/internal/ai/v1
 *   { action, requestId, payload } + Authorization: Bearer <service token>
 *                                   + X-Ai-Claim / X-Ai-Sig (per-user, 60s)
 *
 * Pipeline mirrors functions/api/internal/lte/v1 (single chokepoint):
 *   1. service token  â†’ HMAC + expiry + app == "ai-worker"
 *   2. per-user claim â†’ HMAC + expiry + sub is uuid
 *   3. envelope       â†’ protocol schema { action, requestId, payload }
 *   4. scope          â†’ action must be in the token's allowed actions
 *   5. dispatch       â†’ action registry below (one file per action)
 *   6. DB access      â†’ service client, scoped by the action allowlist.
 *                       Only `analysis:apply` writes, and only the owned
 *                       attempt's report merge (mirrors the lte:sync
 *                       write exception).
 */

import { InternalEnvelopeSchema } from '@rareminds-eym/ai-protocol';
import type { PagesEnv } from '../../../lib/types';
import { getServiceClient } from '../../../lib/supabase';
import { createLogger } from '../../../lib/logger';
import {
  GatewayAuthError,
  getAiGatewaySecret,
  verifyAiServiceToken,
  verifyAiUserClaim,
} from './auth';
import { createSupabaseAiPort } from './db-supabase';
import type { AiDataPort } from './db';
import { handleGetAttempt } from './actions/get-attempt';
import { handleGetQuestions } from './actions/get-questions';
import { handleGetSections } from './actions/get-sections';
import { handleGetStreamQuestions } from './actions/get-stream-questions';
import { handleGetAdaptive } from './actions/get-adaptive';
import { handleSearchRoles } from './actions/search-roles';
import { handleApplyAnalysis } from './actions/apply-analysis';

const logger = createLogger('ai-gateway');

type Handler = (
  db: AiDataPort,
  userId: string,
  payload: unknown,
) => Promise<{ ok: true; data: object } | { ok: false; error: { code: string; message: string } }>;

const REGISTRY: Record<string, Handler> = {
  'attempt:get': handleGetAttempt,
  'questions:get': handleGetQuestions,
  'sections:get': handleGetSections,
  'stream-questions:get': handleGetStreamQuestions,
  'adaptive:get': handleGetAdaptive,
  'roles:search': handleSearchRoles,
  'analysis:apply': handleApplyAnalysis,
};

function gatewayResponse(
  result: { ok: boolean; data?: object; error?: { code: string; message: string } },
  requestId: string,
  status = 200,
): Response {
  const body: Record<string, unknown> = { ok: result.ok, requestId };
  if (result.ok) {
    body.data = result.data;
  } else {
    body.error = result.error;
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'X-Request-ID': requestId },
  });
}

const STATUS_BY_CODE: Record<string, number> = {
  VALIDATION_ERROR: 400,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  STALE_REVISION: 409,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
};

/** Request ID without depending on global crypto typings. */
function newRequestId(): string {
  const holder = globalThis as unknown as { crypto?: { randomUUID?: unknown } };
  const randomUUID = holder.crypto?.randomUUID;
  if (typeof randomUUID === 'function') {
    try {
      const id: unknown = (randomUUID as () => unknown)();
      if (typeof id === 'string' && id.length > 0) return id;
    } catch {
      // fall through to Math.random fallback
    }
  }
  return `req-${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffffffff).toString(36)}`;
}

export const onRequestPost: PagesFunction<PagesEnv> = async (context) => {
  const { request, env } = context;

  try {
    const secret = getAiGatewaySecret(env);

    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return gatewayResponse(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Missing bearer token' } },
        newRequestId(),
        401,
      );
    }
    const serviceClaims = await verifyAiServiceToken(secret, authHeader.slice('Bearer '.length));
    if (serviceClaims.app !== 'ai-worker') {
      return gatewayResponse(
        { ok: false, error: { code: 'FORBIDDEN', message: 'Caller app is not authorized' } },
        newRequestId(),
        403,
      );
    }

    const userClaim = await verifyAiUserClaim(
      secret,
      request.headers.get('X-Ai-Claim') ?? '',
      request.headers.get('X-Ai-Sig') ?? '',
    );

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return gatewayResponse(
        { ok: false, error: { code: 'BAD_REQUEST', message: 'Request body must be valid JSON' } },
        newRequestId(),
        400,
      );
    }
    const envelope = InternalEnvelopeSchema.safeParse(rawBody);
    if (!envelope.success) {
      return gatewayResponse(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request envelope' } },
        newRequestId(),
        400,
      );
    }
    const { action, requestId, payload } = envelope.data;

    if (!serviceClaims.actions.includes(action)) {
      return gatewayResponse(
        { ok: false, error: { code: 'FORBIDDEN', message: `Action not allowed for caller: ${action}` } },
        requestId,
        403,
      );
    }

    const handler = REGISTRY[action];
    if (!handler) {
      return gatewayResponse(
        { ok: false, error: { code: 'UNKNOWN_ACTION', message: `Unknown action: ${action}` } },
        requestId,
        404,
      );
    }

    const db = createSupabaseAiPort(getServiceClient(env));
    const result = await handler(db, userClaim.sub, payload);
    const status = result.ok ? 200 : (STATUS_BY_CODE[result.error.code] ?? 500);
    return gatewayResponse(result, requestId, status);
  } catch (error) {
    if (error instanceof GatewayAuthError) {
      const status = error.code === 'FORBIDDEN' ? 403 : error.code === 'BAD_REQUEST' ? 400 : 401;
      return gatewayResponse(
        { ok: false, error: { code: error.code, message: error.message } },
        newRequestId(),
        status,
      );
    }
    logger.error('AI gateway failure', { error: error instanceof Error ? error.message : String(error) });
    return gatewayResponse(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Internal gateway failure' } },
      newRequestId(),
      500,
    );
  }
};
