import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Row = Record<string, unknown>;
type Read = { table: string; columns: string; filters: Array<[string, unknown]> };
type TestContext = {
  request: Request;
  env: Record<string, string>;
  params: { path: string[] };
  data: { user: { id: string } };
};

const fixture = vi.hoisted(() => ({
  userId: '11111111-1111-4111-8111-111111111111',
  learnerId: '33333333-3333-4333-8333-333333333333',
  foreignId: '22222222-2222-4222-8222-222222222222',
  foreignUserId: '44444444-4444-4444-8444-444444444444',
  unknownId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  learners: [] as Row[],
  reads: [] as Read[],
  cacheMiss: false,
  lookupError: false,
  lookupThrows: false,
  identityOverride: null as Row | null,
  missingVector: false,
  feedbackError: false,
  jobOverrides: {} as Record<string, Row>,
  dismissedId: 'dismissed-own-job',
  from: vi.fn(),
  rpc: vi.fn(),
  entitled: vi.fn(async () => true),
  rateLimit: vi.fn(async (_key: string, _env?: unknown) => true),
  buildText: vi.fn(async () => 'Controlled profile input'),
  embed: vi.fn(async () => Array(1536).fill(0.01)),
  persist: vi.fn(async () => ({ success: true, rowsAffected: 1 })),
}));

// Authentication transport is isolated here. The independent boundary verifier
// executes the application's actual withAuth wrapper and email-verification guard.
vi.mock('../../lib/auth', () => ({
  withAuth: (handler: (context: TestContext) => Promise<Response>) => handler,
  getContextUser: (context: TestContext) => context.data.user,
}));
vi.mock('../../lib/supabase', () => ({
  createSupabaseAdminClient: () => ({ from: fixture.from, rpc: fixture.rpc }),
  getServiceClient: () => ({ from: fixture.from, rpc: fixture.rpc }),
}));
vi.mock('../../api/career/utils/rate-limit', () => ({ checkRateLimit: fixture.rateLimit }));
vi.mock('../../api/embedding/services/textBuilder', () => ({ buildlearnerTextFromDatabase: fixture.buildText }));
vi.mock('../../api/embedding/services/embeddingWorkerClient', () => ({ callEmbeddingWorker: fixture.embed }));
vi.mock('../../api/embedding/services/databaseUpdater', () => ({ updateEmbedding: fixture.persist }));
vi.mock('../../api/embedding/handlers/generateEmbedding', () => ({}));
vi.mock('../../lib/entitlements', () => ({ hasFeatureEntitlement: fixture.entitled }));
vi.mock('../../api/shared/ai-config', () => ({ getAPIKeys: () => ({}) }));
vi.mock('../../api/career/handlers/chat', () => ({}));
vi.mock('../../api/career/handlers/analyze-assessment', () => ({}));
vi.mock('../../api/career/handlers/field-keywords', () => ({}));
vi.mock('../../api/career/handlers/parse-resume', () => ({}));
vi.mock('../../api/career/handlers/get-actions', () => ({}));
vi.mock('../../api/career/handlers/profile', () => ({}));
vi.mock('../../api/career/handlers/opportunities', () => ({}));
vi.mock('../../api/career/handlers/skills-demand', () => ({}));
vi.mock('../../api/career/handlers/analytics', () => ({}));
vi.mock('../../api/career/handlers/conversations', () => ({}));
vi.mock('../../api/career/handlers/feedback', () => ({}));

import { onRequest } from '../../api/career/[[path]]';
import { handleRecommendOpportunities } from '../../api/career/handlers/recommend';
import { RECOMMENDATION_PREPROCESSING_VERSION, RECOMMENDATION_RANKING_POLICY_VERSION } from '../../api/career/utils/recommendation-versions';

