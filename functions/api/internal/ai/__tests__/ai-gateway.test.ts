import { describe, expect, it } from 'vitest';
import {
  getAiGatewaySecret,
  verifyAiServiceToken,
  verifyAiUserClaim,
} from '../auth.js';
import {
  signServiceToken,
  signUserClaim,
} from '../../lte/v1/auth.js';
import { handleGetAttempt } from '../actions/get-attempt.js';
import { handleGetQuestions } from '../actions/get-questions.js';
import { handleGetSections } from '../actions/get-sections.js';
import { handleGetStreamQuestions } from '../actions/get-stream-questions.js';
import { handleGetAdaptive } from '../actions/get-adaptive.js';
import { handleSearchRoles } from '../actions/search-roles.js';
import { handleApplyAnalysis } from '../actions/apply-analysis.js';
import { createSupabaseAiPort } from '../db-supabase.js';
import { onRequestPost as v1Post } from '../v1.js';
import { onRequestPost as indexPost } from '../index.js';
import type { AiDataPort } from '../db.js';

const SECRET = 'ai-internal-test-secret-min-32-chars!';
const SUB = '123e4567-e89b-42d3-a456-426614174000';

function fakeDb(overrides: Partial<AiDataPort> = {}): AiDataPort {
  return {
    findLearnerIdByUser: async () => 'learner-1',
    getAttempt: async () => null,
    getQuestions: async () => [],
    getSections: async () => [],
    getStreamQuestionSets: async () => [],
    getAdaptiveResults: async () => null,
    hybridSearchRoles: async () => [],
    getReport: async () => null,
    mergeReport: async () => ({ duplicate: false, at: 't' }),
    ...overrides,
  };
}

describe('ai gateway secret', () => {
  it('requires a 32+ char secret', () => {
    expect(getAiGatewaySecret({ AI_INTERNAL_SECRET: SECRET } as never)).toBe(SECRET);
    expect(() => getAiGatewaySecret({} as never)).toThrowError();
    expect(() => getAiGatewaySecret({ AI_INTERNAL_SECRET: 'short' } as never)).toThrowError();
  });
});

describe('ai gateway tokens (cross-checked against shared verifiers)', () => {
  it('accepts a well-formed service token for app ai-worker', async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await signServiceToken(SECRET, {
      app: 'ai-worker',
      actions: ['attempt:get'],
      iat: now,
      exp: now + 300,
    });
    const claims = await verifyAiServiceToken(SECRET, token);
    expect(claims.app).toBe('ai-worker');
    expect(claims.actions).toEqual(['attempt:get']);
  });

  it('denies tampered service tokens and expired user claims', async () => {
    const now = Math.floor(Date.now() / 1000);
    const token = await signServiceToken(SECRET, { app: 'ai-worker', actions: [], iat: now, exp: now + 300 });
    const bad = `${token.slice(0, -2)}AA`;
    await expect(verifyAiServiceToken(SECRET, bad)).rejects.toThrowError();
    const { claim, sig } = await signUserClaim(SECRET, SUB, -10);
    await expect(verifyAiUserClaim(SECRET, claim, sig)).rejects.toThrowError();
  });
});

