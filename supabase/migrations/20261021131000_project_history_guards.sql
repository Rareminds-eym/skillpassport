-- Serialize child changes with project closure/deletion and retain agreed work.
CREATE OR REPLACE FUNCTION public.guard_recruitment_project_record() RETURNS trigger
LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE parent_status text;
BEGIN
 SELECT status INTO parent_status FROM recruitment_projects WHERE id=coalesce(NEW.project_id,OLD.project_id) FOR UPDATE;
 IF parent_status IS NULL AND TG_OP='DELETE' THEN RETURN OLD; END IF;
 IF TG_OP='UPDATE' AND NEW.project_id<>OLD.project_id THEN RAISE EXCEPTION 'A record cannot move between projects' USING ERRCODE='23514'; END IF;
 IF TG_OP IN ('UPDATE','DELETE') AND OLD.status IN ('accepted','approved') THEN RAISE EXCEPTION 'Agreed work is retained in project history' USING ERRCODE='23514'; END IF;
 IF parent_status IN ('completed','cancelled') THEN RAISE EXCEPTION 'Closed project records are retained in history' USING ERRCODE='23514'; END IF;
 RETURN CASE WHEN TG_OP='DELETE' THEN OLD ELSE NEW END;
END $$;
DROP TRIGGER IF EXISTS recruitment_proposal_history_guard ON public.recruitment_project_proposals;
CREATE TRIGGER recruitment_proposal_history_guard BEFORE INSERT OR UPDATE OR DELETE ON public.recruitment_project_proposals FOR EACH ROW EXECUTE FUNCTION public.guard_recruitment_project_record();
DROP TRIGGER IF EXISTS recruitment_milestone_history_guard ON public.recruitment_project_milestones;
CREATE TRIGGER recruitment_milestone_history_guard BEFORE INSERT OR UPDATE OR DELETE ON public.recruitment_project_milestones FOR EACH ROW EXECUTE FUNCTION public.guard_recruitment_project_record();

CREATE OR REPLACE FUNCTION public.recruitment_delete_draft_project(p_project_id uuid,p_org uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE project_status text;
BEGIN
 SELECT status INTO project_status FROM recruitment_projects WHERE id=p_project_id AND organization_id=p_org FOR UPDATE;
 IF project_status IS NULL THEN RETURN jsonb_build_object('error','Project not found'); END IF;
 IF project_status<>'draft' OR EXISTS(SELECT 1 FROM recruitment_project_proposals WHERE project_id=p_project_id) THEN RETURN jsonb_build_object('error','Cancel this project to preserve its hiring history'); END IF;
 DELETE FROM recruitment_projects WHERE id=p_project_id AND organization_id=p_org;
 RETURN jsonb_build_object('deleted',true);
END $$;
REVOKE ALL ON FUNCTION public.recruitment_delete_draft_project(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.recruitment_delete_draft_project(uuid,uuid) TO service_role;
NOTIFY pgrst,'reload schema';
