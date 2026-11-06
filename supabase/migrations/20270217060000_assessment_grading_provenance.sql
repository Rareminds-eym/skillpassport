BEGIN;
-- No RLS: question keys have server writers and receipts have a service-only
-- capability. Existing AI reports and psychometric ratings stay advisory.
CREATE TABLE public.assessment_generated_question_authority (
 question_set_id uuid PRIMARY KEY REFERENCES public.career_assessment_ai_questions(id),
 questions_hash text NOT NULL CHECK(length(questions_hash)=64),
 source text NOT NULL CHECK(source='server_generation'), created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE public.assessment_grading_receipts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), attempt_id uuid NOT NULL UNIQUE REFERENCES public.personal_assessment_attempts(id),
 learner_id uuid NOT NULL REFERENCES public.learners(id), version integer NOT NULL DEFAULT 1 CHECK(version=1),
 answers_hash text NOT NULL CHECK(length(answers_hash)=64), questions_hash text NOT NULL CHECK(length(questions_hash)=64),
 question_snapshot jsonb NOT NULL, objective_scores jsonb NOT NULL,
 status text NOT NULL CHECK(status IN('unavailable','partial','complete')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE public.assessment_attempt_question_manifest (
 attempt_id uuid NOT NULL REFERENCES public.personal_assessment_attempts(id), answer_id text NOT NULL CHECK(length(answer_id) BETWEEN 1 AND 200),
 source text NOT NULL CHECK(source IN('catalog','server_generated')), section text NOT NULL CHECK(section IN('aptitude','knowledge')),
 section_id uuid, correct_answer jsonb NOT NULL, question_data jsonb NOT NULL, source_hash text NOT NULL CHECK(length(source_hash)=64),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), PRIMARY KEY(attempt_id,answer_id)
);
ALTER TABLE public.personal_assessment_results ADD COLUMN grading_receipt_id uuid REFERENCES public.assessment_grading_receipts(id),
 ADD COLUMN grading_provenance jsonb NOT NULL DEFAULT '{"objective":"unavailable","subjective":"advisory_unverified"}';
REVOKE ALL ON public.assessment_generated_question_authority,public.assessment_grading_receipts FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,INSERT ON public.assessment_generated_question_authority,public.assessment_grading_receipts TO service_role;
REVOKE ALL ON public.assessment_attempt_question_manifest FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,INSERT ON public.assessment_attempt_question_manifest TO service_role;
GRANT SELECT,INSERT ON public.career_assessment_ai_questions TO service_role;
REVOKE INSERT,UPDATE,DELETE ON public.career_assessment_ai_questions,public.personal_assessment_questions,
 public.personal_assessment_results,public.personal_assessment_attempts,public.personal_assessment_responses FROM PUBLIC,anon,authenticated;
REVOKE SELECT ON public.personal_assessment_questions,public.career_assessment_ai_questions FROM PUBLIC,anon,authenticated;

-- The authenticated router is not a boundary while browser roles can read
-- stored keys or forge sessions/results directly through PostgREST. Revoke
-- table AND column grants on every dependent view, retaining service access.
DO $$ DECLARE object record; column_row record; capability record;
BEGIN
 FOR object IN WITH RECURSIVE protected(oid) AS(
  SELECT c.oid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN(
   'adaptive_aptitude_sessions','adaptive_aptitude_responses','adaptive_aptitude_results','adaptive_aptitude_questions_cache')
  UNION SELECT r.ev_class FROM protected p JOIN pg_depend d ON d.refobjid=p.oid AND d.refclassid='pg_class'::regclass
   AND d.classid='pg_rewrite'::regclass JOIN pg_rewrite r ON r.oid=d.objid WHERE r.ev_class<>p.oid)
  SELECT c.oid,n.nspname,c.relname FROM protected p JOIN pg_class c ON c.oid=p.oid JOIN pg_namespace n ON n.oid=c.relnamespace LOOP
  EXECUTE format('REVOKE ALL ON TABLE %I.%I FROM PUBLIC,anon,authenticated',object.nspname,object.relname);
  FOR column_row IN SELECT attname FROM pg_attribute WHERE attrelid=object.oid AND attnum>0 AND NOT attisdropped LOOP
   EXECUTE format('REVOKE SELECT (%1$I),INSERT (%1$I),UPDATE (%1$I),REFERENCES (%1$I) ON TABLE %2$I.%3$I FROM PUBLIC,anon,authenticated',column_row.attname,object.nspname,object.relname);
  END LOOP;
 END LOOP;
 -- These baseline SECURITY DEFINER functions bypass table ACLs. Their
 -- server implementations remain available, but no browser overload may run.
 FOR capability IN SELECT p.oid::regprocedure identity FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.prokind='f' AND p.proname IN('append_adaptive_response','calculate_session_stats','get_available_questions','update_question_usage','commit_owned_adaptive_answer') LOOP
  EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',capability.identity);
  EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',capability.identity);
 END LOOP;
