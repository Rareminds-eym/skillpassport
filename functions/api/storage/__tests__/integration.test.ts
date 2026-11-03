// @vitest-environment node
/**
 * Exercises the real storage router and auth-core SSO JWT verifier. Normal runs
 * use an ephemeral signing key, a JWKS service-binding fixture and memory R2.
 * test:storage:live uses a running Pages server and two SSO-issued access tokens.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { decodeJwt, exportJWK, generateKeyPair, SignJWT } from 'jose';
import { onRequest } from '../[[path]]';

const live = process.env.STORAGE_INTEGRATION === '1';
const apiUrl = (process.env.STORAGE_API_URL || 'http://localhost:8788/api/storage').replace(/\/$/, '');
const users = [
  { id: '11111111-1111-4111-8111-111111111111', token: '' },
  { id: '22222222-2222-4222-8222-222222222222', token: '' },
];
const uploaded: string[] = [];
let env: Record<string, unknown>;
let expiredToken: string;

async function request(path: string, options: RequestInit = {}, token?: string): Promise<Response> {
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const req = new Request(`${apiUrl}${path}`, { ...options, headers });
  if (live) return fetch(req, { signal: AbortSignal.timeout(15000) });
  return onRequest({ request: req, env, params: {}, data: {} } as Parameters<typeof onRequest>[0]);
}

function json(body: unknown): RequestInit {
  return { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

function fileBody(filename = 'integration-test.txt'): FormData {
  const body = new FormData();
  body.append('file', new Blob(['storage integration test'], { type: 'text/plain' }), filename);
  body.append('filename', filename);
  return body;
}

async function upload(filename: string): Promise<{ key: string; url: string }> {
  const response = await request('/upload', { method: 'POST', body: fileBody(filename) }, users[0].token);
  expect(response.status, await response.clone().text()).toBe(200);
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.key).toMatch(new RegExp(`^uploads/${users[0].id}/`));
  expect(body.url).toEqual(expect.any(String));
  uploaded.push(body.key);
  return body;
}

// Auth-core and storage handlers expose structured error envelopes; assertions
// target their stable codes rather than assuming every layer uses the same text.
async function errorCode(response: Response): Promise<string> {
  const body = await response.json();
  expect(body.error).toEqual(expect.objectContaining({ code: expect.any(String), message: expect.any(String) }));
  return body.error.code;
}

beforeAll(async () => {
  if (live) {
    for (const [index, user] of users.entries()) {
      const token = process.env[`STORAGE_TEST_USER_${index + 1}_TOKEN`];
      if (!token) throw new Error(`STORAGE_TEST_USER_${index + 1}_TOKEN must contain an SSO-issued access token`);
      const claims = decodeJwt(token);
      if (!claims.sub || !claims.exp || claims.exp <= Date.now() / 1000) {
        throw new Error(`Storage test user ${index + 1} needs a subject and an unexpired access token`);
      }
      user.id = claims.sub;
      user.token = token;
    }
    if (users[0].id === users[1].id) throw new Error('Storage tests require two distinct SSO users');
    expiredToken = 'eyJhbGciOiJSUzI1NiJ9.eyJleHAiOjF9.invalid';
    return;
  }

  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const key = { ...await exportJWK(publicKey), kid: 'storage-integration', alg: 'RS256', use: 'sig', status: 'active' };
  const tokenFor = (id: string, expires: number) => new SignJWT({
    email: `${id}@example.test`, org_id: '33333333-3333-4333-8333-333333333333', roles: ['learner'], products: ['passport'],
    membership_status: 'active', is_email_verified: true,
  }).setProtectedHeader({ alg: 'RS256', kid: key.kid, typ: 'JWT' })
    .setSubject(id).setIssuer('sso-api').setAudience('sso-client')
    .setIssuedAt(Math.floor(Date.now() / 1000) - 120).setExpirationTime(expires).sign(privateKey);
  for (const user of users) user.token = await tokenFor(user.id, Math.floor(Date.now() / 1000) + 300);
  expiredToken = await tokenFor(users[0].id, Math.floor(Date.now() / 1000) - 60);
  const objects = new Map<string, ArrayBuffer>();
  env = {
    SSO_SERVICE: {
      getJwks: async ({ correlationId }: { correlationId: string }) => ({
        kind: 'succeeded', correlationId, keys: [key], freshnessSeconds: 60,
      }),
    },
    R2_BUCKET: {
      put: async (key: string, value: ArrayBuffer) => { objects.set(key, value); },
      delete: async (key: string) => { objects.delete(key); },
    },
    SUPABASE_URL: 'http://127.0.0.1:54321', SUPABASE_ANON_KEY: 'test-anon',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service', HEAL_MODE: 'disabled',
  };
});

afterAll(async () => {
  // Only keys returned by this suite's uploads are eligible for cleanup.
  for (const key of uploaded) {
    const response = await request('/delete', json({ key }), users[0].token);
    expect(response.status).toBe(200);
  }
});

describe(`Storage API integration (${live ? 'live SSO / R2' : 'SSO JWT verification / memory R2'})`, () => {
  it('allows the public health check', async () => {
    const response = await request('/');
    expect(response.status).toBe(200);
    expect((await response.json()).service).toBe('storage-api');
  });

  it('handles CORS preflight without authentication', async () => {
    const response = await request('/upload', { method: 'OPTIONS' });
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
  });

  it('keeps certificate verification public', async () => {
    expect((await request('/course-certificate')).status).toBe(400);
  });

  it('requires authentication for content extraction', async () => {
    expect((await request('/extract-content', json({}))).status).toBe(401);
  });

  it('rejects upload without a token', async () => {
    const response = await request('/upload', { method: 'POST', body: fileBody() });
    expect(response.status).toBe(401);
    expect(await errorCode(response)).toEqual(expect.any(String));
  });

  it('rejects a malformed token', async () => {
    expect((await request('/upload', { method: 'POST', body: fileBody() }, 'invalid-token')).status).toBe(401);
  });

  it('rejects an expired token', async () => {
    expect((await request('/upload', { method: 'POST', body: fileBody() }, expiredToken)).status).toBe(401);
  });

  it('rejects a tampered SSO signature', async () => {
    const parts = users[0].token.split('.');
    parts[2] = `${parts[2][0] === 'A' ? 'B' : 'A'}${parts[2].slice(1)}`;
    expect((await request('/upload', { method: 'POST', body: fileBody() }, parts.join('.'))).status).toBe(401);
  });

  it('uploads with a verified SSO token', async () => { await upload('sso-test.txt'); });

  it('uses the authenticated subject in uploaded keys', async () => { await upload('path-test.txt'); });

  it('validates the upload filename', async () => {
    const body = fileBody();
    body.delete('filename');
    expect((await request('/upload', { method: 'POST', body }, users[0].token)).status).toBe(400);
  });

  it('rejects delete without authentication', async () => {
    expect((await request('/delete', json({ key: 'uploads/test/test.txt' }))).status).toBe(401);
  });

  it('allows users to delete their own uploaded file', async () => {
    const { key } = await upload('delete-test.txt');
    const response = await request('/delete', json({ key }), users[0].token);
    expect(response.status).toBe(200);
    expect((await response.json()).data.key).toBe(key);
  });

  it('rejects deletion of another user’s upload', async () => {
    const { key } = await upload('ownership-test.txt');
    const response = await request('/delete', json({ key }), users[1].token);
    expect(response.status).toBe(403);
    expect(await errorCode(response)).toBe('FORBIDDEN');
  });

  it('rejects deletion of another user’s certificate', async () => {
    expect((await request('/delete', json({ key: `certificates/${users[0].id}/test.pdf` }), users[1].token)).status).toBe(403);
  });

  it('rejects deletion of another user’s receipt', async () => {
    expect((await request('/delete', json({ key: `payment_pdf/receipt_${users[0].id}/test.pdf` }), users[1].token)).status).toBe(403);
  });

  it('requires authentication for receipt access', async () => {
    expect((await request('/payment-receipt?key=test')).status).toBe(401);
  });

  it('requires authentication for legacy presigned uploads', async () => {
    expect((await request('/presigned', json({ filename: 'test.pdf' }))).status).toBe(401);
  });

  it('explicitly rejects deprecated direct R2 presigned uploads', async () => {
    const response = await request('/presigned', json({ filename: 'test.pdf' }), users[0].token);
    expect(response.status).toBe(410);
    expect(await errorCode(response)).toBe('PRESIGNED_UPLOAD_DISABLED');
  });

  it('rejects confirmation of another user’s file', async () => {
    expect((await request('/confirm', json({ fileKey: `uploads/${users[0].id}/test.txt` }), users[1].token)).status).toBe(403);
  });

  it('returns signed URLs in the standard response envelope', async () => {
    const { key } = await upload('signed-test.txt');
    const response = await request('/signed-url', json({ fileKey: key }), users[0].token);
    expect(response.status).toBe(200);
    expect((await response.json()).data.signedUrl).toContain(`/api/storage/document-access?key=${encodeURIComponent(key)}`);
  });
});
