// Independent WP00 evidence. Does not modify the historical 31-check harness.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const workspace = path.resolve(__dirname, '../..');
const repo = path.join(workspace, 'skillpassport');
const ts = require(path.join(repo, 'node_modules/typescript'));
const flags = new Set(process.argv.slice(2));
for (const flag of flags) {
  if (!['--regression', '--assert-snapshot'].includes(flag)) throw Error(`Unknown flag: ${flag}`);
}
if (flags.has('--regression') && flags.has('--assert-snapshot')) throw Error('Snapshot assertion is for characterization mode only');
const regression = flags.has('--regression');
const inputs = new Set([__filename]);
const results = [];
const fixedTime = '2026-10-15T00:00:00.000Z';
class FixtureDate extends Date {
  constructor(...args) { super(...(args.length ? args : [fixedTime])); }
  static now() { return Date.parse(fixedTime); }
}
const ids = {
  user: '11111111-1111-4111-8111-111111111111',
  foreignLearner: '22222222-2222-4222-8222-222222222222',
  ownLearner: '33333333-3333-4333-8333-333333333333',
  foreignUser: '44444444-4444-4444-8444-444444444444',
  ownSkill: '55555555-5555-4555-8555-555555555555',
  foreignSkill: '66666666-6666-4666-8666-666666666666',
  ownProfile: '77777777-7777-4777-8777-777777777777',
  opportunity: '99999999-9999-4999-8999-999999999999',
};
const fixtureUser = {sub: ids.user, email: 'boundary-fixture@example.invalid', is_email_verified: true, roles: ['learner'], products: ['skillpassport']};
const vector = () => Array(1536).fill(0.01);
const logger = {info() {}, warn() {}, error() {}};
function read(relative) {
  const file = path.resolve(repo, relative);
  inputs.add(file);
  return fs.readFileSync(file, 'utf8');
}
function load(relative, mocks = {}, transform) {
  let source = read(relative);
  if (transform) source = transform(source);
  const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText;
  const module = {exports: {}};
  vm.runInNewContext(compiled, {
    module, exports: module.exports,
    require(name) {
      if (!(name in mocks)) throw Error(`Unmocked dependency in ${relative}: ${name}`);
      return mocks[name];
    },
    Date: FixtureDate, Error, TypeError, Request, Response, Headers, URL, crypto: crypto.webcrypto,
    console: {log() {}, error() {}, warn() {}},
  }, {filename: relative});
  return module.exports;
}
const response = load('functions/lib/response.ts', {'./cors': load('functions/lib/cors.ts')});
const constants = load('functions/api/embedding/config/constants.ts');
const types = load('functions/api/embedding/types/index.ts');
const vectorValidation = load('functions/api/embedding/services/embeddingValidation.ts', {'../types': types, '../config/constants': constants});
const jobContract = load('functions/lib/job-recommendations.ts');
const updater = load('functions/api/embedding/services/databaseUpdater.ts', {'../types': types, '../config/constants': constants, './embeddingValidation': vectorValidation});
const versions = load('functions/api/career/utils/recommendation-versions.ts');
const stateContract = load('functions/api/career/utils/recommendation-state.ts', {'../../embedding/services/embeddingValidation': vectorValidation, './recommendation-versions': versions});
const validation = load('functions/lib/validation.ts', {zod: require(path.join(repo, 'node_modules/zod')), './response': response});
const embeddingClient = load('functions/api/embedding/services/embeddingWorkerClient.ts', {
  '../types': types, '../config/constants': constants,
  '../lib/embeddingBinding': load('functions/api/embedding/lib/embeddingBinding.ts'),
  './embeddingValidation': vectorValidation,
});