END $$;
CREATE FUNCTION public.assert_private_adaptive_assessment_grants() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF EXISTS(WITH RECURSIVE protected(oid) AS(
  SELECT c.oid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN(
   'adaptive_aptitude_sessions','adaptive_aptitude_responses','adaptive_aptitude_results','adaptive_aptitude_questions_cache')
  UNION SELECT r.ev_class FROM protected p JOIN pg_depend d ON d.refobjid=p.oid AND d.refclassid='pg_class'::regclass
   AND d.classid='pg_rewrite'::regclass JOIN pg_rewrite r ON r.oid=d.objid WHERE r.ev_class<>p.oid)
  SELECT 1 FROM protected p CROSS JOIN(VALUES('anon'),('authenticated')) browser(role)
  WHERE has_table_privilege(browser.role,p.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
   OR has_any_column_privilege(browser.role,p.oid,'SELECT,INSERT,UPDATE,REFERENCES'))
  OR EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace CROSS JOIN(VALUES('anon'),('authenticated')) browser(role)
   WHERE n.nspname='public' AND p.prokind='f' AND p.proname IN('append_adaptive_response','calculate_session_stats','get_available_questions','update_question_usage','commit_owned_adaptive_answer')
    AND has_function_privilege(browser.role,p.oid,'EXECUTE')) THEN
  RAISE EXCEPTION 'Adaptive assessment requires server-only grants' USING ERRCODE='42501';
 END IF;
END $$;
REVOKE ALL ON FUNCTION public.assert_private_adaptive_assessment_grants() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.assert_private_adaptive_assessment_grants() TO service_role;
SELECT public.assert_private_adaptive_assessment_grants();

-- Restore/repair drift never lets an old receipt certify a new answer version.
-- The immutable receipt remains for audit; the current result loses its link.
CREATE FUNCTION public.invalidate_assessment_grading_on_answer_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE target uuid;
BEGIN
 IF TG_TABLE_NAME='personal_assessment_attempts' THEN target:=NEW.id;
 ELSIF TG_OP='DELETE' THEN target:=OLD.attempt_id;
 ELSE target:=NEW.attempt_id; END IF;
 UPDATE public.personal_assessment_results SET grading_receipt_id=NULL,
  grading_provenance='{"objective":"unavailable","subjective":"advisory_unverified","reason":"persisted_answers_changed"}'
  WHERE attempt_id=target AND grading_receipt_id IS NOT NULL;
 IF TG_TABLE_NAME='personal_assessment_responses' THEN
  IF TG_OP='UPDATE' AND OLD.attempt_id IS DISTINCT FROM NEW.attempt_id THEN
   UPDATE public.personal_assessment_results SET grading_receipt_id=NULL,
    grading_provenance='{"objective":"unavailable","subjective":"advisory_unverified","reason":"persisted_answers_changed"}'
    WHERE attempt_id=OLD.attempt_id AND grading_receipt_id IS NOT NULL;
  END IF;
 END IF;
 RETURN NULL;
END $$;
CREATE TRIGGER invalidate_assessment_attempt_grading AFTER UPDATE OF all_responses ON public.personal_assessment_attempts
 FOR EACH ROW WHEN(OLD.all_responses IS DISTINCT FROM NEW.all_responses) EXECUTE FUNCTION public.invalidate_assessment_grading_on_answer_change();
CREATE TRIGGER invalidate_assessment_response_grading AFTER INSERT OR UPDATE OR DELETE ON public.personal_assessment_responses
 FOR EACH ROW EXECUTE FUNCTION public.invalidate_assessment_grading_on_answer_change();
REVOKE ALL ON FUNCTION public.invalidate_assessment_grading_on_answer_change() FROM PUBLIC,anon,authenticated;

