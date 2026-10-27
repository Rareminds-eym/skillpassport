BEGIN;
CREATE TABLE public.learning_job_notification_work (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),dedupe_key text NOT NULL UNIQUE,
 learner_id uuid REFERENCES public.learners(id) ON DELETE CASCADE,
 opportunity_id uuid REFERENCES public.opportunities(id) ON DELETE CASCADE,
 cursor_id uuid,lease_token uuid,lease_until timestamptz,next_attempt_at timestamptz NOT NULL DEFAULT now(),
 attempts integer NOT NULL DEFAULT 0,last_error text,completed_at timestamptz,created_at timestamptz NOT NULL DEFAULT now(),
 CHECK((learner_id IS NULL)<>(opportunity_id IS NULL))
);
CREATE INDEX learning_job_work_pending ON public.learning_job_notification_work(next_attempt_at,id) WHERE completed_at IS NULL;
CREATE TABLE public.learning_job_notification_receipts (
 learner_id uuid NOT NULL REFERENCES public.learners(id) ON DELETE CASCADE,
 opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
 requirements_version bigint NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(learner_id,opportunity_id,requirements_version)
);
CREATE FUNCTION public.enqueue_learning_job_notification() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE learner uuid; key text;
BEGIN
 IF TG_TABLE_NAME='opportunities' THEN
  IF NEW.status='open' AND NEW.is_active AND jsonb_array_length(NEW.learning_requirements)>0 THEN
   INSERT INTO public.learning_job_notification_work(dedupe_key,opportunity_id) VALUES('job:'||NEW.id||':'||NEW.learning_requirements_version,NEW.id) ON CONFLICT(dedupe_key) DO NOTHING;
  END IF; RETURN NULL;
 ELSIF TG_TABLE_NAME='lte_review_events' THEN
  IF NEW.event_type<>'lte.artifact_reviewed_pass' THEN RETURN NULL; END IF;
  SELECT id INTO learner FROM public.learners WHERE user_id=NEW.learner_user_id;
  key:='review:'||NEW.event_id;
 ELSIF TG_TABLE_NAME='learning_equivalencies' THEN
  IF NEW.status<>'approved' THEN RETURN NULL; END IF;
  learner:=NEW.learner_id;key:='equivalency:'||NEW.id||':'||NEW.version;
 ELSE
  IF NEW.source<>'lte' OR NEW.source_revision IS NULL THEN RETURN NULL; END IF;
  learner:=NEW.learner_id;key:='progress:'||NEW.learner_id||':'||NEW.source_revision;
 END IF;
 IF learner IS NOT NULL THEN
  INSERT INTO public.learning_job_notification_work(dedupe_key,learner_id) VALUES(key,learner) ON CONFLICT(dedupe_key) DO NOTHING;
 END IF;
 RETURN NULL;
END $$;
CREATE TRIGGER enqueue_learning_opening AFTER INSERT OR UPDATE OF learning_requirements,status,is_active ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.enqueue_learning_job_notification();
CREATE TRIGGER enqueue_reviewed_learning AFTER INSERT ON public.lte_review_events FOR EACH ROW EXECUTE FUNCTION public.enqueue_learning_job_notification();
CREATE TRIGGER enqueue_equivalent_learning AFTER UPDATE OF status ON public.learning_equivalencies FOR EACH ROW EXECUTE FUNCTION public.enqueue_learning_job_notification();
CREATE TRIGGER enqueue_completed_learning AFTER INSERT OR UPDATE OF source_revision ON public.trainings FOR EACH ROW EXECUTE FUNCTION public.enqueue_learning_job_notification();
CREATE FUNCTION public.claim_learning_job_notification_work() RETURNS public.learning_job_notification_work
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 UPDATE public.learning_job_notification_work SET lease_token=gen_random_uuid(),lease_until=now()+interval '3 minutes',attempts=attempts+1
 WHERE id=(SELECT id FROM public.learning_job_notification_work WHERE completed_at IS NULL AND next_attempt_at<=now() AND (lease_until IS NULL OR lease_until<now())
 ORDER BY next_attempt_at,id FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING *;
$$;
CREATE FUNCTION public.finish_learning_job_notification_work(p_id uuid,p_token uuid,p_cursor uuid,p_done boolean,p_error text DEFAULT NULL) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 UPDATE public.learning_job_notification_work SET cursor_id=CASE WHEN p_error IS NULL THEN p_cursor ELSE cursor_id END,
 completed_at=CASE WHEN p_done AND p_error IS NULL THEN now() ELSE NULL END,lease_until=NULL,lease_token=NULL,
 next_attempt_at=now()+CASE WHEN p_error IS NULL THEN interval '0 seconds' ELSE interval '2 minutes' END,last_error=left(p_error,500)
 WHERE id=p_id AND lease_token=p_token;
$$;
CREATE FUNCTION public.record_learning_job_notification(p_learner uuid,p_job uuid,p_version bigint) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE job public.opportunities; subject uuid;
BEGIN
 SELECT * INTO job FROM public.opportunities WHERE id=p_job AND learning_requirements_version=p_version AND status='open' AND is_active AND (deadline IS NULL OR deadline>now()) FOR SHARE;
 IF NOT FOUND OR jsonb_array_length(job.learning_requirements)=0 THEN RETURN false; END IF;
 SELECT user_id INTO subject FROM public.learners WHERE id=p_learner AND is_deleted=false;
 IF subject IS NULL OR EXISTS(SELECT 1 FROM public.applied_jobs WHERE learner_id=p_learner AND opportunity_id=p_job)
 OR EXISTS(SELECT 1 FROM public.user_settings WHERE user_id=subject AND notification_preferences->>'newOpportunities'='false') THEN RETURN false; END IF;
 INSERT INTO public.learning_job_notification_receipts(learner_id,opportunity_id,requirements_version) VALUES(p_learner,p_job,p_version) ON CONFLICT DO NOTHING;
 IF NOT FOUND THEN RETURN false; END IF;
 INSERT INTO public.notifications(recipient_id,type,title,message) VALUES(subject,'new_opportunity','Your learning matches a job opening',
  coalesce(job.job_title,job.title)||' at '||coalesce(job.company_name,'the employer')||'. Your reviewed learning meets the published requirements. Open Jobs for your learning to view it.');
 RETURN true;
END $$;
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['learning_job_notification_work','learning_job_notification_receipts'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
  EXECUTE format('GRANT SELECT,INSERT,UPDATE,DELETE ON public.%I TO service_role',t);
 END LOOP;
END $$;
REVOKE ALL ON FUNCTION public.enqueue_learning_job_notification(),public.claim_learning_job_notification_work(),public.finish_learning_job_notification_work(uuid,uuid,uuid,boolean,text),public.record_learning_job_notification(uuid,uuid,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_learning_job_notification_work(),public.finish_learning_job_notification_work(uuid,uuid,uuid,boolean,text),public.record_learning_job_notification(uuid,uuid,bigint) TO service_role;
COMMIT;
