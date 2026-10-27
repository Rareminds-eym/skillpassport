-- Synthetic fixtures in one transaction. No historical conversion or model calls.
BEGIN;
DO $$
DECLARE subject uuid:=gen_random_uuid(); stranger uuid:=gen_random_uuid(); learner uuid:=gen_random_uuid(); other_learner uuid:=gen_random_uuid();
 level uuid:=gen_random_uuid(); job uuid:=gen_random_uuid(); source uuid:=gen_random_uuid(); duplicate_source uuid:=gen_random_uuid(); foreign_source uuid:=gen_random_uuid(); cert uuid:=gen_random_uuid();
 req jsonb; result jsonb; item public.learning_equivalencies; approved public.learning_equivalencies; evidence text:=repeat('Implemented and tested a real capability with documented outcomes. ',5);
 org uuid:=gen_random_uuid(); human_request uuid; before_work bigint; before_version bigint; proof uuid;
BEGIN
 INSERT INTO public.users(id,email,role) VALUES(subject,subject||'@normalize.invalid','learner'),(stranger,stranger||'@normalize.invalid','learner');
 INSERT INTO public.learners(id,user_id,email,learner_type) VALUES(learner,subject,subject||'@normalize.invalid','independent'),(other_learner,stranger,stranger||'@normalize.invalid','independent');
 INSERT INTO public.job_learning_catalog(level_id,capability_id,capability_name,title,level_number,version,fingerprint) VALUES(level,gen_random_uuid(),'Fixture capability','Published fixture',1,1,repeat('c',32));
 req:=jsonb_build_array(jsonb_build_object('levelId',level,'fingerprint',repeat('c',32),'mandatory',true,'title','Forged title','capabilityName','Forged capability','levelNumber',9,'version',9));
 INSERT INTO public.opportunities(id,title,job_title,company_name,employment_type,location,department,status,is_active,learning_requirements) VALUES(job,'Normalized fixture','Normalized fixture','Fixture employer','Full-time','Remote','Engineering','open',true,req);
 IF NOT EXISTS(SELECT 1 FROM public.opportunity_learning_requirements WHERE opportunity_id=job AND level_id=level AND requirement_kind='mandatory' AND position=0) THEN RAISE EXCEPTION 'FAIL: requirement relationship missing'; END IF;
 IF (SELECT learning_requirements_format<>2 OR learning_requirements->0->>'title'<>'Published fixture' FROM public.opportunities WHERE id=job) THEN RAISE EXCEPTION 'FAIL: canonical projection'; END IF;
 SELECT learning_requirements_version INTO before_version FROM public.opportunities WHERE id=job;
 SELECT count(*) INTO before_work FROM public.learning_job_notification_work WHERE opportunity_id=job;
 UPDATE public.opportunities SET learning_requirements=jsonb_set(learning_requirements,'{0,title}','"Another forged label"') WHERE id=job;
 IF (SELECT learning_requirements_version FROM public.opportunities WHERE id=job)<>before_version OR (SELECT count(*) FROM public.learning_job_notification_work WHERE opportunity_id=job)<>before_work THEN RAISE EXCEPTION 'FAIL: label-only edit changed version or notifications'; END IF;
 BEGIN
  UPDATE public.opportunities SET learning_requirements=jsonb_set(learning_requirements,'{0,mandatory}','false'),learning_requirements_version=0 WHERE id=job;
  RAISE EXCEPTION 'FAIL: stale requirement edit accepted';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 UPDATE public.opportunities SET learning_requirements=jsonb_set(learning_requirements,'{0,mandatory}','false') WHERE id=job;
 IF NOT EXISTS(SELECT 1 FROM public.opportunity_learning_requirements WHERE opportunity_id=job AND requirement_kind='preferred') THEN RAISE EXCEPTION 'FAIL: preference update not atomic'; END IF;
 INSERT INTO public.applied_jobs(learner_id,opportunity_id,application_status) VALUES(learner,job,'applied');
 DELETE FROM public.applied_jobs WHERE learner_id=learner AND opportunity_id=job;
 UPDATE public.opportunities SET learning_requirements=jsonb_set(learning_requirements,'{0,mandatory}','true') WHERE id=job;
 BEGIN
  INSERT INTO public.applied_jobs(learner_id,opportunity_id,application_status) VALUES(learner,job,'applied');
  RAISE EXCEPTION 'FAIL: normalized mandatory requirement bypassed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 INSERT INTO public.projects(id,learner_id,title,description) VALUES(source,learner,'Own assessed work',evidence),(duplicate_source,learner,'Copied title',evidence),(foreign_source,other_learner,'Foreign work',evidence);
 BEGIN
  PERFORM public.submit_learning_equivalency(subject,level,repeat('c',32),'project',foreign_source);
  RAISE EXCEPTION 'FAIL: foreign evidence accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 result:=public.submit_learning_equivalency(subject,level,repeat('c',32),'project',source);
 SELECT * INTO item FROM public.learning_equivalencies WHERE id=(result->'item'->>'id')::uuid;
 IF item.evidence_format<>2 OR item.source_revision<>1 OR item.title IS NOT NULL OR item.description IS NOT NULL OR item.evidence_content IS NOT NULL OR item.assessed_evidence->>'content'<>trim(evidence) THEN RAISE EXCEPTION 'FAIL: source snapshot/storage shape'; END IF;
 result:=public.submit_learning_equivalency(subject,level,repeat('c',32),'project',duplicate_source);
 IF result->>'duplicate'<>'true' OR (result->'item'->>'id')::uuid<>item.id THEN RAISE EXCEPTION 'FAIL: duplicate source record escaped evidence dedupe'; END IF;
 BEGIN
  UPDATE public.learning_equivalencies SET assessed_evidence='{}' WHERE id=item.id;
  RAISE EXCEPTION 'FAIL: assessed content mutable';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 approved:=public.claim_learning_ai_equivalency(item.id,subject,item.version);
 approved:=public.record_learning_ai_equivalency(approved.id,subject,approved.version,'approved','Demonstrated outcomes','fixture-model',95);
 IF NOT EXISTS(SELECT 1 FROM public.learning_equivalency_audit WHERE equivalency_id=approved.id AND evaluation_model='fixture-model' AND evaluation_score=95 AND source_revision=1 AND evaluation_type='ai') THEN RAISE EXCEPTION 'FAIL: typed audit provenance missing'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.approved_learning_equivalencies(learner,'ai',0) WHERE id=item.id) THEN RAISE EXCEPTION 'FAIL: current approved evidence missing'; END IF;
 -- Unrelated timestamp/embedding changes do not revoke a source decision.
 UPDATE public.projects SET updated_at=now()+interval '1 second',pending_edit_data=jsonb_build_object('title','Unsaved draft') WHERE id=source;
 IF (SELECT status FROM public.learning_equivalencies WHERE id=item.id)<>'approved' THEN RAISE EXCEPTION 'FAIL: timestamp-only update invalidated evidence'; END IF;
 INSERT INTO public.job_application_verifications(learner_id,user_id,opportunity_id,requirements_version,evidence)
 SELECT learner,subject,job,learning_requirements_version,jsonb_build_object('evaluationPolicy','ai','criteria',jsonb_build_array(jsonb_build_object('levelId',level,'fingerprint',repeat('c',32),'mandatory',true,'status','eligible','evidence',jsonb_build_array(jsonb_build_object('equivalencyId',approved.id,'version',approved.version))))) FROM public.opportunities WHERE id=job RETURNING id INTO proof;
 INSERT INTO public.applied_jobs(learner_id,opportunity_id,application_status,learning_verification_id) VALUES(learner,job,'applied',proof);
 DELETE FROM public.applied_jobs WHERE learner_id=learner AND opportunity_id=job;
 UPDATE public.projects SET description=evidence||' Revised implementation.' WHERE id=source;
 IF (SELECT learning_evidence_revision FROM public.projects WHERE id=source)<>2 OR (SELECT status FROM public.learning_equivalencies WHERE id=item.id)<>'revoked' THEN RAISE EXCEPTION 'FAIL: source edit did not invalidate'; END IF;
 IF EXISTS(SELECT 1 FROM public.approved_learning_equivalencies(learner,'ai',0) WHERE id=item.id) THEN RAISE EXCEPTION 'FAIL: stale evidence counted'; END IF;
 BEGIN
  PERFORM public.record_learning_ai_equivalency(approved.id,subject,approved.version,'approved','Stale response','fixture-model',95);
  RAISE EXCEPTION 'FAIL: stale AI response approved edited evidence';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 BEGIN
  INSERT INTO public.applied_jobs(learner_id,opportunity_id,application_status,learning_verification_id) VALUES(learner,job,'applied',proof);
  RAISE EXCEPTION 'FAIL: stale evidence proof accepted';
 EXCEPTION WHEN serialization_failure OR insufficient_privilege THEN NULL; END;
 result:=public.submit_learning_equivalency(subject,level,repeat('c',32),'project',source);
 IF (result->'item'->>'id')::uuid=item.id OR result->'item'->>'source_revision'<>'2' THEN RAISE EXCEPTION 'FAIL: revised source cannot be evaluated'; END IF;
 -- An AI approval cannot stand in for institutional reviewer approval.
 item:=(SELECT e FROM public.learning_equivalencies e WHERE id=(result->'item'->>'id')::uuid);
 approved:=public.claim_learning_ai_equivalency(item.id,subject,item.version);
 approved:=public.record_learning_ai_equivalency(approved.id,subject,approved.version,'approved','Current source qualifies','fixture-model',95);
 INSERT INTO public.organizations(id,name) VALUES(org,'Policy transition fixture');
 INSERT INTO public.school_educators(user_id,school_id,account_status) VALUES(stranger,org,'active');
 UPDATE public.learners SET school_id=org WHERE id=learner;
 IF EXISTS(SELECT 1 FROM public.approved_learning_equivalencies(learner,'human',0)) THEN RAISE EXCEPTION 'FAIL: AI approval survived institutional policy as human evidence'; END IF;
 result:=public.submit_learning_equivalency(subject,level,repeat('c',32),'project',source);
 human_request:=(result->'item'->>'id')::uuid;
 IF human_request=approved.id OR result->'item'->>'evaluation_type'<>'human' THEN RAISE EXCEPTION 'FAIL: AI approval prevented institutional review request'; END IF;
 approved:=public.review_learning_equivalency(human_request,stranger,1,'approved','Reviewed actual source revision.');
 IF approved.evaluation_type<>'human' OR NOT EXISTS(SELECT 1 FROM public.approved_learning_equivalencies(learner,'human',0) WHERE id=human_request) THEN RAISE EXCEPTION 'FAIL: institution review did not qualify current evidence'; END IF;
 BEGIN
  DELETE FROM public.projects WHERE id=source;
  RAISE EXCEPTION 'FAIL: referenced assessed source deleted';
 EXCEPTION WHEN foreign_key_violation THEN NULL; END;
 INSERT INTO public.certificates(id,learner_id,title,description,expiry_date) VALUES(cert,learner,'Expired credential',evidence,current_date-1);
 BEGIN
  PERFORM public.submit_learning_equivalency(subject,level,repeat('c',32),'certificate',cert);
  RAISE EXCEPTION 'FAIL: expired certificate accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 SELECT learning_requirements_version INTO before_version FROM public.opportunities WHERE id=job;
 PERFORM public.record_learning_job_notification(learner,job,before_version);
 IF NOT EXISTS(SELECT 1 FROM public.notifications WHERE recipient_id=subject AND opportunity_id=job AND learning_requirements_version=before_version) THEN RAISE EXCEPTION 'FAIL: typed notification navigation absent'; END IF;
 DELETE FROM public.notifications WHERE recipient_id=subject AND opportunity_id=job;
 IF public.record_learning_job_notification(learner,job,before_version) THEN RAISE EXCEPTION 'FAIL: deleted notification redelivered'; END IF;
 IF has_table_privilege('service_role','public.opportunity_learning_requirements','UPDATE') OR has_function_privilege('authenticated','public.submit_learning_equivalency(uuid,uuid,text,text,uuid)','EXECUTE') THEN RAISE EXCEPTION 'FAIL: private normalized write boundary exposed'; END IF;
 RAISE NOTICE 'PASS: normalized atomic requirements, canonical labels/no-op/stale version, preferred-only apply, mandatory gate, source ownership, immutable snapshots, cross-record dedupe, edit invalidation, stale AI/application rejection, revision resubmission, expiry/deletion, durable notification dedupe, grants';
