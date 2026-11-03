const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const workspace = path.resolve(__dirname, '../..');
const repo = path.resolve(process.argv.find((arg, index) => index > 1 && !arg.startsWith('--')) || path.join(workspace, 'skillpassport'));
const fixedTime = '2026-10-12T00:00:00.000Z';
class AuditDate extends Date {
  constructor(...args) { super(...(args.length ? args : [fixedTime])); }
  static now() { return Date.parse(fixedTime); }
}
const loadedSources = new Set();
const ts = require(path.join(repo, 'node_modules/typescript'));
const results = [];
const logs = [];
const logger = { info() {}, warn() {}, error() {} };
const userA = { sub: '11111111-1111-4111-8111-111111111111', email: 'fixture@example.invalid', is_email_verified: true, roles: ['learner'], products: ['skillpassport'] };
const learnerB = '22222222-2222-4222-8222-222222222222';
const fixtureLearnerOwners = {
  [learnerB]: '44444444-4444-4444-8444-444444444444',
  '33333333-3333-4333-8333-333333333333': userA.sub,
};
const responses = {
  apiSuccess: data => ({ success: true, data }),
  apiError: (status, code, message) => ({ success: false, status, code, message }),
  apiDbError: error => ({ success: false, error: error.message }),
};
function load(file, mocks) {
  loadedSources.add(path.resolve(repo, file));
  const source = ts.transpileModule(fs.readFileSync(path.join(repo, file), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports, require(id) { if (!(id in mocks)) throw Error('Unmocked dependency: ' + id); return mocks[id]; },
    Date: AuditDate, Error, TypeError, Headers, Request, Response, URL, crypto: crypto.webcrypto,
    console: { log(...args) { logs.push(args.join(' ')); }, error() {}, warn() {} },
  }, { filename: file });
  return exports;
}
function database(tables) {
  return { from(table) {
    let rows = tables[table] || [];
    const query = {
      select() { return query; },
      eq(key, value) { rows = rows.filter(row => row[key] === value); return query; },
      is(key, value) { rows = rows.filter(row => row[key] === value); return query; },
      order(key, options) { rows = [...rows].sort((a, b) => options.ascending ? String(a[key]).localeCompare(String(b[key])) : String(b[key]).localeCompare(String(a[key]))); return query; },
      limit(count) { rows = rows.slice(0, count); return query; },
      maybeSingle: async () => ({ data: rows[0] || null, error: null }),
      then(resolve, reject) { return Promise.resolve({ data: rows, error: null }).then(resolve, reject); },
    };
    return query;
  } };
}
function auth(user, db) {
  return load('functions/lib/auth.ts', {
    '@rareminds-eym/auth-core': { createAuth: () => ({ authenticate: handler => request => handler(request, { user }) }) },
    '@rareminds-eym/sso-gateway': { createSsoGateway() {} },
    './app-origins': { APPROVED_ORIGINS: [] }, './entitlements': {},
    './admin-feature-request': { requireAdminRequestFeature: async () => { throw Error('Unexpected admin feature check'); } },
    './roleCategories': {}, './supabase': { getServiceClient: () => db },
    './healConfig': { isHealEnabled: async () => false }, './logger': { createLogger: () => logger },
  });
}
function context(request, params = {}) {
  return { request, params, env: { SSO_SERVICE: {}, SUPABASE_URL: 'https://fixture.invalid', SUPABASE_ANON_KEY: 'fixture-anon', SUPABASE_SERVICE_ROLE_KEY: 'fixture-service-role' }, waitUntil() {} };
}
function recommend(db, options = {}) {
  return load('functions/api/career/handlers/recommend.ts', {
    '../../../lib/response': responses,
    '../../../lib/supabase': load('functions/lib/supabase.ts', { '@supabase/supabase-js': { createClient: () => db } }),
    '../../../lib/validation': load('functions/lib/validation.ts', { zod: require(path.join(repo, 'node_modules/zod')), './response': responses }),
    '../utils/rate-limit': { checkRateLimit: async () => true },
    '../../embedding/services/textBuilder': { buildlearnerTextFromDatabase: async () => { options.builds = (options.builds || 0) + 1; return 'Fixture learner profile'; } },
    '../../embedding/services/embeddingWorkerClient': { callEmbeddingWorker: async () => { options.embeds = (options.embeds || 0) + 1; return [1, 0]; } },
    '../../embedding/services/databaseUpdater': { updateEmbedding: async () => { options.writes = (options.writes || 0) + 1; } },
  });
}
async function check(id, description, callback) {
  await callback(); results.push({ id, result: 'PASS', description });
}
(async () => {
  let learner = { id: learnerB, user_id: userA.sub };
  const now = fixedTime;
  const tables = {
    learners: [learner],
    skills: [{ learner_id: learnerB, name: 'Python', type: 'technical', enabled: false, approval_status: 'pending', training_id: null }],
    opportunities: [
      { id: 'open-job', company_name: 'Fixture', status: 'open', is_active: true, skills_required: ['Python'], posted_date: now },
      { id: 'expired-inactive', company_name: 'Fixture', status: 'active', is_active: false, deadline: '2000-01-01', skills_required: ['Python'], posted_date: now },
      { id: 'unrelated', company_name: 'Fixture', status: 'active', skills_required: ['Accounting'], posted_date: now },
    ],
  };
  const db = database(tables);
  const dashboard = load('functions/api/learners/ai-recommendations.ts', {
    '../../lib/auth': auth(userA, db), '../../lib/heal-user': {},
    '../../lib/supabase': { getServiceClient: () => db }, '../../lib/logger': { createLogger: () => logger }, '../../lib/response': responses,
  });
  const dashboardRequest = () => dashboard.onRequestGet(context(new Request('https://fixture.invalid/api/learners/ai-recommendations')));
  const output = await dashboardRequest();
  await check('T01', 'Dashboard excludes open job and retains expired inactive active-status job', async () => {
    assert.equal(output.data.recommendations.length, 2);
    assert.equal(output.data.recommendations.some(row => row.id === 'open-job'), false);
    assert.equal(output.data.recommendations[0].id, 'expired-inactive');
  });
  await check('T02', 'Disabled pending skill contributes 40 points; absent preferences yield 45 with recency', async () => {
    assert.equal(output.data.recommendations[0].match_percentage, 45);
    assert.equal(output.data.recommendations[1].match_percentage, 5);
    assert.equal(output.data.recommendations[1].isAIRecommended, false);
  });
  await check('T03', '45 percent is conditional: populated preference and experience fields can produce 100', async () => {
    Object.assign(learner, { preferred_employment_types: ['full-time'], preferred_locations: ['Bengaluru'], preferred_departments: ['Tech'], experience_level: 'entry' });
    Object.assign(tables.opportunities[1], { employment_type: 'full-time', location: 'Bengaluru', department: 'Tech', experience_level: 'entry' });
    assert.equal((await dashboardRequest()).data.recommendations[0].match_percentage, 100);
  });
  await check('T04', 'Actual dashboard mapping overrides false recommendation flag on 5 percent result', async () => {
    const source = fs.readFileSync(path.join(repo, 'src/pages/learner/Dashboard.jsx'), 'utf8');
    const start = source.indexOf('const hasAIRecommendations =');
    const end = source.indexOf('// Separate opportunities by type', start);
    assert(start >= 0 && end > start);
    const mapped = vm.runInNewContext('(() => {' + source.slice(start, end) + ';return allJobsToShow;})()', { matchedJobs: [output.data.recommendations[1]], opportunities: [] });
    assert.equal(mapped[0].isAIRecommended, true);
    assert.equal(mapped[0].matchScore, 5);
  });
  let responseData = { recommendations: [{ id: 'hybrid', similarity: 0.9, final_score: 0.485, match_percentage: 49 }] };
  const service = load('src/features/opportunities/api/aiJobMatchingService.ts', {
    '@/shared/api/ssoClient': { ssoClient: { getAccessToken: () => null, fetch: async () => ({ ok: true, json: async () => ({ data: responseData }) }) } },
    '@/shared/api/apiUtils': { getApiUrl: () => '/api/career' },
  });
  await check('T05', 'Weighted 49 percent is transformed to raw similarity 90 percent', async () => {
    assert.equal((await service.matchJobsWithAI(learner, 3, false))[0].match_score, 90);
  });
  await check('T06', 'Fallback without similarity receives 50 percent and loses fallback flag', async () => {
    responseData = { recommendations: [{ id: 'fallback' }], fallback: true, reason: 'no_matches' };
    const match = (await service.matchJobsWithAI(learner, 3, false))[0];
    assert.equal(match.match_score, 50); assert.equal(match.fallback, undefined);
  });
  let tableReads = 0;
  const cacheDb = { from() { tableReads++; throw Error('Unexpected database table read'); }, rpc: async () => ({ data: [{ is_cached: true, matches: [{ id: 'expired-cache', deadline: '2000-01-01' }], match_count: 1 }], error: null }) };
  const cachedRec = recommend(cacheDb);
  const req = body => new Request('https://fixture.invalid/api/career/recommend-opportunities', { method: 'POST', body: JSON.stringify(body) });
  await check('T07', 'Expired cached job is returned before learner or dismissal queries', async () => {
    const result = await cachedRec.handleRecommendOpportunities(req({ learnerId: learnerB }), context(null).env);
    assert.equal(result.data.recommendations[0].deadline, '2000-01-01'); assert.equal(tableReads, 0);
  });
  let entitlementChecks = 0;
  const routeMocks = {
    '../../lib/response': responses, '../../lib/cors': {}, '../../lib/auth': auth(userA, cacheDb),
    '../../lib/supabase': { getServiceClient: () => cacheDb },
    '../../lib/entitlements': { hasFeatureEntitlement: async () => { entitlementChecks++; return false; } },
    '../shared/ai-config': { getAPIKeys: () => ({}) }, './handlers/recommend': cachedRec,
    '../embedding/handlers/generateEmbedding': {},
  };
  for (const name of ['chat', 'analyze-assessment', 'field-keywords', 'parse-resume', 'get-actions', 'profile', 'opportunities', 'skills-demand', 'analytics', 'conversations', 'feedback']) routeMocks['./handlers/' + name] = {};
  const route = load('functions/api/career/[[path]].ts', routeMocks);
  await check('T08', 'Real auth wrapper and career route accept another learner ID without entitlement call', async () => {
    const result = await route.onRequest(context(req({ learnerId: learnerB }), { path: ['recommend-opportunities'] }));
    assert.equal(result.success, true); assert.equal(entitlementChecks, 0);
    assert.notEqual(fixtureLearnerOwners[learnerB], userA.sub);
  });
  await check('T09', 'Email verification guard still blocks an unverified authenticated user', async () => {
    const unverified = load('functions/api/career/[[path]].ts', { ...routeMocks, '../../lib/auth': auth({ ...userA, is_email_verified: false }, cacheDb) });
    const result = await unverified.onRequest(context(req({ learnerId: learnerB }), { path: ['recommend-opportunities'] }));
    assert.equal(result.status, 403);
  });
  const counters = {};
  const freshDb = database({ learners: [{ id: learnerB, name: 'Fixture', embedding: [1, 0] }], opportunity_interactions: [] });
  freshDb.rpc = async name => {
    if (name === 'match_opportunities_enhanced_v2') return { data: [{ id: 'hybrid', similarity: 0.9, match_percentage: 49 }], error: null };
    if (name === 'save_job_matches_cache') return { data: null, error: { message: 'Synthetic cache storage rejection' } };
    throw Error('Unexpected RPC ' + name);
  };
  const freshRec = recommend(freshDb, counters);
  await check('T10', 'Force refresh reuses existing learner embedding', async () => {
    const result = await freshRec.handleRecommendOpportunities(req({ learnerId: learnerB, forceRefresh: true }), context(null).env);
    assert.equal(result.success, true); assert.equal(counters.builds || 0, 0); assert.equal(counters.embeds || 0, 0);
  });
  await check('T11', 'Returned cache RPC error is ignored while handler logs CACHE SAVE', async () => {
    assert(logs.some(line => line.includes('[CACHE SAVE]')));
  });
  const client = load('functions/api/embedding/services/embeddingWorkerClient.ts', {
    '../types': load('functions/api/embedding/types/index.ts', {}),
    '../config/constants': load('functions/api/embedding/config/constants.ts', {}),
    '../lib/embeddingBinding': load('functions/api/embedding/lib/embeddingBinding.ts', {}),
  });
  await check('T12', 'Embedding text above 10000 characters throws undefined logger', async () => {
    await assert.rejects(() => client.callEmbeddingWorker('a'.repeat(10001), {}), error => error.message === 'logger is not defined');
  });
  await check('T13', 'Malformed embedding response references undefined embedding variable', async () => {
    await assert.rejects(() => client.callEmbeddingWorker('Fixture learner profile', { EMBEDDING_SERVICE: { embedText: async () => ({ embedding: [] }) } }), error => error.code === 'API_ERROR' && error.message.includes('embedding is not defined'));
  });
  await check('T14', 'Legacy track-interaction handler rejects frontend interaction_type payload', async () => {
    const actions = load('functions/api/ai-tutor/handlers/actions.ts', { '../../../lib/auth': auth(userA, db), '../../../lib/supabase': { getServiceClient: () => db }, '../../../lib/response': responses });
    const result = await actions.onRequestPost(context(new Request('https://fixture.invalid/api/ai-tutor/actions', { method: 'POST', body: JSON.stringify({ action: 'track-interaction', learner_id: learnerB, opportunity_id: 'fixture-job', interaction_type: 'dismiss' }) })));
    assert.equal(result.success, false); assert.match(result.error, /action required/);
  });
  await check('T15', 'Well-formed short input returns worker vector without undefined-identifier failure', async () => {
    const vector = new Array(1536).fill(0); vector[0] = 1;
    const actual = await client.callEmbeddingWorker('Fixture learner profile', { EMBEDDING_SERVICE: { embedText: async () => ({ embedding: vector }) } });
    assert.equal(actual, vector);
  });
  await check('T16', 'Invalid learner UUID is rejected before matching', async () => {
    const result = await cachedRec.handleRecommendOpportunities(req({ learnerId: 'not-a-uuid' }), context(null).env);
    assert.equal(result.status, 400); assert.equal(result.code, 'VALIDATION_ERROR');
  });
  await check('T17', 'Recommendation handler rejects GET method', async () => {
    const result = await cachedRec.handleRecommendOpportunities(new Request('https://fixture.invalid/api/career/recommend-opportunities'), context(null).env);
    assert.equal(result.status, 405);
  });
  await check('T18', 'Missing learner vector invokes builder worker and persistence when dependencies succeed', async () => {
    const counters = {};
    const missingDb = database({ learners: [{ id: learnerB, name: 'Fixture', embedding: null }], opportunity_interactions: [] });
    missingDb.rpc = freshDb.rpc;
    const result = await recommend(missingDb, counters).handleRecommendOpportunities(req({ learnerId: learnerB, forceRefresh: true }), context(null).env);
    assert.equal(result.success, true); assert.equal(counters.builds, 1); assert.equal(counters.embeds, 1); assert.equal(counters.writes, 1);
  });
  await check('T19', 'Self-target fixture remains allowed under current route', async () => {
    const selfTarget = '33333333-3333-4333-8333-333333333333';
    assert.equal(fixtureLearnerOwners[selfTarget], userA.sub);
    const result = await route.onRequest(context(req({ learnerId: selfTarget }), { path: ['recommend-opportunities'] }));
    assert.equal(result.success, true);
  });
  await check('T20', 'Actual local limiter permits five requests and rejects sixth for same key', async () => {
    const limiter = load('functions/api/career/utils/rate-limit.ts', {});
    for (let i = 0; i < 5; i++) assert.equal(await limiter.checkRateLimit('fixture-subject'), true);
    assert.equal(await limiter.checkRateLimit('fixture-subject'), false);
    assert.equal(await limiter.checkRateLimit('another-fixture-subject'), true);
  });
  await check('T21', 'V2 empty result and V1 RPC error invoke explicit generic fallback', async () => {
    const fallbackDb = database({ learners: [{ id: learnerB, embedding: [1, 0] }], opportunity_interactions: [] });
    const calls = [];
    fallbackDb.rpc = async name => {
      calls.push(name);
      if (name === 'match_opportunities_enhanced_v2') return { data: [], error: null };
      if (name === 'match_opportunities_enhanced') return { data: null, error: { message: 'fixture missing function' } };
      if (name === 'get_popular_opportunities') return { data: [{ id: 'generic-fallback' }], error: null };
      throw Error('Unexpected RPC ' + name);
    };
    const result = await recommend(fallbackDb).handleRecommendOpportunities(req({ learnerId: learnerB, forceRefresh: true }), context(null).env);
    assert.equal(result.data.fallback, true); assert.equal(result.data.reason, 'match_error');
    assert.equal(result.data.recommendations[0].id, 'generic-fallback');
    assert.deepEqual(calls, ['match_opportunities_enhanced_v2', 'match_opportunities_enhanced', 'get_popular_opportunities']);
  });
  await check('T22', 'Missing service binding is reported as API error rather than false matching success', async () => {
    await assert.rejects(() => client.callEmbeddingWorker('Fixture learner profile', {}), error => error.code === 'API_ERROR' && error.message.includes('binding is not configured'));
  });
  function failedQuery(message) {
    const query = { select() { return query; }, eq() { return query; }, is() { return query; }, then(resolve, reject) { return Promise.resolve({ data: null, error: { message } }).then(resolve, reject); } };
    return query;
  }
  const builder = load('functions/api/embedding/services/textBuilder.ts', {
    '../types': load('functions/api/embedding/types/index.ts', {}),
    '../config/constants': load('functions/api/embedding/config/constants.ts', {}),
  });
  function builderDb(coreError = false) {
    return { from(table) {
      const query = {
        select() { return query; }, eq() { return query; }, order() { return query; },
        limit() { return query; }, or() { return query; }, in() { return query; },
        single: async () => coreError ? { data: null, error: { message: 'fixture core profile failure' } } : { data: { id: learnerB, name: 'Fixture', bio: 'Experienced fixture learner with a sufficiently detailed profile for embedding construction.' }, error: null },
        then(resolve, reject) { return Promise.resolve({ data: null, error: { message: 'fixture ' + table + ' outage' } }).then(resolve, reject); },
      };
      return query;
    } };
  }
  await check('T23', 'Builder silently constructs profile text when all five related queries return errors', async () => {
    const text = await builder.buildlearnerTextFromDatabase(builderDb(), learnerB);
    assert(text.includes('sufficiently detailed profile'));
    assert(!text.includes('TECHNICAL SKILLS')); assert(text.length >= 50);
  });
  await check('T24', 'Dismissal query error is treated as an empty dismissal list during fresh matching', async () => {
    const errorDb = database({ learners: [{ id: learnerB, embedding: [1, 0] }] });
    const from = errorDb.from.bind(errorDb);
    errorDb.from = table => table === 'opportunity_interactions' ? failedQuery('fixture dismissal read failure') : from(table);
    let receivedDismissed;
    errorDb.rpc = async (name, params) => {
      if (name === 'match_opportunities_enhanced_v2') { receivedDismissed = params.dismissed_ids; return { data: [{ id: 'previously-dismissed-fixture', similarity: 0.8 }], error: null }; }
      if (name === 'save_job_matches_cache') return { data: null, error: null };
      throw Error('Unexpected RPC ' + name);
    };
    const result = await recommend(errorDb).handleRecommendOpportunities(req({ learnerId: learnerB, forceRefresh: true }), context(null).env);
    assert.equal(result.success, true); assert.equal(receivedDismissed.length, 0);
    assert.equal(result.data.fallback, undefined);
  });
  await check('T25', 'Dashboard skills read failure returns successful recommendations without degradation marker', async () => {
    const errorDb = database(tables), from = errorDb.from.bind(errorDb);
    errorDb.from = table => table === 'skills' ? failedQuery('fixture skill query failure') : from(table);
    const handler = load('functions/api/learners/ai-recommendations.ts', {
      '../../lib/auth': auth(userA, errorDb), '../../lib/heal-user': {},
      '../../lib/supabase': { getServiceClient: () => errorDb }, '../../lib/logger': { createLogger: () => logger }, '../../lib/response': responses,
    });
    const result = await handler.onRequestGet(context(new Request('https://fixture.invalid/api/learners/ai-recommendations')));
    assert.equal(result.success, true); assert.equal(result.data.recommendations[0].match_percentage, 60);
    assert.equal(result.data.fallback, false); assert.equal(result.data.learnerProfile.skills.technical.length, 0);
  });
  await check('T26', 'One null required-skill element makes the entire dashboard recommendation request fail', async () => {
    tables.opportunities.push({ id: 'malformed-skill', status: 'active', company_name: 'Fixture', skills_required: [null], posted_date: fixedTime });
    try { const result = await dashboardRequest(); assert.equal(result.status, 500); assert.equal(result.code, 'INTERNAL_ERROR'); }
    finally { tables.opportunities.pop(); }
  });
  await check('T27', 'V2-shaped opportunity loses external link and actual Apply handler omits redirect until hydrated', async () => {
    const schema = fs.readFileSync(path.join(repo, 'supabase/migrations/20260526000000_schema.sql'), 'utf8');
    const start = schema.indexOf('CREATE OR REPLACE FUNCTION "public"."match_opportunities_enhanced_v2"');
    const signature = schema.slice(start, schema.indexOf('LANGUAGE', start));
    assert(start >= 0); assert(!signature.includes('"application_link"'));
    assert(!signature.includes('"requirements"')); assert(!signature.includes('"posted_date"'));
    responseData = { recommendations: [{ id: 'external-fixture', title: 'Fixture role', company_name: 'Fixture', similarity: 0.8, match_percentage: 70 }] };
    const opportunity = (await service.matchJobsWithAI(learner, 3, false))[0].opportunity;
    assert.equal(opportunity.application_link, undefined);
    const source = fs.readFileSync(path.join(repo, 'src/pages/learner/Opportunities.jsx'), 'utf8');
    const ast = ts.createSourceFile('Opportunities.jsx', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
    let applyExpression;
    function visit(node) { if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'handleApply') applyExpression = node.initializer.getText(ast); ts.forEachChild(node, visit); }
    visit(ast); assert(applyExpression);
    const opened = [], applied = [];
    const apply = vm.runInNewContext('(' + applyExpression + ')', {
      canAccessOpportunities: true, learnerId: learnerB, needsProfileCompletion: false,
      appliedJobs: new Set(), setIsApplying() {}, setAppliedJobs() {}, setShowUpgradePrompt() {}, navigate() {}, logger,
      toast: { info() {}, error() {}, success() {} },
      AppliedJobsService: { applyToJob: async (id, job) => { applied.push(job); return { success: true }; } },
      window: { open: url => opened.push(url) },
    });
    await apply(opportunity); assert.equal(applied.length, 1); assert.equal(opened.length, 0);
    await apply({ ...opportunity, application_link: 'https://employer.example.invalid/apply' });
    assert.equal(applied.length, 2); assert.equal(opened.length, 1);
  });
  await check('T28', 'Nonnumeric limit is accepted and silently returns an empty cached result', async () => {
    const result = await cachedRec.handleRecommendOpportunities(req({ learnerId: learnerB, limit: 'invalid-limit' }), context(null).env);
    assert.equal(result.success, true); assert.equal(result.data.count, 0);
  });
  await check('T29', 'JSON null is not rejected with a structured 400 in the recommendation handler', async () => {
    await assert.rejects(() => cachedRec.handleRecommendOpportunities(req(null), context(null).env), error => error.name === 'TypeError');
  });
  await check('T30', 'Failure of both matching and fallback RPCs is reported as successful empty recommendations', async () => {
    const errorDb = database({ learners: [{ id: learnerB, embedding: [1, 0] }], opportunity_interactions: [] });
    errorDb.rpc = async () => ({ data: null, error: { message: 'fixture database outage' } });
    const result = await recommend(errorDb).handleRecommendOpportunities(req({ learnerId: learnerB, forceRefresh: true }), context(null).env);
    assert.equal(result.success, true); assert.equal(result.data.count, 0);
    assert.equal(result.data.reason, 'match_error'); assert.equal(result.data.fallback, true);
  });
  await check('T31', 'Builder correctly rejects core learner read failure instead of ignoring every database error', async () => {
    await assert.rejects(() => builder.buildlearnerTextFromDatabase(builderDb(true), learnerB), error => error.code === 'INSUFFICIENT_DATA');
  });
  const evidencePaths = [
    'src/pages/learner/Dashboard.jsx', 'src/pages/learner/Opportunities.jsx', 'src/pages/learner/MySkills.jsx',
    'src/pages/learner/BrowseJobs.jsx', 'src/pages/learner/CareerAI.tsx', 'src/app/routes/learnerRoutes.jsx',
    'src/widgets/learner-dashboard/ui/RecommendedJobs.jsx', 'src/widgets/learner-dashboard/ui/LearnerDashboardWidget.tsx',
    'src/features/opportunities/model/useAIJobMatching.ts', 'src/features/opportunities/model/useOpportunities.ts',
    'src/features/learner-profile/model/useLearnerAIRecommendations.ts', 'src/features/learner-profile/api/learnerAIRecommendationsService.ts',
    'src/entities/learner/api/learnerService.ts', 'functions/api/learners/data/[[path]].ts',
    'src/features/ai-tutor/api/aiRecommendationService.ts', 'src/features/ai-tutor/model/useAIRecommendations.ts',
    'src/features/career-assistant/api/careerWorkerService.ts', 'src/features/counselling/api/careerApiService.ts',
    'functions/api/career/handlers/chat.ts', 'functions/api/career/context/smart-opportunities.ts',
    'functions/api/career/ai/prompts/enhanced-system-prompt.ts', 'functions/api/embedding/services/textBuilder.ts',
    'functions/api/embedding/services/databaseUpdater.ts', 'functions/api/recruiter/actions.ts', 'functions/_middleware.ts',
    'functions/lib/entitlements.ts', 'functions/lib/response.ts', 'src/shared/model/authStore.ts',
    'src/features/subscription/ui/shared/FeatureGate.jsx', 'supabase/migrations/20260526000000_schema.sql',
    'supabase/backups/latest/migration_schema.sql', 'supabase/backups/latest/manifest.json',
    '../embedding-worker/src/providers.ts', 'src/widgets/learner-dashboard/ui/OpportunityPreview.jsx',
    'functions/api/opportunities/index.ts', 'src/features/opportunities/api/appliedJobsService.ts',
  ];
  for (const file of evidencePaths) loadedSources.add(path.resolve(repo, file));
  // Include all local migrations so additions cannot silently invalidate absence claims.
  for (const file of fs.readdirSync(path.join(repo, 'supabase/migrations')).filter(file => file.endsWith('.sql'))) loadedSources.add(path.join(repo, 'supabase/migrations', file));
  const sources = [...loadedSources].sort().map(file => ({ path: path.relative(workspace, file).split(path.sep).join('/'), sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') }));
  const environment = { node: process.version, typescript: ts.version, zod: require(path.join(repo, 'node_modules/zod/package.json')).version, supabase: require(path.join(repo, 'node_modules/@supabase/supabase-js/package.json')).version };
  if (process.argv.includes('--assert-snapshot')) {
    const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, 'verification-results.json'), 'utf8'));
    assert.deepEqual(sources, baseline.sources, 'Audited sources have changed; do not reuse the old conclusions without review');
    assert.deepEqual(environment, baseline.environment, 'Verification runtime or dependency versions differ from the recorded run');
    assert.equal(crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'), baseline.harnessSha256, 'The verification harness has changed since the recorded run');
  }
  console.log(JSON.stringify({
    auditId: 'LJR-2026-10-12', suite: 'source-characterization',
    generatedAt: new Date().toISOString(), fixedFixtureTime: fixedTime,
    passed: results.length, failed: 0,
    scope: 'Actual application source; real app auth wrapper validation and client factory; SSO transport database provider and response envelopes isolated',
    assurance: 'Source-level only; passing assertions characterize known defects and controls, not production readiness',
    environment, sources, harnessSha256: crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex'), results,
  }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
