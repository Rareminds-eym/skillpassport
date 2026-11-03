// Explicit local-only upgrade. Default is read-only planning; never uses project URLs or remote DB credentials.
import { readFileSync, readdirSync, mkdirSync, writeFileSync, openSync, closeSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { localMigrationTargets, requireLocalDocker, migrationSource, pendingLocalMigrations, localMigrationBatch } from './lib/zoho-local-migrations.mjs';

const args = process.argv.slice(2);
if (args.length > 1 || (args.length && !['plan', '--apply'].includes(args[0]))) throw new Error('Use plan (read-only default), or --apply');
const apply = args[0] === '--apply';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let manifest, manifestPath;
function docker(args, input, stdio) {
  const result = spawnSync('docker', args, { input, encoding: stdio ? undefined : 'utf8', stdio, timeout: 900000, maxBuffer: 4_000_000 });
  if (result.error || result.status !== 0) {
    if (manifest) { manifest.error = { command: args.slice(0, 3), message: result.error?.message || 'Local Docker command failed', stderr: String(result.stderr || '').slice(0, 32768) }; save(); }
    throw new Error(`Local Docker command failed; ${manifestPath ? 'private backup manifest contains details' : 'no migrations applied'}`);
  }
  return result.stdout;
}
const sql = (target, input) => docker(['exec', '-i', target.container, 'psql', '-X', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=terse', '-qAt'], input);
const tracked = target => JSON.parse(sql(target, "SELECT coalesce(jsonb_agg(version ORDER BY version),'[]')::text FROM supabase_migrations.schema_migrations;"));
function save() { writeFileSync(manifestPath, JSON.stringify(manifest, null, 2)+'\n', { mode: 0o600 }); }

const endpoint = docker(['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}']).trim();
requireLocalDocker(endpoint, process.env.DOCKER_HOST);
const plans = localMigrationTargets.map(target => {
  const inspected = JSON.parse(docker(['inspect', '--type', 'container', target.container]))[0];
  if (inspected?.Name !== '/'+target.container || inspected?.State?.Running !== true || !String(inspected?.Config?.Image).includes('supabase/postgres'))
    throw new Error('Expected running local Supabase PostgreSQL container');
  const identity = JSON.parse(sql(target, "SELECT jsonb_build_object('database',current_database(),'socket',inet_server_addr() IS NULL)::text;"));
  if (identity.database !== 'postgres' || identity.socket !== true) throw new Error('Local container socket connection required');
  const path = resolve(root, target.repository, 'supabase/migrations');
  const sources = readdirSync(path).filter(file => /^\d{14}_.+\.sql$/.test(file)).map(file => {
    // Historical migrations are tracked already; only this upgrade's sources require a transaction envelope.
    if (target.files.includes(file)) return migrationSource(file, readFileSync(resolve(path, file), 'utf8'));
    return { filename: file, version: file.slice(0, 14) };
  });
  const before = tracked(target), pending = pendingLocalMigrations(target, sources, before);
  return { ...target, pending, before, containerId: inspected.Id };
});
for (const plan of plans) {
  console.log(`${plan.repository}: ${plan.pending.length} reviewed local migrations pending`);
  for (const source of plan.pending) console.log(`  ${source.filename} sha256=${source.sha256}`);
}
if (!apply || plans.every(plan => !plan.pending.length)) {
  console.log(apply ? 'Local upgrade already tracked; no changes.' : 'Read-only plan complete. Use --apply only after acceptance passes.');
} else {
  const backup = resolve(root, 'sp-dash/.wrangler/zoho-local/db-backups', new Date().toISOString().replaceAll(/[^0-9TZ]/g, '')+'-'+process.pid);
  mkdirSync(backup, { recursive: true, mode: 0o700 });
  manifestPath = resolve(backup, 'manifest.json');
  manifest = { version: 1, localOnly: true, createdAt: new Date().toISOString(), state: 'backing_up', targets: plans.map(plan => ({
    repository: plan.repository, container: plan.container, containerId: plan.containerId, before: plan.before,
    migrations: plan.pending.map(({ filename, version, sha256 }) => ({ filename, version, sha256 })), state: 'pending',
  })) };
  save();
  // Both full backups must succeed and be readable before the first database is changed.
  for (const [index, plan] of plans.entries()) {
    const file = resolve(backup, plan.repository+'.dump'), fd = openSync(file, 'wx', 0o600);
    try { docker(['exec', plan.container, 'pg_dump', '-U', 'postgres', '-d', 'postgres', '--format=custom'], undefined, ['ignore', fd, 'pipe']); }
    finally { closeSync(fd); }
    const input = openSync(file, 'r');
    try { docker(['exec', '-i', plan.container, 'pg_restore', '--list'], undefined, [input, 'ignore', 'pipe']); }
    finally { closeSync(input); }
    manifest.targets[index].backup = file; manifest.targets[index].state = 'backed_up'; save();
  }
  manifest.state = 'applying'; save();
  try {
    for (const [index, plan] of plans.entries()) {
      if (JSON.stringify(tracked(plan)) !== JSON.stringify(plan.before)) throw new Error('Local migration ledger changed after planning');
      if (plan.pending.length) sql(plan, localMigrationBatch(plan.pending));
      const after = tracked(plan);
      if (plan.pending.some(source => !after.includes(source.version))) throw new Error('Local migration ledger readback incomplete');
      manifest.targets[index].after = after; manifest.targets[index].state = 'applied'; save();
      console.log(`${plan.repository}: reviewed migrations committed with tracking`);
    }
    manifest.state = 'completed'; save();
    console.log(`Local-only upgrade complete. Private backups: ${backup}`);
  } catch (error) {
    manifest.state = 'failed_or_partial'; manifest.failure = error.message; save();
    throw new Error(`Local upgrade stopped; inspect private manifest ${manifestPath}. Do not restore automatically over newer data.`);
  }
}