END $$;
ROLLBACK;

-- A browser role cannot clear requirements through permissive legacy job RLS.
BEGIN;
CREATE TEMP TABLE normalized_write_guard_fixture(id uuid);
DO $$ DECLARE job uuid:=gen_random_uuid(); BEGIN
 INSERT INTO public.opportunities(id,title,job_title,company_name,employment_type,location,department,learning_requirements)
 VALUES(job,'Guard fixture','Guard fixture','Fixture','Full-time','Remote','Engineering','[]');
 INSERT INTO normalized_write_guard_fixture VALUES(job);
END $$;
GRANT SELECT ON normalized_write_guard_fixture TO authenticated;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 BEGIN
  -- A shape change reaches the guard before catalogue validation.
  UPDATE public.opportunities SET learning_requirements='[{"levelId":"11111111-1111-4111-8111-111111111111","mandatory":true}]' WHERE id IN(SELECT id FROM normalized_write_guard_fixture);
  RAISE EXCEPTION 'FAIL: browser wrote learning requirements';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 RAISE NOTICE 'PASS: browser writes cannot bypass the normalized server boundary';
END $$;
RESET ROLE;
ROLLBACK;

-- Legacy representations stay readable and enforced, without copying rows.
BEGIN;
ALTER TABLE public.opportunities DISABLE TRIGGER guard_job_learning_requirements;
DO $$
DECLARE job uuid:=gen_random_uuid(); level uuid:=gen_random_uuid(); requirement jsonb; row public.opportunities;
BEGIN
 INSERT INTO public.job_learning_catalog(level_id,capability_id,capability_name,title,level_number,version,fingerprint) VALUES(level,gen_random_uuid(),'Legacy fixture','Legacy level',1,1,repeat('d',32));
 requirement:=jsonb_build_array(jsonb_build_object('levelId',level,'fingerprint',repeat('d',32),'mandatory',true,'title','Original published label','capabilityName','Legacy fixture','levelNumber',1,'version',1));
 INSERT INTO public.opportunities(id,title,job_title,company_name,employment_type,location,department,learning_requirements,learning_requirements_format) VALUES(job,'Legacy fixture','Legacy fixture','Fixture','Full-time','Remote','Engineering',requirement,1);
 ALTER TABLE public.opportunities ENABLE TRIGGER guard_job_learning_requirements;
 UPDATE public.opportunities SET description='An ordinary edit preserves existing learning criteria' WHERE id=job;
 SELECT * INTO row FROM public.opportunities WHERE id=job;
 IF row.learning_requirements_format<>1 OR row.learning_requirements<>requirement OR public.effective_job_learning_requirements(row)<>requirement OR EXISTS(SELECT 1 FROM public.opportunity_learning_requirements WHERE opportunity_id=job) THEN RAISE EXCEPTION 'FAIL: historical requirements rewritten or ignored'; END IF;
 RAISE NOTICE 'PASS: legacy job requirements preserved without historical conversion';
