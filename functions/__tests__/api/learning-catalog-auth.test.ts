// @vitest-environment node
// Real app middleware and auth-core JWT verification; only external services are fixtures.
import { webcrypto } from 'node:crypto';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  snapshot: vi.fn(), refresh: vi.fn(), entitled: vi.fn(),
}));
vi.mock('../../lib/supabase', () => ({ getServiceClient: () => ({}) }));
vi.mock('../../lib/entitlements', () => ({
  hasFeatureEntitlement: mocks.entitled, hasAnyFeature: vi.fn(),
}));
vi.mock('../../lib/learning-eligibility', async () => ({
  ...await vi.importActual<any>('../../lib/learning-eligibility'),
  readLearningSnapshot: mocks.snapshot, refreshLearningCatalog: mocks.refresh,
}));
import { onRequestGet } from '../../api/learning/catalog';

let pair: Awaited<ReturnType<typeof generateKeyPair>>;
let publicKey: Awaited<ReturnType<typeof exportJWK>>;
beforeAll(async () => {
  vi.stubGlobal('crypto', webcrypto);
  pair = await generateKeyPair('RS256');
  publicKey = await exportJWK(pair.publicKey);
});
afterAll(() => vi.unstubAllGlobals());
beforeEach(() => {
  mocks.snapshot.mockReset().mockResolvedValue({ levels: [] });
  mocks.refresh.mockReset().mockResolvedValue(undefined);
  mocks.entitled.mockReset().mockResolvedValue(false);
});
async function token(overrides: Record<string, unknown> = {}, audience = 'sso-client') {
  return new SignJWT({
    email: 'fixture@example.invalid', org_id: 'fixture-org', roles: ['hr'],
    products: ['passport'], membership_status: 'active', is_email_verified: true,
    ...overrides,
  }).setProtectedHeader({ alg: 'RS256', kid: 'catalogue-test', typ: 'JWT' })
    .setSubject('fixture-user').setIssuer('sso-api').setAudience(audience)
    .setIssuedAt().setExpirationTime('5m').sign(pair.privateKey);
}
function context(accessToken?: string) {
  return {
    request: new Request('https://fixture.invalid/api/learning/catalog', {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    }),
    env: {
      HEAL_MODE: 'disabled',
      SSO_SERVICE: {
        getJwks: async ({ correlationId }: { correlationId: string }) => ({
          kind: 'succeeded', correlationId, freshnessSeconds: 60,
          keys: [{ ...publicKey, kid: 'catalogue-test', alg: 'RS256', use: 'sig', status: 'active' }],
        }),
      },
    },
  };
}
it('rejects unauthenticated requests before reading the catalogue', async () => {
  expect((await onRequestGet(context())).status).toBe(401);
  expect(mocks.snapshot).not.toHaveBeenCalled();
});
it('rejects invalid tokens before reading the catalogue', async () => {
  expect((await onRequestGet(context('invalid-token'))).status).toBe(401);
  expect(mocks.snapshot).not.toHaveBeenCalled();
});
it('retains verified-email enforcement for otherwise valid tokens', async () => {
  const response = await onRequestGet(context(await token({ is_email_verified: false })));
  expect(response.status).toBe(403);
  expect((await response.json()).code).toBe('EMAIL_NOT_VERIFIED');
  expect(mocks.snapshot).not.toHaveBeenCalled();
});
it('verifies an HR token and serves the catalogue without an entitlement lookup', async () => {
  const response = await onRequestGet(context(await token()));
  expect(response.status).toBe(200);
  expect((await response.json()).data).toEqual({ levels: [] });
  expect(mocks.snapshot).toHaveBeenCalledOnce();
  expect(mocks.entitled).not.toHaveBeenCalled();
});
it('rejects a correctly signed token for another audience', async () => {
  const response = await onRequestGet(context(await token({}, 'another-app')));
  expect(response.status).toBe(401);
  expect(mocks.snapshot).not.toHaveBeenCalled();
});