-- Only server generation endpoints call this service-role RPC. Client question
-- upload endpoints are rejected; no historical set is backfilled as trusted.
CREATE OR REPLACE FUNCTION public.get_or_create_shared_questions(p_stream_id text,p_grade_level text,p_question_type text,p_questions jsonb,p_learner_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE existing_questions jsonb; new_id uuid;
BEGIN
 IF p_question_type NOT IN('aptitude','knowledge') OR p_question_type IS NULL OR jsonb_typeof(p_questions) IS DISTINCT FROM 'array'
  OR jsonb_array_length(p_questions) NOT BETWEEN 1 AND 500 OR octet_length(p_questions::text)>1048576 THEN
  RAISE EXCEPTION 'Invalid generated question set' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM public.personal_assessment_streams WHERE id=p_stream_id AND grade_level=p_grade_level AND is_active;
 IF NOT FOUND THEN RAISE EXCEPTION 'Invalid generation context' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtext(p_stream_id||'|'||p_grade_level||'|'||p_question_type));
 SELECT questions INTO existing_questions FROM public.career_assessment_ai_questions WHERE stream_id=p_stream_id AND grade_level=p_grade_level
  AND question_type=p_question_type AND learner_id IS NULL AND is_active ORDER BY created_at,id LIMIT 1;
 IF existing_questions IS NOT NULL THEN RETURN jsonb_build_object('questions',existing_questions,'is_new',false); END IF;
 INSERT INTO public.career_assessment_ai_questions(stream_id,grade_level,question_type,questions,learner_id,is_active)
  VALUES(p_stream_id,p_grade_level,p_question_type,p_questions,NULL,true) RETURNING id INTO new_id;
 INSERT INTO public.assessment_generated_question_authority(question_set_id,questions_hash,source)
  VALUES(new_id,encode(sha256(convert_to(p_questions::text,'UTF8')),'hex'),'server_generation');
 RETURN jsonb_build_object('questions',p_questions,'is_new',true);