function fixture(options = {}) {
  const ownLearner = options.equalIds ? ids.user : ids.ownLearner;
  const trace = {reads: [], writes: [], rpcs: [], providerCalls: 0, builds: 0, entitlementCalls: 0, entitlementArgs: []};
  const tables = {
    learners: [
      {id: ownLearner, user_id: ids.user, name: 'Own fixture', embedding: vector()},
      {id: ids.foreignLearner, user_id: ids.foreignUser, name: 'Foreign fixture', embedding: options.missingForeignVector ? null : vector()},
    ],
    skills: [{id: ids.ownSkill, learner_id: ownLearner, name: 'TypeScript', description: 'Fixture skill'}, {id: ids.foreignSkill, learner_id: ids.foreignLearner, name: 'Foreign skill'}],
    profiles: [{id: ids.ownProfile, user_id: ids.user}],
    school_admins: options.admin ? [{id: 'fixture-admin', user_id: ids.user}] : [], college_admins: [],
    opportunities: [{id: ids.opportunity, title: 'Controlled administrative fixture'},
      {id:'own-job', title:'Own current job', status:'open', is_active:true, deadline:null},
      {id:'foreign-job', title:'Foreign current job', status:'open', is_active:true, deadline:null}],
    opportunity_interactions: [{id: 'fixture-interaction', learner_id: ids.user, opportunity_id: 'dismissed-own-job', action: 'dismiss'}],
  };
  const db = {
    from(table) {
      if (!(table in tables)) throw Error(`Unexpected fixture table: ${table}`);
      const filters = [];
      let columns = '*';
      let maximum = Infinity;
      let patch;
      let execution;
      const execute = () => {
        if (execution) return execution;
        const matching = tables[table].filter(row => filters.every(([key, value]) => Array.isArray(value) ? value.includes(row[key]) : row[key] === value)).slice(0, maximum);
        const entry = {table, columns, filters: filters.map(pair => [...pair]), rows: matching.length};
        if (patch) {
          trace.writes.push(entry);
          for (const row of matching) Object.assign(row, patch);
        } else trace.reads.push(entry);
        const data = matching.map(row => columns === '*' ? {...row} : Object.fromEntries(columns.split(',').map(key => key.trim()).map(key => [key, row[key]])));
        execution = {data, error: null};
        return execution;
      };
      const query = {
        select(value = '*') {columns = value; return query;},
        eq(key, value) {filters.push([key, value]); return query;},
        in(key, value) {filters.push([key, value]); return query;},
        or() {return query;},
        limit(value) {maximum = value; return query;},
        update(value) {patch = value; return query;},
        async maybeSingle() {const result = execute(); return {...result, data: result.data[0] || null};},
        async single() {const result = execute(); return result.data.length === 1 ? {...result, data: result.data[0]} : {data: null, error: {code: 'PGRST116', message: 'Fixture missing row'}};},
        then(resolve, reject) {return Promise.resolve(execute()).then(resolve, reject);},
      };
      return query;
    },
    async rpc(name, args) {
      // Dispatch on the actual selector. Never return B's rows for an A selector.
      const selector = args.p_learner_id ?? args.learner_id_param;
      trace.rpcs.push({name, selector, dismissed: args.dismissed_ids});
      const learner = tables.learners.find(row => row.id === selector);
      if (!learner) return {data: [], error: null};
      const job = {id: selector === ids.foreignLearner ? 'foreign-job' : 'own-job', similarity: 0.8, match_percentage: 70};
      if (name === 'get_recommendation_state_v3') return {data: args.p_user_id === learner.user_id ? {revision:'1',catalog_revision:'1',embedding:learner.embedding,matches:options.cacheMiss?null:[job],computed_at:fixedTime,algorithm_version:'v2.0'} : null,error:null};
      if (name === 'save_recommendation_matches_v3' || name === 'publish_recommendation_vector_v3') return {data:true,error:null};
      if (name === 'get_cached_job_matches') return {data: options.cacheMiss ? [] : [{is_cached: true, matches: [job], match_count: 1, computed_at: fixedTime}], error: null};
      if (name === 'match_opportunities_enhanced_v2') return {data: [job], error: null};
      if (name === 'save_job_matches_cache') return {data: null, error: null};
      throw Error(`Unexpected fixture RPC: ${name}`);
    },
  };
  const env = {
    SSO_SERVICE: {}, SUPABASE_URL: 'https://fixture.invalid', SUPABASE_ANON_KEY: 'fixture-anon', SUPABASE_SERVICE_ROLE_KEY: 'fixture-service',
    MATCHING_EMBEDDING_MODEL:'fixture-model', MATCHING_CATALOG_MODEL:'fixture-model',
    MATCHING_VECTOR_PIPELINE_VERIFIED:'true',
    EMBEDDING_SERVICE: {async embedText() {trace.providerCalls++; return {embedding: vector(), model:'fixture-model'};}},
  };
  return {db, env, trace, tables, ownLearner};
}

