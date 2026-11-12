/** Actual owned table contracts for projection/privacy fixtures. No global roles or unrelated domain RPCs. */
export function candidateAdministrationTables(read) {
  const control = read('supabase/migrations/20270128000001_zoho_recruit_approval_control_plane.sql');
  const recovery = read('supabase/migrations/20270131000000_zoho_recruit_record_recovery.sql');
  const bulk = read('supabase/migrations/20270217011000_zoho_bulk_read.sql');
  const privacy = read('supabase/migrations/20270214000000_zoho_source_privacy.sql');
  function table(source, name) {
    const definition = source.match(new RegExp(`CREATE TABLE public\\.${name} \\([\\s\\S]*?\\n\\);`))?.[0];
    if (!definition) throw new Error(`Missing actual administration fixture table ${name}`);
    return definition;
  }
  const tables = ['zoho_connections', 'zoho_staged_records', 'zoho_approval_batches', 'zoho_approved_operations',
    'zoho_oauth_states', 'zoho_connection_secrets', 'zoho_discovery_runs'].map(name => table(control, name));
  const payloadColumns = privacy.match(/ALTER TABLE public\.zoho_staged_records\s+ADD COLUMN payload_staged_at[\s\S]*?;/)?.[0];
  if (!payloadColumns) throw new Error('Missing actual staged-payload privacy columns');
  const eraseBulk=bulk.match(/CREATE FUNCTION public\.zoho_erase_bulk_source_artifacts\([\s\S]*?\n\$\$;/)?.[0];
  if(!eraseBulk)throw new Error('Missing actual bulk erasure fixture function');
  return [...tables, table(recovery, 'zoho_deferred_records'), payloadColumns,
    table(read('supabase/migrations/20270217010000_zoho_source_lifecycle.sql'),'zoho_source_lifecycle_proposals'),
    table(privacy, 'zoho_source_suppressions'),table(bulk,'zoho_bulk_read_runs'),eraseBulk,
    'REVOKE ALL ON FUNCTION public.zoho_erase_bulk_source_artifacts(uuid) FROM PUBLIC,anon,authenticated; GRANT EXECUTE ON FUNCTION public.zoho_erase_bulk_source_artifacts(uuid) TO service_role;'].join('\n');
}