const env = {
  SUPABASE_URL: 'https://fixture.invalid',
  SUPABASE_ANON_KEY: 'fixture-anon',
  SUPABASE_SERVICE_ROLE_KEY: 'fixture-service',
  MATCHING_EMBEDDING_MODEL: 'fixture-model', MATCHING_CATALOG_MODEL: 'fixture-model',
  MATCHING_VECTOR_PIPELINE_VERIFIED: 'true',
};
const aliases = ['recommend-opportunities', 'recommend'];

function makeQuery(table: string) {
  const filters: Array<[string, unknown]> = [];
  let columns = '*';
  const resolve = () => {
    fixture.reads.push({ table, columns, filters: [...filters] });
    if (table === 'learners') {
      if (columns === 'id, user_id') {
        if (fixture.lookupThrows) throw new Error('private-database-host');
        if (fixture.lookupError) return { data: null, error: { code: 'XX000', message: 'private-database-host' } };
        if (fixture.identityOverride) return { data: fixture.identityOverride, error: null };
      }
      const rows = fixture.learners.filter(row => filters.every(([key, value]) => row[key] === value));
      const row = rows[0];
      return { data: row ? { ...row, embedding: fixture.missingVector ? null : [0.1, 0.2] } : null, error: null };
    }
    if (table === 'opportunity_interactions') {
      if (fixture.feedbackError) return {data: null, error: {code: 'fixture-outage'}};
      const rows = [{ learner_id: fixture.userId, action: 'dismiss', opportunity_id: fixture.dismissedId }];
      return { data: rows.filter(row => filters.every(([key, value]) => (row as Row)[key] === value)), error: null };
    }
    if (table === 'opportunities') {
      const rows = [...Array.from({ length: 60 }, (_, index) => ({ id: `own-${index}` })), { id: 'own-ranked' }]
        .map(row => ({ ...row, status: 'open', is_active: true, deadline: null, title: 'Current job', application_link: 'https://employer.invalid/apply', ...fixture.jobOverrides[row.id] }));
      return { data: rows.filter(row => filters.every(([key, value]) => Array.isArray(value) ? value.includes((row as Row)[key]) : (row as Row)[key] === value)), error: null };
    }
    throw new Error(`Unexpected table ${table}`);
  };
  const query = {
    select(value: string) { columns = value; return query; },
    eq(key: string, value: unknown) { filters.push([key, value]); return query; },
    in(key: string, value: unknown[]) { filters.push([key, value]); return query; },
    or() { return query; },
    async maybeSingle() { return resolve(); },
    then(resolveResult: (value: unknown) => unknown, reject: (error: unknown) => unknown) {
      return Promise.resolve().then(resolve).then(resolveResult, reject);
    },
  };
  return query;
}

async function request(
  body: unknown = { learnerId: fixture.learnerId },
  alias = aliases[0],
  options: { method?: string; raw?: string } = {}
) {
  const method = options.method ?? 'POST';
  const context: TestContext = {
    env,
    data: { user: { id: fixture.userId } },
    params: { path: [alias] },
    request: new Request(`https://fixture.invalid/api/career/${alias}`, {
      method,
      ...(method === 'GET' ? {} : { body: options.raw ?? JSON.stringify(body) }),
    }),
  };
  return await onRequest(context as unknown as Parameters<typeof onRequest>[0]);
}