describe('ai gateway actions', () => {
  it('getAttempt enforces ownership', async () => {
    const db = fakeDb({
      getAttempt: async (attemptId: string, learnerId: string) =>
        learnerId === 'learner-1' ? { id: attemptId, learner_id: learnerId, grade_level: 'middle', stream_id: null, adaptive_aptitude_session_id: null, all_responses: {} } : null,
    });
    const ok = await handleGetAttempt(db, 'user-9', { attemptId: SUB });
    expect(ok.ok).toBe(true);
    const missing = await handleGetAttempt(
      fakeDb({ findLearnerIdByUser: async () => null }),
      'user-9',
      { attemptId: SUB },
    );
    expect(missing).toMatchObject({ ok: false });
    const bad = await handleGetAttempt(db, 'user-9', { attemptId: 'nope' });
    expect(bad).toMatchObject({ ok: false });
  });

  it('getQuestions validates ids and searchRoles validates vectors', async () => {
    expect((await handleGetQuestions(fakeDb(), 'u', { ids: [] })).ok).toBe(false);
    const emb = new Array(1536).fill(0.01);
    let seenAlpha: number | undefined;
    const roles = await handleSearchRoles(fakeDb({ hybridSearchRoles: async (args) => {
      seenAlpha = args.alpha;
      return [{ role_id: 'r', role_family_role_id: 'f', role_code: 'c', role_name: 'n', hybrid_score: 1, semantic_similarity: null, riasec_codes: ['I', 'R'], degree_gate: 'Preferred', aptitude_profile: { logical: 80 } }];
    } }), 'u', {
      queryEmbedding: emb,
      matchCount: 5,
    });
    expect(roles).toMatchObject({ ok: true });
    expect(seenAlpha).toBe(0.6);
    expect((roles as { ok: true; data: { roles: Array<Record<string, unknown>> } }).data.roles[0]).toMatchObject({
      riasec_codes: ['I', 'R'],
      degree_gate: 'Preferred',
    });
    expect(await handleSearchRoles(fakeDb(), 'u', { queryEmbedding: [1, 2], matchCount: 5 })).toMatchObject({
      ok: false,
    });
    expect(
      await handleSearchRoles(fakeDb(), 'u', { queryEmbedding: emb, matchCount: 500 }),
    ).toMatchObject({ ok: false });
  });

  it('getSections validates ids and returns id-name rows', async () => {
    expect((await handleGetSections(fakeDb(), 'u', { ids: [] })).ok).toBe(false);
    const ok = await handleGetSections(
      fakeDb({ getSections: async () => [{ id: 's-1', name: 'riasec' }] }),
      'u',
      { ids: ['s-1'] },
    );
    expect(ok).toMatchObject({ ok: true, data: { sections: [{ id: 's-1', name: 'riasec' }] } });
  });

  it('getStreamQuestions validates scope and adaptive:get is fail-closed', async () => {
    expect((await handleGetStreamQuestions(fakeDb(), 'u', { streamId: '', gradeLevel: 'college' })).ok).toBe(
      false,
    );
    const sets = await handleGetStreamQuestions(
      fakeDb({ getStreamQuestionSets: async () => [{ question_type: 'aptitude', questions: [] }] }),
      'u',
      { streamId: 'cs', gradeLevel: 'college' },
    );
    expect(sets).toMatchObject({ ok: true });
    expect((await handleGetAdaptive(fakeDb(), 'u', { sessionId: 'nope' })).ok).toBe(false);
    const missing = await handleGetAdaptive(fakeDb(), 'u', { attemptId: SUB, sessionId: SUB });
    expect(missing).toMatchObject({ ok: true, data: { session: null, results: null } });
    const found = await handleGetAdaptive(
      fakeDb({
        getAttempt: async () => ({
          id: SUB,
          learner_id: 'learner-1',
          grade_level: 'middle',
          stream_id: null,
          adaptive_aptitude_session_id: SUB,
          all_responses: {},
        }),
        getAdaptiveResults: async () => ({
          session: { id: 's', questions_answered: 10, current_difficulty: 'medium' },
          results: null,
        }),
      }),
      'u',
      { attemptId: SUB, sessionId: SUB },
    );
    expect(found).toMatchObject({ ok: true, data: { results: null } });
    // Linked to a different session: fail closed with nulls, never that session.
    const unlinked = await handleGetAdaptive(
      fakeDb({
        getAttempt: async () => ({
          id: SUB,
          learner_id: 'learner-1',
          grade_level: 'middle',
          stream_id: null,
          adaptive_aptitude_session_id: '123e4567-e89b-12d3-a456-426614174001',
          all_responses: {},
        }),
        getAdaptiveResults: async () => {
          throw new Error('must not read across linkage');
        },
      }),
      'u',
      { attemptId: SUB, sessionId: SUB },
    );
    expect(unlinked).toMatchObject({ ok: true, data: { session: null, results: null } });
  });

  it('applyAnalysis is idempotent per operation and ownership-checked', async () => {
    let writes = 0;
    const seen = new Set<string>();
    const report = {
      gradeLevel: "middle",
      capabilityWheel: [],
      reports: {
        character_strengths_descriptions: [],
        capability_insights: {},
        assessmentReport: "",
        mission_recommendations: [],
        my_interest_worlds: [],
        explorer_insights: { exploredWorlds: [], toExploreWorlds: [] },
        thinking_styles: [],
      },
    };
    const db = fakeDb({
      getAttempt: async () => ({ id: 'a', learner_id: 'learner-1', grade_level: 'middle', stream_id: null, adaptive_aptitude_session_id: null, all_responses: {}, updated_at: 't-new' }),
      mergeReport: async (_attemptId: string, operationId: string) => {
        if (seen.has(operationId)) return { duplicate: true, at: 't0' };
        seen.add(operationId);
        writes += 1;
        return { duplicate: false, at: 't1' };
      },
    });
    const payload = { attemptId: SUB, operationId: 'op-1', report };
    const first = await handleApplyAnalysis(db, 'user-9', payload);
    const second = await handleApplyAnalysis(db, 'user-9', payload);
    expect(first).toMatchObject({ ok: true, data: { applied: true, duplicate: false } });
    expect(second).toMatchObject({ ok: true, data: { applied: false, duplicate: true } });
    expect(writes).toBe(1);
    const foreign = await handleApplyAnalysis(
      fakeDb({ findLearnerIdByUser: async () => 'learner-OTHER' }),
      'user-9',
      payload,
    );
    expect(foreign).toMatchObject({ ok: false });
  });

  it('applyAnalysis refuses stale attempt revisions', async () => {
    const report = {
      gradeLevel: "middle",
      capabilityWheel: [],
      reports: {
        character_strengths_descriptions: [],
        capability_insights: {},
        assessmentReport: "",
        mission_recommendations: [],
        my_interest_worlds: [],
        explorer_insights: { exploredWorlds: [], toExploreWorlds: [] },
        thinking_styles: [],
      },
    };
    const db = fakeDb({
      getAttempt: async () => ({ id: 'a', learner_id: 'learner-1', grade_level: 'middle', stream_id: null, adaptive_aptitude_session_id: null, all_responses: {}, updated_at: 't-new' }),
    });
    const stale = await handleApplyAnalysis(db, 'user-9', {
      attemptId: SUB,
      operationId: 'op-1',
      report,
      expectedUpdatedAt: 't-old',
    });
    expect(stale).toMatchObject({ ok: false, error: { code: 'STALE_REVISION' } });
    const fresh = await handleApplyAnalysis(db, 'user-9', {
      attemptId: SUB,
      operationId: 'op-2',
      report,
      expectedUpdatedAt: 't-new',
    });
    expect(fresh).toMatchObject({ ok: true });
    const unguarded = await handleApplyAnalysis(db, 'user-9', { attemptId: SUB, operationId: 'op-3', report });
    expect(unguarded).toMatchObject({ ok: true });
  });
});

