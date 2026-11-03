// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAuthClient } from '@rareminds-eym/auth-client';

afterEach(() => vi.unstubAllGlobals());
function browser(metadata: Record<string, unknown>, session = false, meMetadata = metadata) {
  const identity = { subject: 'educator-fixture', email: 'educator@example.test', organizationId: 'platform',
    roles: ['educator'], products: [], membershipStatus: 'active', emailVerified: true, userMetadata: metadata };
  vi.stubGlobal('window', {}); vi.stubGlobal('document', {});
  vi.stubGlobal('location', { href: 'https://app.example/login', protocol: 'https:' });
  vi.stubGlobal('isSecureContext', true);
  vi.stubGlobal('navigator', { locks: { request() {} } });
  vi.stubGlobal('BroadcastChannel', class { addEventListener() {} removeEventListener() {} postMessage() {} close() {} });
  vi.stubGlobal('localStorage', { getItem() { return null; }, setItem() {}, removeItem() {} });
  vi.stubGlobal('fetch', async (url: string) => new Response(JSON.stringify(url.endsWith('/me') ? {status:'succeeded',data:{...identity,userMetadata:meMetadata}} : {
    ok: true, credential: { accessToken: 'private.access.token' }, identity, outcome: session ? 'rotated' : 'created', ...(session?{}:{data:{identity}}),
  }), { status: 200, headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache',
    Expires: 'Thu, 01 Jan 1970 00:00:00 GMT', 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff' } }));
  return createAuthClient({ namespace: 'educator-contract', origin: 'https://app.example', csrf: { name: 'X-RM-CSRF', value: '1' } });
}

describe('installed browser SDK educator login contract', () => {
  it.each([true,false])('restores the educator refresh session when first-login setup required=%s',async required=>{
    const client=browser({first_login_setup_required:required,portal_mode:'assigned_trainer'},true);
    try{const result=await client.initialize();expect(result.status).toBe('authenticated');expect(client.getState().identity?.roles).toContain('educator');expect(client.getState().identity?.userMetadata).toMatchObject({first_login_setup_required:required});const me=await client.getMe();expect(me.status).toBe('succeeded');}finally{client.destroy();}
  });
  it('reproduces reload failure when session succeeds but me returns the raw stored flag',async()=>{
    const client=browser({first_login_setup_required:false,portal_mode:'assigned_trainer'},true,{must_change_password:false,portal_mode:'assigned_trainer'});
    try{expect((await client.initialize()).status).toBe('authenticated');await expect(client.getMe()).rejects.toMatchObject({code:'INVALID_RESPONSE'});}finally{client.destroy();}
  });
  it('reproduces the invalid response from the old password-shaped metadata key', async () => {
    const client = browser({ must_change_password: true, portal_mode: 'assigned_trainer' });
    try { await expect(client.login({ email: 'educator@example.test', password: 'fixture-only' })).rejects.toMatchObject({ code: 'INVALID_RESPONSE' }); }
    finally { client.destroy(); }
  });
  it.each([true, false])('accepts the safe first-login policy when required=%s', async required => {
    const client = browser({ first_login_setup_required: required, portal_mode: 'assigned_trainer' });
    try {
      const result = await client.login({ email: 'educator@example.test', password: 'fixture-only' });
      expect(result.status).toBe('succeeded');
      expect(client.getState().identity?.userMetadata).toMatchObject({ first_login_setup_required: required });
    } finally { client.destroy(); }
  });
});