function noRecommendationWork() {
  expect(fixture.rpc).not.toHaveBeenCalled();
  expect(fixture.buildText).not.toHaveBeenCalled();
  expect(fixture.embed).not.toHaveBeenCalled();
  expect(fixture.persist).not.toHaveBeenCalled();
  expect(fixture.rateLimit).not.toHaveBeenCalled();
  expect(fixture.reads.every(read => read.table === 'learners' && read.columns === 'id, user_id')).toBe(true);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  fixture.learners = [
    { id: fixture.learnerId, user_id: fixture.userId, name: 'Own fixture' },
    { id: fixture.foreignId, user_id: fixture.foreignUserId, name: 'Foreign fixture' },
  ];
  fixture.reads = [];
  fixture.cacheMiss = false;
  fixture.lookupError = false;
  fixture.lookupThrows = false;
  fixture.identityOverride = null;
  fixture.missingVector = false;
  fixture.feedbackError = false; fixture.jobOverrides = {}; fixture.dismissedId = 'dismissed-own-job';
  env.MATCHING_EMBEDDING_MODEL = 'fixture-model'; env.MATCHING_CATALOG_MODEL = 'fixture-model';
  env.MATCHING_VECTOR_PIPELINE_VERIFIED = 'true';
  fixture.from.mockImplementation(makeQuery);
  fixture.rateLimit.mockResolvedValue(true);
  fixture.entitled.mockResolvedValue(true);
  fixture.rpc.mockImplementation(async (name: string, args: Record<string, unknown>) => {
    if (name === 'get_recommendation_state_v3') {
      const own = args.p_learner_id === fixture.learners[0]?.id;
      return { data: { revision: '1', catalog_revision: '1', embedding: fixture.missingVector ? null : Array(1536).fill(0.01), computed_at: '2026-10-15T00:00:00Z', algorithm_version: 'v2.0', matches: fixture.cacheMiss ? null : Array.from({ length: 60 }, (_, index) => ({ id: `${own ? 'own' : 'foreign'}-${index}` })) }, error: null };
    }
    if (name === 'match_opportunities_enhanced_v2') return { data: [{ id: 'own-ranked', similarity: 0.8 }], error: null };
    if (name === 'match_opportunities_enhanced' || name === 'get_generic_recommendations_v3') return { data: [{ id: 'own-ranked' }], error: null };
    if (name === 'publish_recommendation_vector_v3') fixture.missingVector = false;
    if (name === 'save_recommendation_matches_v3' || name === 'publish_recommendation_vector_v3') return { data: true, error: null };
    throw new Error(`Unexpected RPC ${name}`);
  });
});
afterEach(() => vi.restoreAllMocks());

describe.each(aliases)('%s ownership boundary', alias => {
  for (const cacheMiss of [false, true]) {
    for (const target of ['foreignId', 'unknownId'] as const) {
      it(`rejects ${target} before work with cacheMiss=${cacheMiss}`, async () => {
        fixture.cacheMiss = cacheMiss;
        const result = await request({ learnerId: fixture[target], forceRefresh: cacheMiss }, alias);
        expect(result.status).toBe(403);
        expect(fixture.reads).toEqual([{ table: 'learners', columns: 'id, user_id', filters: [['user_id', fixture.userId]] }]);
        noRecommendationWork();
      });
    }
  }

  it('allows self with distinct user and learner IDs, after checking the owner mapping', async () => {
    const result = await request({ learnerId: fixture.learnerId, limit: 3 }, alias);
    expect(result.status).toBe(200);
    const body = await result.json() as { data: { recommendations: Array<{ id: string }> } };
    expect(body.data.recommendations.map(job => job.id)).toEqual(['own-0', 'own-1', 'own-2']);
    expect(fixture.reads[0].filters).toEqual([['user_id', fixture.userId]]);
    expect(fixture.rpc).toHaveBeenCalledWith('get_recommendation_state_v3', { p_learner_id: fixture.learnerId, p_user_id: fixture.userId, p_model: env.MATCHING_EMBEDDING_MODEL, p_preprocessing: RECOMMENDATION_PREPROCESSING_VERSION, p_ranking_policy: RECOMMENDATION_RANKING_POLICY_VERSION });
    expect(fixture.rateLimit).toHaveBeenCalledWith(`matching:${fixture.userId}`, env);
  });

  it('does not accept client identity or role claims as authorization', async () => {
    const result = await request({ learnerId: fixture.foreignId, userId: fixture.foreignUserId, role: 'super_admin' }, alias);
    expect(result.status).toBe(403);
    noRecommendationWork();
  });

  it('returns 404 instead of generic matching when the caller has no learner mapping', async () => {
    fixture.learners = [];
    expect((await request({ learnerId: fixture.learnerId }, alias)).status).toBe(404);
    noRecommendationWork();
  });

  it.each(['lookupError', 'lookupThrows'] as const)('fails closed without leaking internals on %s', async failure => {
    fixture[failure] = true;
    const result = await request({ learnerId: fixture.learnerId }, alias);
    expect(result.status).toBe(500);
    expect(JSON.stringify(await result.json())).not.toContain('private-database-host');
    noRecommendationWork();
  });
});