describe('mergeReport write acknowledgement', () => {
  function fakeSupabase(report: unknown, writeError: { message: string } | null) {
    const maybeSingle = async () => ({ data: report, error: null });
    const terminal = async () => ({ data: null, error: writeError });
    const chain: Record<string, unknown> = {};
    chain.select = () => chain;
    chain.eq = () => chain;
    chain.maybeSingle = maybeSingle;
    chain.update = () => chain;
    chain.insert = () => chain;
    chain.then = (resolve: (v: unknown) => unknown) => terminal().then(resolve);
    return { from: () => chain };
  }

  it('throws instead of reporting success when the update fails', async () => {
    const port = createSupabaseAiPort(
      fakeSupabase({ gemini_results: {} }, { message: 'db down' }) as never,
    );
    await expect(port.mergeReport('attempt-1', 'op-1', { analysis: {} })).rejects.toThrow(
      'Failed to merge analysis report',
    );
  });

  it('throws instead of reporting success when the insert fails', async () => {
    const port = createSupabaseAiPort(
      fakeSupabase(null, { message: 'db down' }) as never,
    );
    await expect(port.mergeReport('attempt-1', 'op-1', { analysis: {} })).rejects.toThrow(
      'Failed to insert analysis report',
    );
  });

  it('still merges and returns a receipt when writes succeed', async () => {
    const port = createSupabaseAiPort(fakeSupabase({ gemini_results: {} }, null) as never);
    const receipt = await port.mergeReport('attempt-1', 'op-1', { analysis: { a: 1 } });
    expect(receipt).toMatchObject({ duplicate: false });
  });
});

describe('gateway route agreement', () => {
  it('serves the same handler at the canonical /v1 route', async () => {
    expect(v1Post).toBe(indexPost);
    const request = new Request('https://x.test/api/internal/ai/v1', { method: 'POST', body: '{}' });
    const response = await v1Post({ request, env: { AI_INTERNAL_SECRET: SECRET } } as never);
    // Shared logic rejects the missing bearer token: proves delegation works.
    expect(response.status).toBe(401);
    const body = (await response.json()) as { ok: boolean; requestId: string };
    expect(body.ok).toBe(false);
    expect(typeof body.requestId).toBe('string');
  });
});
