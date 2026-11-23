# Executed inside the disposable database container only, after the sequential suite.
set -euo pipefail
sql() { psql -X -h /tmp -U postgres -d postgres -v ON_ERROR_STOP=1 "$@"; }
sql <<'SQL'
SET statement_timeout='10s';
INSERT INTO public.subscription_cache(id,user_id,plan_id,plan_code,organization_id,is_organization_subscription,status,seat_count,subscription_end_date)
VALUES ('30000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000099','hybrid','20000000-0000-4000-8000-000000000001',true,'active',1,now()+interval '1 year');
INSERT INTO public.organization_members VALUES
('10000000-0000-4000-8000-000000000006','20000000-0000-4000-8000-000000000001','member','active'),
('10000000-0000-4000-8000-000000000007','20000000-0000-4000-8000-000000000001','member','active');
SQL

# The first transaction announces that it holds the parent lock. The second
# request must wait for its commit and then reject the now exhausted capacity.
sql > /tmp/pool-winner.log 2>&1 <<'SQL' &
SET statement_timeout='10s';
BEGIN;
INSERT INTO public.license_pools(id,organization_subscription_id,organization_id,organization_type,member_type,allocated_seats)
VALUES ('40000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','college','learner',1);
\! touch /tmp/pool-parent-locked
SELECT pg_sleep(1);
COMMIT;
SQL
winner=$!
for attempt in {1..200}; do
  if [ -f /tmp/pool-parent-locked ]; then break; fi
  sleep 0.01
done
test -f /tmp/pool-parent-locked
if sql > /tmp/pool-loser.log 2>&1 <<'SQL'
\set VERBOSITY verbose
SET statement_timeout='10s';
INSERT INTO public.license_pools(id,organization_subscription_id,organization_id,organization_type,member_type,allocated_seats)
VALUES ('40000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','college','learner',1);
SQL
then
  echo 'FAIL: competing pool allocation succeeded'; exit 1
fi
wait "$winner"
grep -q '23514: Pool allocation exceeds contracted seats' /tmp/pool-loser.log
sql -c "SELECT public.seat_test_assert((SELECT sum(allocated_seats)=1 FROM public.license_pools WHERE organization_subscription_id='30000000-0000-4000-8000-000000000002'),'competing pool allocations preserve capacity');"

sql > /tmp/assignment-winner.log 2>&1 <<'SQL' &
SET statement_timeout='10s';
BEGIN;
SELECT public.manage_organization_license('assign','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000006');
\! touch /tmp/assignment-parent-locked
SELECT pg_sleep(1);
COMMIT;
SQL
winner=$!
for attempt in {1..200}; do
  if [ -f /tmp/assignment-parent-locked ]; then break; fi
  sleep 0.01
done
test -f /tmp/assignment-parent-locked
if sql > /tmp/assignment-loser.log 2>&1 <<'SQL'
\set VERBOSITY verbose
SET statement_timeout='10s';
SELECT public.manage_organization_license('assign','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000007');
SQL
then
  echo 'FAIL: competing last-seat assignment succeeded'; exit 1
fi
wait "$winner"
grep -q '23514: No available seats in license pool' /tmp/assignment-loser.log
sql <<'SQL'
SELECT public.seat_test_assert((SELECT count(*)=1 FROM public.license_assignments WHERE organization_subscription_id='30000000-0000-4000-8000-000000000002' AND status='active'),'competing assignments consume last seat once');
SELECT public.seat_test_assert((SELECT assigned_seats=1 AND seat_count=1 FROM public.subscription_cache WHERE id='30000000-0000-4000-8000-000000000002'),'concurrent assignment counters equal actual usage');
SELECT public.seat_test_assert(public.organization_seat_usage(ARRAY['40000000-0000-4000-8000-000000000003'::uuid],ARRAY['30000000-0000-4000-8000-000000000002'::uuid])=jsonb_build_object('pools',jsonb_build_object('40000000-0000-4000-8000-000000000003',1),'subscriptions',jsonb_build_object('30000000-0000-4000-8000-000000000002',1)),'usage RPC counts actual assignments');
SELECT public.seat_test_assert(public.organization_seat_usage(ARRAY[]::uuid[],ARRAY[]::uuid[])='{"pools":{},"subscriptions":{}}'::jsonb,'empty usage RPC has no stale counters');
SELECT 'HYBRID_SEAT_CONCURRENCY_OK';
SQL
