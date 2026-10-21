-- Version acceptance under the same row locks as contract creation. Ordinary
-- child updates/deletions use updated_at in their SQL predicate in the API.
BEGIN;
DROP FUNCTION IF EXISTS public.recruitment_accept_proposal(uuid,uuid,uuid);
CREATE OR REPLACE FUNCTION public.recruitment_accept_proposal(p_project_id uuid,p_proposal_id uuid,p_organization_id uuid,p_expected_updated_at timestamptz) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE project public.recruitment_projects; proposal public.recruitment_project_proposals;
BEGIN
 SELECT * INTO project FROM public.recruitment_projects WHERE id=p_project_id AND organization_id=p_organization_id FOR UPDATE;
 IF NOT FOUND THEN RETURN NULL; END IF;
 SELECT * INTO proposal FROM public.recruitment_project_proposals WHERE id=p_proposal_id AND project_id=project.id FOR UPDATE;
 IF NOT FOUND THEN RETURN NULL; END IF;
 IF p_expected_updated_at IS NULL OR proposal.updated_at IS DISTINCT FROM p_expected_updated_at THEN RETURN jsonb_build_object('error','Proposal changed; refresh and retry','code','RECORD_CHANGED'); END IF;
 IF proposal.status='accepted' THEN RETURN to_jsonb(proposal); END IF;
 IF project.status IN ('completed','cancelled') OR EXISTS(SELECT 1 FROM public.recruitment_project_proposals WHERE project_id=project.id AND status='accepted') THEN
   RETURN jsonb_build_object('error','This project already has an accepted contract or is closed');
 END IF;
 UPDATE public.recruitment_project_proposals SET status='accepted',updated_at=now() WHERE id=proposal.id RETURNING * INTO proposal;
 UPDATE public.recruitment_projects SET status='in_progress',updated_at=now() WHERE id=project.id;
 RETURN to_jsonb(proposal);
END $$;
REVOKE ALL ON FUNCTION public.recruitment_accept_proposal(uuid,uuid,uuid,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.recruitment_accept_proposal(uuid,uuid,uuid,timestamptz) TO service_role;

NOTIFY pgrst,'reload schema';
COMMIT;