function appAuth(f, user = fixtureUser) {
  return load('functions/lib/auth.ts', {
    '@rareminds-eym/auth-core': {createAuth: () => ({authenticate: handler => request => handler(request, {user})})},
    '@rareminds-eym/sso-gateway': {createSsoGateway() {}}, './app-origins': {APPROVED_ORIGINS: []}, './entitlements': {},
    './admin-feature-request': {requireAdminRequestFeature() {throw Error('Unexpected admin namespace');}},
    './roleCategories': {}, './supabase': {getServiceClient: () => f.db},
    './healConfig': {isHealEnabled: async () => false}, './logger': {createLogger: () => logger},
  });
}
function route(f, options = {}) {
  const supabase = load('functions/lib/supabase.ts', {'@supabase/supabase-js': {createClient: () => f.db}});
  const limiter = load('functions/api/career/utils/rate-limit.ts');
  const recommend = load('functions/api/career/handlers/recommend.ts', {
    '../../../lib/response': response, '../../../lib/supabase': supabase, '../../../lib/validation': validation,
    '../../../lib/job-recommendations': jobContract, '../utils/recommendation-state': stateContract,
    '../utils/recommendation-versions': versions,
    '../utils/rate-limit': limiter,
    '../../embedding/services/textBuilder': {async buildlearnerTextFromDatabase() {f.trace.builds++; return 'Controlled canonical profile text for boundary fixture';}},
    '../../embedding/services/embeddingWorkerClient': embeddingClient,
    '../../embedding/services/databaseUpdater': updater,
  });
  const generation = load('functions/api/embedding/handlers/generateEmbedding.ts', {
    '../../../lib/response': response, '../../../lib/validation': validation, '../../career/utils/rate-limit': limiter,
    '../../../lib/supabase': supabase, '../services/embeddingWorkerClient': embeddingClient,
    '../services/textBuilder': {}, '../services/databaseUpdater': updater, '../types': types, '../config/constants': constants,
  });
  const mocks = {
    '../../lib/response': response, '../../lib/cors': load('functions/lib/cors.ts'), '../../lib/auth': appAuth(f, options.user),
    '../../lib/supabase': supabase,
    '../../lib/job-recommendations': jobContract,
    '../../lib/entitlements': {async hasFeatureEntitlement(_db, userId, feature) {f.trace.entitlementCalls++; f.trace.entitlementArgs.push({userId, feature}); return options.entitled !== false;}},
    '../shared/ai-config': {getAPIKeys: () => ({})}, './handlers/recommend': recommend,
    '../embedding/handlers/generateEmbedding': generation,
  };
  for (const name of ['chat', 'analyze-assessment', 'field-keywords', 'parse-resume', 'get-actions', 'profile', 'opportunities', 'skills-demand', 'analytics', 'conversations', 'feedback']) mocks[`./handlers/${name}`] = {};
  return load('functions/api/career/[[path]].ts', mocks, options.transform);
}
async function invoke(f, endpoint, body, options = {}) {
  const request = new Request(`https://fixture.invalid/api/career/${endpoint}`, {method: 'POST', body: JSON.stringify(body)});
  const result = await route(f, options).onRequest({request, env: f.env, params: {path: [endpoint]}, data: {}, waitUntil() {}});
  assert(result instanceof Response, 'Fixture must exercise real application response builders');
  return {status: result.status, body: await result.json(), trace: f.trace};
}
function denyForeign(observation) {
  assert([403, 404].includes(observation.status), 'Foreign target must be rejected, not computed or silently redirected');
  assert.equal(observation.trace.rpcs.length, 0, 'Denied target reached matching/cache RPC');
  assert.equal(observation.trace.providerCalls, 0, 'Denied target reached provider');
  assert.equal(observation.trace.writes.length, 0, 'Denied target reached vector persistence');
  for (const query of observation.trace.reads) {
    const identityOnly = query.table === 'learners' && query.columns.split(',').every(key => ['id', 'user_id'].includes(key.trim()));
    if (identityOnly) continue;
    assert(!query.filters.some(([, value]) => [ids.foreignLearner, ids.foreignUser].includes(value)), 'Denied target reached profile/evidence reads before rejection');
  }
}
function selected(observation, expected) {
  const calls = observation.trace.rpcs.filter(call => ['get_cached_job_matches', 'get_recommendation_state_v3', 'match_opportunities_enhanced_v2', 'save_job_matches_cache', 'save_recommendation_matches_v3'].includes(call.name));
  assert(calls.length > 0, 'No selector was exercised');
  for (const call of calls) assert.equal(call.selector, expected, `${call.name} selected the wrong subject`);
}
async function check(id, description, exercise, characterize, desired = characterize, category = 'control') {
  // These two controls deliberately mutate the historical unsafe route. They
  // characterize the old oracle, not desired production behavior after repair.
  if (regression && category === 'fixture-mutation-control') {
    results.push({id, description, category, result: 'SKIP', message: 'Historical mutation control; execute in characterization mode'});
    return;
  }
  let observed;
  try {observed = await exercise();} catch (error) {
    results.push({id, description, category, result: 'SETUP_ERROR', message: error.message});
    return;
  }
  try {
    (regression ? desired : characterize)(observed);
    results.push({id, description, category, result: 'PASS', evidence: evidence(observed)});
  } catch (error) {
    results.push({id, description, category, result: error instanceof assert.AssertionError ? 'FAIL' : 'SETUP_ERROR', message: error.message, evidence: evidence(observed)});
  }
}
function evidence(observed) {
  if (observed?.trace) return {
    status: observed.status, rpcs: observed.trace.rpcs,
    providerCalls: observed.trace.providerCalls,
    writes: observed.trace.writes, entitlementChecks: observed.trace.entitlementArgs,
  };
  if (observed && typeof observed === 'object' && 'rowsAffected' in observed) return observed;
  return undefined;
}
function mutation(kind, ownLearner) {
  return source => {
    const anchor = 'return await handleRecommendOpportunities(request, env as any);';
    assert.equal(source.split(anchor).length, 2, 'Mutation anchor changed; review rather than silently skipping');
    const replacement = kind === 'redirect'
      ? `request = new Request(request.url, {method: 'POST', body: JSON.stringify({...await request.json(), learnerId: '${ownLearner}'})});\n${anchor}`
      : `if ((await request.clone().json() as any).learnerId !== '${ownLearner}') return apiError(403, 'FORBIDDEN', 'Fixture-only guard', request);\n${anchor}`;
    return source.replace(anchor, replacement);
  };
}

