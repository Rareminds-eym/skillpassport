/**
 * Canonical browser-origin allowlist for SkillPassport Pages Functions.
 *
 * Single source of truth consumed by:
 * - functions/lib/auth.ts (auth-core + sso-gateway CORS/origin config)
 * - functions/api/oauth/google (OAuth redirect_uri + callback origin checks)
 *
 * Keep values exact (scheme + host + port). localhost entries exist for dev;
 * production must always be HTTPS.
 */
export const APPROVED_ORIGINS: readonly string[] = Object.freeze([
  'https://skillpassport.rareminds.in',
  'https://skillpassport-dev-bcp.pages.dev',
  'https://skillpassport-qa.pages.dev',
  'http://localhost:3000',
  'http://localhost:8787',
  'http://localhost:8788',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:8787',
  'http://127.0.0.1:8788',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:4173',
]);

/** An exact preview origin is permitted only for explicitly local runtimes. */
export function getApprovedOrigins(env: Record<string, unknown>): readonly string[] {
  if (env.ENVIRONMENT !== 'local' || env.DEV_PUBLIC_ORIGIN === undefined) return APPROVED_ORIGINS;
  const value = env.DEV_PUBLIC_ORIGIN;
  if (typeof value !== 'string') throw new Error('DEV_PUBLIC_ORIGIN must be an exact HTTPS origin');
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.origin !== value || url.username || url.password || url.hostname.includes('*')) {
    throw new Error('DEV_PUBLIC_ORIGIN must be an exact HTTPS origin');
  }
  return [...new Set([...APPROVED_ORIGINS, value])];
}
