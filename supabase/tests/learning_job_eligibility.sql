-- Run against local SkillPassport as postgres after the learning migrations.
-- Every fixture and notification is rolled back; no real candidate is used.
BEGIN;
DO $$
DECLARE subject uuid:=gen_random_uuid(); learner uuid:=gen_random_uuid(); reviewer uuid:=gen_random_uuid(); stranger uuid:=gen_random_uuid();
 org uuid:=gen_random_uuid(); level uuid:=gen_random_uuid(); job uuid:=gen_random_uuid(); proof uuid; unused_proof uuid; request uuid; row public.learning_equivalencies;
 requirement jsonb; result jsonb; version bigint; before_count integer; after_count integer; course uuid:=gen_random_uuid(); payload jsonb; source uuid:=gen_random_uuid();
BEGIN
 INSERT INTO public.users(id,email,role) VALUES(subject,subject||'@learning-test.invalid','learner'),(reviewer,reviewer||'@learning-test.invalid','educator'),(stranger,stranger||'@learning-test.invalid','educator');
 INSERT INTO public.organizations(id,name) VALUES(org,'Learning eligibility fixture');
 INSERT INTO public.learners(id,user_id,email,school_id) VALUES(learner,subject,subject||'@learning-test.invalid',org);
 INSERT INTO public.school_educators(user_id,school_id,account_status) VALUES(reviewer,org,'active');
 INSERT INTO public.job_learning_catalog(level_id,capability_id,capability_name,title,level_number,version,fingerprint)
 VALUES(level,gen_random_uuid(),'Fixture capability','Fixture level',2,1,repeat('a',32));
 requirement:=jsonb_build_array(jsonb_build_object('levelId',level,'fingerprint',repeat('a',32),'capabilityName','Fixture capability','title','Fixture level','levelNumber',2,'version',1,'mandatory',true));
 INSERT INTO public.opportunities(id,title,job_title,company_name,employment_type,location,department,status,is_active,learning_requirements)
 VALUES(job,'Fixture job','Fixture job','Fixture employer','Full-time','Remote','Engineering','open',true,requirement);
 BEGIN
  INSERT INTO public.applied_jobs(learner_id,opportunity_id,application_status) VALUES(learner,job,'applied');
  RAISE EXCEPTION 'FAIL: legacy application writer bypassed the learning gate';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 INSERT INTO public.job_application_verifications(learner_id,user_id,opportunity_id,requirements_version,evidence)
 VALUES(learner,subject,job,1,jsonb_build_object('criteria',jsonb_build_array(jsonb_build_object('levelId',level,'fingerprint',repeat('a',32),'status','not_yet_eligible')))) RETURNING id INTO proof;
 BEGIN
  INSERT INTO public.applied_jobs(learner_id,opportunity_id,application_status,learning_verification_id) VALUES(learner,job,'applied',proof);
  RAISE EXCEPTION 'FAIL: unapproved level accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 UPDATE public.job_application_verifications SET evidence=jsonb_build_object('criteria',jsonb_build_array(jsonb_build_object('levelId',level,'fingerprint',repeat('a',32),'status','eligible'))) WHERE id=proof;
 INSERT INTO public.applied_jobs(learner_id,opportunity_id,application_status,learning_verification_id) VALUES(learner,job,'applied',proof);
 IF NOT EXISTS(SELECT 1 FROM public.applied_jobs WHERE learner_id=learner AND opportunity_id=job AND learning_snapshot->>'requirementsVersion'='1') THEN RAISE EXCEPTION 'FAIL: missing application-time snapshot'; END IF;
 UPDATE public.job_application_verifications SET verified_at=now()-interval '2 days' WHERE id=proof;
 INSERT INTO public.job_application_verifications(learner_id,user_id,opportunity_id,requirements_version,evidence,verified_at)
 VALUES(learner,subject,job,1,'{}',now()-interval '2 days') RETURNING id INTO unused_proof;
 PERFORM public.purge_unused_learning_verifications();
 IF NOT EXISTS(SELECT 1 FROM public.job_application_verifications WHERE id=proof) OR EXISTS(SELECT 1 FROM public.job_application_verifications WHERE id=unused_proof) THEN RAISE EXCEPTION 'FAIL: verification retention deleted used proof or retained unused expired proof'; END IF;
 BEGIN
  UPDATE public.applied_jobs SET learning_snapshot='{}' WHERE learner_id=learner AND opportunity_id=job;
  RAISE EXCEPTION 'FAIL: application evidence overwritten';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 DELETE FROM public.applied_jobs WHERE learner_id=learner AND opportunity_id=job;
 -- Change a real criterion through a second published level, not a label edit.
 UPDATE public.job_learning_catalog SET fingerprint=repeat('b',32) WHERE level_id=level;
 UPDATE public.opportunities SET learning_requirements=jsonb_set(learning_requirements,'{0,fingerprint}',to_jsonb(repeat('b',32))) WHERE id=job;
 UPDATE public.job_learning_catalog SET fingerprint=repeat('a',32) WHERE level_id=level;
 UPDATE public.opportunities SET learning_requirements=jsonb_set(learning_requirements,'{0,fingerprint}',to_jsonb(repeat('a',32))) WHERE id=job;
 BEGIN
  INSERT INTO public.applied_jobs(learner_id,opportunity_id,application_status,learning_verification_id) VALUES(learner,job,'applied',proof);
  RAISE EXCEPTION 'FAIL: stale requirement version accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 SELECT learning_requirements_version INTO version FROM public.opportunities WHERE id=job;
 UPDATE public.job_application_verifications SET requirements_version=version,verified_at=clock_timestamp()-interval '31 seconds' WHERE id=proof;
 BEGIN
  INSERT INTO public.applied_jobs(learner_id,opportunity_id,application_status,learning_verification_id) VALUES(learner,job,'applied',proof);
  RAISE EXCEPTION 'FAIL: expired verification accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 IF (SELECT count(*) FROM public.job_learning_requirement_history WHERE opportunity_id=job)<>3 THEN RAISE EXCEPTION 'FAIL: missing requirement history'; END IF;
 INSERT INTO public.projects(id,learner_id,title,description) VALUES(source,learner,'Fixture work','Synthetic equivalent level evidence');
 INSERT INTO public.learning_equivalencies(learner_id,level_id,fingerprint,evidence_type,evidence_format,project_id)
 VALUES(learner,level,repeat('a',32),'work',2,source) RETURNING id INTO request;
 BEGIN
  PERFORM public.review_learning_equivalency(request,subject,1,'approved','Self review'); RAISE EXCEPTION 'FAIL: self review allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN
  PERFORM public.review_learning_equivalency(request,stranger,1,'approved','Foreign reviewer'); RAISE EXCEPTION 'FAIL: foreign reviewer allowed';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 row:=public.review_learning_equivalency(request,reviewer,1,'approved','Demonstrates the required level.');
 IF row.status<>'approved' OR row.version<>2 THEN RAISE EXCEPTION 'FAIL: authorized review failed'; END IF;
 BEGIN
  PERFORM public.review_learning_equivalency(request,reviewer,1,'revoked','Stale editor'); RAISE EXCEPTION 'FAIL: stale review allowed';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 row:=public.review_learning_equivalency(request,reviewer,2,'revoked','Evidence revoked.');
 IF row.status<>'revoked' THEN RAISE EXCEPTION 'FAIL: revocation failed'; END IF;
 UPDATE public.job_application_verifications SET verified_at=clock_timestamp(),evidence=jsonb_build_object('criteria',jsonb_build_array(jsonb_build_object('levelId',level,'fingerprint',repeat('a',32),'status','eligible','mandatory',true,'evidence',jsonb_build_array(jsonb_build_object('equivalencyId',request,'version',2))))) WHERE id=proof;
 BEGIN
  INSERT INTO public.applied_jobs(learner_id,opportunity_id,application_status,learning_verification_id) VALUES(learner,job,'applied',proof);
  RAISE EXCEPTION 'FAIL: revoked equivalent accepted during proof lifetime';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;

 result:=public.learning_job_feed(subject,learner,jsonb_build_array(jsonb_build_object('levelId',level,'fingerprint',repeat('a',32))),'[]','eligible','Fixture job',0);
 IF (result->>'total')::integer<>0 THEN RAISE EXCEPTION 'FAIL: feed qualifies unapproved learning'; END IF;
 result:=public.learning_job_feed(subject,learner,jsonb_build_array(jsonb_build_object('levelId',level,'fingerprint',repeat('a',32))),jsonb_build_array(jsonb_build_object('levelId',level,'fingerprint',repeat('a',32))),'eligible','Fixture job',0);
 IF (result->>'total')::integer<>1 THEN RAISE EXCEPTION 'FAIL: feed filtering/counts disagree'; END IF;
 UPDATE public.learners SET grade='Grade 7' WHERE id=learner;
 result:=public.learning_job_feed(subject,learner,'[]','[]','all','Fixture job',0);
 IF (result->>'total')::integer<>0 THEN RAISE EXCEPTION 'FAIL: middle-school feed exposed regular jobs'; END IF;
 UPDATE public.learners SET grade='Grade 10' WHERE id=learner;
 result:=public.learning_job_feed(subject,learner,'[]','[]','all','Fixture job',0);
 IF (result->>'total')::integer<>0 THEN RAISE EXCEPTION 'FAIL: high-school feed exposed full-time job'; END IF;
 UPDATE public.opportunities SET employment_type='Internship' WHERE id=job;
 result:=public.learning_job_feed(subject,learner,'[]','[]','all','Fixture job',0);
 IF (result->>'total')::integer<>1 THEN RAISE EXCEPTION 'FAIL: high-school internship missing'; END IF;
 UPDATE public.learners SET grade=NULL WHERE id=learner;
 SELECT count(*) INTO before_count FROM public.notifications WHERE recipient_id=subject;
 PERFORM public.record_learning_job_notification(learner,job,version);
 PERFORM public.record_learning_job_notification(learner,job,version);
 SELECT count(*) INTO after_count FROM public.notifications WHERE recipient_id=subject;
 IF after_count<>before_count+1 THEN RAISE EXCEPTION 'FAIL: notification deduplication'; END IF;
 IF public.job_learning_evaluation_policy(learner,subject)<>'human' THEN RAISE EXCEPTION 'FAIL: institution policy'; END IF;
 IF public.job_learning_evaluation_policy(learner,stranger) IS NOT NULL THEN RAISE EXCEPTION 'FAIL: foreign learner policy'; END IF;
 UPDATE public.projects SET description=repeat('Actual work evidence. ',20) WHERE id=source;
 INSERT INTO public.learning_equivalencies(learner_id,level_id,fingerprint,evidence_type,evidence_format,project_id)
 VALUES(learner,level,repeat('a',32),'work',2,source) RETURNING id INTO request;
 BEGIN
  PERFORM public.record_learning_ai_equivalency(request,subject,1,'approved','Valid work','fixture-model',90);
  RAISE EXCEPTION 'FAIL: AI approved institution-linked learner';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 UPDATE public.learners SET school_id=NULL,learner_type='independent' WHERE id=learner;
 IF public.job_learning_evaluation_policy(learner,subject)<>'ai' THEN RAISE EXCEPTION 'FAIL: independent policy'; END IF;
 UPDATE public.learning_equivalencies SET evaluation_type='ai' WHERE id=request;
 row:=public.claim_learning_ai_equivalency(request,subject,1);
 IF row.id IS NULL OR row.version<>2 OR row.ai_attempts<>1 THEN RAISE EXCEPTION 'FAIL: AI lease claim'; END IF;
 IF (public.claim_learning_ai_equivalency(request,subject,2)).id IS NOT NULL THEN RAISE EXCEPTION 'FAIL: concurrent AI lease'; END IF;
 row:=public.record_learning_ai_equivalency(request,subject,2,'approved','Validated actual work','fixture-model',90);
 IF row.status<>'approved' OR row.evaluation_type<>'ai' OR row.version<>3 THEN RAISE EXCEPTION 'FAIL: AI result recording'; END IF;
 UPDATE public.learners SET school_id=org WHERE id=learner;
 UPDATE public.job_application_verifications SET verified_at=clock_timestamp(),evidence=jsonb_build_object('evaluationPolicy','ai','criteria',jsonb_build_array(jsonb_build_object('levelId',level,'fingerprint',repeat('a',32),'status','eligible'))) WHERE id=proof;
 BEGIN
  INSERT INTO public.applied_jobs(learner_id,opportunity_id,application_status,learning_verification_id) VALUES(learner,job,'applied',proof);
  RAISE EXCEPTION 'FAIL: policy change allowed stale AI proof';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 payload:=jsonb_build_object('schemaVersion',2,'sourceRevision',2,'lteCourseId',course,'courseTitle','Learning fixture course','levels','[]'::jsonb,'totalModules',2,'completedModules',1);
 result:=public.apply_lte_progress_snapshot(learner,payload);
 result:=public.apply_lte_progress_snapshot(learner,jsonb_set(payload,'{sourceRevision}','1'));
 IF result->>'stale' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'FAIL: out-of-order progress accepted'; END IF;
 result:=public.apply_lte_progress_snapshot(learner,payload);
 IF result->>'stale' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'FAIL: duplicate progress accepted'; END IF;
 BEGIN
  PERFORM public.apply_lte_progress_snapshot(learner,jsonb_set(jsonb_set(payload,'{sourceRevision}','3'),'{earnedSkillsDetail}',jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'name','Missing level'))));
  RAISE EXCEPTION 'FAIL: malformed earned skill accepted';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 IF (SELECT source_revision FROM public.trainings WHERE learner_id=learner AND lte_course_id=course)<>2 THEN RAISE EXCEPTION 'FAIL: partial progress write committed'; END IF;
 BEGIN
  PERFORM public.apply_lte_progress_snapshot(learner,payload-'schemaVersion');
  RAISE EXCEPTION 'FAIL: unversioned progress accepted';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 IF has_function_privilege('anon','public.learning_job_feed(uuid,uuid,jsonb,jsonb,text,text,integer)','EXECUTE') OR
    has_function_privilege('authenticated','public.review_learning_equivalency(uuid,uuid,integer,text,text)','EXECUTE') THEN RAISE EXCEPTION 'FAIL: privileged RPC exposure'; END IF;
 RAISE NOTICE 'PASS: application enforcement, immutable snapshots, stale/expired proof, review scope/version/revocation, feed counts, notification dedupe, independent AI policy/lease/recording, institutional policy changes, atomic progress/replay/rollback, grants';
END $$;
ROLLBACK;