(async () => {
  for (const endpoint of ['recommend-opportunities', 'recommend']) {
    for (const cacheMiss of [false, true]) {
      const suffix = `${endpoint}/${cacheMiss ? 'miss' : 'hit'}`;
      await check(`OWN/${suffix}`, 'Foreign subject is selected under current code; regression requires rejection before work', async () => {
        const f = fixture({cacheMiss, missingForeignVector: cacheMiss});
        return invoke(f, endpoint, {learnerId: ids.foreignLearner});
      }, o => {
        assert.equal(o.status, 200); selected(o, ids.foreignLearner);
        assert.equal(o.body.data.recommendations[0].id, 'foreign-job');
        if (cacheMiss) {assert.equal(o.trace.providerCalls, 1); assert(o.trace.writes.some(w => w.table === 'learners' && w.filters.some(([k,v]) => k === 'id' && v === ids.foreignLearner)));}
      }, denyForeign, 'known-defect');
      await check(`SELF/${suffix}`, 'Authorized self remains allowed with selector-aware cache and ranking', async () => {
        const f = fixture({cacheMiss}); return invoke(f, endpoint, {learnerId: f.ownLearner});
      }, o => {assert.equal(o.status, 200); selected(o, ids.ownLearner); assert.equal(o.body.data.recommendations[0].id, 'own-job');});
    }
    await check(`ENT/${endpoint}`, 'Denied matching entitlement must be checked before cache/provider work', async () => {
      const f = fixture(); return invoke(f, endpoint, {learnerId: f.ownLearner}, {entitled: false});
    }, o => {assert.equal(o.status, 200); assert.equal(o.trace.entitlementCalls, 0);}, o => {
      assert.equal(o.status, 403); assert(o.trace.entitlementCalls > 0); assert.equal(o.trace.rpcs.length, 0); assert.equal(o.trace.providerCalls, 0);
      assert(o.trace.entitlementArgs.some(args => args.userId === ids.user && args.feature === 'ai_job_matching'), 'Wrong feature or identity checked');
    }, 'known-defect');
  }
  await check('CTRL/unverified', 'Existing verified-email guard rejects before matching work', async () => {
    const f = fixture(); return invoke(f, 'recommend', {learnerId: ids.foreignLearner}, {user: {...fixtureUser, is_email_verified: false}});
  }, o => {assert.equal(o.status, 403); assert.equal(o.trace.rpcs.length, 0); assert.equal(o.trace.providerCalls, 0);});
  await check('CTRL/invalid-uuid', 'Actual UUID validation rejects invalid subject', async () => {
    const f = fixture(); return invoke(f, 'recommend', {learnerId: 'invalid'});
  }, o => {assert.equal(o.status, 400); assert.equal(o.trace.rpcs.length, 0);});
  for (const table of ['learners', 'skills']) {
    await check(`GEN/distinct/${table}`, 'Standalone own generation must distinguish actor-user from learner-primary identity', async () => {
      const f = fixture(); return invoke(f, 'generate-embedding', {table, id: table === 'learners' ? f.ownLearner : ids.ownSkill, text: 'Controlled direct-text generation fixture'});
    }, o => {assert.equal(o.status, 403); assert.equal(o.trace.providerCalls, 0);}, o => {
      assert.equal(o.status, 200); assert.equal(o.trace.providerCalls, 1); assert(o.trace.writes.some(w => w.table === table && w.rows === 1));
    }, 'known-defect');
  }
  await check('GEN/equal-ids', 'Equal-ID generation control succeeds; failure is not universal', async () => {
    const f = fixture({equalIds: true}); return invoke(f, 'generate-embedding', {table: 'learners', id: f.ownLearner, text: 'Controlled equal-ID generation fixture'});
  }, o => {assert.equal(o.status, 200); assert.equal(o.trace.providerCalls, 1); assert.equal(o.trace.writes[0].rows, 1);});
  await check('GEN/profile-user', 'Profile ownership uses actor-user identity, not learner-primary identity', async () => {
    const f = fixture(); return invoke(f, 'generate-embedding', {table: 'profiles', id: ids.ownProfile, text: 'Controlled profile generation fixture'});
  }, o => {assert.equal(o.status, 200); assert(o.trace.writes.some(w => w.table === 'profiles' && w.rows === 1));});
  await check('GEN/foreign-control', 'Existing standalone ownership guard rejects a foreign learner', async () => {
    const f = fixture(); return invoke(f, 'generate-embedding', {table: 'learners', id: ids.foreignLearner, text: 'Controlled foreign generation fixture'});
  }, o => {assert.equal(o.status, 403); assert.equal(o.trace.providerCalls, 0); assert.equal(o.trace.writes.length, 0);});
  await check('GEN/admin-user', 'Administrative generation retains the actor-user key rather than requiring a learner-primary key', async () => {
    const f = fixture({admin: true});
    return invoke(f, 'generate-embedding', {table: 'opportunities', id: ids.opportunity, text: 'Controlled administrative generation fixture'}, {user: {...fixtureUser, roles: ['school_admin']}});
  }, o => {assert.equal(o.status, 200); assert.equal(o.trace.providerCalls, 1); assert(o.trace.writes.some(w => w.table === 'opportunities' && w.rows === 1));});
  await check('GEN/admin-denied', 'A caller without the administrative mapping cannot generate an opportunity vector', async () => {
    const f = fixture();
    return invoke(f, 'generate-embedding', {table: 'opportunities', id: ids.opportunity, text: 'Controlled denied administrative fixture'});
  }, o => {assert.equal(o.status, 403); assert.equal(o.trace.providerCalls, 0); assert.equal(o.trace.writes.length, 0);});
  await check('WRITE/zero', 'An update affecting zero rows must not report completed persistence', async () => {
    const f = fixture();
    try {return await updater.updateEmbedding(f.db, 'learners', '88888888-8888-4888-8888-888888888888', vector());}
    catch (error) {
      if (!(error instanceof types.EmbeddingError)) throw error;
      return {success: false, rowsAffected: 0, rejectionCode: error.code};
    }
  }, o => {assert.equal(o.success, true); assert.equal(o.rowsAffected, 0);}, o => {assert.equal(o.success, false, 'Zero-row update currently reports success');}, 'known-defect');
  await check('WRITE/one', 'A real one-row fixture update remains successful', async () => {
    const f = fixture(); return updater.updateEmbedding(f.db, 'learners', f.ownLearner, vector());
  }, o => {assert.equal(o.success, true); assert.equal(o.rowsAffected, 1);});
  for (const invalid of ['dimensions', 'nonfinite']) {
    await check(`VECTOR/${invalid}`, 'Existing persistence validation rejects invalid vectors before writing', async () => {
      const f = fixture(); const values = invalid === 'dimensions' ? [0.1, 0.2] : vector();
      if (invalid === 'nonfinite') values[0] = Infinity;
      await assert.rejects(() => updater.updateEmbedding(f.db, 'learners', f.ownLearner, values), error => error instanceof types.EmbeddingError && error.code === 'INVALID_RESPONSE');
      return f.trace;
    }, o => {assert.equal(o.writes.length, 0);});
  }
  await check('MUT/selector-aware', 'Self-redirection cannot satisfy an assertion that foreign selectors actually ran', async () => {
    const original = fixture(); const redirected = fixture();
    return {original: await invoke(original, 'recommend', {learnerId: ids.foreignLearner}), redirected: await invoke(redirected, 'recommend', {learnerId: ids.foreignLearner}, {transform: mutation('redirect', redirected.ownLearner)})};
  }, o => {
    // The old success-only assertion passes both. The stronger oracle distinguishes them.
    assert.equal(o.original.status, 200); assert.equal(o.redirected.status, 200);
    selected(o.original, ids.foreignLearner); selected(o.redirected, ids.ownLearner);
    assert.throws(() => selected(o.redirected, ids.foreignLearner), assert.AssertionError);
  }, undefined, 'fixture-mutation-control');
  await check('MUT/denial-oracle', 'Denial oracle detects unsafe route and accepts only an in-memory fixture guard', async () => {
    const unsafe = fixture(); const guarded = fixture();
    return {unsafe: await invoke(unsafe, 'recommend', {learnerId: ids.foreignLearner}), guarded: await invoke(guarded, 'recommend', {learnerId: ids.foreignLearner}, {transform: mutation('guard', guarded.ownLearner)})};
  }, o => {assert.throws(() => denyForeign(o.unsafe), assert.AssertionError); denyForeign(o.guarded);}, undefined, 'fixture-mutation-control');
  await check('SCHEMA/key-spaces', 'Checked-in evidence/cache and interaction foreign keys use different identifier spaces', async () => read('supabase/migrations/20260526000000_schema.sql'), source => {
    for (const [name, column] of Object.entries({skills_learner_id_fkey: 'id', projects_learner_id_fkey: 'id', certificates_learner_id_fkey: 'id', trainings_learner_id_fkey: 'id', learner_job_matches_learner_id_fkey: 'id', opportunity_interactions_learner_id_fkey: 'user_id'})) {
      const declaration = source.split('\n').find(line => line.includes(`CONSTRAINT "${name}"`));
      assert(declaration?.includes(`REFERENCES "public"."learners"("${column}")`), `Review changed key contract: ${name}`);
    }
  }, undefined, 'checked-in-schema-only');
  const sources = [...inputs].sort().map(file => ({path: path.relative(workspace, file).split(path.sep).join('/'), sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}));
  const environment = {node: process.version, typescript: ts.version, zod: require(path.join(repo, 'node_modules/zod/package.json')).version};
  if (flags.has('--assert-snapshot')) {
    const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, 'boundary-verification-results.json'), 'utf8'));
    assert.deepEqual(sources, baseline.sources, 'Boundary inputs changed; review and retain the prior evidence before rebaselining');
    assert.deepEqual(environment, baseline.environment, 'Boundary runtime changed');
    assert.deepEqual(JSON.parse(JSON.stringify(results)), baseline.results, 'Boundary characterization changed');
  }
  const failures = results.filter(result => result.result === 'FAIL').length;
  const setupErrors = results.filter(result => result.result === 'SETUP_ERROR').length;
  const skipped = results.filter(result => result.result === 'SKIP').length;
  console.log(JSON.stringify({
    suite: 'learner-recommendation-boundaries', mode: regression ? 'desired-behavior-regression' : 'current-source-characterization',
    generatedAt: new Date().toISOString(), fixedFixtureTime: fixedTime,
    passed: results.length - failures - setupErrors - skipped, failed: failures, setupErrors, skipped,
    assurance: 'Isolated source execution only. Characterization PASS can reproduce a defect. Regression failures are not waived.',
    scope: 'Actual application auth wrapper, router, handlers, response builders, UUID validation, local rate limiter, embedding client and updater. Auth-core transport, DB/RPC transport, profile text construction and provider are fixtures. No live JWT verification, SQL, browser, or network.',
    mutations: 'In-memory fixture-only router redirection and hardcoded denial controls; not production fixes; application files never modified.',
    environment, sources, results,
  }, null, 2));
  process.exitCode = setupErrors ? 2 : failures ? 1 : 0;
})().catch(error => {console.error(error); process.exitCode = 2;});
