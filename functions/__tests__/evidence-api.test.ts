/**
 * Internal evidence API — authentication, authorization and response shape.
 *
 * The endpoint is the trust boundary between the AI worker and the product
 * database, so the negative cases matter more than the happy path: a
 * missing signature, a wrong audience, a forged product, a substituted
 * actor, an expired request and an unknown kind must each be refused
 * before any read happens.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContextBundleSchema } from '@rareminds-eym/ai-protocol';

vi.mock('../lib/supabase.js', () => ({
  createSupabaseAdminClient: vi.fn(),
}));

import { createSupabaseAdminClient } from '../lib/supabase.js';
import { onRequest, onRequestPost } from '../api/internal/evidence';
import {
  EVIDENCE_MAX_BODY_BYTES,
  getEvidenceSecret,
  parseEvidenceRequest,
  signEvidenceBody,
  readBoundedBody,
  awaitEvidence,
} from '../api/internal/evidence-auth';

const SECRET = 'test-evidence-secret-that-is-long-enough-32';
const NOW = Date.parse('2026-10-21T12:00:00.000Z');

const learnerRow = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Asha Learner',
  grade: 'Grade 11',
  branch_field: 'Computer Science',
  university: 'Test University',
  updated_at: '2026-10-20T09:00:00.000Z',
};

const skillRows = [
  {
    id: 's-1',
    name: 'Python',
    type: 'technical',
    level: 4,
    verified: true,
    updated_at: '2026-10-19T09:00:00.000Z',
  },
  {
    id: 's-2',
    name: 'Public Speaking',
    type: 'soft',
    level: null,
    verified: false,
    updated_at: '2026-10-18T09:00:00.000Z',
  },
];

function fakeSupabase() {
  const state = {
    appliedCount: 3 as number | null,
    savedCount: 1 as number | null,
    failedTable: '',
    filters: [] as Array<[string, string]>,
    missingLearner: false,
    hangLearner: false,
    largeSkills: false,
    nonceError: null as null | { code: string; message: string },
    lessonMode: false,
  };
  const nonces = new Set<string>();

  // PostgREST builders are chainable AND thenable; the fake mirrors that so
  // `await ...eq(...)` and `await ...limit(1).maybeSingle()` both work.
  const chainFor = (result: () => Promise<unknown>) => {
    const chain: Record<string, unknown> = {
      select: () => chain,
      eq: () => chain,
      is: () => chain,
      ilike: (column: string, value: string) => { state.filters.push([column, value]); return chain; },
      or: () => chain,
      order: () => chain,
      limit: () => chain,
      maybeSingle: async () => result(),
      then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
        result().then(resolve, reject),
    };
    return chain;
  };

  const resultFor = (table: string) => {
    if (state.lessonMode) {
      const rows: Record<string, unknown> = {
        learners: { id: 'canonical-learner' },
        course_enrollments: { id: 'enrollment', status: 'active' },
        courses: { course_id: '11111111-1111-4111-8111-111111111111', title: 'Biology', description: 'Cells', code: 'BIO' },
        course_modules: { module_id: 'module', title: 'Module' },
        lessons: { lesson_id: '22222222-2222-4222-8222-222222222222', module_id: 'module', title: 'Lesson', content: 'Permitted lesson facts' },
      };
      return { data: rows[table] ?? null, error: null };
    }
    if (table === 'learners' && state.hangLearner) return new Promise(() => {});
    if (table === 'skills' && state.largeSkills) return { data: Array.from({length: 20}, (_, i) => ({ ...skillRows[0], id: `large-${i}`, name: '?'.repeat(3990) })), error: null };
    if (table === state.failedTable) return { data: null, count: null, error: { code: 'XX000', message: 'private database diagnostic' } };
    if (table === 'learners' && state.missingLearner) return { data: null, error: null };
    if (table === 'learners') return { data: learnerRow, error: null };
    if (table === 'skills') return { data: skillRows, error: null };
    if (table === 'applied_jobs') return { data: null, error: null, count: state.appliedCount };
    if (table === 'saved_jobs') return { data: null, error: null, count: state.savedCount };
    if (table === 'personal_assessment_results') return { data: null, error: null };
    return { data: [], error: null };
  };

  return {
    state,
    client: {
      from(table: string) {
        if (table === 'internal_evidence_nonces') {
          return {
            insert: async (row: { nonce: string }) => {
              if (state.nonceError) return { error: state.nonceError };
              if (nonces.has(row.nonce)) {
                return { error: { code: '23505', message: 'duplicate key value' } };
              }
              nonces.add(row.nonce);
              return { error: null };
            },
          };
        }
        return chainFor(async () => resultFor(table));
      },
    },
  };
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function buildBody(overrides: Record<string, unknown> = {}) {
  const body = {
    audience: 'skillpassport.evidence',
    product: 'skillpassport',
    actorId: '11111111-1111-4111-8111-111111111111',
    task: 'career-talent-strategist.chat',
    kinds: ['learner.profile', 'learner.skills'],
    resources: [],
    // Relative to the real clock: the endpoint checks expiry against now.
    expiresAt: new Date(Date.now() + 30_000).toISOString(),
    nonce: '0123456789abcdef0123',
    ...overrides,
  };
  const text = JSON.stringify(body);
  return {
    text,
    signature: await signEvidenceBody(SECRET, text),
    requestHash: await sha256Hex(text),
  };
}

function context(request: Request, env: Record<string, unknown>) {
  return { request, env, params: {}, data: {}, waitUntil: () => {}, next: async () => {} } as never;
}

function post(body: string, signature?: string | null, requestHash?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (signature !== null) headers['x-evidence-signature'] = signature ?? '';
  if (requestHash !== null) headers['x-evidence-request-hash'] = requestHash ?? '';
  return new Request('https://pages.local/api/internal/evidence', { method: 'POST', headers, body });
}

const ENV = { EVIDENCE_SHARED_SECRET: SECRET } as never;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.mocked(createSupabaseAdminClient).mockReturnValue(fakeSupabase().client as never);
});

describe('evidence auth helpers', () => {
  it('fails closed when the shared secret is missing or short', () => {
    expect(() => getEvidenceSecret({} as never)).toThrowError(/missing or too short/);
    expect(() => getEvidenceSecret({ EVIDENCE_SHARED_SECRET: 'short' } as never)).toThrowError(
      /missing or too short/,
    );
  });

  it('rejects unknown fields, a wrong audience, a forged product and an unknown kind', () => {
    const base = {
      audience: 'skillpassport.evidence',
      product: 'skillpassport',
      actorId: 'u-1',
      task: 't',
      kinds: ['learner.profile'],
      resources: [],
      expiresAt: new Date(NOW + 30_000).toISOString(),
      nonce: '0123456789abcdef0123',
    };
    expect(() => parseEvidenceRequest({ ...base, table: 'learners' }, NOW)).toThrowError(
      /Unknown field/,
    );
    expect(() => parseEvidenceRequest({ ...base, audience: 'other' }, NOW)).toThrowError(/audience/);
    expect(() => parseEvidenceRequest({ ...base, product: 'lte' }, NOW)).toThrowError(/Product/);
    expect(
      () => parseEvidenceRequest({ ...base, kinds: ['learner.private_table'] }, NOW),
    ).toThrowError(/not allowed/);
  });

  it('rejects an expired request and one with too long a lifetime', () => {
    const base = {
      audience: 'skillpassport.evidence',
      product: 'skillpassport',
      actorId: 'u-1',
      task: 't',
      kinds: ['learner.profile'],
      resources: [],
      nonce: '0123456789abcdef0123',
    };
    expect(() =>
      parseEvidenceRequest({ ...base, expiresAt: new Date(NOW - 1000).toISOString() }, NOW),
    ).toThrowError(/expired/);
    expect(() =>
      parseEvidenceRequest({ ...base, expiresAt: new Date(NOW + 600_000).toISOString() }, NOW),
    ).toThrowError(/lifetime too long/);
  });
});

describe('POST /api/internal/evidence', () => {
  it('serves signed course context without exposing personal learner fields', async () => {
    const db = fakeSupabase(); db.state.lessonMode = true;
    vi.mocked(createSupabaseAdminClient).mockReturnValue(db.client as never);
    const signed = await buildBody({ task: 'senior-educator.tutor-chat', kinds: ['course.summary'], resources: [{ kind: 'course', id: '11111111-1111-4111-8111-111111111111' }] });
    const response = await onRequestPost(context(post(signed.text, signed.signature, signed.requestHash), ENV));
    expect(response.status).toBe(200);
    const body = await response.json() as any;
    expect(body.data.evidence).toHaveLength(1);
    expect(body.data.evidence[0]).toMatchObject({ kind: 'course.summary', source: 'skillpassport:courses' });
    expect(body.data.evidence[0].text).toContain('Biology');
    expect(JSON.stringify(body.data)).not.toContain('canonical-learner');
  });
  it('serves the authorized lesson projection through signed tutor evidence requests', async () => {
    const db = fakeSupabase(); db.state.lessonMode = true;
    vi.mocked(createSupabaseAdminClient).mockReturnValue(db.client as never);
    const signed = await buildBody({ task: 'senior-educator.suggest', kinds: ['course.lesson'], resources: [
      { kind: 'course', id: '11111111-1111-4111-8111-111111111111' },
      { kind: 'lesson', id: '22222222-2222-4222-8222-222222222222' },
    ] });
    const response = await onRequestPost(context(post(signed.text, signed.signature, signed.requestHash), ENV));
    expect(response.status).toBe(200);
    const body = await response.json() as any;
    expect(body.data.evidence[0]).toMatchObject({ kind: 'course.lesson', source: 'skillpassport:lessons' });
    expect(JSON.stringify(body)).toContain('Permitted lesson facts');
    const replay = await onRequestPost(context(post(signed.text, signed.signature, signed.requestHash), ENV));
    expect(replay.status).toBe(403);
  });
  it('rejects a tutor asking for personal Career evidence before accessing the store', async () => {
    vi.mocked(createSupabaseAdminClient).mockClear();
    const signed = await buildBody({ task: 'senior-educator.suggest', kinds: ['learner.profile'] });
    const response = await onRequestPost(context(post(signed.text, signed.signature, signed.requestHash), ENV));
    expect(response.status).toBe(403);
    expect(createSupabaseAdminClient).not.toHaveBeenCalled();
  });
  it('serves provenance-carrying evidence for a signed request', async () => {
    const { text, signature, requestHash } = await buildBody();
    const res = await onRequestPost(context(post(text, signature, requestHash), ENV));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: unknown };
    expect(body.success).toBe(true);
    // The response must satisfy the canonical shared contract.
    expect(ContextBundleSchema.safeParse(body.data).success).toBe(true);
    const bundle = body.data as { evidence: Array<Record<string, unknown>>; missing: string[] };
    const skill = bundle.evidence.find((item) => item.kind === 'learner.skills');
    expect(skill?.text).toContain('Python');
    // Provenance is preserved: a verified skill says so.
    expect(skill?.text).toContain('verified');
    expect(skill?.source).toBe('skillpassport:skills');
    expect(skill?.gatheredAt).toBeTruthy();
    expect(bundle.missing).toEqual([]);
  });

  it('keeps an unknown skill level unknown instead of inventing one', async () => {
    const { text, signature, requestHash } = await buildBody();
    const res = await onRequestPost(context(post(text, signature, requestHash), ENV));
    const body = (await res.json()) as { data: { evidence: Array<{ text: string }> } };
    const unknown = body.data.evidence.find((item) => item.text.includes('Public Speaking'));
    expect(unknown?.text).toContain('level unknown');
    expect(unknown?.text).toContain('self-reported');
    expect(unknown?.text).not.toContain('level 3');
  });

  it('rejects a missing signature', async () => {
    const { text } = await buildBody();
    const res = await onRequestPost(context(post(text, null), ENV));
    expect(res.status).toBe(401);
  });

  it('rejects a signature made with the wrong secret', async () => {
    const { text } = await buildBody();
    const forged = await signEvidenceBody('a-different-secret-that-is-long-enough-x', text);
    const res = await onRequestPost(context(post(text, forged), ENV));
    expect(res.status).toBe(401);
  });

  it('forwards signed job relevance through the HTTP handler into database filtering', async () => {
    const fake = fakeSupabase();
    vi.mocked(createSupabaseAdminClient).mockReturnValue(fake.client as never);
    const signed = await buildBody({ query: 'Python jobs in Chennai', kinds: ['learner.skills', 'opportunities.recommended'] });
    const response = await onRequestPost(context(post(signed.text, signed.signature, signed.requestHash), ENV));
    expect(response.status).toBe(200);
    expect(fake.state.filters).toContainEqual(['location', '%Chennai%']);
  });

  it('authenticates relevance text and rejects oversized queries', async () => {
    const { text, signature } = await buildBody({ query: 'Python jobs' });
    const res = await onRequestPost(context(post(text.replace('Python jobs', 'Other jobs'), signature), ENV));
    expect(res.status).toBe(401);
    const oversized = await buildBody({ query: 'x'.repeat(1001) });
    const invalid = await onRequestPost(context(post(oversized.text, oversized.signature), ENV));
    expect(invalid.status).toBe(400);
    expect(createSupabaseAdminClient).not.toHaveBeenCalled();
  });

  it('rejects a body that was altered after signing', async () => {
    const { text, signature } = await buildBody();
    const tampered = text.replace('learner.profile', 'assessment.summary');
    const res = await onRequestPost(context(post(tampered, signature), ENV));
    expect(res.status).toBe(401);
  });

  it('rejects a request whose hash does not match the body', async () => {
    const { text, signature } = await buildBody();
    const res = await onRequestPost(context(post(text, signature, 'b'.repeat(64)), ENV));
    expect(res.status).toBe(400);
  });

  it('rejects a request with no request hash at all', async () => {
    const { text, signature } = await buildBody();
    const res = await onRequestPost(context(post(text, signature, null), ENV));
    expect(res.status).toBe(400);
  });

  it('fails closed with 500 when the endpoint is not configured', async () => {
    const { text, signature, requestHash } = await buildBody();
    const res = await onRequestPost(context(post(text, signature, requestHash), {} as never));
    expect(res.status).toBe(500);
  });

  it('rejects an oversized body before parsing it', async () => {
    const huge = 'x'.repeat(EVIDENCE_MAX_BODY_BYTES + 1);
    const res = await onRequestPost(context(post(huge, 'v1=00'), ENV));
    expect(res.status).toBe(400);
  });

  it('rejects a body that is not JSON', async () => {
    const text = 'not json';
    const signature = await signEvidenceBody(SECRET, text);
    const res = await onRequestPost(context(post(text, signature, await sha256Hex(text)), ENV));
    expect(res.status).toBe(400);
  });

  it('refuses a resource the actor does not own', async () => {
    const { text, signature, requestHash } = await buildBody({
      resources: [{ kind: 'learner', id: '99999999-9999-4999-8999-999999999999' }],
    });
    const res = await onRequestPost(context(post(text, signature, requestHash), ENV));
    expect(res.status).toBe(403);
  });

  it('refuses a task the endpoint has not reviewed', async () => {
    // The historical camelCase id: structurally valid, but not a reviewed task.
    const { text, signature, requestHash } = await buildBody({ task: 'careerTalentStrategist.chat' });
    const res = await onRequestPost(context(post(text, signature, requestHash), ENV));
    expect(res.status).toBe(403);
  });

  it('refuses a tenant scope it cannot verify', async () => {
    const { text, signature, requestHash } = await buildBody({ tenantId: 'tenant-1' });
    const res = await onRequestPost(context(post(text, signature, requestHash), ENV));
    expect(res.status).toBe(403);
  });

  it('refuses a resource kind it cannot ownership-check', async () => {
    const { text, signature, requestHash } = await buildBody({
      resources: [{ kind: 'attempt', id: 'a-1' }],
    });
    const res = await onRequestPost(context(post(text, signature, requestHash), ENV));
    expect(res.status).toBe(403);
  });

  it('refuses more kinds than the contract allows', async () => {
    const { text, signature, requestHash } = await buildBody({
      kinds: Array(7).fill('learner.profile'),
    });
    const res = await onRequestPost(context(post(text, signature, requestHash), ENV));
    expect(res.status).toBe(400);
  });

  it('serves a signed request once and refuses the replay', async () => {
    const { text, signature, requestHash } = await buildBody();
    const first = await onRequestPost(context(post(text, signature, requestHash), ENV));
    expect(first.status).toBe(200);

    const second = await onRequestPost(context(post(text, signature, requestHash), ENV));
    expect(second.status).toBe(403);
  });

  it('reports an unreachable nonce store as unavailable, not as a replay', async () => {
    const fake = fakeSupabase();
    fake.state.nonceError = { code: 'XX000', message: 'private database diagnostic' };
    vi.mocked(createSupabaseAdminClient).mockReturnValue(fake.client as never);
    const { text, signature, requestHash } = await buildBody();
    const res = await onRequestPost(context(post(text, signature, requestHash), ENV));
    expect(res.status).toBe(503);
    expect(await res.text()).not.toContain('private database diagnostic');
  });

  it('reports a kind with no data as missing, not as an error', async () => {
    const { text, signature, requestHash } = await buildBody({ kinds: ['assessment.summary'] });
    const res = await onRequestPost(context(post(text, signature, requestHash), ENV));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { missing: string[]; evidence: unknown[] } };
    expect(body.data.missing).toEqual(['assessment.summary']);
    expect(body.data.evidence).toEqual([]);
  });

  it('refuses a non-POST method', async () => {
    const res = await onRequest(
      context(
        new Request('https://pages.local/api/internal/evidence', { method: 'GET' }),
        ENV,
      ),
    );
    expect(res.status).toBe(405);
  });
});


describe('evidence store failures', () => {
  it.each([
    ['learners', 'learner.profile'],
    ['skills', 'learner.skills'],
    ['personal_assessment_results', 'assessment.summary'],
    ['course_enrollments', 'learner.courses'],
    ['opportunities', 'opportunities.recommended'],
    ['applied_jobs', 'learner.progress'],
    ['saved_jobs', 'learner.progress'],
  ])('returns unavailable instead of missing or zero facts when %s fails', async (table, kind) => {
    const fake = fakeSupabase();
    fake.state.failedTable = table;
    vi.mocked(createSupabaseAdminClient).mockReturnValue(fake.client as never);
    const body = await buildBody({ kinds: [kind] });
    const response = await onRequestPost(context(post(body.text, body.signature, body.requestHash), ENV));
    expect(response.status).toBe(503);
    const text = await response.text();
    expect(text).not.toContain('private database diagnostic');
    expect(text).not.toContain('Applied to 0');
    expect(text).not.toContain('evidence":[');
  });

  it('keeps a genuinely missing learner distinct from a failed lookup', async () => {
    const fake = fakeSupabase(); fake.state.missingLearner = true;
    vi.mocked(createSupabaseAdminClient).mockReturnValue(fake.client as never);
    const body = await buildBody({ kinds: ['learner.profile'] });
    const response = await onRequestPost(context(post(body.text, body.signature, body.requestHash), ENV));
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.missing).toContain('learner.profile');
  });

  it('does not treat an unknown successful count as zero', async () => {
    const fake = fakeSupabase(); fake.state.appliedCount = null;
    vi.mocked(createSupabaseAdminClient).mockReturnValue(fake.client as never);
    const body = await buildBody({ kinds: ['learner.progress'] });
    const response = await onRequestPost(context(post(body.text, body.signature, body.requestHash), ENV));
    expect(response.status).toBe(503);
  });

  it('preserves genuine zero counts as valid evidence', async () => {
    const fake = fakeSupabase(); fake.state.appliedCount = 0; fake.state.savedCount = 0;
    vi.mocked(createSupabaseAdminClient).mockReturnValue(fake.client as never);
    const body = await buildBody({ kinds: ['learner.progress'] });
    const response = await onRequestPost(context(post(body.text, body.signature, body.requestHash), ENV));
    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.data.evidence[0].text).toContain('Applied to 0 job(s), saved 0 job(s)');
  });
});


it('rejects keywords requesting personal evidence before creating the database client', async () => {
  vi.mocked(createSupabaseAdminClient).mockClear();
  const body = await buildBody({ task: 'career-talent-strategist.keywords', kinds: ['learner.profile'] });
  const response = await onRequestPost(context(post(body.text, body.signature, body.requestHash), ENV));
  expect(response.status).toBe(403);
  expect(createSupabaseAdminClient).not.toHaveBeenCalled();
});

it('keeps the final Unicode bundle inside 32000 bytes', async () => {
  const fake = fakeSupabase(); fake.state.largeSkills = true;
  vi.mocked(createSupabaseAdminClient).mockReturnValue(fake.client as never);
  const body = await buildBody({ kinds: ['learner.profile', 'learner.skills'] });
  const response = await onRequestPost(context(post(body.text, body.signature, body.requestHash), ENV));
  expect(response.status).toBe(200);
  const { data } = await response.json();
  expect(new TextEncoder().encode(JSON.stringify(data)).byteLength).toBeLessThanOrEqual(32000);
  expect(ContextBundleSchema.safeParse(data).success).toBe(true);
});

it('bounds a stalled database read by the endpoint deadline', async () => {
  const fake = fakeSupabase(); fake.state.hangLearner = true;
  vi.mocked(createSupabaseAdminClient).mockReturnValue(fake.client as never);
  const body = await buildBody();
  const response = await onRequestPost(context(post(body.text, body.signature, body.requestHash), ENV));
  expect(response.status).toBe(503);
}, 10000);


it('cancels a stalled incoming body by deadline', async () => {
  const controller = new AbortController();
  const cancelled = vi.fn();
  const stream = new ReadableStream<Uint8Array>({ cancel: cancelled });
  const request = new Request('https://pages.local/api/internal/evidence', { method: 'POST', body: stream, duplex: 'half' } as RequestInit);
  const pending = readBoundedBody(request, 16384, controller.signal);
  controller.abort();
  await expect(pending).rejects.toThrow('timed out');
  expect(cancelled).toHaveBeenCalled();
});

it('removes dependency abort listeners after successful completion', async () => {
  const controller = new AbortController();
  const removed = vi.spyOn(controller.signal, 'removeEventListener');
  expect(await awaitEvidence(Promise.resolve('ok'), controller.signal)).toBe('ok');
  await Promise.resolve();
  expect(removed).toHaveBeenCalled();
});
