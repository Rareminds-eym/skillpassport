// Preparation inspection only. This program has no connection loader, SQL client or SQL execution.
// Real SQL rollback/locking/privilege/replay/legacy-isolation acceptance needs a separately approved target.
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

if (process.argv.length !== 2) throw new Error('Only offline preparation inspection is supported; no target execution is authorized');
const source = readFileSync(new URL('../../supabase/migrations/20270318010000_subscription_credit_execution.sql', import.meta.url), 'utf8');
function inspect(sql) {
  assert.match(sql, /^-- PREPARED ONLY\./);
  assert.match(sql, /BEGIN;[\s\S]+COMMIT;\s*$/);
  for (const name of ['allocate_subscription_credits', 'consume_subscription_credits', 'get_subscription_credit_usage', 'get_credit_balance', 'consume_credits']) {
    const body = sql.match(new RegExp(`CREATE (?:OR REPLACE )?FUNCTION public\\.${name}\\([\\s\\S]*?END; \\$\\$;`))?.[0];
    assert.ok(body, `Missing prepared function ${name}`);
    assert.match(body, /SECURITY DEFINER SET search_path=pg_catalog,public/);
    if (name === 'get_credit_balance' || name === 'consume_credits') {
      assert.match(body, /NOT EXISTS\(SELECT 1 FROM public\.subscription_credit_allocations a WHERE a\.ledger_id=l\.id\)/);
      assert.match(body, /NOT EXISTS\(SELECT 1 FROM public\.subscription_credit_consumptions c WHERE c\.ledger_id=l\.id\)/);
    }
  }
  assert.match(sql, /prior\.occurrence IS DISTINCT FROM p_occurrence/);
  assert.match(sql, /prior\.command IS DISTINCT FROM p_command/);
  assert.match(sql, /jsonb_typeof\(p_command->'actionKey'\) IS DISTINCT FROM 'string'/);
  assert.match(sql, /s:=p_command - ARRAY\['operationId','actionKey','amount','spendingOrder'\]/);
  assert.equal((sql.match(/prior\.receipt->>'actorId' IS DISTINCT FROM p_actor_id::text/g) ?? []).length, 2);
  assert.equal((sql.match(/pg_advisory_xact_lock\(hashtextextended/g) ?? []).length, 3);
  assert.match(sql, /WHERE a\.scope=s AND a\.expires_at_ms>at_ms/);
  assert.match(sql, /WHERE a\.scope=p_scope AND a\.expires_at_ms>/);
  assert.match(sql, /p_occurrence->'rollover' IS DISTINCT FROM '\{"kind":"none"\}'::jsonb/);
  assert.match(sql, /IF starts_ms>at_ms OR expires_ms<=at_ms THEN RAISE EXCEPTION/);
  assert.match(sql, /RETURN prior\.receipt; -- replay precedes time checks/);
  assert.match(sql, /IF available<requested THEN RAISE EXCEPTION 'INSUFFICIENT_SUBSCRIPTION_CREDITS'/);
  assert.match(sql, /'consumption',-requested,NULL,at_time/);
  assert.match(sql, /ON public\.credit_ledger\s+FOR EACH ROW EXECUTE FUNCTION public\.protect_subscription_credit_ledger/);
  assert.match(sql, /REVOKE ALL ON public\.subscription_credit_allocations,public\.subscription_credit_consumptions,public\.subscription_credit_attribution FROM PUBLIC,anon,authenticated,service_role/);
  assert.doesNotMatch(sql, /ENABLE ROW LEVEL SECURITY|ON CONFLICT DO NOTHING|dblink|http_post/);
}
inspect(source);
// Positive-control mutations ensure these inspected guards actually reject missing protections.
for (const [label, changed] of [
  ['legacy exclusion', source.replaceAll('NOT EXISTS(SELECT 1 FROM public.subscription_credit_allocations a WHERE a.ledger_id=l.id)', 'true')],
  ['scope', source.replaceAll('WHERE a.scope=s AND a.expires_at_ms>at_ms', 'WHERE a.expires_at_ms>at_ms')],
  ['expiry', source.replaceAll('WHERE a.scope=s AND a.expires_at_ms>at_ms', 'WHERE a.scope=s')],
  ['replay', source.replaceAll('prior.occurrence IS DISTINCT FROM p_occurrence', 'false')],
  ['privileges', source.replaceAll('FROM PUBLIC,anon,authenticated,service_role', 'FROM anon')],
]) assert.throws(() => inspect(changed), undefined, `Preparation negative control failed: ${label}`);
console.log('SUBSCRIPTION_CREDIT_PREPARATION_INSPECTED (offline text assertions; SQL execution and concurrency NOT VERIFIED)');
