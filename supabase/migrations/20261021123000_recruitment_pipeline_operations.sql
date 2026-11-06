-- All selected rows are locked and authorized before any change is committed.
CREATE OR REPLACE FUNCTION public.recruitment_pipeline_operation(
 p_org uuid,p_actor uuid,p_ids uuid[],p_action text,p_assignee uuid DEFAULT NULL,p_reason text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE row public.pipeline_candidates; found integer:=0;
BEGIN
 IF cardinality(p_ids) NOT BETWEEN 1 AND 100 OR p_action NOT IN ('assign','reject') THEN
  RETURN jsonb_build_object('error','Invalid operation');
 END IF;
 IF p_action='assign' AND NOT EXISTS(SELECT 1 FROM organization_members WHERE organization_id=p_org AND user_id=p_assignee AND status='active') THEN
  RETURN jsonb_build_object('error','Assignee is not an active organization member');
 END IF;
 IF p_action='reject' AND length(trim(coalesce(p_reason,''))) NOT BETWEEN 1 AND 2000 THEN
  RETURN jsonb_build_object('error','A rejection reason is required');
 END IF;
 FOR row IN SELECT * FROM pipeline_candidates WHERE id=ANY(p_ids) AND organization_id=p_org ORDER BY id FOR UPDATE LOOP
  found:=found+1;
  IF row.status='hired' OR row.stage='hired' THEN RETURN jsonb_build_object('error','Hired candidates cannot be changed with bulk actions'); END IF;
 END LOOP;
 IF found<>(SELECT count(DISTINCT x) FROM unnest(p_ids) x) THEN RETURN jsonb_build_object('error','One or more candidates are unavailable in this organization'); END IF;
 FOR row IN SELECT * FROM pipeline_candidates WHERE id=ANY(p_ids) AND organization_id=p_org LOOP
  IF p_action='assign' THEN
   UPDATE pipeline_candidates SET assigned_to=p_assignee::text,assigned_to_uuid=p_assignee,updated_at=now() WHERE id=row.id;
  ELSIF row.status IS DISTINCT FROM 'rejected' THEN
   UPDATE pipeline_candidates SET status='rejected',rejection_reason=p_reason,rejection_date=now(),updated_at=now() WHERE id=row.id;
   UPDATE applied_jobs SET application_status='rejected',updated_by=p_actor,updated_at=now()
    WHERE opportunity_id=row.opportunity_id AND learner_id IN (SELECT id FROM learners WHERE id=row.learner_id OR user_id=row.learner_id UNION SELECT user_id FROM learners WHERE id=row.learner_id OR user_id=row.learner_id)
    AND application_status IS DISTINCT FROM 'rejected';
  ELSE CONTINUE;
  END IF;
  INSERT INTO pipeline_activities(candidate_uuid,learner_id,activity_type,from_stage,to_stage,performed_by,activity_details)
   VALUES(row.id,row.learner_id,CASE WHEN p_action='assign' THEN 'assigned' ELSE 'rejected' END,row.stage,row.stage,p_actor::text,jsonb_build_object('reason',p_reason,'assigned_to',p_assignee));
 END LOOP;
 RETURN jsonb_build_object('count',found);
END $$;
REVOKE ALL ON FUNCTION public.recruitment_pipeline_operation(uuid,uuid,uuid[],text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.recruitment_pipeline_operation(uuid,uuid,uuid[],text,uuid,text) TO service_role;

CREATE TABLE IF NOT EXISTS public.recruitment_email_submissions(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),organization_id uuid NOT NULL REFERENCES organizations(id),actor_id uuid NOT NULL REFERENCES users(id),
 candidate_id uuid NOT NULL REFERENCES pipeline_candidates(id) ON DELETE CASCADE,request_key uuid NOT NULL,
 state text NOT NULL CHECK(state IN ('processing','submitted','unknown')),provider_message_id text,created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(actor_id,request_key,candidate_id)
);
ALTER TABLE public.recruitment_email_submissions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.recruitment_email_submissions FROM anon,authenticated;
GRANT ALL ON public.recruitment_email_submissions TO service_role;
NOTIFY pgrst,'reload schema';
