import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { experimental_readRawConfig } from 'wrangler';
import { pagesBuildSettings, selectPagesConfiguration, resetPagesConfiguration } from '../build-pages.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const publicKey = 'sb_publishable_test_fixture';
const database = 'https://qidmndjtlbajwswufghf.supabase.co';
const read = file => experimental_readRawConfig({ config: join(root, file) }).rawConfig;

for (const [target, suffix, environment, branch] of [
  ['qa', '-qa', 'qa', 'qa-environment'],
  ['dev', '-dev', 'development', 'dev'],
  ['production', '', 'production', 'production'],
]) {
  test(`${target}: Pages configuration uses its own services, queues, storage and identity`, () => {
    const settings = pagesBuildSettings(target, { SUPABASE_ANON_KEY: publicKey, CF_PAGES_BRANCH: branch });
    const config = read(settings.file);
    assert.equal(config.name, `skillpassport${suffix}`);
    assert.equal(config.pages_build_output_dir, 'dist');
    assert.equal(config.vars.ENVIRONMENT, environment);
    assert.equal(config.vars.SUPABASE_URL, target === 'production'
      ? 'https://dpooleduinyyzxgrcwko.supabase.co' : database);
    assert.equal(settings.env.VITE_SUPABASE_URL, config.vars.SUPABASE_URL);
    assert.equal(settings.env.VITE_SUPABASE_ANON_KEY, publicKey);
    const services = Object.fromEntries(config.services.map(binding => [binding.binding, binding]));
    for (const [binding, service, entrypoint] of [
      ['SSO_SERVICE', 'sso-api', 'SsoWorker'],
      ['ZOHO_CANDIDATE_SOURCE', 'sso-api', 'ZohoCandidateProvisioner'],
      ['EMBEDDING_SERVICE', 'embedding-api', 'EmbeddingService'],
      ['PAYMENT_WORKER', 'razorpay-api', 'PaymentService'],
      ['EMAIL_SERVICE', 'shared-email-api', 'EmailService'],
    ]) {
      assert.equal(services[binding].service, service + suffix);
      assert.equal(services[binding].entrypoint, entrypoint);
      assert.equal(services[binding].environment, undefined);
    }
    assert.equal(services.JOB_INDEX_SERVICE.service, target === 'qa' ? 'sp-dash-2-qa' : 'sp-dash-2');
    assert.equal(services.JOB_INDEX_SERVICE.entrypoint, 'JobIndexService');
    assert.equal(config.durable_objects.bindings[0].script_name, `realtime-worker${suffix}`);
    assert.deepEqual(config.queues.producers.map(p => p.queue), [
      `realtime-events-queue${suffix}`, `sso-reverse-sync-queue${suffix}`,
    ]);
    assert.equal(config.r2_buckets[0].bucket_name, `skill-echosystem${suffix}`);
    assert.equal(config.vars.MATCHING_EMBEDDING_MODEL, 'google/gemini-embedding-2-preview');
    if (target !== 'production') assert.equal(config.vars.COOKIE_DOMAIN, undefined);
    assert.equal(config.env?.qa, undefined, 'Pages does not support Workers-style named QA environments');
  });
}

test('build selection rejects unknown environments and mismatched branches', () => {
  for (const target of [undefined, 'preview', 'unknown', '__proto__', 'constructor']) {
    assert.throws(() => pagesBuildSettings(target, {}), /Choose dev, qa, or production/);
  }
  assert.throws(() => pagesBuildSettings('production', { CF_PAGES_BRANCH: 'feature/signup' }), /requires branch production/);
  assert.throws(() => pagesBuildSettings('dev', { CF_PAGES_BRANCH: 'feature/signup' }), /requires branch dev/);
});

test('QA feature-branch previews keep the QA configuration and database', () => {
  const settings = pagesBuildSettings('qa', {
    CF_PAGES_BRANCH: 'feature/signup', SUPABASE_ANON_KEY: publicKey,
  });
  assert.equal(settings.file, 'wrangler.qa.toml');
  assert.equal(settings.mode, 'qa');
  assert.equal(settings.env.ENVIRONMENT, 'qa');
  assert.equal(settings.env.VITE_SUPABASE_URL, database);
  assert.equal(settings.env.CF_PAGES_BRANCH, 'feature/signup');
});

test('frontend builds cannot silently use a different database', () => {
  assert.throws(() => pagesBuildSettings('qa', {
    SUPABASE_ANON_KEY: publicKey, VITE_SUPABASE_URL: 'https://production.invalid',
  }), /does not match/);
  assert.throws(() => pagesBuildSettings('qa', {}), /public|ANON_KEY/);
});

test('service-role keys are rejected even when accidentally supplied as an anon key', () => {
  const jwt = payload => `header.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.signature`;
  assert.throws(() => pagesBuildSettings('qa', {
    SUPABASE_ANON_KEY: publicKey, VITE_SUPABASE_SERVICE_ROLE_KEY: 'fixture',
  }), /must never be frontend variables/);
  assert.throws(() => pagesBuildSettings('qa', {
    SUPABASE_ANON_KEY: jwt({ role: 'service_role' }),
  }), /public anon key/);
  assert.throws(() => pagesBuildSettings('qa', {
    SUPABASE_ANON_KEY: jwt({ role: 'anon', ref: 'wrong-project' }),
  }), /public anon key/);
  assert.equal(pagesBuildSettings('qa', {
    SUPABASE_ANON_KEY: jwt({ role: 'anon', ref: 'qidmndjtlbajwswufghf' }),
  }).env.VITE_SUPABASE_URL, database);
});

test('the Pages adapter redirect selects a real config without overwriting the tracked file', () => {
  const directory = mkdtempSync(join(tmpdir(), 'pages-config-'));
  const cwd = process.cwd();
  try {
    const original = readFileSync(join(root, 'wrangler.toml'), 'utf8');
    writeFileSync(join(directory, 'wrangler.toml'), original);
    writeFileSync(join(directory, 'wrangler.qa.toml'), readFileSync(join(root, 'wrangler.qa.toml')));
    selectPagesConfiguration(directory, 'wrangler.qa.toml');
    const redirect = join(directory, '.wrangler/deploy/config.json');
    assert.equal(resolve(directory, '.wrangler/deploy', JSON.parse(readFileSync(redirect)).configPath), join(directory, 'wrangler.qa.toml'));
    process.chdir(directory);
    const selected = experimental_readRawConfig({}, { useRedirectIfAvailable: true });
    assert.equal(selected.rawConfig.name, 'skillpassport-qa');
    assert.equal(readFileSync(join(directory, 'wrangler.toml'), 'utf8'), original);
    resetPagesConfiguration(directory);
    assert.equal(existsSync(redirect), false);
    assert.equal(experimental_readRawConfig({}).rawConfig.name, 'skillpassport');
  } finally {
    process.chdir(cwd);
    rmSync(directory, { recursive: true, force: true });
  }
});
