BEGIN;
SET LOCAL lock_timeout='5s';
CREATE TABLE public.job_learning_catalog (
 level_id uuid PRIMARY KEY, capability_id uuid NOT NULL, capability_name text NOT NULL,
 title text NOT NULL, level_number integer NOT NULL CHECK(level_number>0),
 version integer NOT NULL CHECK(version>0), fingerprint text NOT NULL CHECK(length(fingerprint)=32),
 synced_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.opportunities ADD COLUMN learning_requirements jsonb NOT NULL DEFAULT '[]',
 ADD COLUMN learning_requirements_version bigint NOT NULL DEFAULT 1;
CREATE TABLE public.job_learning_requirement_history (
 opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
 version bigint NOT NULL, requirements jsonb NOT NULL, recorded_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(opportunity_id,version)
);
CREATE TABLE public.learning_equivalencies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), learner_id uuid NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
 level_id uuid NOT NULL REFERENCES public.job_learning_catalog(level_id), fingerprint text NOT NULL,
 evidence_type text NOT NULL CHECK(evidence_type IN ('course','certification','work')),
 title text NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 200),
 evidence_url text NOT NULL CHECK(evidence_url ~ '^https://'),
 description text NOT NULL CHECK(length(trim(description)) BETWEEN 1 AND 4000),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','revoked')),
 version integer NOT NULL DEFAULT 1, reviewer_id uuid REFERENCES public.users(id),
 feedback text, created_at timestamptz NOT NULL DEFAULT now(), reviewed_at timestamptz
);
CREATE INDEX learning_equivalencies_learner ON public.learning_equivalencies(learner_id,level_id,status);
CREATE TABLE public.learning_equivalency_audit (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), equivalency_id uuid NOT NULL REFERENCES public.learning_equivalencies(id) ON DELETE CASCADE,
 actor_id uuid NOT NULL, decision text NOT NULL, version integer NOT NULL, feedback text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.job_application_verifications (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), learner_id uuid NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES public.users(id), opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
 requirements_version bigint NOT NULL, evidence jsonb NOT NULL, verified_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX job_application_verifications_learner ON public.job_application_verifications(learner_id,verified_at);
CREATE INDEX job_application_verifications_opportunity ON public.job_application_verifications(opportunity_id);
ALTER TABLE public.applied_jobs ADD COLUMN learning_verification_id uuid REFERENCES public.job_application_verifications(id),
 ADD COLUMN learning_snapshot jsonb;

CREATE FUNCTION public.guard_job_learning_requirements() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE requirement jsonb; seen uuid[] := '{}'; level uuid;
BEGIN
 IF TG_OP='UPDATE' AND NEW.learning_requirements=OLD.learning_requirements THEN
  NEW.learning_requirements_version := OLD.learning_requirements_version; RETURN NEW;
 END IF;
 IF jsonb_typeof(NEW.learning_requirements)<>'array' OR jsonb_array_length(NEW.learning_requirements)>20 THEN
  RAISE EXCEPTION 'INVALID_LEARNING_REQUIREMENTS' USING ERRCODE='22023';
 END IF;
 FOR requirement IN SELECT value FROM jsonb_array_elements(NEW.learning_requirements) LOOP
  level := (requirement->>'levelId')::uuid;
  IF level IS NULL OR level=ANY(seen) OR jsonb_typeof(requirement->'mandatory') IS DISTINCT FROM 'boolean'
   OR NOT EXISTS(SELECT 1 FROM public.job_learning_catalog c WHERE c.level_id=level AND c.fingerprint=requirement->>'fingerprint') THEN
   RAISE EXCEPTION 'INVALID_OR_STALE_LEARNING_REQUIREMENTS' USING ERRCODE='22023';
  END IF;
  seen := array_append(seen,level);
 END LOOP;
 IF TG_OP='UPDATE' THEN
  IF NEW.learning_requirements_version<>OLD.learning_requirements_version THEN
   RAISE EXCEPTION 'LEARNING_REQUIREMENTS_CHANGED' USING ERRCODE='40001';
  END IF;
  NEW.learning_requirements_version := OLD.learning_requirements_version+1;
 ELSE NEW.learning_requirements_version:=1;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_job_learning_requirements BEFORE INSERT OR UPDATE ON public.opportunities
 FOR EACH ROW EXECUTE FUNCTION public.guard_job_learning_requirements();
CREATE FUNCTION public.record_job_learning_requirements() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF TG_OP='INSERT' OR NEW.learning_requirements IS DISTINCT FROM OLD.learning_requirements THEN
  INSERT INTO public.job_learning_requirement_history(opportunity_id,version,requirements)
   VALUES(NEW.id,NEW.learning_requirements_version,NEW.learning_requirements);
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER record_job_learning_requirements AFTER INSERT OR UPDATE ON public.opportunities
 FOR EACH ROW EXECUTE FUNCTION public.record_job_learning_requirements();

