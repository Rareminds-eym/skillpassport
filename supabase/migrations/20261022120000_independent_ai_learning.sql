BEGIN;
ALTER TABLE public.learning_equivalencies ADD COLUMN evaluation_type text NOT NULL DEFAULT 'human' CHECK(evaluation_type IN ('human','ai')),
 ADD COLUMN evidence_content text,ADD COLUMN evaluation_model text,ADD COLUMN evaluation_score integer,
 ADD COLUMN ai_attempts integer NOT NULL DEFAULT 0,ADD COLUMN ai_lease_until timestamptz;
CREATE FUNCTION public.job_learning_evaluation_policy(p_learner uuid,p_user uuid) RETURNS text
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT CASE WHEN l.school_id IS NULL AND l.college_id IS NULL AND l.university_college_id IS NULL
 AND coalesce(l.learner_type,'') NOT IN ('school','school_student','college','college_student')
 AND NOT EXISTS(SELECT 1 FROM public.organization_members m JOIN public.organizations o ON o.id=m.organization_id
  WHERE m.user_id=p_user AND m.status='active' AND o.organization_type IN ('school','college','university'))
 THEN 'ai' ELSE 'human' END FROM public.learners l WHERE l.id=p_learner AND l.user_id=p_user AND l.is_deleted=false;
$$;
CREATE FUNCTION public.record_learning_ai_equivalency(p_id uuid,p_user uuid,p_version integer,p_decision text,p_feedback text,p_model text,p_score integer)
 RETURNS public.learning_equivalencies LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE item public.learning_equivalencies;
BEGIN
 SELECT * INTO STRICT item FROM public.learning_equivalencies WHERE id=p_id FOR UPDATE;
 IF public.job_learning_evaluation_policy(item.learner_id,p_user) IS DISTINCT FROM 'ai' THEN RAISE EXCEPTION 'AI_POLICY_FORBIDDEN' USING ERRCODE='42501'; END IF;
 IF item.version<>p_version OR item.status<>'pending' OR item.evaluation_type<>'ai' THEN RAISE EXCEPTION 'REVIEW_CHANGED' USING ERRCODE='40001'; END IF;
 IF p_decision IS NULL OR p_decision NOT IN ('approved','rejected','pending') OR p_model IS NULL OR length(p_model)<1 OR p_score IS NULL OR p_score NOT BETWEEN 0 AND 100
 OR length(trim(coalesce(p_feedback,''))) NOT BETWEEN 1 AND 4000 THEN RAISE EXCEPTION 'INVALID_AI_EVALUATION' USING ERRCODE='22023'; END IF;
 IF p_decision='approved' AND NOT EXISTS(SELECT 1 FROM public.job_learning_catalog c WHERE c.level_id=item.level_id AND c.fingerprint=item.fingerprint) THEN RAISE EXCEPTION 'CATALOG_CHANGED' USING ERRCODE='40001'; END IF;
 UPDATE public.learning_equivalencies SET status=p_decision,feedback=p_feedback,evaluation_model=p_model,evaluation_score=p_score,reviewed_at=now(),version=version+1,ai_lease_until=NULL WHERE id=p_id RETURNING * INTO item;
 INSERT INTO public.learning_equivalency_audit(equivalency_id,actor_id,decision,version,feedback) VALUES(item.id,p_user,'ai_'||p_decision,item.version,p_feedback);
 RETURN item;
END $$;
CREATE FUNCTION public.claim_learning_ai_equivalency(p_id uuid,p_user uuid,p_version integer) RETURNS public.learning_equivalencies
 LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 UPDATE public.learning_equivalencies e SET ai_attempts=ai_attempts+1,ai_lease_until=now()+interval '2 minutes',version=version+1
 WHERE e.id=p_id AND e.version=p_version AND e.status='pending' AND e.evaluation_type='ai' AND e.ai_attempts<5
 AND (e.ai_lease_until IS NULL OR e.ai_lease_until<now())
 AND public.job_learning_evaluation_policy(e.learner_id,p_user)='ai' RETURNING e.*;
$$;
CREATE FUNCTION public.guard_learning_evaluation_policy() RETURNS trigger
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE proof public.job_application_verifications;
BEGIN
 IF TG_TABLE_NAME='learning_equivalencies' THEN
  IF NEW.reviewer_id IS NOT NULL THEN NEW.evaluation_type:='human'; END IF;
 ELSE
  SELECT * INTO proof FROM public.job_application_verifications WHERE id=NEW.learning_verification_id;
  IF proof.evidence->>'evaluationPolicy'='ai' AND public.job_learning_evaluation_policy(NEW.learner_id,proof.user_id) IS DISTINCT FROM 'ai' THEN
   RAISE EXCEPTION 'EVALUATION_POLICY_CHANGED' USING ERRCODE='42501'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_equivalency_evaluation_policy BEFORE UPDATE ON public.learning_equivalencies FOR EACH ROW EXECUTE FUNCTION public.guard_learning_evaluation_policy();
CREATE TRIGGER guard_application_evaluation_policy BEFORE INSERT ON public.applied_jobs FOR EACH ROW EXECUTE FUNCTION public.guard_learning_evaluation_policy();
REVOKE ALL ON FUNCTION public.job_learning_evaluation_policy(uuid,uuid),public.record_learning_ai_equivalency(uuid,uuid,integer,text,text,text,integer) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.claim_learning_ai_equivalency(uuid,uuid,integer),public.guard_learning_evaluation_policy() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.job_learning_evaluation_policy(uuid,uuid),public.record_learning_ai_equivalency(uuid,uuid,integer,text,text,text,integer),public.claim_learning_ai_equivalency(uuid,uuid,integer) TO service_role;
COMMIT;
