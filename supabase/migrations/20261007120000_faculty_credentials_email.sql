-- Credentials are held only in request memory and sent to the account email.
-- Remove legacy values in SQL without returning or exporting their contents.
begin;
alter table public.college_lecturers
  add column if not exists credentials_email_status text not null default 'not_sent'
    check (credentials_email_status in ('not_sent', 'sending', 'sent', 'failed')),
  add column if not exists credentials_email_attempted_at timestamptz;

update public.college_lecturers
set temporary_password = null,
    metadata = metadata - 'temporary_password' - 'password_created_at'
where temporary_password is not null or metadata ? 'temporary_password' or metadata ? 'password_created_at';

create or replace function public.strip_faculty_plaintext_credentials()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.temporary_password := null;
  new.metadata := new.metadata - 'temporary_password' - 'password_created_at';
  return new;
end;
$$;
revoke all on function public.strip_faculty_plaintext_credentials() from public;
drop trigger if exists strip_faculty_plaintext_credentials on public.college_lecturers;
create trigger strip_faculty_plaintext_credentials
before insert or update on public.college_lecturers
for each row execute function public.strip_faculty_plaintext_credentials();
commit;