describe('canonical identifiers and authorized execution', () => {
  it('uses learner primary IDs for profile/ranking/cache and user IDs for feedback', async () => {
    fixture.cacheMiss = true;
    expect((await request()).status).toBe(200);
    expect(fixture.reads.find(read => read.columns === 'id')?.filters).toEqual([
      ['id', fixture.learnerId], ['user_id', fixture.userId],
    ]);
    expect(fixture.reads.find(read => read.table === 'opportunity_interactions')?.filters).toEqual([
      ['learner_id', fixture.userId], ['action', 'dismiss'],
    ]);
    expect(fixture.rpc).toHaveBeenCalledWith('match_opportunities_enhanced_v2', expect.objectContaining({
      learner_id_param: fixture.learnerId, dismissed_ids: ['dismissed-own-job'],
    }));
    expect(fixture.rpc).toHaveBeenCalledWith('save_recommendation_matches_v3', expect.objectContaining({ p_learner_id: fixture.learnerId, p_user_id: fixture.userId, p_revision: '1' }));
  });

  it('only builds and persists the authorized learner vector on a cache miss', async () => {
    fixture.cacheMiss = true;
    fixture.missingVector = true;
    expect((await request()).status).toBe(200);
    expect(fixture.buildText).toHaveBeenCalledWith(expect.anything(), fixture.learnerId);
    expect(fixture.rpc).toHaveBeenCalledWith('publish_recommendation_vector_v3', expect.objectContaining({ p_learner_id: fixture.learnerId, p_user_id: fixture.userId, p_revision: '1' }));
  });

  it('supports self when learner and user UUID values happen to coincide', async () => {
    fixture.learners[0].id = fixture.userId;
    expect((await request({ learnerId: fixture.userId })).status).toBe(200);
    expect(fixture.rpc).toHaveBeenCalledWith('get_recommendation_state_v3', { p_learner_id: fixture.userId, p_user_id: fixture.userId, p_model: env.MATCHING_EMBEDDING_MODEL, p_preprocessing: RECOMMENDATION_PREPROCESSING_VERSION, p_ranking_policy: RECOMMENDATION_RANKING_POLICY_VERSION });
  });

  it('accepts an uppercase spelling of the same learner UUID but uses the resolved value', async () => {
    fixture.learners[0].id = fixture.unknownId;
    expect((await request({ learnerId: fixture.unknownId.toUpperCase() })).status).toBe(200);
    expect(fixture.rpc).toHaveBeenCalledWith('get_recommendation_state_v3', { p_learner_id: fixture.unknownId, p_user_id: fixture.userId, p_model: env.MATCHING_EMBEDDING_MODEL, p_preprocessing: RECOMMENDATION_PREPROCESSING_VERSION, p_ranking_policy: RECOMMENDATION_RANKING_POLICY_VERSION });
  });

  it('fails closed if the identity lookup returns an inconsistent owner', async () => {
    fixture.identityOverride = { id: fixture.learnerId, user_id: fixture.foreignUserId };
    expect((await request()).status).toBe(500);
    noRecommendationWork();
  });

  it('uses the actor key and stops before cache/provider work when rate limited', async () => {
    fixture.rateLimit.mockResolvedValue(false);
    expect((await request()).status).toBe(429);
    expect(fixture.rateLimit).toHaveBeenCalledWith(`matching:${fixture.userId}`, env);
    expect(fixture.rpc).not.toHaveBeenCalled();
    expect(fixture.embed).not.toHaveBeenCalled();
  });

  it('force refresh still authorizes self and reuses an existing valid vector', async () => {
    expect((await request({ learnerId: fixture.learnerId, forceRefresh: true })).status).toBe(200);
    expect(fixture.reads[0].filters).toEqual([['user_id', fixture.userId]]);
    expect(fixture.rpc.mock.calls.some(([name]) => name === 'get_cached_job_matches')).toBe(false);
    expect(fixture.buildText).not.toHaveBeenCalled();
    expect(fixture.embed).not.toHaveBeenCalled();
  });
});

