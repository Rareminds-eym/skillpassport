import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';

// A fresh database in the existing local PostgreSQL container. Never resets,
// migrates, reads or deletes the app database or any existing records.
const container = 'supabase_db_skillpassport';
const database = `ai_worker_tutor_test_${randomBytes(8).toString('hex')}`;
assert.match(database, /^ai_worker_tutor_test_[a-f0-9]{16}$/);
let created = false;
let passed = 0;
const args = db => ['exec', '-i', container, 'psql', '-X', '-U', 'postgres', '-d', db, '-v', 'ON_ERROR_STOP=1', '-q', '-A', '-t'];
function sql(query, db = database) {
  const result = spawnSync('docker', args(db), { input: query, encoding: 'utf8', windowsHide: true, timeout: 60000 });
  if (result.error || result.status !== 0) throw new Error(result.error?.message ?? result.stderr.trim());
  return result.stdout.trim();
}
function denied(query, pattern) {
  const result = spawnSync('docker', args(database), { input: query, encoding: 'utf8', windowsHide: true, timeout: 60000 });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, pattern);
}
function concurrentSql(query) {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', args(database), { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
    let output = ''; let error = '';
    child.stdout.on('data', data => { output += data; });
    child.stderr.on('data', data => { error += data; });
    child.once('error', reject);
    child.once('close', code => code === 0 ? resolve(output.trim()) : reject(new Error(error.trim())));
    child.stdin.end(query);
  });
}
async function test(name, run) { await run(); passed++; console.log(`PASS ${name}`); }
const hash = 'a'.repeat(64);
try {
  sql(`CREATE DATABASE "${database}";`, 'postgres'); created = true;
  sql(`CREATE TABLE public.users(id uuid PRIMARY KEY, metadata jsonb DEFAULT '{}'::jsonb, "updatedAt" timestamptz);
    INSERT INTO public.users(id) VALUES ('11111111-1111-4111-8111-111111111111'), ('22222222-2222-4222-8222-222222222222');`);
  sql(readFileSync(new URL('../supabase/migrations/20261022000002_tutor_generation_reservations.sql', import.meta.url), 'utf8'));
  const teacher = '11111111-1111-4111-8111-111111111111';
  const turn = '33333333-3333-4333-8333-333333333333';
  const generation = (operation, actor = teacher, identity = hash) => `SELECT public.claim_tutor_generation('${actor}', '${operation}', '${identity}');`;
  const finishGeneration = (operation, identity = hash) => `SELECT public.complete_tutor_generation('${teacher}', '${operation}', '${identity}');`;
  await test('duplicate generation reservations consume one allowance', async () => {
    await Promise.all(Array.from({ length: 4 }, () => concurrentSql(generation(turn))));
    assert.equal(sql(`SELECT count(*) FROM ai_tutor_generation_claims WHERE actor_id = '${teacher}';`), '1');
  });
  await test('parallel distinct generations cannot exceed two admitted uses', async () => {
    const turns = ['44444444-4444-4444-8444-444444444444', '55555555-5555-4555-8555-555555555555', '66666666-6666-4666-8666-666666666666'];
    const results = await Promise.allSettled(turns.map(value => concurrentSql(generation(value))));
    assert.equal(results.filter(value => value.status === 'fulfilled').length, 1);
    assert.equal(sql(`SELECT count(*) FROM ai_tutor_generation_claims WHERE actor_id = '${teacher}';`), '2');
  });
  await test('generation payload conflicts cannot adopt another reservation', () => denied(generation(turn, teacher, 'b'.repeat(64)), /Generation identity conflict/));
  await test('generation completion is idempotent and preserves unrelated metadata', async () => {
    sql(`UPDATE users SET metadata = '{"existing":"keep"}' WHERE id = '${teacher}';`);
    await Promise.all(Array.from({ length: 4 }, () => concurrentSql(finishGeneration(turn))));
    assert.equal(sql(`SELECT metadata->>'ai_tutor_generation_count' FROM users WHERE id = '${teacher}';`), '1');
    assert.equal(sql(`SELECT metadata->>'existing' FROM users WHERE id = '${teacher}';`), 'keep');
    assert.equal(JSON.parse(sql(generation(turn))).remaining, 0);
    assert.deepEqual(JSON.parse(sql(`SELECT public.get_tutor_generation_usage('${teacher}');`)), { limit: 2, used: 1, remaining: 0 });
    denied(finishGeneration(turn, 'b'.repeat(64)), /Generation identity conflict/);
  });
  await test('existing counters count toward the unchanged two-use allowance', () => {
    const actor = '22222222-2222-4222-8222-222222222222';
    sql(`UPDATE users SET metadata = '{"ai_tutor_generation_count":2}' WHERE id = '${actor}';`);
    denied(generation(turn, actor), /Generation allowance exhausted/);
    assert.equal(sql(`SELECT count(*) FROM ai_tutor_generation_claims WHERE actor_id = '${actor}';`), '0');
  });
  await test('browser roles cannot reserve, complete or inspect generation claims', () => {
    denied(`SET ROLE authenticated; ${generation(turn)}`, /permission denied/);
    denied(`SET ROLE authenticated; ${finishGeneration(turn)}`, /permission denied/);
    denied('SET ROLE authenticated; SELECT * FROM ai_tutor_generation_claims;', /permission denied/);
    denied(`SET ROLE authenticated; SELECT public.get_tutor_generation_usage('${teacher}');`, /permission denied/);
  });
  console.log(`${passed} PostgreSQL checks passed; application databases were not modified.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error)); process.exitCode = 1;
} finally {
  if (created) {
    try { sql(`DROP DATABASE "${database}";`, 'postgres'); console.log('Removed only the temporary test database.'); }
    catch (error) { console.error(`Temporary database cleanup failed: ${error.message}`); process.exitCode = 1; }
  }
}
