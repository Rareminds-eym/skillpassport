CREATE TABLE public.lte_review_events (
 event_id uuid PRIMARY KEY,
 review_id uuid NOT NULL,
 learner_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
 event_type text NOT NULL,
 assignment_version integer NOT NULL CHECK(assignment_version>0),
 payload jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.lte_review_evidence (
 review_id uuid PRIMARY KEY,
 submission_id uuid NOT NULL UNIQUE,
 learner_id uuid NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
 reviewer_user_id uuid NOT NULL REFERENCES public.users(id),
 scope_id uuid NOT NULL,
 scope_type text NOT NULL CHECK(scope_type IN ('college_program','school_class')),
 score integer NOT NULL CHECK(score BETWEEN 0 AND 100),
 reviewed_at timestamptz NOT NULL,
 badge_id text NOT NULL DEFAULT 'reviewed_artifact'
);
CREATE INDEX lte_review_events_version_idx ON public.lte_review_events(review_id,assignment_version);
CREATE INDEX lte_review_evidence_learner_idx ON public.lte_review_evidence(learner_id,reviewed_at);
ALTER TABLE public.lte_review_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lte_review_evidence DISABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lte_review_events,public.lte_review_evidence FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.lte_review_events,public.lte_review_evidence TO service_role;

CREATE FUNCTION public.apply_lte_review_event(p_actor uuid,p_type text,p_payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE v_event_id uuid := (p_payload->>'eventId')::uuid; review uuid := (p_payload->>'reviewId')::uuid;
 learner uuid; recipient uuid; title text; message text; notification public.notifications; prior integer; email_opt_in boolean; institution uuid; administrator uuid;
BEGIN
 IF p_actor IS DISTINCT FROM (p_payload->>'learnerId')::uuid OR (p_payload->>'schemaVersion')::integer IS DISTINCT FROM 1
 OR p_type NOT IN ('lte.review_assigned','lte.review_completed','lte.artifact_reviewed_pass','lte.review_due_soon','lte.review_overdue') THEN RAISE EXCEPTION 'INVALID_REVIEW_EVENT'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('lte-review:'||review,0));
 IF EXISTS(SELECT 1 FROM public.lte_review_events e WHERE e.event_id=v_event_id) THEN RETURN jsonb_build_object('duplicate',true); END IF;
 SELECT max(assignment_version) INTO prior FROM public.lte_review_events WHERE review_id=review;
 INSERT INTO public.lte_review_events(event_id,review_id,learner_user_id,event_type,assignment_version,payload)
 VALUES(v_event_id,review,p_actor,p_type,(p_payload->>'assignmentVersion')::integer,p_payload);
 IF coalesce(prior,0)>(p_payload->>'assignmentVersion')::integer THEN RETURN jsonb_build_object('stale',true); END IF;
 IF p_type='lte.artifact_reviewed_pass' THEN
  IF p_payload->>'decision' IS DISTINCT FROM 'pass' THEN RAISE EXCEPTION 'INVALID_REVIEW_PASS'; END IF;
  SELECT id INTO STRICT learner FROM public.learners WHERE user_id=p_actor AND is_deleted=false;
  INSERT INTO public.lte_review_evidence(review_id,submission_id,learner_id,reviewer_user_id,scope_id,scope_type,score,reviewed_at)
  VALUES(review,(p_payload->>'submissionId')::uuid,learner,(p_payload->>'reviewerId')::uuid,(p_payload->>'scopeId')::uuid,
   p_payload->>'scopeType',(p_payload->>'score')::integer,(p_payload->>'occurredAt')::timestamptz)
  ON CONFLICT(review_id) DO NOTHING;
  RETURN jsonb_build_object('evidenceRecorded',true);
 END IF;
 recipient := CASE WHEN p_type<>'lte.review_completed' THEN (p_payload->>'reviewerId')::uuid ELSE p_actor END;
 title := CASE WHEN p_type='lte.review_due_soon' THEN 'Artifact review due soon' WHEN p_type='lte.review_overdue' THEN 'Artifact review overdue' WHEN p_type='lte.review_assigned' THEN 'New artifact review'
 WHEN p_payload->>'decision'='pass' THEN 'Your artifact passed staff review' ELSE 'Revise and resubmit your artifact' END;
 message := CASE WHEN p_type<>'lte.review_completed' THEN 'Open the educator review queue to read the evidence and rubric.'
 ELSE 'Open the artifact feedback in LTE for your review and next steps.' END;
 INSERT INTO public.notifications(id,recipient_id,type,title,message) VALUES(v_event_id,recipient,'lte_review',title,message)
 ON CONFLICT(id) DO NOTHING RETURNING * INTO notification;
 IF p_type='lte.review_overdue' THEN
  SELECT CASE WHEN p_payload->>'scopeType'='school_class' THEN school_id ELSE college_id END INTO institution FROM public.learners WHERE user_id=p_actor AND is_deleted=false;
  SELECT admin_id INTO administrator FROM public.organizations WHERE id=institution;
  IF administrator IS NOT NULL AND administrator<>recipient THEN
   INSERT INTO public.notifications(recipient_id,type,title,message) VALUES(administrator,'lte_review','Overdue artifact review','Open artifact review oversight to resolve overdue work in your institution.');
  END IF;
 END IF;
 SELECT email_enabled INTO email_opt_in FROM public.lte_review_scope_settings
 WHERE (p_payload->>'scopeType'='college_program' AND college_program_id=(p_payload->>'scopeId')::uuid)
 OR (p_payload->>'scopeType'='school_class' AND school_class_id=(p_payload->>'scopeId')::uuid);
 IF coalesce(email_opt_in,false) THEN
  INSERT INTO public.lte_review_email_deliveries(event_id,recipient_id) VALUES(v_event_id,recipient) ON CONFLICT DO NOTHING;
 END IF;
 RETURN jsonb_build_object('notification',to_jsonb(notification));
END $$;
REVOKE ALL ON FUNCTION public.apply_lte_review_event(uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_lte_review_event(uuid,text,jsonb) TO service_role;
