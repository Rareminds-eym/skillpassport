-- No historical conversion. Existing rows retain format 1; new writes use format 2.
BEGIN;
SET LOCAL lock_timeout='5s';
ALTER TABLE public.opportunities ADD COLUMN learning_requirements_format smallint NOT NULL DEFAULT 1 CHECK(learning_requirements_format IN (1,2));
CREATE TABLE public.opportunity_learning_requirements (
 opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
 level_id uuid NOT NULL REFERENCES public.job_learning_catalog(level_id),
 required_fingerprint text NOT NULL CHECK(required_fingerprint ~ '^[a-f0-9]{32}$'),
 requirement_kind text NOT NULL CHECK(requirement_kind IN ('mandatory','preferred')),
 position smallint NOT NULL CHECK(position BETWEEN 0 AND 19),
 PRIMARY KEY(opportunity_id,level_id),UNIQUE(opportunity_id,position)
);
CREATE INDEX opportunity_learning_requirements_level ON public.opportunity_learning_requirements(level_id);
ALTER TABLE public.opportunity_learning_requirements ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.opportunity_learning_requirements FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.opportunity_learning_requirements TO service_role;
COMMENT ON COLUMN public.opportunities.learning_requirements IS 'Legacy requirements for format 1; database-maintained compatibility snapshot/write adapter for format 2. Child rows are the normalized relationship; direct child writes are forbidden.';
CREATE OR REPLACE FUNCTION public.guard_job_learning_requirements() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE requirement jsonb; seen uuid[] := '{}'; level uuid; canonical jsonb:='[]'; catalog public.job_learning_catalog;
BEGIN
 IF (TG_OP='INSERT' OR NEW.learning_requirements IS DISTINCT FROM OLD.learning_requirements OR NEW.learning_requirements_format IS DISTINCT FROM OLD.learning_requirements_format)
 AND current_user NOT IN ('postgres','service_role','supabase_admin') THEN
  RAISE EXCEPTION 'LEARNING_REQUIREMENTS_SERVER_WRITE_REQUIRED' USING ERRCODE='42501';
 END IF;
 IF TG_OP='UPDATE' THEN
  IF NEW.learning_requirements_format<>OLD.learning_requirements_format THEN RAISE EXCEPTION 'REQUIREMENT_FORMAT_SERVER_OWNED' USING ERRCODE='42501'; END IF;
  IF NEW.learning_requirements=OLD.learning_requirements THEN
   NEW.learning_requirements_version:=OLD.learning_requirements_version;RETURN NEW;
  END IF;
 END IF;
 IF jsonb_typeof(NEW.learning_requirements) IS DISTINCT FROM 'array' OR jsonb_array_length(NEW.learning_requirements)>20 THEN
  RAISE EXCEPTION 'INVALID_LEARNING_REQUIREMENTS' USING ERRCODE='22023';
 END IF;
 FOR requirement IN SELECT value FROM jsonb_array_elements(NEW.learning_requirements) LOOP
  level:=(requirement->>'levelId')::uuid;
  SELECT * INTO catalog FROM public.job_learning_catalog c WHERE c.level_id=level AND c.fingerprint=requirement->>'fingerprint';
  IF NOT FOUND OR level=ANY(seen) OR jsonb_typeof(requirement->'mandatory') IS DISTINCT FROM 'boolean' THEN
   RAISE EXCEPTION 'INVALID_OR_STALE_LEARNING_REQUIREMENTS' USING ERRCODE='22023';
  END IF;
  seen:=array_append(seen,level);
  canonical:=canonical||jsonb_build_array(jsonb_build_object('levelId',level,'fingerprint',catalog.fingerprint,'mandatory',(requirement->>'mandatory')::boolean,
   'capabilityName',catalog.capability_name,'title',catalog.title,'levelNumber',catalog.level_number,'version',catalog.version));
 END LOOP;
 -- Label-only client changes are a no-op. Presentation order is significant.
 IF TG_OP='UPDATE' THEN
  IF EXISTS(SELECT 1 FROM jsonb_array_elements(OLD.learning_requirements) WITH ORDINALITY r
    FULL JOIN jsonb_array_elements(canonical) WITH ORDINALITY n ON r.ordinality=n.ordinality
    WHERE r.value->>'levelId' IS DISTINCT FROM n.value->>'levelId' OR r.value->>'fingerprint' IS DISTINCT FROM n.value->>'fingerprint' OR r.value->'mandatory' IS DISTINCT FROM n.value->'mandatory') THEN
   IF NEW.learning_requirements_version<>OLD.learning_requirements_version THEN RAISE EXCEPTION 'LEARNING_REQUIREMENTS_CHANGED' USING ERRCODE='40001'; END IF;
   NEW.learning_requirements_version:=OLD.learning_requirements_version+1;
  ELSE
   NEW.learning_requirements:=OLD.learning_requirements;NEW.learning_requirements_version:=OLD.learning_requirements_version;RETURN NEW;
  END IF;
 ELSE NEW.learning_requirements_version:=1;
 END IF;
 NEW.learning_requirements:=canonical;NEW.learning_requirements_format:=2;
 RETURN NEW;
