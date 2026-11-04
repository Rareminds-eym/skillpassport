import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Never loads .env files, invokes deployment, resets a project DB, or starts an
// email service. Existing SQL runners create/drop uniquely named fixture DBs.
const workspace = fileURLToPath(new URL('../../../', import.meta.url));
const args = process.argv.slice(2);
if (args.some(arg => !['--list', '--unit'].includes(arg))) {
  console.error('Usage: node scripts/checks/test-zoho-local-acceptance.mjs [--list] [--unit]');
  process.exit(2);
}
const unit = args.includes('--unit');
const environment = Object.fromEntries(['PATH', 'HOME', 'USER', 'TMPDIR', 'TEMP', 'TMP', 'LANG', 'SYSTEMROOT']
  .filter(name => process.env[name] !== undefined).map(name => [name, process.env[name]]));
environment.CI = '1';
environment.NO_COLOR = '1';
if (!unit) {
  environment.ZOHO_LOCAL_TWO_DB_TEST = '1';
  environment.ZOHO_LOCAL_PROJECTION_SQL_TEST = '1';
}
const files = (repo, directory) => readdirSync(join(workspace, repo, directory))
  .filter(name => /^zoho-.*\.test\.[jt]s$/.test(name)).sort().map(name => `${directory}/${name}`);
const steps = [
  { label: 'Local configuration rollback, migration safety, fresh-start prerequisites and dashboard state regressions', repo: 'skillpassport', args: ['--test', '../scripts/__tests__/zoho-local-config.test.mjs', '../scripts/__tests__/zoho-local-migrations.test.mjs', '../scripts/__tests__/zoho-dashboard-ui.test.mjs', '../scripts/__tests__/zoho-operator-ui.test.mjs', '../scripts/__tests__/zoho-policy-ui.test.mjs'] },
  { label: 'Dashboard approval, review, discovery and execution contracts', repo: 'sp-dash', args: ['node_modules/vitest/vitest.mjs', 'run', 'lib/zoho/__tests__'] },
  { label: 'SSO canonical approval, candidate and delivery contracts', repo: 'sso-worker', args: ['node_modules/vitest/vitest.mjs', 'run', ...files('sso-worker', 'src/__tests__')] },
  { label: 'Existing auth-sync queue reference transport and redirect rejection', repo: 'auth-sync-consumer', args: ['node_modules/vitest/vitest.mjs', 'run', 'tests/zoho-candidate-delivery.test.js'] },
  { label: 'Existing educator and subscription synchronization compatibility', repo: 'skillpassport', args: ['node_modules/vitest/vitest.mjs', 'run', 'functions/lib/__tests__/sync-service.educator.test.ts', 'functions/__tests__/subscription-sync-regression.test.ts', '--environment', 'node'] },
  { label: unit ? 'Application projection and privacy contracts (SQL cases skipped)' : 'Application contracts and real two-database projection acceptance', repo: 'skillpassport', args: ['node_modules/vitest/vitest.mjs', 'run', ...files('skillpassport', 'functions/__tests__'), '--environment', 'node'] },
  { label: 'Owned legacy assessment delivery, finalization and grading provenance', repo: 'skillpassport', args: ['node_modules/vitest/vitest.mjs', 'run',
    'functions/__tests__/assessment-context.test.ts', 'functions/__tests__/assessment-catalog.test.ts',
    'functions/__tests__/assessment-question-ownership.test.ts', 'functions/__tests__/assessment-grading-context.test.ts',
    'functions/__tests__/assessment-analysis-provenance.test.ts',
    'functions/__tests__/assessment-records.test.ts',
    'functions/__tests__/adaptive-session-boundary.test.ts',
    'functions/__tests__/adaptive-answer-commit.test.ts',
    'functions/__tests__/question-delivery-safety.test.ts',
    'src/features/assessment/api/__tests__/assessmentService.finalization.test.ts',
    'src/features/assessment/api/__tests__/assessmentService.records.test.ts',
    'src/features/assessment/api/__tests__/assessmentService.progress.test.ts', '--environment', 'node'] },
];
if (!unit) steps.push(
  { label: 'SSO approver SQL', repo: 'sso-worker', args: ['scripts/checks/test-zoho-approver-sql.mjs'] },
  { label: 'SSO candidate SQL and concurrent canonical transactions', repo: 'sso-worker', args: ['scripts/checks/test-zoho-candidate-sql.mjs'] },
  { label: 'Control-plane approval, claims and recovery SQL', repo: 'skillpassport', args: ['scripts/checks/test-zoho-control-plane-sql.mjs'] },
  { label: 'Job publishing, quota and no-effect receipt SQL', repo: 'skillpassport', args: ['scripts/checks/test-zoho-job-publisher-sql.mjs'] },
  { label: 'Assessment ownership, immutable question manifests and grading SQL', repo: 'skillpassport', args: ['scripts/checks/test-assessment-progress-sql.mjs'] },
  { label: 'Adaptive answer replay and concurrent atomic commit SQL', repo: 'skillpassport', args: ['scripts/checks/test-adaptive-answer-sql.mjs'] },
);
for (const [index, step] of steps.entries()) console.log(`${index + 1}. ${step.label}`);
if (args.includes('--list')) process.exit(0);
function check(command, argv, options = {}) {
  const result = spawnSync(command, argv, { env: environment, encoding: 'utf8', timeout: 15000, ...options });
  if (result.error || result.status !== 0) throw new Error(`Local preflight failed: ${command} (${result.error?.code || result.status}). No project database was migrated.`);
  return result.stdout?.trim();
}
for (const repo of ['skillpassport', 'sp-dash', 'sso-worker', 'auth-sync-consumer']) {
  if (!existsSync(join(workspace, repo, 'node_modules/vitest/vitest.mjs'))) throw new Error(`Install existing dependencies in ${repo} before running acceptance.`);
}
if (!unit) {
  // Reject remote Docker contexts even when selected through Docker's config.
  // Do not forward caller DOCKER_HOST/CONTEXT or any credentials into tests.
  const context = JSON.parse(check('docker', ['context', 'inspect']));
  const endpoint = context[0]?.Endpoints?.docker?.Host || '';
  if (!endpoint.startsWith('unix://') && !endpoint.startsWith('npipe://')) throw new Error('Acceptance requires a local Docker socket; remote contexts are not allowed.');
  for (const container of ['supabase_db_skillpassport', 'supabase_db_sso-auth']) {
    if (check('docker', ['inspect', '--format', '{{.State.Running}}', container]) !== 'true') throw new Error(`Start the existing local Supabase stack for ${container} first.`);
    check('docker', ['exec', container, 'psql', '-U', 'postgres', '-d', 'postgres', '-At', '-v', 'ON_ERROR_STOP=1', '-c', 'SELECT 1']);
  }
}
const started = Date.now();
for (const step of steps) {
  console.log(`\nRunning: ${step.label}`);
  const result = spawnSync(process.execPath, step.args, { cwd: resolve(workspace, step.repo), env: environment, stdio: 'inherit', timeout: 600000 });
  if (result.error || result.status !== 0) {
    console.error(`FAILED: ${step.label}${result.error ? ` (${result.error.code})` : ''}. Later acceptance steps were not run.`);
    process.exitCode = 1;
    break;
  }
}
if (!process.exitCode) console.log(`\nPASS: ${unit ? 'module-only' : 'synthetic local SQL and service-contract'} acceptance (${Math.round((Date.now() - started) / 1000)}s). Real Zoho OAuth, authenticated browser and deployed bindings are separate acceptance gates.`);