END $$;
REVOKE ALL ON FUNCTION public.get_or_create_shared_questions(text,text,text,jsonb,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_shared_questions(text,text,text,jsonb,uuid) TO service_role;

CREATE FUNCTION public.snapshot_owned_assessment_catalog(p_owner uuid,p_attempt uuid,p_section uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE learner uuid; attempt public.personal_assessment_attempts; section_row public.personal_assessment_sections;
 q public.personal_assessment_questions; manifest public.assessment_attempt_question_manifest;
 questions jsonb; data jsonb; objective_section text; bound boolean:=false;
BEGIN
 BEGIN SELECT id INTO STRICT learner FROM public.learners WHERE user_id=p_owner FOR SHARE;
 EXCEPTION WHEN NO_DATA_FOUND THEN RETURN NULL; END;
 SELECT * INTO attempt FROM public.personal_assessment_attempts WHERE id=p_attempt AND learner_id=learner FOR UPDATE;
 IF NOT FOUND THEN RETURN NULL; END IF;
 SELECT * INTO section_row FROM public.personal_assessment_sections WHERE id=p_section AND is_active
  AND grade_level IN(CASE WHEN attempt.grade_level='higher_secondary' THEN 'highschool' ELSE attempt.grade_level END,'general');
 IF NOT FOUND THEN RETURN NULL; END IF;
 SELECT coalesce(jsonb_agg(question_data ORDER BY answer_id),'[]') INTO questions FROM public.assessment_attempt_question_manifest
  WHERE attempt_id=attempt.id AND section_id=p_section;
 bound:=jsonb_array_length(questions)>0;
 objective_section:=CASE WHEN section_row.name LIKE '%knowledge%' THEN 'knowledge' WHEN section_row.name LIKE '%aptitude%' THEN 'aptitude' END;
 FOR q IN SELECT * FROM public.personal_assessment_questions WHERE section_id=p_section AND is_active
  AND (CASE WHEN section_row.is_stream_specific THEN stream_id=attempt.stream_id ELSE stream_id IS NULL END) ORDER BY order_number,id LOOP
  SELECT * INTO manifest FROM public.assessment_attempt_question_manifest WHERE attempt_id=attempt.id AND answer_id=q.id::text;
  IF FOUND THEN CONTINUE; END IF;
  data:=to_jsonb(q);
  IF objective_section IS NOT NULL AND jsonb_typeof(q.correct_answer) IN('string','number') AND attempt.status='in_progress'
   AND NOT (coalesce(attempt.all_responses,'{}') ? q.id::text) AND NOT EXISTS(SELECT 1 FROM public.personal_assessment_responses WHERE attempt_id=attempt.id AND question_id=q.id) THEN
   IF (SELECT count(*) FROM public.assessment_attempt_question_manifest WHERE attempt_id=attempt.id)>=1000 THEN RAISE EXCEPTION 'Question manifest budget exceeded' USING ERRCODE='P0001'; END IF;
   INSERT INTO public.assessment_attempt_question_manifest(attempt_id,answer_id,source,section,section_id,correct_answer,question_data,source_hash)
    VALUES(attempt.id,q.id::text,'catalog',objective_section,p_section,q.correct_answer,data,encode(sha256(convert_to(data::text,'UTF8')),'hex'));
   bound:=true;
  END IF;
  questions:=questions||jsonb_build_array(data);
 END LOOP;
 RETURN jsonb_build_object('questions',questions,'bound',bound);
END $$;

CREATE FUNCTION public.snapshot_generated_assessment_questions(p_owner uuid,p_attempt uuid,p_stream text,p_type text) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE learner uuid; attempt public.personal_assessment_attempts; generated public.career_assessment_ai_questions;
 manifest public.assessment_attempt_question_manifest; grade text; entry jsonb; questions jsonb:='[]'; expected jsonb; candidate_answer_id text;
 trusted boolean:=false; bound boolean:=false; source_hash text;
BEGIN
 BEGIN SELECT id INTO STRICT learner FROM public.learners WHERE user_id=p_owner FOR SHARE;
 EXCEPTION WHEN NO_DATA_FOUND THEN RETURN NULL; END;
 SELECT * INTO attempt FROM public.personal_assessment_attempts WHERE id=p_attempt AND learner_id=learner FOR UPDATE;
 IF NOT FOUND THEN RETURN NULL; END IF;
 IF p_type IS NULL OR p_type NOT IN('aptitude','knowledge') OR p_stream IS DISTINCT FROM attempt.stream_id THEN RAISE EXCEPTION 'Question context mismatch' USING ERRCODE='22023'; END IF;
 SELECT grade_level INTO grade FROM public.personal_assessment_streams WHERE id=p_stream AND is_active;
 IF NOT FOUND THEN RAISE EXCEPTION 'Question stream unavailable' USING ERRCODE='22023'; END IF;
 SELECT * INTO generated FROM public.career_assessment_ai_questions WHERE stream_id=p_stream AND grade_level=grade
  AND question_type=p_type AND learner_id IS NULL AND is_active ORDER BY created_at,id LIMIT 1;
 IF NOT FOUND OR jsonb_typeof(generated.questions) IS DISTINCT FROM 'array' THEN RETURN jsonb_build_object('questions','[]'::jsonb,'bound',false); END IF;
 source_hash:=encode(sha256(convert_to(generated.questions::text,'UTF8')),'hex');
 trusted:=EXISTS(SELECT 1 FROM public.assessment_generated_question_authority WHERE question_set_id=generated.id AND questions_hash=source_hash);
 FOR entry IN SELECT * FROM jsonb_array_elements(generated.questions) LOOP
  candidate_answer_id:=entry->>'id'; expected:=coalesce(nullif(entry->'correct_answer','null'),nullif(entry->'correctAnswer','null'),nullif(entry->'correct','null'));
  IF length(coalesce(candidate_answer_id,'')) NOT BETWEEN 1 AND 200 THEN questions:=questions||jsonb_build_array(entry); CONTINUE; END IF;
  SELECT * INTO manifest FROM public.assessment_attempt_question_manifest m WHERE m.attempt_id=attempt.id AND m.answer_id=candidate_answer_id;
  IF FOUND THEN
   IF manifest.source<>'server_generated' OR manifest.section<>p_type THEN RAISE EXCEPTION 'Question manifest identity conflict' USING ERRCODE='P0001'; END IF;
   questions:=questions||jsonb_build_array(manifest.question_data); bound:=true; CONTINUE;
  END IF;
  IF trusted AND attempt.status='in_progress' AND jsonb_typeof(expected) IN('string','number')
   AND NOT (coalesce(attempt.all_responses,'{}') ? candidate_answer_id) AND NOT EXISTS(SELECT 1 FROM public.personal_assessment_responses WHERE attempt_id=attempt.id AND question_id::text=candidate_answer_id) THEN
   IF (SELECT count(*) FROM public.assessment_attempt_question_manifest WHERE attempt_id=attempt.id)>=1000 THEN RAISE EXCEPTION 'Question manifest budget exceeded' USING ERRCODE='P0001'; END IF;
   INSERT INTO public.assessment_attempt_question_manifest(attempt_id,answer_id,source,section,correct_answer,question_data,source_hash)
    VALUES(attempt.id,candidate_answer_id,'server_generated',p_type,expected,entry,source_hash);
   bound:=true;
  END IF;
  questions:=questions||jsonb_build_array(entry);
 END LOOP;
 RETURN jsonb_build_object('questions',questions,'bound',bound);
END $$;
REVOKE ALL ON FUNCTION public.snapshot_owned_assessment_catalog(uuid,uuid,uuid),public.snapshot_generated_assessment_questions(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.snapshot_owned_assessment_catalog(uuid,uuid,uuid),public.snapshot_generated_assessment_questions(uuid,uuid,text,text) TO service_role;

-- Exact scalar option comparison only. A client-supplied correctness/key inside
-- an answer object has no authority. No semantic/AI guess can award a mark.
CREATE FUNCTION public.assessment_scalar_answer(p_value jsonb) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path=pg_catalog,public AS $$
 SELECT CASE WHEN jsonb_typeof(p_value) IN('string','number') THEN trim(p_value#>>'{}')
  WHEN jsonb_typeof(p_value)='object' AND jsonb_typeof(p_value->'answer') IN('string','number') THEN trim(p_value->>'answer')
  WHEN jsonb_typeof(p_value)='object' AND jsonb_typeof(p_value->'selectedAnswer') IN('string','number') THEN trim(p_value->>'selectedAnswer')
  ELSE NULL END
$$;

CREATE FUNCTION public.grade_owned_assessment(p_owner uuid,p_attempt uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE learner uuid; attempt public.personal_assessment_attempts; existing public.assessment_grading_receipts;
 answers jsonb; snapshot jsonb; scores jsonb; answers_hash text; questions_hash text; receipt uuid;
 q jsonb; section text; answer text; expected text; totals jsonb:='{}'; counts jsonb:='{}'; rights jsonb:='{}';
 total integer:=0; answered integer:=0; correct integer:=0; n integer; a integer; r integer; grade text; state text; ambiguous boolean:=false;
BEGIN
 BEGIN SELECT id INTO STRICT learner FROM public.learners WHERE user_id=p_owner FOR SHARE;
 EXCEPTION WHEN NO_DATA_FOUND THEN RETURN NULL; END;
 SELECT * INTO attempt FROM public.personal_assessment_attempts WHERE id=p_attempt AND learner_id=learner FOR UPDATE;
 IF NOT FOUND THEN RETURN NULL; END IF;
 IF attempt.status IS DISTINCT FROM 'completed' THEN RAISE EXCEPTION 'Completed owned attempt required' USING ERRCODE='P0001'; END IF;
 answers:=coalesce(attempt.all_responses,'{}');
 IF jsonb_typeof(answers)<>'object' THEN RAISE EXCEPTION 'Invalid persisted answers' USING ERRCODE='P0001'; END IF;
 SELECT answers||coalesce(jsonb_object_agg(question_id::text,response_value),'{}') INTO answers FROM public.personal_assessment_responses WHERE attempt_id=attempt.id;
 answers_hash:=encode(sha256(convert_to(answers::text,'UTF8')),'hex');
 -- The attempt lock serializes grading. Receipts are immutable and do not
 -- require UPDATE privilege or a row lock merely to verify an existing one.
 SELECT * INTO existing FROM public.assessment_grading_receipts WHERE attempt_id=attempt.id;
 IF FOUND THEN
  IF existing.learner_id<>learner OR existing.answers_hash<>answers_hash THEN RAISE EXCEPTION 'Graded answer version changed' USING ERRCODE='P0001'; END IF;
  UPDATE public.personal_assessment_results SET grading_receipt_id=existing.id,grading_provenance=jsonb_build_object('objective',
   CASE WHEN existing.status<>'unavailable' THEN 'server_graded' ELSE 'unavailable' END,'subjective','advisory_unverified',
   'receiptId',existing.id,'version',existing.version,'status',existing.status) WHERE attempt_id=attempt.id AND learner_id=learner;
  RETURN jsonb_build_object('receiptId',existing.id,'status',existing.status,'version',existing.version);
 END IF;
 -- Only the immutable manifest captured during authenticated question
 -- delivery is gradeable. Matching a historical answer to today's catalog is
 -- never sufficient provenance.
 SELECT coalesce(jsonb_agg(jsonb_build_object('source',m.source,'questionId',m.answer_id,'answerId',m.answer_id,
  'section',m.section,'correct',m.correct_answer,'sourceHash',m.source_hash) ORDER BY m.answer_id),'[]') INTO snapshot
  FROM public.assessment_attempt_question_manifest m WHERE m.attempt_id=attempt.id;
 IF jsonb_array_length(snapshot)>1000 THEN RAISE EXCEPTION 'Question grading budget exceeded' USING ERRCODE='P0001'; END IF;
 -- Duplicate answer IDs across different keys cannot safely be attributed.
 ambiguous:=EXISTS(SELECT 1 FROM jsonb_array_elements(snapshot) item GROUP BY item->>'answerId' HAVING count(*)>1);
 FOR q IN SELECT * FROM jsonb_array_elements(snapshot) LOOP
  IF (SELECT count(*) FROM jsonb_array_elements(snapshot) item WHERE item->>'answerId'=q->>'answerId')>1 THEN CONTINUE; END IF;
  section:=q->>'section'; expected:=public.assessment_scalar_answer(q->'correct'); answer:=public.assessment_scalar_answer(answers->(q->>'answerId'));
  total:=total+1; totals:=jsonb_set(totals,ARRAY[section],to_jsonb(coalesce((totals->>section)::integer,0)+1));
  IF answer IS NOT NULL THEN
   answered:=answered+1; counts:=jsonb_set(counts,ARRAY[section],to_jsonb(coalesce((counts->>section)::integer,0)+1));
   IF answer=expected THEN correct:=correct+1; rights:=jsonb_set(rights,ARRAY[section],to_jsonb(coalesce((rights->>section)::integer,0)+1)); END IF;
  END IF;
 END LOOP;
 scores:='{}';
 FOREACH section IN ARRAY ARRAY['aptitude','knowledge'] LOOP
  n:=coalesce((totals->>section)::integer,0); a:=coalesce((counts->>section)::integer,0); r:=coalesce((rights->>section)::integer,0);
  IF n>0 THEN scores:=scores||jsonb_build_object(section,jsonb_build_object('correct',r,'answered',a,'total',n,'percentage',round(100.0*r/n))); END IF;
 END LOOP;
 IF ambiguous THEN scores:=scores||jsonb_build_object('ungradedReason','ambiguous_question_identity'); END IF;
 state:=CASE WHEN answered=0 THEN 'unavailable' WHEN answered=total AND NOT ambiguous THEN 'complete' ELSE 'partial' END;
 questions_hash:=encode(sha256(convert_to(snapshot::text,'UTF8')),'hex');
 INSERT INTO public.assessment_grading_receipts(attempt_id,learner_id,answers_hash,questions_hash,question_snapshot,objective_scores,status)
  VALUES(attempt.id,learner,answers_hash,questions_hash,snapshot,scores,state) RETURNING id INTO receipt;
 UPDATE public.personal_assessment_results SET grading_receipt_id=receipt,grading_provenance=jsonb_build_object('objective',
  CASE WHEN answered>0 THEN 'server_graded' ELSE 'unavailable' END,'subjective','advisory_unverified','receiptId',receipt,'version',1,'status',state)
  WHERE attempt_id=attempt.id AND learner_id=learner;
 RETURN jsonb_build_object('receiptId',receipt,'status',state,'version',1);
END $$;
REVOKE ALL ON FUNCTION public.assessment_scalar_answer(jsonb),public.grade_owned_assessment(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.assessment_scalar_answer(jsonb),public.grade_owned_assessment(uuid,uuid) TO service_role;

-- Preserve the existing compatibility contract while grading the same locked
-- persisted answer version in the finalization transaction. Raw reports remain
-- advisory; a browser cannot submit a receipt or a trusted score.
ALTER FUNCTION public.finalize_owned_assessment(uuid,uuid,text,jsonb) RENAME TO finalize_owned_assessment_advisory;
CREATE FUNCTION public.finalize_owned_assessment(p_owner uuid,p_attempt uuid,p_action text,p_payload jsonb DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE result jsonb; grading jsonb;
BEGIN
 result:=public.finalize_owned_assessment_advisory(p_owner,p_attempt,p_action,p_payload);
 IF result IS NULL THEN RETURN NULL; END IF;
 grading:=public.grade_owned_assessment(p_owner,p_attempt);
 IF grading IS NULL THEN RAISE EXCEPTION 'Grading owner changed' USING ERRCODE='P0001'; END IF;
 RETURN result||jsonb_build_object('grading',grading);
END $$;
REVOKE ALL ON FUNCTION public.finalize_owned_assessment(uuid,uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_owned_assessment(uuid,uuid,text,jsonb) TO service_role;
COMMIT;
