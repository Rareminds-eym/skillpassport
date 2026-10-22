-- Synthetic fixtures only; every mutation, including evaluation and review, rolls back.
BEGIN;
DO $$
DECLARE subject uuid:=gen_random_uuid(); learner uuid:=gen_random_uuid(); reviewer uuid:=gen_random_uuid(); foreign_user uuid:=gen_random_uuid();
 level uuid:=gen_random_uuid(); request uuid; other_request uuid; college uuid:=gen_random_uuid(); university uuid:=gen_random_uuid(); uc uuid:=gen_random_uuid();
 item public.learning_equivalencies; attempt integer; source uuid:=gen_random_uuid(); other_source uuid:=gen_random_uuid(); evidence text:=repeat('Actual implementation with tests and demonstrated outcomes. ',8);
BEGIN
 INSERT INTO public.users(id,email,role) VALUES(subject,subject||'@recovery-test.invalid','learner'),(reviewer,reviewer||'@recovery-test.invalid','educator'),(foreign_user,foreign_user||'@recovery-test.invalid','learner');
 INSERT INTO public.learners(id,user_id,email,learner_type) VALUES(learner,subject,subject||'@recovery-test.invalid','independent');
 INSERT INTO public.job_learning_catalog(level_id,capability_id,capability_name,title,level_number,version,fingerprint) VALUES(level,gen_random_uuid(),'Fixture','Fixture level',1,1,repeat('b',32));
 INSERT INTO public.projects(id,learner_id,title,description) VALUES(source,learner,'Fixture',evidence),(other_source,learner,'Another fixture',evidence||' Different implementation.');
 INSERT INTO public.learning_equivalencies(learner_id,level_id,fingerprint,evidence_type,evidence_format,project_id)
 VALUES(learner,level,repeat('b',32),'work',2,source) RETURNING id INTO request;
 BEGIN
  INSERT INTO public.learning_equivalencies(learner_id,level_id,fingerprint,evidence_type,evidence_format,project_id)
  VALUES(learner,level,repeat('b',32),'work',2,source);
  RAISE EXCEPTION 'FAIL: identical evidence created a new evaluation request';
 EXCEPTION WHEN unique_violation THEN NULL; END;
 IF (public.find_learning_ai_equivalency(learner,level,repeat('b',32),evidence)).id<>request THEN RAISE EXCEPTION 'FAIL: duplicate lookup'; END IF;
 INSERT INTO public.learning_equivalencies(learner_id,level_id,fingerprint,evidence_type,evidence_format,project_id)
 VALUES(learner,level,repeat('b',32),'work',2,other_source) RETURNING id INTO other_request;
 IF (public.claim_learning_ai_equivalency(request,foreign_user,1)).id IS NOT NULL THEN RAISE EXCEPTION 'FAIL: foreign claim'; END IF;
 item:=public.claim_learning_ai_equivalency(request,subject,1);
 IF item.id IS NULL OR item.version<>2 OR item.ai_attempts<>1 THEN RAISE EXCEPTION 'FAIL: claim'; END IF;
 BEGIN
  PERFORM public.claim_learning_ai_equivalency(other_request,subject,1); RAISE EXCEPTION 'FAIL: concurrent candidate evaluation';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'AI_CONCURRENT_EVALUATION' THEN RAISE; END IF; END;
 PERFORM public.fail_learning_ai_equivalency(request,2);
 IF (SELECT ai_lease_until IS NOT NULL OR ai_last_error IS NULL FROM public.learning_equivalencies WHERE id=request) THEN RAISE EXCEPTION 'FAIL: failed attempt did not release lease and retain retry state'; END IF;
 -- More than the former 20-attempt daily quota remains eligible. Each iteration
 -- represents another recovery round; no aggregate daily accounting exists.
 FOR attempt IN 1..21 LOOP
  UPDATE public.learning_equivalencies SET ai_attempts=0,ai_next_attempt_at=now(),ai_lease_until=NULL WHERE id=other_request;
  item:=public.claim_learning_ai_equivalency(other_request,subject,(SELECT version FROM public.learning_equivalencies WHERE id=other_request));
  IF item.id IS NULL THEN RAISE EXCEPTION 'FAIL: evaluation blocked by removed daily quota'; END IF;
  PERFORM public.fail_learning_ai_equivalency(item.id,item.version);
 END LOOP;
 IF to_regclass('public.learning_ai_limits') IS NOT NULL OR to_regclass('public.learning_ai_usage') IS NOT NULL THEN RAISE EXCEPTION 'FAIL: AI quota tables remain'; END IF;
 UPDATE public.learning_equivalencies SET ai_attempts=5,ai_last_attempt_at=now() WHERE id=request;
 BEGIN
  PERFORM public.requeue_learning_ai_equivalency(request,subject,2); RAISE EXCEPTION 'FAIL: cooldown bypass';
 EXCEPTION WHEN serialization_failure THEN NULL; END;
 UPDATE public.learning_equivalencies SET ai_last_attempt_at=now()-interval '2 days' WHERE id=request;
 item:=public.requeue_learning_ai_equivalency(request,subject,2);
 IF item.ai_attempts<>0 OR item.version<>3 THEN RAISE EXCEPTION 'FAIL: recovery requeue'; END IF;
 item:=public.claim_learning_ai_equivalency(request,subject,3);
 IF item.id IS NULL THEN RAISE EXCEPTION 'FAIL: requeued evidence cannot be evaluated'; END IF;
 PERFORM public.fail_learning_ai_equivalency(item.id,item.version);
 INSERT INTO public.organizations(id,name) VALUES(college,'Mapped college fixture'),(university,'University fixture');
 INSERT INTO public.university_colleges(id,university_id,college_id,name,code,account_status) VALUES(uc,university,college,'Mapped university college','FIX-'||left(uc::text,8),'active');
 INSERT INTO public.college_lecturers(user_id,"collegeId","accountStatus") VALUES(reviewer,college,'active');
 UPDATE public.learners SET university_college_id=uc WHERE id=learner;
 IF public.job_learning_evaluation_policy(learner,subject)<>'human' THEN RAISE EXCEPTION 'FAIL: university affiliation lost human policy'; END IF;
 IF NOT public.learning_equivalency_reviewer_allowed(learner,reviewer) OR public.learning_equivalency_reviewer_allowed(learner,subject) OR public.learning_equivalency_reviewer_allowed(learner,foreign_user) THEN RAISE EXCEPTION 'FAIL: university reviewer scope'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.list_learning_equivalencies(reviewer,0,true) e WHERE e.id=request) THEN RAISE EXCEPTION 'FAIL: university review queue'; END IF;
 item:=public.review_learning_equivalency(request,reviewer,4,'approved','Actual evidence demonstrates the mapped level.');
 IF item.status<>'approved' OR item.evaluation_type<>'human' THEN RAISE EXCEPTION 'FAIL: university human review'; END IF;
 UPDATE public.university_colleges SET account_status='inactive' WHERE id=uc;
 IF public.learning_equivalency_reviewer_allowed(learner,reviewer) THEN RAISE EXCEPTION 'FAIL: inactive university mapping authorized review'; END IF;
 IF has_function_privilege('authenticated','public.requeue_learning_ai_equivalency(uuid,uuid,integer)','EXECUTE') THEN RAISE EXCEPTION 'FAIL: private recovery controls exposed'; END IF;
 RAISE NOTICE 'PASS: evidence dedupe, candidate concurrency without daily quotas, durable failure, cooldown recovery, university mapping/scope/review, private grants';
END $$;
ROLLBACK;
