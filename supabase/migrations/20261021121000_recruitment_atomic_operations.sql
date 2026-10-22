BEGIN;
CREATE UNIQUE INDEX IF NOT EXISTS recruitment_project_one_contract_idx ON public.recruitment_project_proposals(project_id) WHERE status = 'accepted';
CREATE OR REPLACE FUNCTION public.recruitment_accept_proposal(p_project_id uuid,p_proposal_id uuid,p_organization_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE project public.recruitment_projects; proposal public.recruitment_project_proposals;
BEGIN
 SELECT * INTO project FROM public.recruitment_projects WHERE id=p_project_id AND organization_id=p_organization_id FOR UPDATE;
 IF NOT FOUND THEN RETURN NULL; END IF;
 SELECT * INTO proposal FROM public.recruitment_project_proposals WHERE id=p_proposal_id AND project_id=project.id FOR UPDATE;
 IF NOT FOUND THEN RETURN NULL; END IF;
 IF proposal.status='accepted' THEN RETURN to_jsonb(proposal); END IF;
 IF project.status IN ('completed','cancelled') OR EXISTS(SELECT 1 FROM public.recruitment_project_proposals WHERE project_id=project.id AND status='accepted') THEN
   RETURN jsonb_build_object('error','This project already has an accepted contract or is closed');
 END IF;
 UPDATE public.recruitment_project_proposals SET status='accepted',updated_at=now() WHERE id=proposal.id RETURNING * INTO proposal;
 UPDATE public.recruitment_projects SET status='in_progress',updated_at=now() WHERE id=project.id;
 RETURN to_jsonb(proposal);
END $$;
REVOKE ALL ON FUNCTION public.recruitment_accept_proposal(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.recruitment_accept_proposal(uuid,uuid,uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.save_recruitment_preferences(p_user_id uuid,p_preferences jsonb) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$
 INSERT INTO public.user_settings(user_id,notification_preferences,updated_by)
 VALUES(p_user_id,jsonb_build_object('recruitment',p_preferences),p_user_id)
 ON CONFLICT(user_id) DO UPDATE SET notification_preferences=jsonb_set(COALESCE(user_settings.notification_preferences,'{}'::jsonb),'{recruitment}',p_preferences),updated_at=now(),updated_by=p_user_id;
$$;
REVOKE ALL ON FUNCTION public.save_recruitment_preferences(uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_recruitment_preferences(uuid,jsonb) TO service_role;

CREATE TABLE IF NOT EXISTS public.recruitment_work_review_events(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),review_id uuid NOT NULL REFERENCES public.recruitment_work_reviews(id) ON DELETE CASCADE,
 organization_id uuid NOT NULL REFERENCES public.organizations(id),status text NOT NULL,note text NOT NULL,
 reviewed_by uuid REFERENCES public.users(id),created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS recruitment_work_review_events_review_idx ON public.recruitment_work_review_events(review_id,created_at);
ALTER TABLE public.recruitment_work_review_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.recruitment_work_review_events FROM anon,authenticated;
GRANT SELECT ON public.recruitment_work_review_events TO service_role;
CREATE OR REPLACE FUNCTION public.record_recruitment_work_review() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
 INSERT INTO public.recruitment_work_review_events(review_id,organization_id,status,note,reviewed_by)
 VALUES(NEW.id,NEW.organization_id,NEW.status,NEW.note,NEW.reviewed_by);
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.record_recruitment_work_review() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER recruitment_work_review_history AFTER INSERT OR UPDATE ON public.recruitment_work_reviews FOR EACH ROW EXECUTE FUNCTION public.record_recruitment_work_review();
NOTIFY pgrst,'reload schema';
COMMIT;
