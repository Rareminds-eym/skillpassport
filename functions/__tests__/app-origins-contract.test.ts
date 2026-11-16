// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createSsoGateway } from '@rareminds-eym/sso-gateway';
import { APPROVED_ORIGINS } from '../lib/app-origins';

const gateway = (origins: readonly string[]) => createSsoGateway({
  sso: { getJwks: async () => { throw new Error('Unexpected SSO call during configuration'); } } as never,
  issuer: 'sso-api',
  audience: 'sso-client',
  basePath: '/api/auth',
  approvedOrigins: [...origins],
  csrf: { name: 'X-RM-CSRF', value: '1' },
  cookieMaxAgeSeconds: 604800,
  ssoRequestTimeoutMs: 5000,
});

describe('browser origin configuration contract', () => {
  it('constructs the real gateway with the canonical origin list', () => {
    expect(APPROVED_ORIGINS).toContain('https://skillpassport-qa.pages.dev');
    expect(() => gateway(APPROVED_ORIGINS)).not.toThrow();
  });

  it('reproduces the deployed wildcard rejection before any SSO call', () => {
    const origins = [...APPROVED_ORIGINS];
    origins.splice(5, 0, 'https://*.skillpassport-qa.pages.dev');
    expect(() => gateway(origins)).toThrow('approvedOrigins[5] must not be wildcard or opaque');
  });
});