END $$;
CREATE FUNCTION public.materialize_job_learning_requirements() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF NEW.learning_requirements_format=2 AND (TG_OP='INSERT' OR NEW.learning_requirements IS DISTINCT FROM OLD.learning_requirements) THEN
  DELETE FROM public.opportunity_learning_requirements WHERE opportunity_id=NEW.id;
  INSERT INTO public.opportunity_learning_requirements(opportunity_id,level_id,required_fingerprint,requirement_kind,position)
   SELECT NEW.id,(r.value->>'levelId')::uuid,r.value->>'fingerprint',CASE WHEN (r.value->>'mandatory')::boolean THEN 'mandatory' ELSE 'preferred' END,r.ordinality-1
   FROM jsonb_array_elements(NEW.learning_requirements) WITH ORDINALITY r;
 END IF;
 RETURN NULL;
END $$;
-- Runs before the existing history and notification AFTER triggers. All changes
-- commit in the same transaction, including job creation and ordinary job fields.
CREATE TRIGGER aa_materialize_job_learning_requirements AFTER INSERT OR UPDATE ON public.opportunities
 FOR EACH ROW EXECUTE FUNCTION public.materialize_job_learning_requirements();
CREATE FUNCTION public.effective_job_learning_requirements(p_job public.opportunities) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT CASE WHEN p_job.learning_requirements_format=1 THEN p_job.learning_requirements ELSE coalesce((
  SELECT jsonb_agg(jsonb_build_object('levelId',r.level_id,'fingerprint',r.required_fingerprint,'mandatory',r.requirement_kind='mandatory')||
   jsonb_build_object('capabilityName',s.value->>'capabilityName','title',s.value->>'title','levelNumber',(s.value->>'levelNumber')::integer,'version',(s.value->>'version')::integer) ORDER BY r.position)
  FROM public.opportunity_learning_requirements r
  JOIN LATERAL jsonb_array_elements(p_job.learning_requirements) s ON s.value->>'levelId'=r.level_id::text
  WHERE r.opportunity_id=p_job.id),'[]') END;
$$;
-- Typed navigation, independent durable receipts remain after inbox deletion.
ALTER TABLE public.notifications ADD COLUMN opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE SET NULL,
 ADD COLUMN learning_requirements_version bigint CHECK(learning_requirements_version>0);
