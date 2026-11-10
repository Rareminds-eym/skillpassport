import { readFileSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';

// Synthetic fixture database in an existing local Supabase container only.
// No project URL, source credentials, email bindings or application DB are used.
const root = new URL('../../', import.meta.url);
const container = process.argv[2] || 'supabase_db_skillpassport';
if (!/^[a-zA-Z0-9_-]+$/.test(container)) throw new Error('Invalid local container name');
const database = `zoho_control_plane_test_${process.pid}_${Date.now()}`;
function docker(args, input) {
  const result = spawnSync('docker', ['exec', ...(input ? ['-i'] : []), container, ...args],
    { input, encoding: 'utf8', maxBuffer: 2_000_000, timeout: 120000 });
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || 'Local fixture command failed');
  return result.stdout;
}
const read = relative => readFileSync(new URL(relative, root), 'utf8');
const migrations = ['20270128000001_zoho_recruit_approval_control_plane.sql', '20270129000000_zoho_recruit_execution_ledger.sql', '20270130000000_zoho_recruit_discovery_authority.sql', '20270131000000_zoho_recruit_record_recovery.sql', '20270201000000_zoho_recruit_live_execution_authority.sql', '20270202000000_zoho_recruit_decision_recovery.sql', '20270217030000_zoho_source_quota_key_rotation.sql'];
function migrationBody(name) {
  const lines = read(`supabase/migrations/${name}`).trim().split('\n');
  if (lines[0] !== 'BEGIN;' || lines.at(-1) !== 'COMMIT;') throw new Error('Expected a transaction-wrapped migration');
  return lines.slice(1, -1).join('\n');
}
const psql = ['psql', '-U', 'postgres', '-d', database, '-v', 'ON_ERROR_STOP=1'];
function concurrentQuery(statement) {
  const sql = `BEGIN; ${statement}; SELECT pg_sleep(0.15); COMMIT;`;
  return new Promise((resolve, reject) => {
    const child = spawn('docker', ['exec', container, ...psql, '-At', '-c', sql]);
    let stdout = ''; let stderr = '';
    const timer = setTimeout(() => { child.kill(); reject(new Error('Concurrent claim timed out')); }, 15000);
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => {
      clearTimeout(timer);
      if (code !== 0) { reject(new Error(stderr || 'Concurrent claim failed')); return; }
      try {
        const line = stdout.split('\n').find(value => value.startsWith('{'));
        resolve(JSON.parse(line));
      } catch (error) { reject(error); }
    });
  });
}

let created = false;
const readerRoleExisted = docker(['psql', '-U', 'postgres', '-d', 'postgres', '-At', '-c',
  "SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='zoho_discovery');"]).trim() === 't';
const readerMembershipExisted = docker(['psql', '-U', 'postgres', '-d', 'postgres', '-At', '-c',
  "SELECT EXISTS(SELECT 1 FROM pg_auth_members m JOIN pg_roles r ON r.oid=m.roleid JOIN pg_roles a ON a.oid=m.member WHERE r.rolname='zoho_discovery' AND a.rolname='authenticator');"]).trim() === 't';