describe('request contract', () => {
  it.each([
    null, [], 'text', false, {}, { learnerId: 'invalid' },
    { learnerId: fixture.learnerId, limit: '3' },
    { learnerId: fixture.learnerId, limit: null },
    { learnerId: fixture.learnerId, limit: 0 },
    { learnerId: fixture.learnerId, limit: -1 },
    { learnerId: fixture.learnerId, limit: 51 },
    { learnerId: fixture.learnerId, limit: 1.5 },
    { learnerId: fixture.learnerId, forceRefresh: 'false' },
    { learnerId: fixture.learnerId, forceRefresh: null },
  ])('rejects malformed body %j before learner/profile operations', async body => {
    expect((await request(body)).status).toBe(400);
    expect(fixture.from).not.toHaveBeenCalled();
    noRecommendationWork();
  });

  it('rejects invalid JSON before database work', async () => {
    expect((await request(null, aliases[0], { raw: '{invalid' })).status).toBe(400);
    expect(fixture.from).not.toHaveBeenCalled();
  });

  it.each([1, 3, 50])('retains supported limit %i', async limit => {
    const result = await request({ learnerId: fixture.learnerId, limit });
    expect(result.status).toBe(200);
    const body = await result.json() as { data: { recommendations: unknown[] } };
    expect(body.data.recommendations).toHaveLength(limit);
  });

  it('retains the default limit of 20', async () => {
    const body = await (await request()).json() as { data: { recommendations: unknown[] } };
    expect(body.data.recommendations).toHaveLength(20);
  });

  it('rejects unsupported method without database work', async () => {
    expect((await request(null, aliases[0], { method: 'GET' })).status).toBe(405);
    expect(fixture.from).not.toHaveBeenCalled();
  });

  it('cannot be called without an authenticated actor supplied by the router', async () => {
    const result = await handleRecommendOpportunities(
      new Request('https://fixture.invalid/api/career/recommend', { method: 'POST', body: JSON.stringify({ learnerId: fixture.learnerId }) }),
      env,
      undefined as unknown as string
    );
    expect(result.status).toBe(401);
    expect(fixture.from).not.toHaveBeenCalled();
  });
});

