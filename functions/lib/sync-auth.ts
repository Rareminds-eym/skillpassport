/**
 * Service-to-service webhook authentication for the /sync/* family and
 * /api/sync/check-user.
 *
 * Mirrors the constant-time comparison pattern from
 * api/internal/lte/v1/auth.ts (`safeEqual`): both values are HMAC'd under a
 * fixed key and digests compared byte-by-byte — never `===`.
 *
 * Fail-closed by design: if INTERNAL_WEBHOOK_SECRET is not configured, every
 * request is rejected (401) and an error is logged so misconfiguration is
 * immediately visible.
 */

const encoder = new TextEncoder();

async function hmacKey(keyMaterial: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(keyMaterial),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

/** Constant-time-ish equality for string secrets. */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const key = await hmacKey('skillpassport-sync-webhook-const-time');
  const [da, db] = await Promise.all([
    crypto.subtle.sign('HMAC', key, encoder.encode(a)),
    crypto.subtle.sign('HMAC', key, encoder.encode(b)),
  ]);
  const ua = new Uint8Array(da);
  const ub = new Uint8Array(db);
  if (ua.length !== ub.length) return false;
  let diff = 0;
  for (let i = 0; i < ua.length; i++) diff |= ua[i] ^ ub[i];
  return diff === 0;
}

export type WebhookAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 500; message: string };

/**
 * Verifies `Authorization: Bearer <INTERNAL_WEBHOOK_SECRET>`.
 *
 * - Missing/invalid secret in request → 401 UNAUTHORIZED.
 * - Secret not configured server-side → 500 (fail-closed) + error log, so a
 *   deployment without the var breaks loudly instead of silently opening the
 *   endpoint.
 */
export async function verifyWebhookSecret(
  request: Request,
  configuredSecret: string | undefined,
): Promise<WebhookAuthResult> {
  if (!configuredSecret) {
    console.error('[sync-auth] INTERNAL_WEBHOOK_SECRET is not configured — rejecting all sync requests');
    return { ok: false, status: 500, message: 'Webhook secret not configured' };
  }

  const provided = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim() ?? '';
  if (provided.length === 0 || !(await safeEqual(provided, configuredSecret))) {
    return { ok: false, status: 401, message: 'Invalid or missing internal webhook secret' };
  }
  return { ok: true };
}