try {
  docker(['createdb', '-U', 'postgres', '--template=template0', database]);
  created = true;
  docker(psql, `
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon,authenticated,service_role;
    CREATE TABLE public.organizations(id uuid PRIMARY KEY);
    CREATE TABLE public.users(id uuid PRIMARY KEY);
    CREATE TABLE public.learners(id uuid PRIMARY KEY);
    CREATE TABLE public.opportunities(id uuid PRIMARY KEY);
    INSERT INTO public.organizations VALUES('10000000-0000-4000-8000-000000000001');
  `);
  const schema = migrations.map(migrationBody).join('\n');
  // Verify migration execution and all regression fixtures as a single transaction.
  docker(psql, ['BEGIN;', schema, read('functions/__tests__/sql/zoho-source-quota-rotation.sql'), read('functions/__tests__/sql/zoho-recruit-approvals.sql'),
    read('functions/__tests__/sql/zoho-recruit-execution.sql'), read('functions/__tests__/sql/zoho-recruit-audit.sql'),
    read('functions/__tests__/sql/zoho-recruit-record-recovery.sql'), read('functions/__tests__/sql/zoho-recruit-live-authority.sql'), read('functions/__tests__/sql/zoho-recruit-decision-recovery.sql'), migrationBody('20270209000000_zoho_candidate_review_binding.sql'), read('functions/__tests__/sql/zoho-candidate-review-binding.sql'), migrationBody('20270212000000_zoho_discovery_incremental.sql'), read('functions/__tests__/sql/zoho-discovery-incremental.sql'), migrationBody('20270214000000_zoho_source_privacy.sql'), read('functions/__tests__/sql/zoho-source-privacy.sql'), migrationBody('20270215000000_zoho_payload_retention_fences.sql'), read('functions/__tests__/sql/zoho-payload-retention-fences.sql'), migrationBody('20270219010000_zoho_console_controls.sql'), read('functions/__tests__/sql/zoho-console-controls.sql'), migrationBody('20270220000000_zoho_dynamic_source_allocation.sql'), read('functions/__tests__/sql/zoho-dynamic-source-allocation.sql'), migrationBody('20270223000000_zoho_overview_module_counts.sql'), read('functions/__tests__/sql/zoho-overview-module-counts.sql'), migrationBody('20270226000000_zoho_discovery_batch_pages.sql'), read('functions/__tests__/sql/zoho-discovery-batch-pages.sql'), 'ROLLBACK;'].join('\n'));

  // Install only in this disposable fixture DB, so two real sessions can see the
  // same approved intent. This is a concurrency check, not a production load test.
  docker(psql, ['BEGIN;', schema, migrationBody('20270209000000_zoho_candidate_review_binding.sql'), 'COMMIT;'].join('\n'));
  docker(psql, `
    DO $$
    DECLARE c uuid; actor uuid:=gen_random_uuid(); r jsonb;
    BEGIN
      c:=(public.zoho_register_connection('Concurrent fixture','99999999999999999997','in',
        '10000000-0000-4000-8000-000000000001',actor)->>'id')::uuid;
      UPDATE public.zoho_connections SET status='connected' WHERE id=c;
      r:=public.zoho_stage_record(c,'Candidates','1',now(),
        '{"name":"Synthetic Learner","email":"fixture@example.com"}','[]');
      PERFORM public.zoho_decide_records(c,(SELECT jsonb_build_array(jsonb_build_object('id',id,'revision',revision,'sourceHash',source_hash,'configRevision',config_revision,'targetId',target_id,'candidateReviewHash',repeat('a',64))) FROM public.zoho_staged_records WHERE id=(r->>'id')::uuid),
        'approve','Concurrent claim fixture',gen_random_uuid(),actor);
    END $$;
  `);
  const operation = docker([...psql, '-At', '-c', 'SELECT id FROM public.zoho_approved_operations;']).trim();
  if (!/^[0-9a-f-]{36}$/.test(operation)) throw new Error('Unexpected fixture operation ID');
  const claims = await Promise.all([
    concurrentQuery(`SELECT public.zoho_claim_operation('${operation}','20000000-0000-4000-8000-000000000001')`),
    concurrentQuery(`SELECT public.zoho_claim_operation('${operation}','20000000-0000-4000-8000-000000000002')`),
  ]);
  if (claims.filter(result => result.claimed === true).length !== 1 || claims.filter(result => result.claimed === false).length !== 1)
    throw new Error('Concurrent workers did not produce exactly one successful claim');
  docker(psql, `DO $$ BEGIN
    ASSERT (SELECT count(*)=1 FROM public.zoho_execution_attempts);
    ASSERT (SELECT execution_attempts=1 FROM public.zoho_approved_operations);
    ASSERT NOT EXISTS(SELECT 1 FROM public.users);
    ASSERT NOT EXISTS(SELECT 1 FROM public.learners);
    ASSERT NOT EXISTS(SELECT 1 FROM public.opportunities);
  END $$;`);
  docker(psql, `DO $$
    DECLARE c uuid; actor uuid:=gen_random_uuid(); r uuid;
    BEGIN
      c:=(public.zoho_register_connection('Concurrent refresh fixture','99999999999999999993','in',
        '10000000-0000-4000-8000-000000000001',actor)->>'id')::uuid;
      PERFORM public.zoho_complete_connection(c,'{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"AAAAAAAAAAAAAAAAAAAAAAAA"}',actor);
      r:=(public.zoho_start_discovery(c,'Candidates',actor)->>'runId')::uuid;
      PERFORM public.zoho_claim_discovery(r);
      r:=(public.zoho_start_discovery(c,'Job_Openings',actor)->>'runId')::uuid;
      PERFORM public.zoho_claim_discovery(r);
    END $$;`);
  const readers = docker([...psql, '-At', '-c', `SELECT jsonb_build_object('id',r.id,'lease',r.lease_token)
    FROM public.zoho_discovery_runs r JOIN public.zoho_connections c ON c.id=r.connection_id
    WHERE c.source_org_id='99999999999999999993';`]).trim().split('\n').map(line => JSON.parse(line));
  if (readers.length !== 2 || readers.some(row => !/^[0-9a-f-]{36}$/.test(row.id) || !/^[0-9a-f-]{36}$/.test(row.lease)))
    throw new Error('Unexpected synthetic read leases');
  const refreshes = await Promise.all(readers.map(row => concurrentQuery(
    `SELECT public.zoho_begin_discovery_refresh('${row.id}','${row.lease}','{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"AAAAAAAAAAAAAAAAAAAAAAAA"}')`)));
  if (refreshes.filter(result => result.acquired === true).length !== 1 || refreshes.filter(result => result.acquired === false).length !== 1)
    throw new Error('Concurrent readers did not produce exactly one refresh owner');
  docker(psql, `DO $$ DECLARE c uuid; actor uuid:=gen_random_uuid(); BEGIN
    c:=(public.zoho_register_connection('Quota race fixture','99999999999999999002','in',
      '10000000-0000-4000-8000-000000000001',actor)->>'id')::uuid;
    UPDATE public.zoho_connections SET status='connected' WHERE id=c;
    PERFORM public.zoho_configure_source_quota(c,3,1,actor,'Concurrent last budget slot');
  END $$;`);
  const quotaConnection = docker([...psql, '-At', '-c', "SELECT id FROM public.zoho_connections WHERE source_org_id='99999999999999999002'"]).trim();
  if (!/^[0-9a-f-]{36}$/.test(quotaConnection)) throw new Error('Unexpected quota race fixture');
  const quotaRace = await Promise.all([
    concurrentQuery(`SELECT public.zoho_reserve_source_quota('${quotaConnection}','read')`),
    concurrentQuery(`SELECT public.zoho_reserve_source_quota('${quotaConnection}','read')`),
  ]);
  if (quotaRace.filter(result => result.granted === true).length !== 1 || quotaRace.filter(result => result.granted === false).length !== 1)
    throw new Error('Concurrent reservations exceeded the final source quota slot');
  const quotaWinner = quotaRace.find(result => result.granted);
  docker(psql, `SELECT public.zoho_settle_source_quota('${quotaConnection}','${quotaWinner.reservationId}',200,0);
    DO $$ BEGIN
      ASSERT (SELECT count(*)=1 AND sum(cost)=3 FROM public.zoho_source_reservations WHERE connection_id='${quotaConnection}');
      ASSERT NOT EXISTS(SELECT 1 FROM public.users); ASSERT NOT EXISTS(SELECT 1 FROM public.learners);
      ASSERT NOT EXISTS(SELECT 1 FROM public.opportunities);
    END $$;`);
  console.log('Zoho SQL regressions, two-session claim fencing, refresh single-flight and source quota contention passed; canonical fixture tables unchanged.');
} finally {
  if (created) docker(['dropdb', '-U', 'postgres', database]);
  // The fixture migration creates a cluster role. Do not leave it behind or
  // delete a role that predated this test run.
  if (!readerRoleExisted) docker(['psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', 'DROP ROLE IF EXISTS zoho_discovery;']);
  else if (!readerMembershipExisted) docker(['psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-c', 'REVOKE zoho_discovery FROM authenticator;']);
}
