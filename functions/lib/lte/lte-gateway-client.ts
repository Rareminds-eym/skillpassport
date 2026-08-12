import { z } from 'zod';
import { getGatewaySecret, signServiceToken, signUserClaim } from '../../api/internal/lte/v1/auth';

/** Single gateway endpoint on LTE (dispatcher at functions/api/internal/skillpassport). */
const GATEWAY_PATH = '/api/internal/skillpassport';

/** Caller app id for the service token — MUST match LTE contract.ts. */
export const CALLER_APP = 'skillpassport';

/** Actions this caller performs on LTE — add here as new wrappers are added. */
export const SUPPORTED_ACTIONS = ['capabilities:get'] as const;
export type LteAction = (typeof SUPPORTED_ACTIONS)[number];

const LTE_TIMEOUT_MS = 2000;

/** Typed failure from a gateway call so callers map failures consistently. */
export class LteGatewayError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'LteGatewayError';
  }
}

const EnvelopeSchema = z.object({
  ok: z.boolean(),
  data: z.unknown().optional(),
  error: z.object({ code: z.string(), message: z.string() }).optional(),
});

/**
 * Generic SP → LTE authenticated gateway caller. Handles service-token signing,
 * the per-user claim, timeout, and response-envelope parsing ONCE here — add a
 * new LTE action as a thin typed wrapper over this function rather than
 * reimplementing auth/timeout/envelope. `action` is constrained to
 * SUPPORTED_ACTIONS so a new action is also registered in one place.
 */
export async function callLteGateway<T = unknown>(
  env: Record<string, string>,
  action: LteAction,
  payload: Record<string, unknown>,
  userId: string,
): Promise<T> {
  const lteUrl = (env.LTE_APP_URL ?? '').replace(/\/+$/, '');
  if (!lteUrl) throw new LteGatewayError('LTE_APP_URL is not configured', 'MISCONFIGURED');

  const secret = getGatewaySecret(env as never);
  const nowSec = Math.floor(Date.now() / 1000);
  const [serviceToken, userClaim] = await Promise.all([
    signServiceToken(secret, { app: CALLER_APP, actions: [action], iat: nowSec, exp: nowSec + 300 }),
    signUserClaim(secret, userId),
  ]);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LTE_TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${lteUrl}${GATEWAY_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serviceToken}`,
        'X-Lte-Claim': userClaim.claim,
        'X-Lte-Sig': userClaim.sig,
      },
      body: JSON.stringify({ action, requestId: crypto.randomUUID(), payload }),
      signal: controller.signal,
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    throw new LteGatewayError(aborted ? 'LTE pull timed out' : 'LTE pull unreachable', 'UNAVAILABLE');
  } finally {
    clearTimeout(timer);
  }

  const raw: unknown = await response.json().catch(() => null);
  const parsed = EnvelopeSchema.safeParse(raw);
  if (!parsed.success || parsed.data.ok !== true) {
    const message =
      parsed.success && parsed.data.error?.message
        ? parsed.data.error.message
        : `LTE gateway returned ${response.status}`;
    throw new LteGatewayError(`LTE gateway action failed: ${message}`, 'GATEWAY_ERROR');
  }
  return parsed.data.data as T;
}
