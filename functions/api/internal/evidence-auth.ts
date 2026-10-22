/**
 * Authentication and request validation for the internal evidence API
 * (`POST /api/internal/evidence`).
 *
 * The request body is signed end-to-end by the caller (the AI worker) with
 * a shared HMAC secret. The signature covers the exact body bytes, so every
 * field inside is bound: substituting the actor, the product, the task or
 * the requested kinds invalidates the signature. A separate sha-256 hash of
 * the same bytes is returned by the caller as the audit key.
 *
 * The local checks provide product-specific error classification; the
 * canonical ai-protocol schema also validates the final shape at runtime.
 * Build ai-protocol before deploying this product; local checks cannot
 * silently widen the shared contract.
 *
 * Verification is constant-time (WebCrypto HMAC verify) and the secret is
 * never compared with `===`.
 */

import type { PagesEnv } from '../../lib/types';
import { EvidenceRequestSchema } from '@rareminds-eym/ai-protocol';

/** Evidence kinds this endpoint may project. Mirrors the ai-protocol enum. */
export const ALLOWED_EVIDENCE_KINDS = [
  'learner.profile',
  'learner.skills',
  'assessment.summary',
  'learner.courses',
  'learner.progress',
  'opportunities.recommended',
  'course.lesson',
  'course.summary',
] as const;

/** The only product this endpoint serves. */
export const EVIDENCE_PRODUCT = 'skillpassport';

/** The only audience this endpoint answers. */
export const EVIDENCE_AUDIENCE = 'skillpassport.evidence';

/** Maximum body size accepted before parsing (bytes). */
export const EVIDENCE_MAX_BODY_BYTES = 16 * 1024;

/** Maximum request lifetime accepted. */
export const EVIDENCE_MAX_TTL_MS = 60_000;

/** Maximum evidence kinds accepted in one request (mirrors the protocol). */
export const EVIDENCE_MAX_KINDS = 6;

/** Maximum resource references accepted in one request (mirrors the protocol). */
export const EVIDENCE_MAX_RESOURCE_REFS = 20;

/**
 * Tasks this endpoint answers.
 *
 * Reviewed policy, not a pass-through: the worker's `requirements.ts` only
 * covers these actions, and an unreviewed task must never be able to name an
 * arbitrary scope. Ids are the canonical kebab-case action ids.
 */
export const EVIDENCE_TASKS = [
  'career-talent-strategist.chat',
  'career-talent-strategist.keywords',
  'senior-educator.suggest',
  'senior-educator.tutor-chat',
] as const;

/** Resource kinds this endpoint can authorize. */
export const ALLOWED_RESOURCE_KINDS = ['learner'] as const;

/** Evidence kinds are selected by task policy, never by the model. */
export function assertEvidenceKindsAllowed(task: string, kinds: string[]): void {
  assertEvidenceTaskAllowed(task);
  const allowed: readonly string[] = task === 'career-talent-strategist.chat'
    ? ALLOWED_EVIDENCE_KINDS.filter(kind => !kind.startsWith('course.'))
    : task === 'senior-educator.suggest' ? ['course.lesson'] : task === 'senior-educator.tutor-chat' ? ['course.summary'] : [];
  if (kinds.some(kind => !allowed.includes(kind))) {
    throw new EvidenceAuthError('Evidence kind is not permitted for this task', 'FORBIDDEN', 403);
  }
}

/** Bound the entire operation, including a stalled stream or dependency. */
export function awaitEvidence<T>(operation: PromiseLike<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const aborted = () => reject(new Error('Evidence request timed out'));
    if (signal.aborted) { aborted(); return; }
    signal.addEventListener('abort', aborted, { once: true });
    Promise.resolve(operation).then(resolve, reject).finally(() => signal.removeEventListener('abort', aborted));
  });
}

/** ISO-8601 UTC instant, which is the only expiry form the contract emits. */
const ISO_UTC_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/;

/**
 * UTF-8 byte length of a string, computed arithmetically.
 *
 * The product build must not take a runtime dependency on the protocol
 * package, so this mirrors `utf8Bytes` instead of importing it. A lone
 * surrogate counts as the 3 bytes of U+FFFD, matching `TextEncoder`.
 */
export function utf8Length(value: string): number {
  let bytes = 0;
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes += 4;
        i += 1;
      } else {
        bytes += 3;
      }
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

/**
 * Read the request body with a hard byte cap, enforced while streaming.
 *
 * Returns `null` when the body exceeds the cap. Reading is bounded before
 * decoding, so an oversized body is never materialized as a string.
 */
