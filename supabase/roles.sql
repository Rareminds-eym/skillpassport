-- =============================================================================
-- LOCAL-ONLY global bootstrap for the Supabase CLI. Provides auth.jwt() without GoTrue.
-- =============================================================================
-- Why this file exists
--   GoTrue / Supabase Auth is disabled locally ([auth] enabled = false in config.toml):
--   credentials are owned by the custom SSO worker. The consequence is that no GoTrue
--   migration runs, so the `auth.jwt()` function is never created. The baseline migration
--   (20260526000000_schema.sql) and 20260624000000_add_maintenance_mode_config.sql use
--   auth.jwt() inside RLS policies, and the Supabase Postgres image only ships auth.uid(),
--   auth.role(), auth.email(), a minimal auth.users and auth.refresh_tokens_id_seq.
--
-- When it runs
--   The CLI (`supabase start` on a fresh volume, `supabase db reset`, and the shadow DB)
--   executes supabase/roles.sql as role `postgres` BEFORE migrations ("Seeding globals from
--   supabase/roles.sql..."). `postgres` is not a superuser and has no CREATE on schema `auth`
--   (revoked by the image), so a plain `CREATE FUNCTION auth.jwt()` fails with
--   "permission denied for schema auth". This block therefore creates the function as
--   `supabase_admin` through a short-lived dblink connection and drops dblink again.
--
-- Guarantees
--   * Idempotent: a no-op whenever auth.jwt() already exists (re-runs, volumes created by an
--     older GoTrue run, and every hosted project).
--   * Fails loudly (never silently skips) if the function cannot be created.
--   * Leaves no dblink extension behind.
--
-- Known limits / risks
--   * Uses the CLI default LOCAL database password (`postgres`; config.toml [db] sets none).
--     If you change the local DB password, update the connection string below.
--   * The function body is identical to GoTrue's (migration 20220531120530_add_auth_jwt_function).
--   * NEVER run `supabase db push --include-roles` (or any command that sends this file to a
--     remote project). The guard makes it harmless where auth.jwt() exists, but it is a
--     local-development file only.
-- =============================================================================

do $roles$
declare
  v_host         text;
  v_ext_existed  boolean;
  v_conn         text;
begin
  -- Idempotent guard: nothing to do when auth.jwt() already exists.
  if to_regprocedure('auth.jwt()') is not null then
    return;
  end if;

  -- dblink refuses loopback for non-superusers (pg_hba "trust" there), so connect to the
  -- container's own non-loopback address, which uses password authentication.
  v_host := host(inet_server_addr());
  if v_host is null or v_host in ('127.0.0.1', '::1') then
    raise exception 'roles.sql: cannot create auth.jwt(): server address is %, a non-loopback address is required (connect to the local database through the Docker network address, as the Supabase CLI does)', coalesce(v_host, 'NULL (unix socket)');
  end if;

  v_ext_existed := exists (select 1 from pg_extension where extname = 'dblink');
  create extension if not exists dblink with schema extensions;

  v_conn := format(
    'host=%s port=5432 dbname=postgres user=supabase_admin password=postgres connect_timeout=5',
    v_host
  );

  begin
    perform extensions.dblink_exec(v_conn, $fn$
      create or replace function auth.jwt() returns jsonb language sql stable as $jwt$
        select
          coalesce(
            nullif(current_setting('request.jwt.claim', true), ''),
            nullif(current_setting('request.jwt.claims', true), '')
          )::jsonb
      $jwt$
    $fn$);

    perform extensions.dblink_exec(v_conn,
      'grant execute on function auth.jwt() to postgres, anon, authenticated, service_role, supabase_auth_admin'
    );
  exception when others then
    raise exception 'roles.sql: could not create auth.jwt() (needs local supabase_admin password = postgres and a non-loopback server address): %', sqlerrm;
  end;

  -- Do not leave a loopback-superuser capability in the database.
  if not v_ext_existed then
    drop extension dblink;
  end if;
end
$roles$;
