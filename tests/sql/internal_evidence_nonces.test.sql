-- Run after the nonce and retention migrations, in an isolated local database.
begin;
insert into public.internal_evidence_nonces(nonce, expires_at)
values ('expired-fixture', now() - interval '5 minutes'), ('live-fixture', now() + interval '1 minute');
-- A subsequent successful claim invokes bounded cleanup.
insert into public.internal_evidence_nonces(nonce, expires_at) values ('new-fixture', now() + interval '1 minute');
do $$ begin
  if exists (select 1 from public.internal_evidence_nonces where nonce = 'expired-fixture') then
    raise exception 'expired nonce was not cleaned';
  end if;
  if not exists (select 1 from public.internal_evidence_nonces where nonce = 'live-fixture') then
    raise exception 'live nonce was deleted';
  end if;
  begin
    insert into public.internal_evidence_nonces(nonce, expires_at) values ('new-fixture', now() + interval '1 minute');
    raise exception 'duplicate nonce was accepted';
  exception when unique_violation then null;
  end;
  if not (select relrowsecurity from pg_class where oid = 'public.internal_evidence_nonces'::regclass) then
    raise exception 'RLS disabled';
  end if;
end $$;
rollback;