export async function readBoundedBody(
  request: Request,
  maxBytes: number,
  signal: AbortSignal = AbortSignal.timeout(2000),
): Promise<string | null> {
  const body = request.body;
  if (!body) return '';
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await awaitEvidence(reader.read(), signal);
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } finally {
    if (signal.aborted) void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

export class EvidenceAuthError extends Error {
  public readonly status: number;

  constructor(
    message: string,
    public readonly code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'BAD_REQUEST' = 'UNAUTHORIZED',
    status?: number,
  ) {
    super(message);
    this.name = 'EvidenceAuthError';
    // The HTTP status follows the code unless a caller overrides it
    // (the unconfigured-secret case answers 500, not 403).
    this.status =
      status ?? (code === 'BAD_REQUEST' ? 400 : code === 'FORBIDDEN' ? 403 : 401);
  }
}

export interface EvidenceRequestInput {
  audience: string;
  product: string;
  actorId: string;
  tenantId?: string;
  task: string;
  query?: string;
  kinds: string[];
  resources: Array<{ kind: string; id: string }>;
  expiresAt: string;
  nonce: string;
}

const encoder = new TextEncoder();

function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length === 0 || hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex)) {
    throw new EvidenceAuthError('Malformed evidence signature', 'BAD_REQUEST');
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** Read the shared secret (server-only). Fails closed when unset or too short. */
export function getEvidenceSecret(env: PagesEnv): string {
  const secret = env.EVIDENCE_SHARED_SECRET;
  if (!secret || secret.length < 32) {
    throw new EvidenceAuthError('Evidence secret is missing or too short', 'FORBIDDEN', 500);
  }
  return secret;
}

/** Sign the exact body bytes. Returns `v1=<hex hmac>`. */
export async function signEvidenceBody(secret: string, body: string): Promise<string> {
  const key = await hmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const hex = Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return `v1=${hex}`;
}

/**
 * Verify the caller's signature over the body. Throws a typed error on a
 * missing, malformed or mismatched signature.
 */
export async function verifyEvidenceBody(
  secret: string,
  body: string,
  signature: string | null,
): Promise<void> {
  if (!signature) {
    throw new EvidenceAuthError('Missing evidence signature');
  }
  const raw = signature.startsWith('v1=') ? signature.slice(3) : signature;
  let signatureBytes: Uint8Array;
  try {
    signatureBytes = hexToBytes(raw);
  } catch (error) {
    if (error instanceof EvidenceAuthError) throw error;
    throw new EvidenceAuthError('Malformed evidence signature', 'BAD_REQUEST');
  }
  const key = await hmacKey(secret);
  const valid = await crypto.subtle.verify('HMAC', key, signatureBytes, encoder.encode(body));
  if (!valid) {
    throw new EvidenceAuthError('Invalid evidence signature');
  }
}

/** sha-256 hex of the body bytes — the audit key that ties logs to the request. */
export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

const ALLOWED_FIELDS = new Set([
  'audience',
  'product',
  'actorId',
  'tenantId',
  'task',
  'query',
  'kinds',
  'resources',
  'expiresAt',
  'nonce',
]);

function isNonEmptyString(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max;
}

/**
 * Validate the decoded request body. Unknown fields are rejected so nothing
 * can be smuggled past the signature check.
 */
export function parseEvidenceRequest(value: unknown, nowMs: number = Date.now()): EvidenceRequestInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new EvidenceAuthError('Malformed evidence request', 'BAD_REQUEST');
  }
  const body = value as Record<string, unknown>;
  for (const key of Object.keys(body)) {
    if (!ALLOWED_FIELDS.has(key)) {
      throw new EvidenceAuthError(`Unknown field '${key}'`, 'BAD_REQUEST');
    }
  }
  if (body.audience !== EVIDENCE_AUDIENCE) {
    throw new EvidenceAuthError('Wrong audience', 'FORBIDDEN', 403);
  }
  if (!isNonEmptyString(body.product, 64)) {
    throw new EvidenceAuthError('Invalid product', 'BAD_REQUEST');
  }
  if (body.product !== EVIDENCE_PRODUCT) {
    throw new EvidenceAuthError('Product is not served by this endpoint', 'FORBIDDEN', 403);
  }
  if (!isNonEmptyString(body.actorId, 256)) {
    throw new EvidenceAuthError('Invalid actor', 'BAD_REQUEST');
  }
  if (body.tenantId !== undefined && !isNonEmptyString(body.tenantId, 256)) {
    throw new EvidenceAuthError('Invalid tenant', 'BAD_REQUEST');
  }
  if (!isNonEmptyString(body.task, 128)) {
    throw new EvidenceAuthError('Invalid task', 'BAD_REQUEST');
  }
  if (
    !Array.isArray(body.kinds) ||
    body.kinds.length === 0 ||
    body.kinds.length > EVIDENCE_MAX_KINDS
  ) {
    throw new EvidenceAuthError('Invalid evidence kinds', 'BAD_REQUEST');
  }
  const allowedKinds = new Set<string>(ALLOWED_EVIDENCE_KINDS);
  for (const kind of body.kinds) {
    if (!isNonEmptyString(kind, 64) || !allowedKinds.has(kind)) {
      throw new EvidenceAuthError('Evidence kind is not allowed', 'BAD_REQUEST');
    }
  }
  if (
    !Array.isArray(body.resources) ||
    body.resources.length > EVIDENCE_MAX_RESOURCE_REFS
  ) {
    throw new EvidenceAuthError('Invalid resources', 'BAD_REQUEST');
  }
  const resources: Array<{ kind: string; id: string }> = [];
  for (const entry of body.resources) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      throw new EvidenceAuthError('Invalid resource reference', 'BAD_REQUEST');
    }
    const record = entry as Record<string, unknown>;
    const keys = Object.keys(record);
    // Strict shape, like the canonical schema: extra keys are not silently
    // dropped, because the signature binds whatever the caller sent.
    if (keys.length !== 2 || !keys.includes('kind') || !keys.includes('id')) {
      throw new EvidenceAuthError('Invalid resource reference', 'BAD_REQUEST');
    }
    if (!isNonEmptyString(record.kind, 64) || !isNonEmptyString(record.id, 256)) {
      throw new EvidenceAuthError('Invalid resource reference', 'BAD_REQUEST');
    }
    resources.push({ kind: record.kind, id: record.id });
  }
  if (!isNonEmptyString(body.expiresAt, 64) || !ISO_UTC_PATTERN.test(body.expiresAt)) {
    throw new EvidenceAuthError('Invalid expiry', 'BAD_REQUEST');
  }
  const expiresAtMs = Date.parse(body.expiresAt);
  if (Number.isNaN(expiresAtMs)) {
    throw new EvidenceAuthError('Invalid expiry', 'BAD_REQUEST');
  }
  if (expiresAtMs <= nowMs) {
    throw new EvidenceAuthError('Evidence request expired');
  }
  if (expiresAtMs - nowMs > EVIDENCE_MAX_TTL_MS) {
    throw new EvidenceAuthError('Evidence request lifetime too long', 'BAD_REQUEST');
  }
  if (!isNonEmptyString(body.nonce, 128) || body.nonce.length < 16) {
    throw new EvidenceAuthError('Invalid nonce', 'BAD_REQUEST');
  }
  if (!EvidenceRequestSchema.safeParse(body).success) {
    throw new EvidenceAuthError('Evidence request does not match the shared contract', 'BAD_REQUEST');
  }
  return {
    audience: body.audience,
    product: body.product,
    actorId: body.actorId,
    ...(body.tenantId !== undefined ? { tenantId: body.tenantId as string } : {}),
    task: body.task,
    ...(body.query !== undefined ? { query: body.query as string } : {}),
    kinds: body.kinds as string[],
    resources,
    expiresAt: body.expiresAt,
    nonce: body.nonce,
  };
}

