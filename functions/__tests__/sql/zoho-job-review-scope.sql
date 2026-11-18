-- DISPOSABLE DATABASE ONLY. All DDL and policy fixtures are rolled back.
BEGIN;
DO $test$
BEGIN
 ASSERT public.zoho_job_has_dynamic_sql('BEGIN EXECUTE/**/''SELECT 1''; END');
 ASSERT public.zoho_job_has_dynamic_sql('BEGIN RETURN QUERY EXECUTE ''SELECT 1''; END');
 ASSERT NOT public.zoho_job_has_dynamic_sql('BEGIN RAISE NOTICE ''execute''; END');
 ASSERT NOT public.zoho_job_has_dynamic_sql('BEGIN PERFORM "execute" FROM sample; END');
 ASSERT NOT public.zoho_job_has_dynamic_sql($body$BEGIN RAISE NOTICE $literal$execute$literal$; END$body$);
 ASSERT NOT public.zoho_job_has_dynamic_sql($body$BEGIN RAISE NOTICE $$execute$$; END$body$);
 ASSERT NOT public.zoho_job_has_dynamic_sql(E'BEGIN -- execute\n RETURN; END');
 ASSERT NOT public.zoho_job_has_dynamic_sql('BEGIN /* outer /* nested */ execute */ RETURN; END');
 ASSERT public.zoho_job_has_dynamic_sql('BEGIN /* execute */ EXECUTE ''SELECT 1''; END');
 ASSERT NOT public.zoho_job_has_dynamic_sql($body$BEGIN RAISE NOTICE E'can\'t execute'; END$body$);
END $test$;
CREATE SCHEMA fixture_scope_helpers;
CREATE TABLE public.fixture_scope_sink(value text);
CREATE FUNCTION fixture_scope_helpers.leaf() RETURNS void LANGUAGE plpgsql AS $$ BEGIN RETURN; END $$;
CREATE FUNCTION fixture_scope_helpers.middle() RETURNS void LANGUAGE plpgsql AS $$ BEGIN PERFORM fixture_scope_helpers.leaf/* call comment */(); END $$;
CREATE FUNCTION public.fixture_scope_trigger() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN PERFORM fixture_scope_helpers.middle(); RETURN NEW; END $$;
CREATE TRIGGER fixture_scope_hook AFTER INSERT ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.fixture_scope_trigger();
-- Parse multiple static targets without executing their destructive statement.
CREATE TABLE fixture_scope_helpers."Truncate Sink"(value text);
CREATE FUNCTION fixture_scope_helpers.truncate_both() RETURNS void LANGUAGE plpgsql AS $$
BEGIN TRUNCATE TABLE public.fixture_scope_sink, ONLY fixture_scope_helpers."Truncate Sink" RESTART IDENTITY; END $$;
DO $$ DECLARE targets oid[]; BEGIN
 SELECT array_agg(t) INTO targets FROM public.zoho_job_write_targets('fixture_scope_helpers.truncate_both()'::regprocedure) t;
 ASSERT cardinality(targets)=2 AND targets @> ARRAY['public.fixture_scope_sink'::regclass::oid,'fixture_scope_helpers."Truncate Sink"'::regclass::oid], 'Multiple write targets were truncated from review';
END $$;