CREATE INDEX notifications_opportunity ON public.notifications(opportunity_id) WHERE opportunity_id IS NOT NULL;
REVOKE ALL ON FUNCTION public.materialize_job_learning_requirements(),public.effective_job_learning_requirements(public.opportunities) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.effective_job_learning_requirements(public.opportunities) TO service_role;
CREATE OR REPLACE FUNCTION public.guard_learning_application() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE job public.opportunities; proof public.job_application_verifications;
BEGIN
 SELECT * INTO STRICT job FROM public.opportunities WHERE id=NEW.opportunity_id FOR SHARE;
 job.learning_requirements:=public.effective_job_learning_requirements(job);
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
CREATE OR REPLACE FUNCTION public.learning_job_feed(p_user uuid,p_learner uuid,p_catalog jsonb,p_approved jsonb,p_state text DEFAULT 'eligible',p_search text DEFAULT '',p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
WITH matches AS (
 SELECT o job,CASE WHEN jsonb_array_length(public.effective_job_learning_requirements(o))=0 THEN 'requirements_unspecified'
 WHEN EXISTS(SELECT 1 FROM jsonb_array_elements(public.effective_job_learning_requirements(o)) r WHERE (r->>'mandatory')::boolean
  AND EXISTS(SELECT 1 FROM jsonb_array_elements(p_catalog) c WHERE c->>'levelId'=r->>'levelId' AND c->>'fingerprint'=r->>'fingerprint')
  AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_approved) a WHERE a->>'levelId'=r->>'levelId' AND a->>'fingerprint'=r->>'fingerprint')) THEN 'not_yet_eligible'
 WHEN EXISTS(SELECT 1 FROM jsonb_array_elements(public.effective_job_learning_requirements(o)) r WHERE (r->>'mandatory')::boolean
  AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_catalog) c WHERE c->>'levelId'=r->>'levelId' AND c->>'fingerprint'=r->>'fingerprint')) THEN 'unknown'
 ELSE 'eligible' END state
 FROM public.opportunities o WHERE o.status='open' AND o.is_active AND (o.deadline IS NULL OR o.deadline>now())
 AND public.learning_job_audience_allows(p_learner,o.employment_type)
 AND EXISTS(SELECT 1 FROM public.learners WHERE id=p_learner AND user_id=p_user)
 AND position(lower(coalesce(p_search,'')) IN lower(concat_ws(' ',o.job_title,o.title,o.company_name,o.department,o.location)))>0
), filtered AS (SELECT * FROM matches WHERE p_state='all' OR state=p_state), page AS (
 SELECT job,row_number() OVER(ORDER BY CASE state WHEN 'eligible' THEN 0 WHEN 'not_yet_eligible' THEN 1 ELSE 2 END,(job).created_at DESC,(job).id) ord
 FROM filtered ORDER BY CASE state WHEN 'eligible' THEN 0 WHEN 'not_yet_eligible' THEN 1 ELSE 2 END,(job).created_at DESC,(job).id
 LIMIT 12 OFFSET greatest(0,least(p_offset,100000))
)
SELECT jsonb_build_object('jobs',coalesce((SELECT jsonb_agg(to_jsonb(job) ORDER BY ord) FROM page),'[]'),'total',(SELECT count(*) FROM filtered));
$$;
CREATE OR REPLACE FUNCTION public.record_learning_job_notification(p_learner uuid,p_job uuid,p_version bigint) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE job public.opportunities; subject uuid;
BEGIN
 SELECT * INTO job FROM public.opportunities WHERE id=p_job AND learning_requirements_version=p_version AND status='open' AND is_active AND (deadline IS NULL OR deadline>now()) FOR SHARE;
 IF NOT FOUND THEN RETURN false; END IF;
 job.learning_requirements:=public.effective_job_learning_requirements(job);
 IF jsonb_array_length(job.learning_requirements)=0 THEN RETURN false; END IF;
 SELECT user_id INTO subject FROM public.learners WHERE id=p_learner AND is_deleted=false;
 IF subject IS NULL OR NOT public.learning_job_audience_allows(p_learner,job.employment_type) OR EXISTS(SELECT 1 FROM public.applied_jobs WHERE learner_id=p_learner AND opportunity_id=p_job)
 OR EXISTS(SELECT 1 FROM public.user_settings WHERE user_id=subject AND notification_preferences->>'newOpportunities'='false') THEN RETURN false; END IF;
 INSERT INTO public.learning_job_notification_receipts(learner_id,opportunity_id,requirements_version) VALUES(p_learner,p_job,p_version) ON CONFLICT DO NOTHING;
 IF NOT FOUND THEN RETURN false; END IF;
 INSERT INTO public.notifications(recipient_id,type,title,message,opportunity_id,learning_requirements_version) VALUES(subject,'new_opportunity','Your learning matches a job opening',
  coalesce(job.job_title,job.title)||' at '||coalesce(job.company_name,'the employer')||'. Your evaluated learning meets the published requirements. Open Jobs for your learning to view it.',p_job,p_version);
 RETURN true;
END $$;
COMMIT;
