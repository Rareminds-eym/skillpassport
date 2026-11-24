/** Execute only after explicit approval for this disposable local SQL target.
 * No existing container/database is used; the test has no network or host ports.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = new URL('../../', import.meta.url);
const read = file => readFileSync(new URL(file, root), 'utf8');
const baseline = read('supabase/migrations/20260526000000_schema.sql');
const tables = ['subscription_cache', 'license_pools', 'license_assignments'].map(table => {
  const definition = baseline.match(new RegExp(`CREATE TABLE IF NOT EXISTS "public"\\."${table}" \\([\\s\\S]*?\\n\\);`))?.[0];
  if (!definition) throw new Error(`Actual ${table} definition missing`);
  return definition;
}).join('\n');
const fixture = `CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
 CREATE TABLE public.users(id uuid PRIMARY KEY,email text,"organizationId" uuid);
 CREATE TABLE public.organization_members(user_id uuid REFERENCES public.users(id),organization_id uuid,role text,status text,UNIQUE(user_id,organization_id));
 CREATE TABLE public.learners(id uuid PRIMARY KEY,user_id uuid,school_id uuid,college_id uuid,is_deleted boolean DEFAULT false);
 CREATE TABLE public.school_educators(id uuid PRIMARY KEY,user_id uuid,school_id uuid);
 CREATE TABLE public.college_lecturers(id uuid PRIMARY KEY,user_id uuid,"collegeId" uuid);
 CREATE TABLE public.organization_invitations(id uuid PRIMARY KEY,organization_id uuid,organization_type text,invitee_role text,invitee_email text,license_pool_id uuid,status text,expires_at timestamptz,invited_by uuid,accepted_at timestamptz,accepted_by_user_id uuid,updated_at timestamptz);
 ${tables}
 ALTER TABLE public.subscription_cache ADD PRIMARY KEY(id);
 ALTER TABLE public.license_pools ADD PRIMARY KEY(id);
 ALTER TABLE public.license_assignments ADD PRIMARY KEY(id);
 ALTER TABLE public.license_assignments ADD FOREIGN KEY(user_id) REFERENCES public.users(id);
 ALTER TABLE public.license_assignments ADD FOREIGN KEY(license_pool_id) REFERENCES public.license_pools(id) ON DELETE CASCADE;
 CREATE UNIQUE INDEX unique_active_assignment ON public.license_assignments(user_id,organization_subscription_id) WHERE status='active';
 ${read('supabase/migrations/20270313010000_hybrid_seat_integrity.sql')}
 CREATE TRIGGER trigger_validate_pool_allocation BEFORE INSERT OR UPDATE ON public.license_pools FOR EACH ROW EXECUTE FUNCTION public.validate_pool_allocation();
 CREATE TRIGGER trigger_sync_pool_assigned_seats AFTER INSERT OR UPDATE OR DELETE ON public.license_assignments FOR EACH ROW EXECUTE FUNCTION public.sync_pool_assigned_seats();
 CREATE TRIGGER trigger_auto_assign_license_learners AFTER INSERT ON public.learners FOR EACH ROW EXECUTE FUNCTION public.auto_assign_license_to_member();
 CREATE TABLE public.subscriptions(id uuid PRIMARY KEY,plan_code text,seat_count integer);
 ${read('../sso-worker/supabase/migrations/20270313010000_guard_hybrid_capacity_reductions.sql')}
 ${read('tests/sql/hybrid_seat_integrity.test.sql')}`;
const shell = `cat > /tmp/seat-test.sql
initdb -D /tmp/seat-db --auth=trust >/dev/null
pg_ctl -D /tmp/seat-db -l /tmp/seat-db.log -o "-k /tmp -c listen_addresses=''" -w start >/dev/null
trap 'pg_ctl -D /tmp/seat-db -m immediate stop >/dev/null' EXIT
psql -X -h /tmp -U postgres -d postgres -v ON_ERROR_STOP=1 -f /tmp/seat-test.sql
${read('tests/sql/hybrid_seat_concurrency.test.sh')}`;
const result = spawnSync('docker', ['run','--rm','-i','--network','none','--user','postgres','--read-only','--tmpfs','/tmp:rw,mode=1777','--entrypoint','/bin/bash','public.ecr.aws/supabase/postgres:17.6.1.063','-ceu',shell], { input: fixture, encoding: 'utf8', timeout: 90000, maxBuffer: 2e6, cwd: fileURLToPath(root) });
if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
