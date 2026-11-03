import { beforeEach, describe, expect, it, vi } from 'vitest';
const fixture = vi.hoisted(() => ({ metadata: { must_change_password: true } as Record<string, unknown> }));
vi.mock('@rareminds-eym/auth-core', () => ({ createAuth: () => ({
  authenticate: (handler: any) => (request: Request) => handler(request, { user: {
    sub: 'trainer-1', is_email_verified: true, user_metadata: fixture.metadata,
  } }),
}) }));
import { withAuth } from '../auth';
describe('temporary educator password server gate', () => {
  beforeEach(() => { fixture.metadata = { must_change_password: true }; });
  it('denies business handlers before any teaching data can be accessed', async () => {
    const handler = vi.fn();
    const response = await withAuth(handler)({ request: new Request('https://app.example/api/educator/actions'),
      env: { SSO_SERVICE: {} }, data: {} });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ code: 'PASSWORD_CHANGE_REQUIRED' });
    expect(handler).not.toHaveBeenCalled();
  });
});
