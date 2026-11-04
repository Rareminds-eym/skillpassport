import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrationSource, pendingLocalMigrations, requireLocalDocker, localMigrationBatch } from '../lib/zoho-local-migrations.mjs';
const filename='20270217020000_zoho_candidate_administration.sql';
test('local migration transport rejects remote Docker endpoints and overrides',()=>{
  for(const endpoint of ['tcp://localhost:2375','ssh://remote','https://remote',''])assert.throws(()=>requireLocalDocker(endpoint));
  assert.throws(()=>requireLocalDocker('unix:///var/run/docker.sock','tcp://remote:2375'));
  assert.doesNotThrow(()=>requireLocalDocker('unix:///var/run/docker.sock'));
});
test('migration plan fails closed on any unreviewed pending file',()=>{
  const target={repository:'sso-worker',files:[filename]}, source=migrationSource(filename,'BEGIN;\nSELECT 1;\nCOMMIT;');
  assert.deepEqual(pendingLocalMigrations(target,[source],[]),[source]);
  assert.deepEqual(pendingLocalMigrations(target,[source],[source.version]),[]);
  assert.throws(()=>pendingLocalMigrations(target,[source,{filename:'20270218000000_unreviewed.sql',version:'20270218000000'}],[]));
  assert.throws(()=>pendingLocalMigrations(target,[],[]));
});
test('migration source validates identity, requires outer transaction and records exact content digest',()=>{
  const source=migrationSource(filename,'BEGIN;\nSELECT 1;\nCOMMIT;\n');
  assert.match(source.sha256,/^[a-f0-9]{64}$/);assert.equal(source.body.trim(),'SELECT 1;');
  assert.throws(()=>migrationSource('../malicious.sql','BEGIN;COMMIT;'));
  assert.throws(()=>migrationSource(filename,'SELECT 1;'));
});
test('DDL and exact migration tracking share a single transaction and quoted source stays encoded',()=>{
  const contents="BEGIN;\nSELECT 'literal'; -- $() `shell`\nCOMMIT;";
  const batch=localMigrationBatch([migrationSource(filename,contents)]);
  assert.equal(batch.startsWith('BEGIN;'),true);assert.equal(batch.includes('schema_migrations(version,statements,name)'),true);
  assert.equal(batch.includes(Buffer.from(contents).toString('base64')),true);
  assert.equal(batch.endsWith("COMMIT;\nNOTIFY pgrst,'reload schema';"),true);
});
