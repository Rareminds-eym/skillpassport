// @vitest-environment node
// Opt-in only: synthetic isolated PostgREST fixture at loopback port 55439.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import { createHmac } from 'node:crypto';
import { onRequestPost } from '../api/internal/evidence';
import { signEvidenceBody, sha256Hex } from '../api/internal/evidence-auth';
import { SkillPassportEvidenceAdapter } from '../../../ai-worker/src/adapters/skillpassport/evidence';
import type { Env } from '../../../ai-worker/src/env';

const live = describe.skipIf(process.env.EVIDENCE_ISOLATED_HTTP_TEST !== '1');
const secret = 'isolated-evidence-shared-secret-32-chars';
const actorId = '11111111-1111-4111-8111-111111111111';
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
const unsigned = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ role: 'service_role', exp: Math.floor(Date.now() / 1000) + 600 })}`;
const jwt = `${unsigned}.${createHmac('sha256', 'isolated-evidence-test-jwt-secret-32-chars').update(unsigned).digest('base64url')}`;

live('real HTTP evidence endpoint and isolated PostgreSQL', () => {
  let server: Server;
  let origin: string;
  beforeAll(async () => {
    server = createServer(async (incoming, outgoing) => {
      try {
        const chunks: Buffer[] = [];
        for await (const chunk of incoming) chunks.push(Buffer.from(chunk));
        const headers = new Headers();
        for (const [name, value] of Object.entries(incoming.headers)) if (typeof value === 'string') headers.set(name, value);
        // Local fixture supplies Kong's /rest/v1 prefix rewrite; PostgREST itself
        // exposes table routes at /. No database responses are mocked.
        if (incoming.url?.startsWith('/rest/v1/')) {
          const database = await fetch(`http://127.0.0.1:55439/${incoming.url.slice('/rest/v1/'.length)}`, {
            method: incoming.method, headers, ...(chunks.length ? { body: Buffer.concat(chunks) } : {}),
          });
          outgoing.writeHead(database.status, Object.fromEntries(database.headers));
          outgoing.end(await database.text());
          return;
        }
        const request = new Request(`${origin}/api/internal/evidence`, { method: 'POST', headers, body: Buffer.concat(chunks) });
        const env = { EVIDENCE_SHARED_SECRET: secret, SUPABASE_URL: incoming.url === '/outage' ? 'http://127.0.0.1:55438' : origin, SUPABASE_SERVICE_ROLE_KEY: jwt };
        const response = await onRequestPost({ request, env } as never);
        outgoing.writeHead(response.status, Object.fromEntries(response.headers));
        outgoing.end(await response.text());
      } catch { outgoing.writeHead(500); outgoing.end(); }
    });
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing HTTP fixture address');
    origin = `http://127.0.0.1:${address.port}`;
  });
  afterAll(async () => { server.closeAllConnections(); await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); });
  async function signed(overrides: Record<string, unknown> = {}, path = '/api/internal/evidence') {
    const body = JSON.stringify({ audience: 'skillpassport.evidence', product: 'skillpassport', actorId, task: 'career-talent-strategist.chat', kinds: ['learner.profile', 'learner.skills'], resources: [], expiresAt: new Date(Date.now() + 30000).toISOString(), nonce: crypto.randomUUID(), ...overrides });
    return { body, headers: { 'Content-Type': 'application/json', 'x-evidence-signature': await signEvidenceBody(secret, body), 'x-evidence-request-hash': await sha256Hex(body) }, path };
  }
  async function send(input: Awaited<ReturnType<typeof signed>>) { return fetch(`${origin}${input.path}`, { method: 'POST', headers: input.headers, body: input.body }); }
  it('runs the actual worker adapter through HTTP, product auth and database reads', async () => {
    const outcome = await new SkillPassportEvidenceAdapter({ SKILLPASSPORT_URL: origin, EVIDENCE_SHARED_SECRET: secret } as Env).loadEvidence({ product: 'skillpassport', actorId, task: 'career-talent-strategist.chat', kinds: ['learner.profile', 'learner.skills'], resources: [], requestId: 'integration' });
    expect(outcome.kind).toBe('ok');
    if (outcome.kind !== 'ok') throw new Error('Expected real evidence');
    expect(outcome.bundle.evidence.some(item => item.text.includes('level unknown'))).toBe(true);
  });
  it('atomically rejects one concurrent presentation of the same signed request', async () => {
    const input = await signed();
    const responses = await Promise.all([send(input), send(input)]);
    expect(responses.map(response => response.status).sort()).toEqual([200, 403]);
  });
  it.each([
    { tenantId: 'unsupported-tenant' },
    { task: 'career-talent-strategist.keywords' },
    { resources: [{ kind: 'learner', id: '44444444-4444-4444-8444-444444444444' }] },
  ])('rejects unauthorized scope %j', async overrides => {
    expect((await send(await signed(overrides))).status).toBe(403);
  });
  it('reports an actual failed evidence-table read as unavailable rather than absent', async () => {
    // This isolated fixture intentionally has no assessment table.
    expect((await send(await signed({ kinds: ['assessment.summary'] }))).status).toBe(503);
  });
  it.each([
    [{ product: 'lte' }, 403],
    [{ expiresAt: new Date(Date.now() - 60000).toISOString() }, 401],
  ] as const)('rejects forged or expired signed request %j', async (overrides, status) => {
    expect((await send(await signed(overrides))).status).toBe(status);
  });
  it('reports a real unreachable database API as unavailable', async () => {
    expect((await send(await signed({}, '/outage'))).status).toBe(503);
  });
});