DO $$
DECLARE connection uuid; before_hash text; original text; middle_definition text; wired_hash text; n integer; elapsed interval; started timestamptz;
BEGIN
 connection:=(public.zoho_register_connection('Scoped review fixture','77777777777777777771','in',
 '00000000-0000-0000-0000-000000000001','10000000-0000-4000-8000-000000000002')->>'id')::uuid;
 UPDATE public.zoho_connections SET status='connected' WHERE id=connection;
 PERFORM public.zoho_configure_job_policy(connection,'10000000-0000-4000-8000-000000000002',1,
 '{"Open":"open","Closed":"closed","Draft":"draft"}','{"Full time":"job"}',true,true,
 public.zoho_job_trigger_fingerprint(),'Reviewed scope regression fixture');
 ASSERT public.zoho_job_publisher_ready();
 started:=clock_timestamp();
 before_hash:=public.zoho_job_trigger_fingerprint();
 elapsed:=clock_timestamp()-started;
 ASSERT before_hash IS NOT NULL;
 ASSERT elapsed<interval '5 seconds','Fingerprint exceeds dependency request timeout';

 -- Absence assertions have positive controls below: referenced helpers/tables
 -- MUST be present and invalidate the same digest when changed.
 EXECUTE 'CREATE TABLE public.fixture_unrelated_recruitment_notes(id uuid PRIMARY KEY,note text)';
 EXECUTE 'ALTER TABLE public.fixture_unrelated_recruitment_notes ADD COLUMN updated_at timestamptz DEFAULT now()';
 EXECUTE 'CREATE INDEX fixture_unrelated_note_idx ON public.fixture_unrelated_recruitment_notes(note)';
 EXECUTE 'CREATE TYPE public.fixture_unrelated_status AS ENUM (''queued'',''done'')';
 EXECUTE 'CREATE FUNCTION public.fixture_unrelated_calculation() RETURNS integer LANGUAGE sql AS ''SELECT 1''';
 EXECUTE 'CREATE FUNCTION public.fixture_unrelated_org_trigger() RETURNS trigger LANGUAGE plpgsql AS $b$ BEGIN RETURN NEW; END $b$';
 EXECUTE 'CREATE TRIGGER fixture_unrelated_org_hook AFTER INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.fixture_unrelated_org_trigger()';
 ASSERT before_hash=public.zoho_job_trigger_fingerprint(),'Unrelated DDL invalidated review';
 ASSERT public.zoho_job_publisher_ready(),'Unrelated DDL blocked publishing';
 EXECUTE 'CREATE OR REPLACE FUNCTION public.fixture_unrelated_calculation() RETURNS integer LANGUAGE sql AS ''SELECT 2''';
 EXECUTE 'ALTER TYPE public.fixture_unrelated_status ADD VALUE ''cancelled''';
 EXECUTE 'GRANT SELECT ON public.fixture_unrelated_recruitment_notes TO authenticated';
 ASSERT before_hash=public.zoho_job_trigger_fingerprint(),'Unrelated routine/enum/ACL invalidated review';
 ASSERT NOT EXISTS(SELECT 1 FROM public.zoho_job_executable_surface() s WHERE s.name LIKE '%fixture_unrelated%');
 ASSERT EXISTS(SELECT 1 FROM public.zoho_job_executable_surface() s WHERE s.kind='routine' AND s.name='fixture_scope_helpers.leaf()');
 ASSERT EXISTS(SELECT 1 FROM public.zoho_job_executable_surface() s WHERE s.kind='relation' AND s.name='opportunities');

 -- Model a catalogue with hundreds of unrelated writers. Their names/bodies
 -- must not enter the digest or get parsed as reachable write effects.
 FOR n IN 1..400 LOOP
  EXECUTE format('CREATE FUNCTION public.fixture_scaled_writer_%s() RETURNS void LANGUAGE plpgsql AS %L',n,
   E'BEGIN\n/* '||repeat('Unrelated catalogue fixture content. ',45)||E' */\nIF false THEN UPDATE public.fixture_unrelated_recruitment_notes SET note=note; END IF; END');
 END LOOP;
 started:=clock_timestamp();
 ASSERT before_hash=public.zoho_job_trigger_fingerprint(),'Unrelated writer catalogue changed review';
 ASSERT clock_timestamp()-started<interval '5 seconds','Unrelated routines made readiness exceed the dependency timeout';

 -- Comments and literals cannot invent dependencies, even on dynamic routines.
 SELECT pg_get_functiondef('fixture_scope_helpers.leaf()'::regprocedure) INTO original;
 EXECUTE 'CREATE FUNCTION fixture_scope_helpers.comment_only() RETURNS integer LANGUAGE sql AS ''SELECT 1''';
 EXECUTE 'CREATE OR REPLACE FUNCTION fixture_scope_helpers.leaf() RETURNS void LANGUAGE plpgsql AS $b$
 BEGIN /* comment_only */ RAISE NOTICE ''comment_only''; RETURN; END $b$';
 wired_hash:=public.zoho_job_trigger_fingerprint();
 EXECUTE 'CREATE OR REPLACE FUNCTION fixture_scope_helpers.comment_only() RETURNS integer LANGUAGE sql AS ''SELECT 2''';
 ASSERT wired_hash=public.zoho_job_trigger_fingerprint(),'Comment/literal-only dependency invalidated review';
 EXECUTE 'CREATE OR REPLACE FUNCTION fixture_scope_helpers.comment_only() RETURNS integer LANGUAGE plpgsql AS $b$ BEGIN EXECUTE ''SELECT 1''; RETURN 2; END $b$';
 ASSERT wired_hash=public.zoho_job_trigger_fingerprint(),'Comment-only dynamic routine blocked review';
 EXECUTE original;
 EXECUTE 'DROP FUNCTION fixture_scope_helpers.comment_only()';

 -- Execute escaped calls as positive controls before measuring helper drift.
 EXECUTE 'CREATE FUNCTION fixture_scope_helpers.unicode_leaf() RETURNS integer LANGUAGE sql AS ''SELECT 1''';
 EXECUTE $ddl$CREATE OR REPLACE FUNCTION fixture_scope_helpers.leaf() RETURNS void LANGUAGE plpgsql AS $b$
 BEGIN ASSERT fixture_scope_helpers.U&"unicode_le\0061f"()=1; END $b$ $ddl$;
 PERFORM fixture_scope_helpers.leaf();
 wired_hash:=public.zoho_job_trigger_fingerprint();
 EXECUTE 'CREATE OR REPLACE FUNCTION fixture_scope_helpers.unicode_leaf() RETURNS integer LANGUAGE sql AS ''SELECT 2''';
 ASSERT wired_hash<>public.zoho_job_trigger_fingerprint(),'Unicode-escaped helper drift escaped scope';
 EXECUTE $ddl$CREATE OR REPLACE FUNCTION fixture_scope_helpers.leaf() RETURNS void LANGUAGE plpgsql AS $b$
 BEGIN ASSERT fixture_scope_helpers.U&"unicode_le!0061f" UESCAPE '!' ()=2; END $b$ $ddl$;
 PERFORM fixture_scope_helpers.leaf();
 wired_hash:=public.zoho_job_trigger_fingerprint();
 EXECUTE 'CREATE OR REPLACE FUNCTION fixture_scope_helpers.unicode_leaf() RETURNS integer LANGUAGE sql AS ''SELECT 3''';
 ASSERT wired_hash<>public.zoho_job_trigger_fingerprint(),'Custom Unicode escape drift escaped scope';
 EXECUTE original;
 EXECUTE 'DROP FUNCTION fixture_scope_helpers.unicode_leaf()';
 ASSERT before_hash=public.zoho_job_trigger_fingerprint();

 -- A transitive helper has no pg_depend body edge, but must still be covered.
 SELECT pg_get_functiondef('fixture_scope_helpers.leaf()'::regprocedure) INTO original;
 EXECUTE 'CREATE OR REPLACE FUNCTION fixture_scope_helpers.leaf() RETURNS void LANGUAGE plpgsql AS $b$ BEGIN INSERT INTO public.fixture_scope_sink VALUES(''unreviewed''); END $b$';
 ASSERT before_hash IS DISTINCT FROM public.zoho_job_trigger_fingerprint(),'Transitive helper escaped scope';
 ASSERT NOT public.zoho_job_publisher_ready();
 ASSERT NOT EXISTS(SELECT 1 FROM public.fixture_scope_sink),'Review executed a helper';
 EXECUTE original;
 ASSERT before_hash=public.zoho_job_trigger_fingerprint();
 ASSERT public.zoho_job_publisher_ready();

 -- Comment-separated writes and quoted names must include destination triggers.
 EXECUTE 'CREATE TABLE fixture_scope_helpers."Job Sink"(value text)';
 EXECUTE 'CREATE FUNCTION fixture_scope_helpers.sink_hook() RETURNS trigger LANGUAGE plpgsql AS $b$ BEGIN RETURN NEW; END $b$';
 EXECUTE 'CREATE TRIGGER fixture_quoted_hook BEFORE INSERT ON fixture_scope_helpers."Job Sink" FOR EACH ROW EXECUTE FUNCTION fixture_scope_helpers.sink_hook()';
 EXECUTE 'CREATE OR REPLACE FUNCTION fixture_scope_helpers.leaf() RETURNS void LANGUAGE plpgsql AS $b$ BEGIN INSERT /* outer /* nested */ comment */ INTO fixture_scope_helpers."Job Sink" VALUES(''reviewed''); END $b$';
 wired_hash:=public.zoho_job_trigger_fingerprint();
 ASSERT EXISTS(SELECT 1 FROM public.zoho_job_executable_surface() s WHERE s.kind='trigger' AND s.name LIKE '%Job Sink%.fixture_quoted_hook'),'Quoted/comment-separated write target not analyzed';
 EXECUTE 'ALTER TABLE fixture_scope_helpers."Job Sink" DISABLE TRIGGER fixture_quoted_hook';
 ASSERT wired_hash IS DISTINCT FROM public.zoho_job_trigger_fingerprint(),'Transitive destination trigger drift escaped scope';
 EXECUTE original;
 EXECUTE 'DROP TABLE fixture_scope_helpers."Job Sink"';
 EXECUTE 'DROP FUNCTION fixture_scope_helpers.sink_hook()';
 ASSERT before_hash=public.zoho_job_trigger_fingerprint();

 -- Operator implementations used inside a body are not tracked by pg_depend.
 SELECT pg_get_functiondef('fixture_scope_helpers.middle()'::regprocedure) INTO middle_definition;
 EXECUTE 'CREATE FUNCTION fixture_scope_helpers.equivalent(text,text) RETURNS boolean IMMUTABLE LANGUAGE sql AS ''SELECT $1=$2''';
 EXECUTE 'CREATE OPERATOR fixture_scope_helpers.=== (FUNCTION=fixture_scope_helpers.equivalent,LEFTARG=text,RIGHTARG=text)';
 EXECUTE 'CREATE OR REPLACE FUNCTION fixture_scope_helpers.middle() RETURNS void LANGUAGE plpgsql AS $b$ BEGIN PERFORM ''a'' OPERATOR(fixture_scope_helpers.===) ''b''; PERFORM fixture_scope_helpers.leaf(); END $b$';
 wired_hash:=public.zoho_job_trigger_fingerprint();
 ASSERT EXISTS(SELECT 1 FROM public.zoho_job_executable_surface() s WHERE s.kind='routine' AND s.name='fixture_scope_helpers.equivalent(text,text)');
 EXECUTE 'CREATE OR REPLACE FUNCTION fixture_scope_helpers.equivalent(text,text) RETURNS boolean IMMUTABLE LANGUAGE sql AS ''SELECT false''';
 ASSERT wired_hash IS DISTINCT FROM public.zoho_job_trigger_fingerprint(),'Operator helper drift escaped scope';
 EXECUTE middle_definition;
 EXECUTE 'DROP OPERATOR fixture_scope_helpers.=== (text,text)';
 EXECUTE 'DROP FUNCTION fixture_scope_helpers.equivalent(text,text)';
 ASSERT before_hash=public.zoho_job_trigger_fingerprint();

 -- Expression dependencies from an index must include its function.
 EXECUTE 'CREATE FUNCTION fixture_scope_helpers.index_key(text) RETURNS text IMMUTABLE LANGUAGE sql AS ''SELECT lower($1)''';
 EXECUTE 'CREATE INDEX fixture_scope_expression ON public.opportunities(fixture_scope_helpers.index_key(title))';
 ASSERT before_hash IS DISTINCT FROM public.zoho_job_trigger_fingerprint(),'Expression index escaped scope';
 ASSERT EXISTS(SELECT 1 FROM public.zoho_job_executable_surface() s WHERE s.kind='routine' AND s.name='fixture_scope_helpers.index_key(text)');
 EXECUTE 'DROP INDEX public.fixture_scope_expression';
 EXECUTE 'DROP FUNCTION fixture_scope_helpers.index_key(text)';
 ASSERT before_hash=public.zoho_job_trigger_fingerprint();

 -- Index operator classes must bring their support implementation into scope.
 EXECUTE 'CREATE FUNCTION fixture_scope_helpers.compare(text,text) RETURNS integer IMMUTABLE LANGUAGE sql AS ''SELECT CASE WHEN $1<$2 THEN -1 WHEN $1=$2 THEN 0 ELSE 1 END''';
 EXECUTE 'CREATE OPERATOR CLASS fixture_scope_helpers.text_order FOR TYPE text USING btree AS OPERATOR 1 < (text,text), OPERATOR 2 <= (text,text), OPERATOR 3 = (text,text), OPERATOR 4 >= (text,text), OPERATOR 5 > (text,text), FUNCTION 1 fixture_scope_helpers.compare(text,text)';
 EXECUTE 'CREATE INDEX fixture_scope_order ON public.opportunities(title fixture_scope_helpers.text_order)';
 wired_hash:=public.zoho_job_trigger_fingerprint();
 ASSERT EXISTS(SELECT 1 FROM public.zoho_job_executable_surface() s WHERE s.kind='opclass' AND s.name='fixture_scope_helpers.text_order');
 ASSERT EXISTS(SELECT 1 FROM public.zoho_job_executable_surface() s WHERE s.kind='routine' AND s.name='fixture_scope_helpers.compare(text,text)');
 EXECUTE 'CREATE OR REPLACE FUNCTION fixture_scope_helpers.compare(text,text) RETURNS integer IMMUTABLE LANGUAGE sql AS ''SELECT 0''';
 ASSERT wired_hash IS DISTINCT FROM public.zoho_job_trigger_fingerprint(),'Index support helper drift escaped scope';
 EXECUTE 'DROP INDEX public.fixture_scope_order';
 EXECUTE 'DROP OPERATOR CLASS fixture_scope_helpers.text_order USING btree';
 EXECUTE 'DROP OPERATOR FAMILY fixture_scope_helpers.text_order USING btree';
 EXECUTE 'DROP FUNCTION fixture_scope_helpers.compare(text,text)';
 ASSERT before_hash=public.zoho_job_trigger_fingerprint();

 -- Identity sequence configuration is not represented by a DEFAULT expression.
 EXECUTE 'ALTER TABLE public.opportunities ADD COLUMN fixture_identity bigint GENERATED BY DEFAULT AS IDENTITY';
 wired_hash:=public.zoho_job_trigger_fingerprint();
 EXECUTE 'ALTER SEQUENCE public.opportunities_fixture_identity_seq INCREMENT BY 2';
 ASSERT wired_hash IS DISTINCT FROM public.zoho_job_trigger_fingerprint(),'Identity sequence drift escaped scope';
 EXECUTE 'ALTER TABLE public.opportunities DROP COLUMN fixture_identity';
 ASSERT before_hash=public.zoho_job_trigger_fingerprint();

 -- Unresolvable runtime SQL is denied, never certified from partial dependencies.
 EXECUTE 'CREATE OR REPLACE FUNCTION fixture_scope_helpers.leaf() RETURNS void LANGUAGE plpgsql AS $b$ BEGIN EXECUTE ''SELECT 1''; END $b$';
 BEGIN
  PERFORM public.zoho_job_trigger_fingerprint();
  RAISE EXCEPTION 'Dynamic SQL accepted';
 EXCEPTION WHEN SQLSTATE 'ZJ001' THEN NULL; END;
 EXECUTE 'CREATE OR REPLACE FUNCTION fixture_scope_helpers.leaf() RETURNS void LANGUAGE plpgsql AS $b$ BEGIN EXECUTE/**/''SELECT 1''; END $b$';
 BEGIN
  PERFORM public.zoho_job_trigger_fingerprint();
  RAISE EXCEPTION 'Comment-separated dynamic statement accepted';
 EXCEPTION WHEN SQLSTATE 'ZJ001' THEN NULL; END;
 EXECUTE original;
 ASSERT before_hash=public.zoho_job_trigger_fingerprint();
 ASSERT public.zoho_job_publisher_ready();
 ASSERT NOT has_function_privilege('service_role','public.zoho_job_sql_tokens(text)','EXECUTE');
 ASSERT NOT has_function_privilege('service_role','public.zoho_job_write_targets(oid)','EXECUTE');
 ASSERT NOT has_function_privilege('service_role','public.zoho_job_body_references(oid)','EXECUTE');
 ASSERT NOT has_function_privilege('service_role','public.zoho_job_has_dynamic_sql(text)','EXECUTE');
 ASSERT NOT has_function_privilege('service_role','public.zoho_job_dependency_objects()','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','public.zoho_job_dependency_objects()','EXECUTE');
 ASSERT NOT has_function_privilege('anon','public.zoho_job_dependency_objects()','EXECUTE');
END $$;
ROLLBACK;
