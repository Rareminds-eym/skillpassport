-- Bounded opportunistic retention. No new table and no cron dependency.
-- Keep a one-minute grace after expiry so in-flight admitted reads cannot
-- have their nonce removed at the validity boundary.
create or replace function public.cleanup_internal_evidence_nonces()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  delete from public.internal_evidence_nonces
  where nonce in (
    select nonce from public.internal_evidence_nonces
    where expires_at < pg_catalog.now() - interval '1 minute'
    order by expires_at limit 100 for update skip locked
  );
  return null;
end;
$$;
revoke all on function public.cleanup_internal_evidence_nonces() from public, anon, authenticated;
drop trigger if exists cleanup_internal_evidence_nonces_after_insert on public.internal_evidence_nonces;
create trigger cleanup_internal_evidence_nonces_after_insert
  after insert on public.internal_evidence_nonces
  for each statement execute function public.cleanup_internal_evidence_nonces();
