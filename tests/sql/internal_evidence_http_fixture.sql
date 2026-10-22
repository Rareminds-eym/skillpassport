-- Synthetic fixture for an isolated database only; do not run against application data.
create table public.learners(id uuid primary key, user_id uuid, name text, grade text, branch_field text, university text, updated_at timestamptz);
create table public.skills(id uuid primary key, learner_id uuid, name text, type text, level integer, verified boolean, enabled boolean, updated_at timestamptz);
insert into public.learners values ('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','Integration Learner','College','Computing','Test',now());
insert into public.skills values ('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222','Python','technical',null,false,true,now());
grant usage on schema public to service_role;
grant select, insert, delete on all tables in schema public to service_role;
