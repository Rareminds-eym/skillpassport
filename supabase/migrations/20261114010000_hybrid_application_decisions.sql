-- Atomic application decisions. Deploy before callers; no HTTP fallback is safe.
BEGIN;
CREATE OR REPLACE FUNCTION public.recruitment_move_pipeline_candidates(
  p_org uuid, p_actor uuid, p_ids uuid[], p_stage text, p_notes text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE c public.pipeline_candidates; a public.applied_jobs; changed public.pipeline_candidates;
  target_status text; found_count integer := 0; result jsonb := '[]'::jsonb;
BEGIN
  IF p_ids IS NULL OR cardinality(p_ids) NOT BETWEEN 1 AND 100 OR array_position(p_ids,NULL) IS NOT NULL
     OR p_stage IS NULL OR p_stage NOT IN ('sourced','screened','interview_1','interview_2','offer','hired','rejected') THEN
    RETURN jsonb_build_object('code','VALIDATION_ERROR','message','Select 1–100 candidates and a valid stage');
  END IF;
  IF public.has_recruitment_permission(p_user_id => p_actor, p_org_id => p_org, p_permission => 'manage_candidates') IS NOT TRUE THEN
    RETURN jsonb_build_object('code','FORBIDDEN','message','Candidate management permission is required');
  END IF;
  -- Match the existing bulk rejection lock order: pipeline UUIDs, then applications.
  FOR c IN SELECT pc.* FROM public.pipeline_candidates pc
    JOIN public.opportunities o ON o.id=pc.opportunity_id AND o.organization_id=p_org
    WHERE pc.id=ANY(p_ids) AND pc.organization_id=p_org ORDER BY pc.id FOR UPDATE OF pc LOOP
    found_count := found_count+1;
  END LOOP;
  IF found_count <> (SELECT count(DISTINCT id) FROM unnest(p_ids) id) THEN
    RETURN jsonb_build_object('code','NOT_FOUND','message','Candidate not found in this organization');
  END IF;
  PERFORM aj.id FROM public.applied_jobs aj JOIN public.pipeline_candidates pc
    ON aj.opportunity_id=pc.opportunity_id AND aj.learner_id=pc.learner_id
    WHERE pc.id=ANY(p_ids) AND pc.organization_id=p_org ORDER BY aj.id FOR UPDATE OF aj;
  -- Validate all locked rows before any write, including bulk selections.
  FOR c IN SELECT * FROM public.pipeline_candidates WHERE id=ANY(p_ids) ORDER BY id LOOP
    SELECT * INTO a FROM public.applied_jobs WHERE opportunity_id=c.opportunity_id AND learner_id=c.learner_id;
    IF c.status='rejected' OR c.stage='rejected' OR a.application_status='rejected' THEN
      RETURN jsonb_build_object('code','APPLICATION_REJECTED','message','Reset the rejected application status before moving this candidate');
    END IF;
    IF EXISTS(SELECT 1 FROM public.opportunities WHERE id=c.opportunity_id AND status IN ('closed','filled')) THEN
      RETURN jsonb_build_object('code','OPPORTUNITY_CLOSED','message','This opportunity is closed');
    END IF;
  END LOOP;
  target_status := CASE p_stage WHEN 'sourced' THEN 'applied' WHEN 'screened' THEN 'under_review'
    WHEN 'interview_1' THEN 'interview_scheduled' WHEN 'interview_2' THEN 'interviewed'
    WHEN 'offer' THEN 'offer_received' WHEN 'hired' THEN 'accepted' WHEN 'rejected' THEN 'rejected' END;
  FOR c IN SELECT * FROM public.pipeline_candidates WHERE id=ANY(p_ids) ORDER BY id LOOP
    UPDATE public.pipeline_candidates SET previous_stage=c.stage, stage=p_stage,
      status=CASE WHEN p_stage='rejected' THEN 'rejected' ELSE c.status END,
      stage_changed_at=now(),stage_changed_by=p_actor::text,updated_at=now()
      WHERE id=c.id RETURNING * INTO changed;
    UPDATE public.applied_jobs SET application_status=target_status,updated_by=p_actor,updated_at=now(),
      interview_scheduled_at=CASE WHEN p_stage='interview_1' THEN now() ELSE interview_scheduled_at END
      WHERE opportunity_id=c.opportunity_id AND learner_id=c.learner_id;
    INSERT INTO public.pipeline_activities(candidate_uuid,learner_id,activity_type,from_stage,to_stage,performed_by,activity_details)
      VALUES(c.id,c.learner_id,'stage_change',c.stage,p_stage,p_actor::text,jsonb_build_object('notes',p_notes));
    result := result || jsonb_build_array(to_jsonb(changed));
  END LOOP;
  RETURN jsonb_build_object('candidates',result);
END $$;
REVOKE ALL ON FUNCTION public.recruitment_move_pipeline_candidates(uuid,uuid,uuid[],text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.recruitment_move_pipeline_candidates(uuid,uuid,uuid[],text,text) TO service_role;

CREATE OR REPLACE FUNCTION public.recruitment_shortlist_application(
  p_org uuid,p_actor uuid,p_application uuid,p_shortlist text,p_learner uuid,p_notes text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE a public.applied_jobs; item public.shortlist_candidates;
BEGIN
  IF public.has_recruitment_permission(p_user_id => p_actor,p_org_id => p_org,p_permission => 'manage_candidates') IS NOT TRUE THEN
    RETURN jsonb_build_object('code','FORBIDDEN','message','Candidate management permission is required');
  END IF;
  -- Keep the parent ownership decision valid through insertion. Preserve owner-only legacy lists.
  PERFORM id FROM public.shortlists WHERE id=p_shortlist AND
    (organization_id=p_org OR (organization_id IS NULL AND created_by=p_actor::text)) FOR SHARE;
  IF NOT FOUND THEN RETURN jsonb_build_object('code','NOT_FOUND','message','Shortlist not found'); END IF;
  SELECT aj.* INTO a FROM public.applied_jobs aj JOIN public.opportunities o ON o.id=aj.opportunity_id
    WHERE aj.id=p_application AND aj.learner_id=p_learner AND o.organization_id=p_org FOR UPDATE OF aj;
  IF NOT FOUND THEN RETURN jsonb_build_object('code','NOT_FOUND','message','Application not found'); END IF;
  IF a.application_status='rejected' THEN
    RETURN jsonb_build_object('code','APPLICATION_REJECTED','message','Reset the rejected application status before shortlisting this applicant');
  END IF;
  INSERT INTO public.shortlist_candidates(shortlist_id,learner_id,added_by,notes)
    VALUES(p_shortlist,p_learner,p_actor::text,p_notes) ON CONFLICT(shortlist_id,learner_id) DO NOTHING RETURNING * INTO item;
  IF NOT FOUND THEN RETURN jsonb_build_object('code','DUPLICATE_CANDIDATE','message','Candidate is already in this shortlist'); END IF;
  RETURN jsonb_build_object('data',to_jsonb(item));
END $$;
REVOKE ALL ON FUNCTION public.recruitment_shortlist_application(uuid,uuid,uuid,text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.recruitment_shortlist_application(uuid,uuid,uuid,text,uuid,text) TO service_role;
-- Talent-pool additions and explicit reactivation share the rejection authority.
CREATE OR REPLACE FUNCTION public.recruitment_add_pipeline_candidate(
  p_org uuid,p_actor uuid,p_opportunity uuid,p_learner uuid,p_stage text,p_details jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE c public.pipeline_candidates; a public.applied_jobs; changed public.pipeline_candidates; target_status text;
BEGIN
  IF p_stage IS NULL OR p_stage NOT IN ('sourced','screened','interview_1','interview_2','offer','hired','rejected')
    OR nullif(trim(p_details->>'candidate_name'),'') IS NULL THEN
    RETURN jsonb_build_object('code','VALIDATION_ERROR','message','Candidate name and a valid stage are required');
  END IF;
  IF public.has_recruitment_permission(p_user_id=>p_actor,p_org_id=>p_org,p_permission=>'manage_candidates') IS NOT TRUE THEN
    RETURN jsonb_build_object('code','FORBIDDEN','message','Candidate management permission is required');
  END IF;
  IF NOT EXISTS(SELECT 1 FROM public.opportunities WHERE id=p_opportunity AND organization_id=p_org) THEN
    RETURN jsonb_build_object('code','NOT_FOUND','message','Opportunity not found in this organization');
  END IF;
  SELECT * INTO c FROM public.pipeline_candidates WHERE opportunity_id=p_opportunity AND learner_id=p_learner FOR UPDATE;
  IF c.id IS NOT NULL AND c.organization_id IS DISTINCT FROM p_org THEN
    RETURN jsonb_build_object('code','NOT_FOUND','message','Candidate not found in this organization');
  END IF;
  SELECT * INTO a FROM public.applied_jobs WHERE opportunity_id=p_opportunity AND learner_id=p_learner FOR UPDATE;
  IF a.application_status='rejected' OR (a.id IS NULL AND (c.status='rejected' OR c.stage='rejected')) THEN
    RETURN jsonb_build_object('code','APPLICATION_REJECTED','message','Reset the rejected application status before adding this candidate');
  END IF;
  IF c.id IS NOT NULL THEN
    IF c.status='active' THEN RETURN jsonb_build_object('code','DUPLICATE_CANDIDATE','message','Candidate is already in this pipeline'); END IF;
    UPDATE public.pipeline_candidates SET status='active',stage=p_stage,updated_at=now() WHERE id=c.id RETURNING * INTO changed;
    RETURN jsonb_build_object('candidate',to_jsonb(changed),'message','Candidate reactivated in pipeline');
  END IF;
  INSERT INTO public.pipeline_candidates(opportunity_id,learner_id,candidate_name,candidate_email,candidate_phone,stage,source,status,added_by,added_by_uuid,organization_id,next_action,recruiter_notes)
    VALUES(p_opportunity,p_learner,p_details->>'candidate_name',p_details->>'candidate_email',p_details->>'candidate_phone',p_stage,p_details->>'source','active',p_actor::text,p_actor,p_org,p_details->>'next_action',p_details->>'recruiter_notes')
    ON CONFLICT(opportunity_id,learner_id) DO NOTHING RETURNING * INTO changed;
  IF NOT FOUND THEN RETURN jsonb_build_object('code','DUPLICATE_CANDIDATE','message','Candidate is already in this pipeline'); END IF;
  target_status:=CASE p_stage WHEN 'sourced' THEN 'applied' WHEN 'screened' THEN 'under_review'
    WHEN 'interview_1' THEN 'interview_scheduled' WHEN 'interview_2' THEN 'interviewed'
    WHEN 'offer' THEN 'offer_received' WHEN 'hired' THEN 'accepted' WHEN 'rejected' THEN 'rejected' END;
  UPDATE public.applied_jobs SET application_status=target_status,updated_at=now() WHERE id=a.id;
  INSERT INTO public.pipeline_activities(candidate_uuid,learner_id,activity_type,from_stage,to_stage,performed_by,activity_details)
    VALUES(changed.id,p_learner,'stage_change',NULL,p_stage,p_actor::text,p_details->'activity_details');
  RETURN jsonb_build_object('candidate',to_jsonb(changed));
END $$;
REVOKE ALL ON FUNCTION public.recruitment_add_pipeline_candidate(uuid,uuid,uuid,uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.recruitment_add_pipeline_candidate(uuid,uuid,uuid,uuid,text,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