END $$;
ROLLBACK;

-- Expiry happens without a source revision update. Emulate the date crossing
-- only on synthetic records, leaving normal edit invalidation out of the setup.
BEGIN;
DO $$
DECLARE subject uuid:=gen_random_uuid(); learner uuid:=gen_random_uuid(); level uuid:=gen_random_uuid();
 cert uuid:=gen_random_uuid(); pending_cert uuid:=gen_random_uuid(); other_pending_cert uuid:=gen_random_uuid(); project uuid:=gen_random_uuid();
 expired_approved public.learning_equivalencies; pending_one uuid; pending_two uuid; valid_request uuid; result jsonb;
 evidence text:=repeat('Assessed real work with implementation, tests and measurable outcomes. ',5);
BEGIN
 INSERT INTO public.users(id,email,role) VALUES(subject,subject||'@expiry-regression.invalid','learner');
 INSERT INTO public.learners(id,user_id,email,learner_type) VALUES(learner,subject,subject||'@expiry-regression.invalid','independent');
 INSERT INTO public.job_learning_catalog(level_id,capability_id,capability_name,title,level_number,version,fingerprint) VALUES(level,gen_random_uuid(),'Expiry fixture','Level',1,1,repeat('f',32));
 INSERT INTO public.certificates(id,learner_id,title,description,expiry_date) VALUES(cert,learner,'Approved credential',evidence,current_date+1),(pending_cert,learner,'Pending credential',evidence||' Pending one.',current_date+1),(other_pending_cert,learner,'Another pending credential',evidence||' Pending two.',current_date+1);
 result:=public.submit_learning_equivalency(subject,level,repeat('f',32),'certificate',cert);
 expired_approved:=public.claim_learning_ai_equivalency((result->'item'->>'id')::uuid,subject,1);
 expired_approved:=public.record_learning_ai_equivalency(expired_approved.id,subject,expired_approved.version,'approved','Demonstrated outcomes','fixture-model',90);
 result:=public.submit_learning_equivalency(subject,level,repeat('f',32),'certificate',pending_cert);pending_one:=(result->'item'->>'id')::uuid;
 result:=public.submit_learning_equivalency(subject,level,repeat('f',32),'certificate',other_pending_cert);pending_two:=(result->'item'->>'id')::uuid;
 INSERT INTO public.projects(id,learner_id,title,description) VALUES(project,learner,'Current work sample',evidence||' Valid independent work.');
 result:=public.submit_learning_equivalency(subject,level,repeat('f',32),'project',project);valid_request:=(result->'item'->>'id')::uuid;
 ALTER TABLE public.certificates DISABLE TRIGGER learning_source_revision;
 ALTER TABLE public.certificates DISABLE TRIGGER learning_source_invalidation;
 UPDATE public.certificates SET expiry_date=current_date-1 WHERE id IN(cert,pending_cert,other_pending_cert);
 ALTER TABLE public.certificates ENABLE TRIGGER learning_source_revision;
 ALTER TABLE public.certificates ENABLE TRIGGER learning_source_invalidation;
 UPDATE public.learning_equivalencies SET ai_next_attempt_at=now()-interval '100 years' WHERE id IN(pending_one,pending_two);
 IF EXISTS(SELECT 1 FROM public.due_learning_ai_equivalencies() WHERE id IN(pending_one,pending_two)) OR NOT EXISTS(SELECT 1 FROM public.due_learning_ai_equivalencies() WHERE id=valid_request) THEN RAISE EXCEPTION 'FAIL: expired pending evidence starves valid retry work'; END IF;
 -- Same content in an available source must not be bound to expired approval.
 UPDATE public.projects SET description=evidence WHERE id=project;
 result:=public.submit_learning_equivalency(subject,level,repeat('f',32),'project',project);
 IF result->>'duplicate'<>'false' OR (result->'item'->>'id')::uuid=expired_approved.id THEN RAISE EXCEPTION 'FAIL: expired evidence blocks valid replacement'; END IF;
 IF (SELECT status FROM public.learning_equivalencies WHERE id=expired_approved.id)<>'revoked' OR NOT EXISTS(SELECT 1 FROM public.learning_equivalency_audit WHERE equivalency_id=expired_approved.id AND decision='source_unavailable') THEN RAISE EXCEPTION 'FAIL: unavailable duplicate not retired with an audit'; END IF;
 valid_request:=(result->'item'->>'id')::uuid;
 expired_approved:=public.claim_learning_ai_equivalency(valid_request,subject,1);
 expired_approved:=public.record_learning_ai_equivalency(expired_approved.id,subject,expired_approved.version,'rejected','Evidence needs improvement','fixture-model',20);
 result:=public.submit_learning_equivalency(subject,level,repeat('f',32),'project',project);
 IF result->>'duplicate'<>'true' THEN RAISE EXCEPTION 'FAIL: unchanged rejected work automatically reevaluated'; END IF;
 UPDATE public.projects SET title='Updated assessed context' WHERE id=project;
 result:=public.submit_learning_equivalency(subject,level,repeat('f',32),'project',project);
 IF result->>'duplicate'<>'false' OR (result->'item'->>'id')::uuid=valid_request THEN RAISE EXCEPTION 'FAIL: changed source revision still bound to an old rejected assessment'; END IF;
 RAISE NOTICE 'PASS: expired pending evidence cannot starve retry delivery; unavailable duplicate cannot block valid replacement';
END $$;
ROLLBACK;
