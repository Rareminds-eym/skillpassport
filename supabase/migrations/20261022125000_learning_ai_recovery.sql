BEGIN;
ALTER TABLE public.learning_equivalencies ADD COLUMN evidence_digest text,
 ADD COLUMN ai_next_attempt_at timestamptz NOT NULL DEFAULT now(),ADD COLUMN ai_last_attempt_at timestamptz,ADD COLUMN ai_last_error text;
CREATE UNIQUE INDEX learning_ai_evidence_unique ON public.learning_equivalencies(learner_id,level_id,fingerprint,evidence_digest) WHERE evaluation_type='ai' AND evidence_digest IS NOT NULL;
CREATE INDEX learning_ai_due ON public.learning_equivalencies(ai_next_attempt_at,id) WHERE status='pending' AND evaluation_type='ai';
CREATE FUNCTION public.guard_learning_ai_evidence() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
 IF NEW.evaluation_type='ai' THEN
  IF length(trim(coalesce(NEW.evidence_content,''))) NOT BETWEEN 200 AND 10000 THEN RAISE EXCEPTION 'EVIDENCE_CONTENT_REQUIRED' USING ERRCODE='22023'; END IF;
  NEW.evidence_digest:=md5(trim(NEW.evidence_content));
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_learning_ai_evidence BEFORE INSERT ON public.learning_equivalencies FOR EACH ROW EXECUTE FUNCTION public.guard_learning_ai_evidence();
CREATE OR REPLACE FUNCTION public.claim_learning_ai_equivalency(p_id uuid,p_user uuid,p_version integer) RETURNS public.learning_equivalencies
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE item public.learning_equivalencies;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('learning-ai:'||p_user,0));
 SELECT * INTO item FROM public.learning_equivalencies WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR item.version<>p_version OR item.status<>'pending' OR item.evaluation_type<>'ai' OR item.ai_attempts>=5
 OR item.ai_next_attempt_at>now() OR item.ai_lease_until>now() OR public.job_learning_evaluation_policy(item.learner_id,p_user) IS DISTINCT FROM 'ai' THEN RETURN NULL; END IF;
 IF EXISTS(SELECT 1 FROM public.learning_equivalencies e JOIN public.learners l ON l.id=e.learner_id WHERE l.user_id=p_user AND e.ai_lease_until>now()) THEN RAISE EXCEPTION 'AI_CONCURRENT_EVALUATION' USING ERRCODE='P0001'; END IF;
 UPDATE public.learning_equivalencies SET ai_attempts=ai_attempts+1,ai_lease_until=now()+interval '2 minutes',version=version+1,
 ai_last_attempt_at=now(),ai_last_error=NULL,ai_next_attempt_at=now()+least(60,power(2,ai_attempts))*interval '1 minute' WHERE id=p_id RETURNING * INTO item;
 RETURN item;
END $$;
CREATE FUNCTION public.defer_learning_ai_equivalency(p_id uuid,p_version integer,p_delay integer,p_error text) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 UPDATE public.learning_equivalencies SET ai_next_attempt_at=greatest(ai_next_attempt_at,now()+greatest(1,least(p_delay,86400))*interval '1 second'),ai_last_error=left(p_error,500)
 WHERE id=p_id AND version=p_version AND status='pending' AND evaluation_type='ai' AND (ai_lease_until IS NULL OR ai_lease_until<now());
$$;
CREATE FUNCTION public.fail_learning_ai_equivalency(p_id uuid,p_version integer) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 UPDATE public.learning_equivalencies SET ai_lease_until=NULL,ai_last_error='Evaluation unavailable; automatic retry scheduled unless the attempt limit was reached.'
 WHERE id=p_id AND version=p_version AND status='pending' AND evaluation_type='ai';
$$;
CREATE FUNCTION public.due_learning_ai_equivalencies() RETURNS SETOF public.learning_equivalencies
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT e.* FROM public.learning_equivalencies e JOIN public.learners l ON l.id=e.learner_id
 WHERE e.status='pending' AND e.evaluation_type='ai' AND e.ai_attempts<5 AND e.ai_next_attempt_at<=now()
 AND (e.ai_lease_until IS NULL OR e.ai_lease_until<now()) AND public.job_learning_evaluation_policy(l.id,l.user_id)='ai'
 ORDER BY e.ai_next_attempt_at,e.id LIMIT 2;
$$;
CREATE FUNCTION public.requeue_learning_ai_equivalency(p_id uuid,p_user uuid,p_version integer) RETURNS public.learning_equivalencies
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE item public.learning_equivalencies;
BEGIN
 SELECT * INTO STRICT item FROM public.learning_equivalencies WHERE id=p_id FOR UPDATE;
 IF public.job_learning_evaluation_policy(item.learner_id,p_user) IS DISTINCT FROM 'ai' THEN RAISE EXCEPTION 'AI_POLICY_FORBIDDEN' USING ERRCODE='42501'; END IF;
 IF item.version<>p_version OR item.status<>'pending' OR item.evaluation_type<>'ai' OR item.ai_attempts<5 OR item.ai_last_attempt_at IS NULL OR item.ai_last_attempt_at>now()-interval '1 day' THEN RAISE EXCEPTION 'REQUEUE_NOT_AVAILABLE' USING ERRCODE='40001'; END IF;
 UPDATE public.learning_equivalencies SET ai_attempts=0,ai_next_attempt_at=now(),ai_lease_until=NULL,ai_last_error=NULL,version=version+1 WHERE id=p_id RETURNING * INTO item;
 INSERT INTO public.learning_equivalency_audit(equivalency_id,actor_id,decision,version,feedback) VALUES(item.id,p_user,'ai_requeued',item.version,'Candidate requested another evaluation round after the recovery cooldown.');
 RETURN item;
END $$;
CREATE FUNCTION public.find_learning_ai_equivalency(p_learner uuid,p_level uuid,p_fingerprint text,p_content text) RETURNS public.learning_equivalencies
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT * FROM public.learning_equivalencies WHERE learner_id=p_learner AND level_id=p_level AND fingerprint=p_fingerprint AND evidence_digest=md5(trim(p_content)) AND evaluation_type='ai';
$$;
REVOKE ALL ON FUNCTION public.find_learning_ai_equivalency(uuid,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.find_learning_ai_equivalency(uuid,uuid,text,text) TO service_role;
REVOKE ALL ON FUNCTION public.guard_learning_ai_evidence(),public.defer_learning_ai_equivalency(uuid,integer,integer,text),public.fail_learning_ai_equivalency(uuid,integer),public.due_learning_ai_equivalencies(),public.requeue_learning_ai_equivalency(uuid,uuid,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.defer_learning_ai_equivalency(uuid,integer,integer,text),public.fail_learning_ai_equivalency(uuid,integer),public.due_learning_ai_equivalencies(),public.requeue_learning_ai_equivalency(uuid,uuid,integer) TO service_role;
COMMIT;
