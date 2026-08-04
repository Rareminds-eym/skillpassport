/**
 * Service-to-service authentication for the LTE ↔ SkillPassport internal gateway.
 *
 * Two independent tokens are required on every request:
 *
 *  1. SERVICE TOKEN (Authorization: Bearer <token>)
 *       HS256-HMAC-signed compact token: `<b64url(header)>.<b64url(claims)>.<b64url(sig)>`
 *       Claims: { app: "lte", actions: ["learning-track:get", ...], iat, exp, nbf? }
 *       Signed with the shared `LTE_INTERNAL_SECRET`. Proves the caller is the
 *       LTE service and that this action is in its granted scope.
 *
 *  2. PER-USER CLAIM (X-Lte-Claim + X-Lte-Sig)
 *       claim = b64url({ sub: <userId>, exp: now + 60s })
 *       sig   = HMAC-SHA256(secret, claim) b64url
 *       Binds every request to ONE user and expires in 60s, so a leaked token
 *       cannot be replayed to enumerate other learners.
 *
 * Verification is constant-time (WebCrypto HMAC verify). The secret itself is
 * compared via the same HMAC trick (safeEqual) — never `===`.
 */

import type { PagesEnv } from '../../../../lib/types';
import { isValidUUID } from '../../../../lib/validation';

export class GatewayAuthError extends Error {
  constructor(
    message: string,
    public readonly code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'BAD_REQUEST' = 'UNAUTHORIZED',
  ) {
    super(message);
    this.name = 'GatewayAuthError';
  }
}

export interface ServiceTokenClaims {
  app: string;
  actions: string[];
  iat: number;
  exp: number;
  nbf?: number;
}

export interface UserClaim {
  sub: string;
  exp: number;
}

const encoder = new TextEncoder();

function b64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function b64urlDecode(input: string): Uint8Array {
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function b64urlDecodeString(input: string): string {
  return new TextDecoder().decode(b64urlDecode(input));
}

/**
 * Safe variants: malformed base64url must surface as a clean GatewayAuthError
 * (401), never an uncaught atob() DOMException (which the gateway would turn
 * into a 500).
 */
function b64urlDecodeSafe(input: string): Uint8Array {
  try {
    return b64urlDecode(input);
  } catch {
    throw new GatewayAuthError('Invalid token encoding', 'BAD_REQUEST');
  }
}

function b64urlDecodeStringSafe(input: string): string {
  try {
    return b64urlDecodeString(input);
  } catch {
    throw new GatewayAuthError('Invalid token encoding', 'BAD_REQUEST');
  }
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

/**
 * Constant-time-ish equality for string secrets. Both values are HMAC'd with a
 * fixed key and the digests compared byte-by-byte with a running XOR.
 */
export async function safeEqual(a: string, b: string): Promise<boolean> {
  const key = await hmacKey('opengsd-internal-gateway-const-time');
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

export async function signServiceToken(
  secret: string,
  claims: ServiceTokenClaims,
): Promise<string> {
  const key = await hmacKey(secret);
  const header = b64urlEncode(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'svc' })));
  const payload = b64urlEncode(encoder.encode(JSON.stringify(claims)));
  const data = `${header}.${payload}`;
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return `${data}.${b64urlEncode(new Uint8Array(sig))}`;
}

export async function verifyServiceToken(
  secret: string,
  token: string,
): Promise<ServiceTokenClaims> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new GatewayAuthError('Malformed service token');

  const [header, payload, signature] = parts as [string, string, string];
  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    b64urlDecodeSafe(signature),
    encoder.encode(`${header}.${payload}`),
  );
  if (!valid) throw new GatewayAuthError('Invalid service token signature');

  let claims: unknown;
  try {
    claims = JSON.parse(b64urlDecodeStringSafe(payload));
  } catch {
    throw new GatewayAuthError('Invalid service token payload');
  }

  const c = claims as Partial<ServiceTokenClaims>;
  if (typeof c.app !== 'string' || !Array.isArray(c.actions) || typeof c.iat !== 'number' || typeof c.exp !== 'number') {
    throw new GatewayAuthError('Invalid service token claims');
  }
  if (!c.actions.every((a) => typeof a === 'string')) {
    throw new GatewayAuthError('Invalid service token actions');
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec > c.exp) throw new GatewayAuthError('Service token expired');
  if (typeof c.nbf === 'number' && nowSec < c.nbf) throw new GatewayAuthError('Service token not yet valid');

  return c as ServiceTokenClaims;
}

export async function signUserClaim(secret: string, sub: string, ttlSeconds = 60): Promise<{ claim: string; sig: string }> {
  if (!isValidUUID(sub)) throw new GatewayAuthError('User claim subject must be a UUID', 'BAD_REQUEST');
  const claim = b64urlEncode(encoder.encode(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + ttlSeconds })));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(claim));
  return { claim, sig: b64urlEncode(new Uint8Array(sig)) };
}

export async function verifyUserClaim(secret: string, claim: string, signature: string): Promise<UserClaim> {
  if (!claim || !signature) throw new GatewayAuthError('Missing user claim');

  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify('HMAC', key, b64urlDecodeSafe(signature), encoder.encode(claim));
  if (!valid) throw new GatewayAuthError('Invalid user claim signature');

  let payload: unknown;
  try {
    payload = JSON.parse(b64urlDecodeStringSafe(claim));
  } catch {
    throw new GatewayAuthError('Invalid user claim payload');
  }

  const c = payload as Partial<UserClaim>;
  if (typeof c.sub !== 'string' || !isValidUUID(c.sub)) {
    throw new GatewayAuthError('Invalid user claim subject', 'BAD_REQUEST');
  }
  if (typeof c.exp !== 'number' || Math.floor(Date.now() / 1000) > c.exp) {
    throw new GatewayAuthError('User claim expired');
  }

  return { sub: c.sub, exp: c.exp };
}

/** Read the shared gateway secret from the environment (throws a typed error if unset). */
export function getGatewaySecret(env: PagesEnv): string {
  const secret = env.LTE_INTERNAL_SECRET;
  if (!secret || secret.length < 32) {
    throw new GatewayAuthError('Gateway secret is missing or too short', 'FORBIDDEN');
  }
  return secret;
}