-- Covers every application writer, including legacy aliases. Only a private,
-- short-lived server-issued verification can authorize required-learning jobs.
CREATE FUNCTION public.guard_learning_application() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE job public.opportunities; proof public.job_application_verifications;
BEGIN
 SELECT * INTO STRICT job FROM public.opportunities WHERE id=NEW.opportunity_id FOR SHARE;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(job.learning_requirements) r WHERE (r->>'mandatory')::boolean) THEN
  SELECT * INTO proof FROM public.job_application_verifications WHERE id=NEW.learning_verification_id;
  IF NOT FOUND OR proof.learner_id<>NEW.learner_id OR proof.opportunity_id<>job.id
    OR proof.requirements_version<>job.learning_requirements_version
    OR proof.verified_at<clock_timestamp()-interval '30 seconds'
    OR NOT EXISTS(SELECT 1 FROM public.learners WHERE id=proof.learner_id AND user_id=proof.user_id)
    OR job.status<>'open' OR job.is_active IS DISTINCT FROM true OR job.deadline<=clock_timestamp() THEN
   RAISE EXCEPTION 'LEARNING_VERIFICATION_REQUIRED' USING ERRCODE='42501';
  END IF;
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(job.learning_requirements) r WHERE (r->>'mandatory')::boolean AND NOT EXISTS(
    SELECT 1 FROM jsonb_array_elements(proof.evidence->'criteria') e WHERE e->>'levelId'=r->>'levelId'
    AND e->>'fingerprint'=r->>'fingerprint' AND e->>'status'='eligible')) THEN
   RAISE EXCEPTION 'REQUIRED_LEVEL_NOT_APPROVED' USING ERRCODE='42501';
  END IF;
  NEW.learning_snapshot := jsonb_build_object('requirements',job.learning_requirements,'requirementsVersion',job.learning_requirements_version,
    'evidence',proof.evidence,'verifiedAt',proof.verified_at);
 ELSE NEW.learning_snapshot:=jsonb_build_object('requirements',job.learning_requirements,'requirementsVersion',job.learning_requirements_version);
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER guard_learning_application BEFORE INSERT ON public.applied_jobs FOR EACH ROW EXECUTE FUNCTION public.guard_learning_application();

CREATE FUNCTION public.review_learning_equivalency(p_id uuid,p_reviewer uuid,p_version integer,p_decision text,p_feedback text)
RETURNS public.learning_equivalencies LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE item public.learning_equivalencies; learner public.learners;
BEGIN
 SELECT * INTO STRICT item FROM public.learning_equivalencies WHERE id=p_id FOR UPDATE;
 SELECT * INTO STRICT learner FROM public.learners WHERE id=item.learner_id;
 IF learner.user_id=p_reviewer OR NOT (
  EXISTS(SELECT 1 FROM public.school_educators e WHERE e.user_id=p_reviewer AND e.school_id=learner.school_id AND e.account_status='active') OR
  EXISTS(SELECT 1 FROM public.college_lecturers e WHERE e.user_id=p_reviewer AND e."collegeId"=learner.college_id AND e."accountStatus"='active')
 ) THEN RAISE EXCEPTION 'REVIEWER_FORBIDDEN' USING ERRCODE='42501'; END IF;
 IF item.version<>p_version THEN RAISE EXCEPTION 'REVIEW_CHANGED' USING ERRCODE='40001'; END IF;
 IF p_decision NOT IN ('approved','rejected','revoked') OR length(trim(coalesce(p_feedback,''))) NOT BETWEEN 1 AND 4000 THEN
  RAISE EXCEPTION 'INVALID_REVIEW' USING ERRCODE='22023'; END IF;
 IF (item.status='approved' AND p_decision<>'revoked') OR (item.status<>'pending' AND p_decision<>'revoked') THEN
  RAISE EXCEPTION 'INVALID_REVIEW_TRANSITION' USING ERRCODE='22023'; END IF;
 IF p_decision='approved' AND NOT EXISTS(SELECT 1 FROM public.job_learning_catalog WHERE level_id=item.level_id AND fingerprint=item.fingerprint) THEN
  RAISE EXCEPTION 'CATALOG_CHANGED' USING ERRCODE='40001'; END IF;
 UPDATE public.learning_equivalencies SET status=p_decision,reviewer_id=p_reviewer,feedback=trim(p_feedback),reviewed_at=now(),version=version+1 WHERE id=p_id RETURNING * INTO item;
 INSERT INTO public.learning_equivalency_audit(equivalency_id,actor_id,decision,version,feedback) VALUES(item.id,p_reviewer,p_decision,item.version,trim(p_feedback));
 RETURN item;
END $$;

DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['job_learning_catalog','job_learning_requirement_history','learning_equivalencies','learning_equivalency_audit','job_application_verifications'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
  EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO service_role',t);
 END LOOP;
END $$;
REVOKE UPDATE,DELETE ON public.job_learning_requirement_history,public.learning_equivalency_audit FROM service_role;
REVOKE ALL ON FUNCTION public.guard_job_learning_requirements(),public.record_job_learning_requirements(),public.guard_learning_application(),
 public.review_learning_equivalency(uuid,uuid,integer,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.review_learning_equivalency(uuid,uuid,integer,text,text) TO service_role;
COMMIT;