/**
 * Authorize the requested task against the reviewed allowlist.
 *
 * A well-formed but unreviewed task is refused rather than served with a
 * guessed scope: the worker's requirements policy and this list must agree.
 */
export function assertEvidenceTaskAllowed(task: string): void {
  if (!(EVIDENCE_TASKS as readonly string[]).includes(task)) {
    throw new EvidenceAuthError('Task is not served by this endpoint', 'FORBIDDEN', 403);
  }
}

/**
 * Refuse a tenant-scoped request.
 *
 * This product cannot verify tenancy (`learners` carries no tenant column),
 * so a supplied tenant is refused instead of being ignored: silently
 * dropping it would serve one tenant's evidence under another's claim.
 */
export function assertEvidenceTenantUnsupported(tenantId: string | undefined): void {
  if (tenantId !== undefined) {
    throw new EvidenceAuthError('Tenant scope is not supported by this endpoint', 'FORBIDDEN', 403);
  }
}

/**
 * Authorize the resource kinds the caller named. An unknown kind cannot be
 * ownership-checked, so it is refused rather than ignored.
 */
export function assertResourceKindsAllowed(
  resources: Array<{ kind: string; id: string }>,
  task?: string,
): void {
  const allowed: readonly string[] = task === 'senior-educator.suggest' || task === 'senior-educator.tutor-chat' ? ['course', 'lesson'] : ALLOWED_RESOURCE_KINDS;
  for (const resource of resources) {
    if (!allowed.includes(resource.kind)) {
      throw new EvidenceAuthError('Resource kind is not served by this endpoint', 'FORBIDDEN', 403);
    }
  }
}

/**
 * Verify the caller's request hash against the body bytes actually received.
 * The hash is the audit key that ties the receiver's logs to the request it
 * served; a mismatch means the header and the body disagree.
 */
export async function verifyRequestHash(body: string, provided: string | null): Promise<void> {
  if (!provided || !/^[0-9a-f]{64}$/i.test(provided)) {
    throw new EvidenceAuthError('Missing or malformed request hash', 'BAD_REQUEST');
  }
  const actual = await sha256Hex(body);
  if (actual.toLowerCase() !== provided.toLowerCase()) {
    throw new EvidenceAuthError('Request hash does not match the body', 'BAD_REQUEST');
  }
}
