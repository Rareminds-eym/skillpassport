import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ authenticate: vi.fn(), gateway: vi.fn() }));
vi.mock('../lib/auth', () => ({
  withAuthAllowUnverified: (handler: (context: any) => Promise<Response>) => async (context: any) => {
    const rejected = mocks.authenticate(context.request);
    return rejected ?? handler(context);
  },
  getSsoGatewayInstance: () => ({ handleBrowserRequest: mocks.gateway }),
}));
vi.mock('../api/storage/config/fileSizeLimits', () => ({ validateFileSizeConfig: vi.fn() }));
import { onRequestPost } from '../api/auth/change-password';
import { onRequest } from '../_middleware';

const changePassword = vi.fn();
function context(body: unknown = { current_password: 'OldPassword123!', new_password: 'NewPassword123!' }) {
  return {
    request: new Request('http://localhost:8788/api/auth/change-password', {
      method: 'POST', headers: { Origin: 'http://localhost:8788', Cookie: '__Host-rm-refresh=current-refresh', Authorization: 'Bearer test-token', 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }), env: { SSO_SERVICE: { changePassword } }, next: vi.fn(async () => new Response('handler')),
  };
}
beforeEach(() => { vi.resetAllMocks(); changePassword.mockResolvedValue({ success: true }); });
describe('signed-in password change', () => {
  it('routes the request to Pages instead of the unsupported gateway route', async () => {
    const ctx = context();
    expect(await (await onRequest(ctx as any)).text()).toBe('handler');
    expect(ctx.next).toHaveBeenCalledOnce();
    expect(mocks.gateway).not.toHaveBeenCalled();
  });
  it('keeps reset-link requests in the gateway', async () => {
    const ctx = context(); ctx.request = new Request('http://localhost:8788/api/auth/password/reset');
    mocks.gateway.mockResolvedValue(new Response('gateway'));
    expect(await (await onRequest(ctx as any)).text()).toBe('gateway');
    expect(ctx.next).not.toHaveBeenCalled();
  });
  it('forwards only credentials, never a client-supplied account', async () => {
    const response = await onRequestPost(context({ current_password: 'old', new_password: 'new', user_id: 'other-user' }));
    expect(response.status).toBe(200);
    expect((await response.json()).success).toBe(true);
    expect(changePassword).toHaveBeenCalledWith({ access_token: 'test-token', current_refresh_token: 'current-refresh', current_password: 'old', new_password: 'new' });
  });
  it('does not call SSO after an authentication rejection', async () => {
    mocks.authenticate.mockReturnValue(new Response(null, { status: 401 }));
    expect((await onRequestPost(context())).status).toBe(401);
    expect(changePassword).not.toHaveBeenCalled();
  });
  it('rejects an untrusted browser origin', async () => {
    const ctx = context(); ctx.request.headers.set('Origin', 'https://untrusted.example');
    expect((await onRequestPost(ctx)).status).toBe(403);
    expect(changePassword).not.toHaveBeenCalled();
  });
  it('does not accept cookie-only requests', async () => {
    const ctx = context(); ctx.request.headers.delete('Authorization');
    ctx.request.headers.set('Cookie', 'rm_sso_session=test');
    expect((await onRequestPost(ctx)).status).toBe(401);
    expect(changePassword).not.toHaveBeenCalled();
  });
  it.each(['', '__Host-rm-refresh=a; __Host-rm-refresh=b'])('rejects missing or ambiguous session cookies', async cookie => {
    const ctx = context(); ctx.request.headers.set('Cookie', cookie);
    expect((await onRequestPost(ctx)).status).toBe(401);
    expect(changePassword).not.toHaveBeenCalled();
  });
  it('rejects malformed password input', async () => {
    expect((await onRequestPost(context({ current_password: [], new_password: 'new' }))).status).toBe(400);
    expect(changePassword).not.toHaveBeenCalled();
  });
  it.each([
    ['Current password is incorrect', 400], ['Rate limit exceeded', 429], ['Invalid or expired access token', 401],
  ])('maps %s without losing the failure', async (message, status) => {
    changePassword.mockRejectedValue(new Error(message));
    const response = await onRequestPost(context());
    expect(response.status).toBe(status);
    expect((await response.json()).error.message).toBe(message);
  });
  it('does not expose unexpected backend errors', async () => {
    changePassword.mockRejectedValue(new Error('private database detail'));
    const response = await onRequestPost(context());
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain('private database detail');
  });
});
