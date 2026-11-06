BEGIN;
CREATE FUNCTION public.guard_learning_application_integrity() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE proof public.job_application_verifications; criterion jsonb; evidence jsonb; equivalent public.learning_equivalencies;
BEGIN
 IF TG_OP='UPDATE' THEN
  IF NEW.learning_snapshot IS DISTINCT FROM OLD.learning_snapshot
   OR NEW.learning_verification_id IS DISTINCT FROM OLD.learning_verification_id
   OR NEW.learner_id IS DISTINCT FROM OLD.learner_id
   OR NEW.opportunity_id IS DISTINCT FROM OLD.opportunity_id THEN
   RAISE EXCEPTION 'APPLICATION_EVIDENCE_IMMUTABLE' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
 END IF;
 SELECT * INTO proof FROM public.job_application_verifications WHERE id=NEW.learning_verification_id;
 FOR criterion IN SELECT value FROM jsonb_array_elements(coalesce(proof.evidence->'criteria','[]')) LOOP
  IF criterion->>'mandatory'='true' THEN
   FOR evidence IN SELECT value FROM jsonb_array_elements(coalesce(criterion->'evidence','[]')) LOOP
    IF evidence ? 'equivalencyId' THEN
     SELECT * INTO equivalent FROM public.learning_equivalencies
      WHERE id=(evidence->>'equivalencyId')::uuid AND learner_id=NEW.learner_id
       AND level_id=(criterion->>'levelId')::uuid AND fingerprint=criterion->>'fingerprint'
       AND version=(evidence->>'version')::integer AND status='approved' FOR SHARE;
     IF NOT FOUND OR (equivalent.evaluation_type='ai' AND public.job_learning_evaluation_policy(NEW.learner_id,proof.user_id) IS DISTINCT FROM 'ai') THEN
      RAISE EXCEPTION 'EQUIVALENT_EVIDENCE_CHANGED' USING ERRCODE='42501';
     END IF;
    END IF;
   END LOOP;
  END IF;
 END LOOP;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_application_evidence_integrity BEFORE INSERT OR UPDATE ON public.applied_jobs
 FOR EACH ROW EXECUTE FUNCTION public.guard_learning_application_integrity();
REVOKE ALL ON FUNCTION public.guard_learning_application_integrity() FROM PUBLIC,anon,authenticated;
COMMIT;
