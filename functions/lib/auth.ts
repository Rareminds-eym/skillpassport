import { initAuth, withAuth, requireRole, requireProduct } from '@rareminds-eym/auth-core';

/**
 * Auth-core is initialized lazily on first request.
 * In Cloudflare Pages Functions, env vars are only available per-request,
 * but auth-core only needs to be initialized once.
 */
let initialized = false;

function ensureInit(ssoDomain?: string) {
  if (!initialized) {
    initAuth({ ssoDomain: ssoDomain || 'https://sso-api.rareminds.workers.dev' });
    initialized = true;
  }
}

// Initialize with default SSO domain (production).
// Pages Functions will call ensureInit() on first request if SSO_DOMAIN env is set.
ensureInit();

export { withAuth, requireRole, requireProduct, ensureInit };

