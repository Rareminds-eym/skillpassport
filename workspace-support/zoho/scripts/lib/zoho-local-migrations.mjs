import { createHash } from 'node:crypto';

export const localMigrationTargets = [
  { repository: 'sso-worker', container: 'supabase_db_sso-auth', files: ['20270217020000_zoho_candidate_administration.sql','20270218010000_zoho_administration_recovery.sql'] },
  { repository: 'skillpassport', container: 'supabase_db_skillpassport', files: [
    '20270217010000_zoho_source_lifecycle.sql', '20270217011000_zoho_bulk_read.sql', '20270217012000_zoho_deleted_scan_cursor.sql',
    '20270217030000_zoho_source_quota_key_rotation.sql', '20270217040000_zoho_candidate_context_privacy.sql',
    '20270217050000_assessment_owned_context.sql', '20270217060000_assessment_grading_provenance.sql',
    '20270217070000_adaptive_owned_answer_commit.sql',
    '20270218020000_zoho_operator_history.sql', '20270218030000_zoho_administration_order.sql',
    '20270219010000_zoho_console_controls.sql', '20270219020000_assessment_specialization_context.sql', '20270220000000_zoho_dynamic_source_allocation.sql', '20270221000000_zoho_operator_audit_fixes.sql', '20270222000000_zoho_retry_visibility.sql', '20270223000000_zoho_overview_module_counts.sql',
  ] },
];
export function requireLocalDocker(endpoint, override) {
  if (typeof endpoint !== 'string' || !endpoint.startsWith('unix://') || (override && !override.startsWith('unix://')))
    throw new Error('Only a local Docker Unix socket is supported');
}
export function migrationSource(filename, contents) {
  const match = /^(\d{14})_([a-z0-9_]+)\.sql$/.exec(filename);
  if (!match || typeof contents !== 'string') throw new Error('Invalid migration source');
  const sql = contents.trim();
  if (!sql.startsWith('BEGIN;') || !sql.endsWith('COMMIT;')) throw new Error(`Migration must use an outer transaction: ${filename}`);
  return { filename, version: match[1], name: match[2], contents,
    body: sql.slice('BEGIN;'.length, -'COMMIT;'.length), sha256: createHash('sha256').update(contents).digest('hex') };
}
export function pendingLocalMigrations(target, sources, tracked) {
  if (!Array.isArray(tracked) || tracked.some(v => typeof v !== 'string' || !/^\d{14}$/.test(v))) throw new Error('Invalid local migration ledger');
  const allowed = new Set(target.files), versions = new Set(tracked);
  for (const filename of target.files) if (!sources.some(s => s.filename === filename)) throw new Error(`Missing allowed migration: ${filename}`);
  const pending = sources.filter(s => !versions.has(s.version));
  const unexpected = pending.filter(s => !allowed.has(s.filename));
  if (unexpected.length) throw new Error(`Unreviewed pending migrations in ${target.repository}: ${unexpected.map(s => s.filename).join(', ')}`);
  return pending.sort((a, b) => a.version.localeCompare(b.version));
}
const encodedLiteral = text => `convert_from(decode('${Buffer.from(text).toString('base64')}','base64'),'UTF8')`;
/** The ledger insert and exact source DDL commit in the same local DB transaction. */
export function localMigrationBatch(sources) {
  return ['BEGIN;', "SELECT pg_advisory_xact_lock(hashtextextended('zoho-local-migration-upgrade',0));",
    ...sources.map(source => {
      if (!/^\d{14}$/.test(source.version) || !/^[a-z0-9_]+$/.test(source.name)) throw new Error('Invalid migration identity');
      return `${source.body}\nINSERT INTO supabase_migrations.schema_migrations(version,statements,name) VALUES('${source.version}',ARRAY[${encodedLiteral(source.contents)}],'${source.name}');`;
    }), 'COMMIT;', "NOTIFY pgrst,'reload schema';"].join('\n');
}