describe('release boundary regressions', () => {
  it('carries preprocessing/ranking versions and cached algorithm provenance', async () => {
    const body = await (await request()).json() as any;
    expect(body.data).toMatchObject({cached:true, algorithmVersion:'v2.0', entityEmbeddingsEnabled:true,
      preprocessing_version: RECOMMENDATION_PREPROCESSING_VERSION, ranking_policy_version: RECOMMENDATION_RANKING_POLICY_VERSION});
    fixture.cacheMiss = true;
    await request();
    expect(fixture.rpc).toHaveBeenCalledWith('save_recommendation_matches_v3', expect.objectContaining({
      p_preprocessing: RECOMMENDATION_PREPROCESSING_VERSION, p_ranking_policy: RECOMMENDATION_RANKING_POLICY_VERSION,
      p_algorithm: 'v2.0',
    }));
  });

  it('does not label a V1 cache hit as V2', async () => {
    const original = fixture.rpc.getMockImplementation()!;
    fixture.rpc.mockImplementation(async(name,args) => {
      const result = await original(name,args);
      if (name === 'get_recommendation_state_v3') (result.data as any).algorithm_version = 'v1.0';
      return result;
    });
    const body = await (await request()).json() as any;
    expect(body.data).toMatchObject({cached:true, algorithmVersion:'v1.0', entityEmbeddingsEnabled:false});
  });

  it('rejects a concurrent vector-space change before serving a cache hit', async () => {
    const original = fixture.rpc.getMockImplementation()!;
    let reads = 0;
    fixture.rpc.mockImplementation(async(name,args) => {
      const result = await original(name,args);
      if (name === 'get_recommendation_state_v3' && ++reads > 1) (result.data as any).embedding = null;
      return result;
    });
    expect((await request()).status).toBe(409);
  });

  it('rejects cached matches with missing algorithm provenance', async () => {
    const original = fixture.rpc.getMockImplementation()!;
    fixture.rpc.mockImplementation(async(name,args) => {
      const result = await original(name,args);
      if (name === 'get_recommendation_state_v3') delete (result.data as any).algorithm_version;
      return result;
    });
    expect((await request()).status).toBe(503);
  });

  it('uses the actor-bound pre-limit generic query instead of a limited legacy RPC', async () => {
    env.MATCHING_CATALOG_MODEL = '';
    const body = await (await request({learnerId:fixture.learnerId,limit:1})).json() as any;
    expect(body.data.recommendations).toHaveLength(1);
    expect(fixture.rpc).toHaveBeenCalledWith('get_generic_recommendations_v3', {
      p_learner_id:fixture.learnerId, p_user_id:fixture.userId, p_limit:1,
    });
    expect(fixture.rpc.mock.calls.some(([name]) => name === 'get_popular_opportunities')).toBe(false);
  });

  it.each([null, {}, 'invalid'])('does not present invalid generic data as healthy emptiness: %j', async data => {
    env.MATCHING_CATALOG_MODEL = '';
    const original = fixture.rpc.getMockImplementation()!;
    fixture.rpc.mockImplementation(async(name,args) => name === 'get_generic_recommendations_v3' ? {data,error:null} : original(name,args));
    expect((await request()).status).toBe(503);
  });

  it('allows a genuinely empty eligible generic catalog', async () => {
    env.MATCHING_CATALOG_MODEL = '';
    const original = fixture.rpc.getMockImplementation()!;
    fixture.rpc.mockImplementation(async(name,args) => name === 'get_generic_recommendations_v3' ? {data:[],error:null} : original(name,args));
    const response = await request();
    expect(response.status).toBe(200);
    expect((await response.json() as any).data).toMatchObject({recommendations:[],fallback:true});
  });

  it.each(aliases)('enforces matching entitlement on %s before target work', async alias => {
    fixture.entitled.mockResolvedValue(false);
    expect((await request(undefined, alias)).status).toBe(403);
    expect(fixture.entitled).toHaveBeenCalledWith(expect.anything(), fixture.userId, 'ai_job_matching');
    noRecommendationWork();
  });

  it('rehydrates cache fields and removes closed, expired, inactive and dismissed jobs', async () => {
    fixture.jobOverrides = { 'own-0': {status: 'closed'}, 'own-1': {deadline: '2000-01-01'}, 'own-2': {is_active: false} };
    fixture.dismissedId = 'own-3';
    const body = await (await request()).json() as any;
    expect(body.data.recommendations[0]).toMatchObject({id:'own-4', application_link:'https://employer.invalid/apply'});
    for (const id of ['own-0','own-1','own-2','own-3']) expect(body.data.recommendations.map((job: any) => job.id)).not.toContain(id);
  });

  it('fails closed on unavailable dismissal state before cache or provider work', async () => {
    fixture.feedbackError = true;
    expect((await request()).status).toBe(503);
    expect(fixture.rpc).not.toHaveBeenCalled(); expect(fixture.embed).not.toHaveBeenCalled();
  });

  it('returns an explicit generic result when vector-space provenance is unverified', async () => {
    env.MATCHING_CATALOG_MODEL = '';
    const body = await (await request()).json() as any;
    expect(body.data).toMatchObject({fallback:true, provenance:'generic', reason:'model_provenance_unverified'});
    expect(fixture.buildText).not.toHaveBeenCalled(); expect(fixture.embed).not.toHaveBeenCalled();
  });

  it('detects profile changes during a cache read', async () => {
    const original = fixture.rpc.getMockImplementation()!; let reads=0;
    fixture.rpc.mockImplementation(async (name, args) => {
      const result = await original(name,args);
      if(name==='get_recommendation_state_v3' && ++reads>1) (result.data as any).revision='2';
      return result;
    });
    expect((await request()).status).toBe(409);
  });

  it('keeps unverified alternate vector writers behind an explicit readiness gate', async () => {
    env.MATCHING_VECTOR_PIPELINE_VERIFIED = 'false';
    const response = await request();
    expect((await response.json() as any).data).toMatchObject({fallback:true,reason:'embedding_pipeline_unverified'});
    expect(fixture.embed).not.toHaveBeenCalled();
    expect(fixture.rpc.mock.calls.some(([name]) => name === 'get_recommendation_state_v3')).toBe(false);
  });

  it('does not publish an obsolete generated vector', async () => {
    fixture.cacheMiss=true; fixture.missingVector=true;
    const original=fixture.rpc.getMockImplementation()!;
    fixture.rpc.mockImplementation(async (name,args) => name==='publish_recommendation_vector_v3' ? {data:false,error:null} : original(name,args));
    expect((await request()).status).toBe(409);
    expect(fixture.rpc.mock.calls.some(([name])=>name==='match_opportunities_enhanced_v2')).toBe(false);
  });

  it('rejects an inconsistent input build before calling the provider', async () => {
    fixture.cacheMiss=true; fixture.missingVector=true;
    const original=fixture.rpc.getMockImplementation()!; let reads=0;
    fixture.rpc.mockImplementation(async(name,args)=>{
      const result=await original(name,args);
      if(name==='get_recommendation_state_v3' && ++reads>1) (result.data as any).revision='2';
      return result;
    });
    expect((await request()).status).toBe(409); expect(fixture.embed).not.toHaveBeenCalled();
  });

  it('keeps valid fresh results but reports cache persistence failure', async () => {
    fixture.cacheMiss=true; const original=fixture.rpc.getMockImplementation()!;
    fixture.rpc.mockImplementation(async(name,args)=>name==='save_recommendation_matches_v3'?{data:null,error:{code:'fixture-cache-outage'}}:original(name,args));
    const response=await request(); expect(response.status).toBe(200);
    expect((await response.json() as any).data.cache_saved).toBe(false);
  });

  it('does not persist incomplete evidence', async () => {
    fixture.cacheMiss=true; fixture.missingVector=true; fixture.buildText.mockRejectedValueOnce(new Error('evidence unavailable'));
    const response=await request(); expect(response.status).toBe(200);
    expect((await response.json() as any).data.fallback).toBe(true);
    expect(fixture.embed).not.toHaveBeenCalled();
    expect(fixture.rpc.mock.calls.some(([name])=>name==='publish_recommendation_vector_v3')).toBe(false);
  });

  it('returns 503 rather than healthy emptiness when ranking and fallback fail', async () => {
    fixture.cacheMiss=true; const original=fixture.rpc.getMockImplementation()!;
    fixture.rpc.mockImplementation(async(name,args)=>name.startsWith('match_opportunities')||name==='get_generic_recommendations_v3'?{data:null,error:{code:'fixture-outage'}}:original(name,args));
    expect((await request()).status).toBe(503);
  });
});
