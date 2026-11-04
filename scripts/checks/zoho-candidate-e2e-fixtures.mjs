import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { candidateAdministrationTables } from './zoho-candidate-administration-fixture.mjs';

const applicationRoot = new URL('../../', import.meta.url);
const canonicalRoot = new URL('../../../sso-worker/', import.meta.url);
const source = (root, path) => readFileSync(new URL(path, root), 'utf8');
const identifier = value => { if (!/^[a-zA-Z0-9_]+$/.test(value)) throw new Error('Invalid fixture identifier'); return value; };
const literal = value => `convert_from(decode('${Buffer.from(String(value)).toString('base64')}','base64'),'UTF8')`;
const signatures = {
  zoho_candidate_sync_policy: { p_user: 'uuid' },
  zoho_generic_identity_sync_policy: { p_user: 'uuid' },
  zoho_candidate_runtime_ready: {},
  zoho_candidate_projection_ready: {},
  zoho_activate_candidate_oauth: { p_user: 'uuid', p_provider_subject: 'text', p_email: 'text' },
  zoho_preview_candidate_review: { p_actor: 'uuid', p_context: 'jsonb' },
  zoho_verify_candidate_review: { p_actor: 'uuid', p_context: 'jsonb', p_review_hash: 'text' },
  zoho_provision_candidate: { p_grant: 'jsonb' },
  zoho_find_candidate_receipt: { p_operation: 'uuid', p_source_hash: 'text' },
  zoho_reserve_candidate_deliveries: { p_lease: 'uuid' },
  zoho_record_candidate_publication: { p_operation: 'uuid', p_lease: 'uuid', p_published: 'boolean' },
  zoho_get_candidate_projection: { p_operation: 'uuid', p_source_hash: 'text' },
  zoho_confirm_candidate_projection: { p_operation: 'uuid', p_source_hash: 'text', p_projection_hash: 'text', p_receipt: 'uuid' },
  zoho_apply_candidate_projection: { p_snapshot: 'text', p_projection_hash: 'text' },
  zoho_check_candidate_projection: { p_operation: 'uuid', p_source_hash: 'text', p_projection_hash: 'text', p_receipt: 'uuid' },
  zoho_preview_candidate_administration: { p_actor: 'uuid', p_context: 'jsonb' },
  zoho_execute_candidate_administration: { p_actor: 'uuid', p_context: 'jsonb', p_review_hash: 'text', p_request: 'uuid' },
  zoho_find_candidate_administration: { p_actor: 'uuid', p_request: 'uuid' },
  zoho_list_pending_candidate_administrations: { p_actor:'uuid',p_source_org:'text',p_before_at:'timestamptz',p_before_request:'uuid' },
  zoho_acknowledge_candidate_administration: { p_actor:'uuid',p_request:'uuid' },
  zoho_list_candidate_erased_operations: { p_actor: 'uuid', p_request: 'uuid', p_after: 'uuid' },
  zoho_confirm_candidate_administration: { p_request: 'uuid', p_actor: 'uuid' },
  zoho_apply_candidate_administration: { p_connection: 'uuid', p_receipt: 'jsonb', p_actor: 'uuid', p_after: 'uuid' },
};
function database(container, name) {
  if (!/^[a-zA-Z0-9_-]+$/.test(container)) throw new Error('Invalid local fixture container');
  identifier(name);
  let created = false;
  function command(args, input) {
    const result = spawnSync('docker', ['exec', ...(input ? ['-i'] : []), container, ...args],
      { input, encoding: 'utf8', timeout: 120000, maxBuffer: 4_000_000 });
    if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || 'Local two-database fixture failed');
    return result.stdout;
  }
  const sql = (text, role = 'postgres') => command(['psql', '-U', 'postgres', '-d', name, '-v', 'ON_ERROR_STOP=1', '-qAt'],
    `${role === 'service_role' ? 'SET ROLE service_role;\n' : ''}${text}`);
  const json = (text, role) => JSON.parse(sql(text, role).trim());
  return {
    create() { command(['createdb', '-U', 'postgres', '--template=template0', name]); created = true; },
    drop() { if (created) { command(['dropdb', '-U', 'postgres', name]); created = false; } },
    sql, json,
    async rpc(fn, args) {
      const signature = signatures[fn];
      if (!signature || Object.keys(args).length !== Object.keys(signature).length || !Object.keys(signature).every(key => Object.hasOwn(args, key)))
        throw new Error('Unrecognized fixture RPC');
      const parameters = Object.entries(signature).map(([key, type]) => {
        const value = args[key];
        return `${identifier(key)} => ${value === null ? 'NULL' : literal(type === 'jsonb' ? JSON.stringify(value) : value)}::${type}`;
      });
      return json(`SELECT coalesce(to_jsonb(public.${identifier(fn)}(${parameters.join(',')})),'null'::jsonb)::text;`, 'service_role');
    },
  };
}
function tableDefinitions(baseline, names) {
  return names.map(name => {
    const match = baseline.match(new RegExp(`CREATE TABLE IF NOT EXISTS "public"\\."${name}" \\([\\s\\S]*?\\n\\);`));
    if (!match) throw new Error(`Missing actual fixture table ${name}`);
    return match[0];
  });
}
function constraints(baseline, names) {
  return [...baseline.matchAll(/ALTER TABLE ONLY "public"\."([^"]+)"\s+ADD CONSTRAINT [\s\S]*?;/g)]
    .filter(match => names.includes(match[1])).map(match => match[0]);
}
function functionDefinition(baseline, name) {
  const definition = baseline.match(new RegExp(`CREATE OR REPLACE FUNCTION "public"\\."${name}"[\\s\\S]*?\\$\\$;`))?.[0];
  if (!definition) throw new Error(`Missing actual fixture function ${name}`);
  return definition;
}
function setupCanonical(db) {
  const read = path => source(canonicalRoot, path);
  const baseline = read('supabase/migrations/20260526000000_schema.sql');
  const names = ['users', 'organizations', 'products', 'roles', 'memberships', 'membership_roles', 'membership_products', 'plans', 'subscriptions', 'organization_products', 'oauth_accounts'];
  const indexes = [...baseline.matchAll(/CREATE (?:UNIQUE )?INDEX [^\n]+ ON "public"\."([^"]+)"[^\n]+;/g)]
    .filter(match => names.includes(match[1])).map(match => match[0]);
  db.sql([
    ...tableDefinitions(baseline, names), ...constraints(baseline, names), ...indexes,
    functionDefinition(baseline, 'get_jwt_claims'),
    functionDefinition(baseline, 'check_duplicate_active_subscription'),
    functionDefinition(baseline, 'set_updated_at'),
    ...['trg_plans_updated_at', 'trg_subscriptions_updated_at'].map(name => {
      const trigger = baseline.match(new RegExp(`CREATE OR REPLACE TRIGGER "${name}"[^;]+;`))?.[0];
      if (!trigger) throw new Error(`Missing canonical timestamp trigger ${name}`);
      return trigger;
    }),
    "CREATE TRIGGER trg_check_duplicate_active BEFORE INSERT ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.check_duplicate_active_subscription();",
    read('supabase/migrations/20260618000000_add_user_metadata_column.sql'),
    ...['20261030000000_zoho_import_approver_authority.sql', '20261031000000_zoho_import_approval_evidence.sql',
      '20261101000000_zoho_candidate_canonical_transaction.sql', '20261102000000_zoho_candidate_projection_delivery.sql',
      '20261103000000_zoho_candidate_review.sql', '20261104000000_zoho_candidate_runtime_readiness.sql', '20261105000000_zoho_candidate_sync_policy.sql',
      '20270217020000_zoho_candidate_administration.sql','20270218010000_zoho_administration_recovery.sql'].map(name => read(`supabase/migrations/${name}`)),
    // Production boundary is a rollout precondition; fixture explicitly has no browser grants/RLS.
    "DO $$ DECLARE f record; BEGIN FOR f IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prosecdef LOOP EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.signature); END LOOP; END $$;",
    'SELECT public.zoho_assert_private_identity_boundary();',
    'CREATE SCHEMA fixture;',
    read('src/__tests__/sql/zoho-candidate.sql').split('-- Opening a direct browser grant')[0].replaceAll('pg_temp.', 'fixture.'),
  ].join('\n'));
}
function setupApplication(db) {
  // Mirrors the existing isolated projection runner: owned table definitions,
  // actual learner insert triggers/keys and views; unrelated parent domains are stubs.
  const read = path => source(applicationRoot, path);
  const baseline = read('supabase/migrations/20260526000000_schema.sql');
  const names = ['users', 'learners', 'users_shadow', 'plans_cache', 'subscription_cache'];
  const keys = constraints(baseline, names);
  const parents = new Set(keys.flatMap(statement => [...statement.matchAll(/REFERENCES "public"\."([^"]+)"/g)].map(match => match[1])).filter(name => !names.includes(name)));
  const types = ['user_role', 'user_approval_status'].map(name => {
    const type = baseline.match(new RegExp(`CREATE TYPE "public"\\."${name}" AS ENUM \\([\\s\\S]*?\\n\\);`))?.[0];
    if (!type) throw new Error('Missing actual application enum'); return type;
  });
  const functions = ['auto_assign_license_to_member', 'generate_learner_id', 'update_grade_on_program_mapping', 'validate_aadhar_number', 'trigger_validate_aadhar']
    .map(name => functionDefinition(baseline, name));
  const triggers = [...baseline.matchAll(/CREATE OR REPLACE TRIGGER [\s\S]*?;/g)].map(match => match[0])
    .filter(statement => statement.includes(' ON "public"."learners"') && statement.includes(' INSERT ') && !statement.includes('invalidate_job_matches'));
  const view = baseline.match(/CREATE OR REPLACE VIEW "public"\."learner_applications_with_pipeline"[\s\S]*?;/)?.[0];
  if (!view) throw new Error('Missing actual learner application view');
  const activityNames = ['pipeline_candidates', 'applied_jobs', 'interviews', 'shortlist_candidates', 'trainings', 'certificates', 'skills'];
  const activityKeys = constraints(baseline, activityNames).filter(statement => /FOREIGN KEY \("learner_id"\) REFERENCES "public"\."learners"/.test(statement));
  if (activityKeys.length !== activityNames.length) throw new Error('Missing actual learner activity keys');
  const viewGrants = baseline.split('\n').filter(line => line.includes('"learner_applications_with_pipeline"') && (line.startsWith('GRANT ') || line.startsWith('ALTER VIEW ')));
  db.sql([
    'CREATE SCHEMA extensions; CREATE EXTENSION vector WITH SCHEMA extensions; GRANT USAGE ON SCHEMA extensions TO service_role;',
    ...types, ...[...parents].map(name => `CREATE TABLE public."${identifier(name)}"(id uuid PRIMARY KEY);`),
    ...tableDefinitions(baseline, names), ...keys, 'CREATE SEQUENCE public.learner_id_seq;', ...functions, ...triggers,
    ...['users', 'learners', 'users_shadow'].map(name => `ALTER TABLE public.${name} DISABLE ROW LEVEL SECURITY; GRANT SELECT,INSERT,UPDATE,DELETE ON public.${name} TO anon,authenticated,service_role;`),
    'CREATE TABLE public.pipeline_candidates(learner_id uuid,opportunity_id_old bigint,stage text,status text,added_at timestamptz,stage_changed_at timestamptz,next_action text,next_action_date date);',
    'CREATE TABLE public.opportunities(id_old bigint,title text,company_name text,requisition_id text);',
    'GRANT SELECT ON public.pipeline_candidates,public.opportunities TO anon,authenticated,service_role;',
    'CREATE VIEW public.pipeline_candidates_detailed AS SELECT * FROM public.pipeline_candidates;',
    ...['applied_jobs', 'shortlist_candidates', 'trainings', 'certificates', 'skills'].map(name => `CREATE TABLE public.${name}(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),learner_id uuid,candidate_name text,candidate_email text);`),
    ...tableDefinitions(baseline, ['interviews']), ...activityKeys, view, ...viewGrants,
    read('supabase/migrations/20270203000000_zoho_candidate_projection.sql'),
    read('supabase/migrations/20270204000000_zoho_projection_view_privacy.sql'),
    read('supabase/migrations/20270213000000_zoho_candidate_projection_readiness.sql'),
    read('supabase/migrations/20270216000000_zoho_generic_identity_sync_guard.sql'),
    candidateAdministrationTables(read),
    read('supabase/migrations/20270217040000_zoho_candidate_context_privacy.sql'),
    read('supabase/migrations/20270218020000_zoho_operator_history.sql'),
    read('supabase/seed/dev/20270218020000_seed_zoho_operator_history.sql'),
    read('supabase/migrations/20270218030000_zoho_administration_order.sql'),
    'REVOKE ALL ON public.users,public.learners,public.users_shadow,public.learner_applications_with_pipeline FROM PUBLIC,anon,authenticated;',
    "DO $$ DECLARE f record; BEGIN FOR f IN SELECT p.oid::regprocedure signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='public' AND p.prosecdef LOOP EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',f.signature); END LOOP; END $$;",
    'SELECT public.zoho_assert_private_projection_boundary();',
  ].join('\n'));
}

/** Opt-in only. Both uniquely named databases are dropped even if setup or a case fails. */
export function createCandidateTwoDatabaseFixture() {
  if (process.env.ZOHO_LOCAL_TWO_DB_TEST !== '1') throw new Error('Explicit local two-database test opt-in required');
  const suffix = `${process.pid}_${Date.now()}`;
  const canonical = database(process.env.ZOHO_TEST_SSO_CONTAINER || 'supabase_db_sso-auth', `zoho_e2e_sso_${suffix}`);
  const application = database(process.env.ZOHO_TEST_APP_CONTAINER || 'supabase_db_skillpassport', `zoho_e2e_app_${suffix}`);
  const close = () => {
    const failures = [];
    for (const db of [application, canonical]) try { db.drop(); } catch (error) { failures.push(error); }
    if (failures.length) throw new AggregateError(failures, 'Disposable fixture cleanup incomplete');
  };
  try {
    canonical.create(); application.create(); setupCanonical(canonical); setupApplication(application);
    return {
      canonical, application, close,
      grant(email, externalId) {
        return canonical.json(`SELECT fixture.candidate_grant(${literal(email)},${literal(externalId)})::text;`);
      },
    };
  } catch (error) {
    try { close(); } catch (cleanupError) { throw new AggregateError([error, cleanupError], 'Fixture setup and cleanup failed'); }
    throw error;
  }
}
