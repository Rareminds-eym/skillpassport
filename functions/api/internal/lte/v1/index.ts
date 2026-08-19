/**
 * @public-endpoint: LTE internal gateway endpoint (service-token authenticated)
 * LTE ↔ SkillPassport internal gateway — THE single door for LTE → Skill data.
 *
 * POST /api/internal/lte/v1
 *   { action, requestId, payload }  +  Authorization: Bearer <service token>
 *                                    +  X-Lte-Claim / X-Lte-Sig (per-user, 60s)
 *
 * Request pipeline (single security chokepoint, order matters):
 *   1. service token  → verify HMAC signature + expiry + app == "lte"
 *   2. per-user claim → verify HMAC signature + expiry + sub is uuid
 *   3. envelope       → Zod validate { action, requestId, payload }
 *   4. scope          → action must be in the service token's allowed actions
 *   5. dispatch       → action registry (one file per action, zero logic here)
 *   6. DB access      → handlers receive ONLY a read-only (SELECT-only) client
 *
 * Actions are registered in REGISTRY below. Adding an action = one handler file
 * + one registry line. No business logic may live in this file.
 *
 * TODO(rate-limit): per-action + per-token rate limiting with lockout is the
 * next hardening step and requires a KV/binding — hook belongs between step 4
 * and step 5 (see design docs).
 */

import { createLogger } from '../../../../lib/logger';
import type { PagesEnv } from '../../../../lib/types';
import { GatewayAuthError, getGatewaySecret, verifyServiceToken, verifyUserClaim } from './auth';
import { LteGatewayEnvelopeSchema } from './schemas';
import { createReadOnlyDb } from './readonly-db';
import type { GatewayAction, GatewayContext, GatewayResult } from './types';
import { handlePing } from './actions/ping';
import { handleLearningTrack } from './actions/learning-track';
import { handleLearnerStatus } from './actions/learner-status';

const logger = createLogger('lte-gateway');

const REGISTRY: Record<string, GatewayAction> = {
  'ping': handlePing,
  'learning-track:get': handleLearningTrack,
  'learner:status': handleLearnerStatus,
};

function gatewayResponse(result: GatewayResult, requestId: string, status = 200): Response {
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

export const onRequestPost: PagesFunction<PagesEnv> = async (context) => {
  const { request, env } = context;

  try {
    const secret = getGatewaySecret(env);

    // 1. Service token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return gatewayResponse(
        { ok: false, error: { code: 'UNAUTHORIZED', message: 'Missing bearer token' } },
        crypto.randomUUID(),
        401,
      );
    }
    const serviceClaims = await verifyServiceToken(secret, authHeader.slice('Bearer '.length));
    if (serviceClaims.app !== 'lte') {
      return gatewayResponse(
        { ok: false, error: { code: 'FORBIDDEN', message: 'Caller app is not authorized' } },
        crypto.randomUUID(),
        403,
      );
    }

    // 2. Per-user claim (binds this request to exactly one learner)
    const userClaim = await verifyUserClaim(
      secret,
      request.headers.get('X-Lte-Claim') ?? '',
      request.headers.get('X-Lte-Sig') ?? '',
    );

    // 3. Envelope validation
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return gatewayResponse(
        { ok: false, error: { code: 'BAD_REQUEST', message: 'Request body must be valid JSON' } },
        crypto.randomUUID(),
        400,
      );
    }
    const envelope = LteGatewayEnvelopeSchema.safeParse(rawBody);
    if (!envelope.success) {
      return gatewayResponse(
        { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request envelope' } },
        crypto.randomUUID(),
        400,
      );
    }
    const { action, requestId, payload } = envelope.data;

    // 4. Action scope check (service token must grant this action)
    if (!serviceClaims.actions.includes(action)) {
      return gatewayResponse(
        { ok: false, error: { code: 'FORBIDDEN', message: `Action not allowed for caller: ${action}` } },
        requestId,
        403,
      );
    }

    // 5. Dispatch
    const handler = REGISTRY[action];
    if (!handler) {
      return gatewayResponse(
        { ok: false, error: { code: 'UNKNOWN_ACTION', message: `Unknown action: ${action}` } },
        requestId,
        404,
      );
    }

    // 6. Handlers get a SELECT-only DB — no write path exists for them.
    const ctx: GatewayContext = {
      db: createReadOnlyDb(env),
      env,
      request,
      requestId,
      userId: userClaim.sub,
    };

    const result = await handler(ctx, payload);
    logger.info('[lte-gateway] action', {
      action,
      requestId,
      userId: `${userClaim.sub.slice(0, 8)}…`,
      ok: result.ok,
    });
    return gatewayResponse(result, requestId);
  } catch (error) {
    if (error instanceof GatewayAuthError) {
      const status = error.code === 'FORBIDDEN' ? 403 : error.code === 'BAD_REQUEST' ? 400 : 401;
      return gatewayResponse(
        { ok: false, error: { code: error.code, message: error.message } },
        crypto.randomUUID(),
        status,
      );
    }
    const message = error instanceof Error ? error.message : 'Unknown gateway error';
    logger.error('[lte-gateway] Unhandled error', error instanceof Error ? error : new Error(message));
    return gatewayResponse(
      { ok: false, error: { code: 'INTERNAL_ERROR', message: 'Internal gateway error' } },
      crypto.randomUUID(),
      500,
    );
  }
};
