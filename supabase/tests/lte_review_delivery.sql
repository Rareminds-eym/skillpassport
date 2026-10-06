-- Run after migrations inside a transaction; creates only synthetic test users.
DO $$
DECLARE learner_user uuid:=gen_random_uuid(); reviewer uuid:=gen_random_uuid(); admin_user uuid:=gen_random_uuid();
 learner uuid:=gen_random_uuid(); institution uuid:=gen_random_uuid(); classroom uuid:=gen_random_uuid();
 review uuid:=gen_random_uuid(); submission uuid:=gen_random_uuid(); event uuid:=gen_random_uuid(); payload jsonb; result jsonb;
BEGIN
 INSERT INTO public.users(id,email) VALUES(learner_user,'review-'||learner_user||'@example.test'),(reviewer,'review-'||reviewer||'@example.test'),(admin_user,'review-'||admin_user||'@example.test');
 INSERT INTO public.organizations(id,admin_id) VALUES(institution,admin_user);
 INSERT INTO public.school_classes(id,school_id,name,grade,academic_year) VALUES(classroom,institution,'Review test','10','2026-27');
 INSERT INTO public.learners(id,user_id,email,school_id,school_class_id,is_deleted) VALUES(learner,learner_user,'review-'||learner_user||'@example.test',institution,classroom,false);
 INSERT INTO public.lte_review_scope_settings(school_class_id,enabled) VALUES(classroom,true);
 payload:=jsonb_build_object('schemaVersion',1,'eventId',event,'occurredAt',now(),'reviewId',review,'submissionId',submission,'learnerId',learner_user,'reviewerId',reviewer,'scopeId',classroom,'scopeType','school_class','assignmentVersion',4,'decision','pass','score',80);
 result:=public.apply_lte_review_event(learner_user,'lte.review_completed',payload);
 PERFORM public.apply_lte_review_event(learner_user,'lte.review_completed',payload);
 ASSERT (SELECT count(*) FROM public.notifications WHERE id=event)=1,'duplicate notification';
 ASSERT (SELECT count(*) FROM public.lte_review_email_deliveries WHERE event_id=event)=0,'email enabled by default';
 PERFORM public.apply_lte_review_event(learner_user,'lte.review_assigned',payload||jsonb_build_object('eventId',gen_random_uuid(),'assignmentVersion',2,'dueBy',now()));
 ASSERT (SELECT count(*) FROM public.notifications WHERE recipient_id=reviewer)=0,'stale assignment notified';
 event:=gen_random_uuid();payload:=payload||jsonb_build_object('eventId',event);
 PERFORM public.apply_lte_review_event(learner_user,'lte.artifact_reviewed_pass',payload);
 PERFORM public.apply_lte_review_event(learner_user,'lte.artifact_reviewed_pass',payload);
 ASSERT (SELECT count(*) FROM public.lte_review_evidence WHERE review_id=review)=1,'duplicate evidence';
 ASSERT NOT coalesce((SELECT metadata ? 'lte_reviewed_artifact_count' FROM public.learners WHERE id=learner),false),'obsolete review count recreated';
 BEGIN
  PERFORM public.apply_lte_review_event(reviewer,'lte.review_completed',payload||jsonb_build_object('eventId',gen_random_uuid()));
  RAISE EXCEPTION 'expected subject rejection';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'INVALID_REVIEW_EVENT' THEN RAISE; END IF; END;
 UPDATE public.lte_review_scope_settings SET email_enabled=true WHERE school_class_id=classroom;
 event:=gen_random_uuid();payload:=payload||jsonb_build_object('eventId',event,'reviewId',gen_random_uuid(),'assignmentVersion',3,'dueBy',now());
 PERFORM public.apply_lte_review_event(learner_user,'lte.review_overdue',payload);
 ASSERT (SELECT count(*) FROM public.notifications WHERE recipient_id=admin_user)=1,'missing administrator escalation';
 ASSERT (SELECT status FROM public.lte_review_email_deliveries WHERE event_id=event)='pending','email not durable';
 result:=public.claim_lte_review_email(event);
 ASSERT result->>'status'='sending','email not claimed';
 BEGIN
  PERFORM public.claim_lte_review_email(event);
  RAISE EXCEPTION 'expected concurrent email rejection';
 EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'EMAIL_IN_PROGRESS' THEN RAISE; END IF; END;
 UPDATE public.lte_review_email_deliveries SET started_at=now()-interval '3 minutes' WHERE event_id=event;
 result:=public.claim_lte_review_email(event);
 ASSERT result->>'status'='uncertain','ambiguous delivery automatically retried';
 ASSERT NOT has_table_privilege('authenticated','public.lte_review_evidence','INSERT'),'browser evidence write allowed';
 ASSERT NOT has_function_privilege('authenticated','public.apply_lte_review_event(uuid,text,jsonb)','EXECUTE'),'browser effect RPC allowed';
END $$;

-- Access restrictions must work through grants with RLS disabled.
DO $$ DECLARE t text; BEGIN
 FOR t IN SELECT unnest(ARRAY['lte_review_scope_settings','lte_review_events','lte_review_evidence','lte_review_email_deliveries']) LOOP
  ASSERT NOT (SELECT relrowsecurity FROM pg_class WHERE oid=to_regclass('public.'||t)), 'RLS enabled: '||t;
  ASSERT NOT has_table_privilege('anon','public.'||t,'SELECT,INSERT,UPDATE,DELETE'), 'anon access: '||t;
  ASSERT NOT has_table_privilege('authenticated','public.'||t,'SELECT,INSERT,UPDATE,DELETE'), 'browser access: '||t;
  ASSERT has_table_privilege('service_role','public.'||t,'SELECT'), 'missing backend read: '||t;
 END LOOP;
END $$;
