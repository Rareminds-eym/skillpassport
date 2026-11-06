BEGIN;
-- Existing learner_context is self-described report context, never a trusted
-- evaluated achievement. Its owner capability is independent of Supabase RLS.
CREATE FUNCTION public.patch_owned_assessment_context(p_owner uuid,p_attempt uuid,p_context jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE learner uuid; attempt public.personal_assessment_attempts; k text; v jsonb;
BEGIN
 IF p_context IS NULL OR jsonb_typeof(p_context)<>'object' OR octet_length(p_context::text)>8192
  OR jsonb_typeof(p_context->'rawGrade') IS DISTINCT FROM 'string' OR length(trim(p_context->>'rawGrade'))=0 THEN
  RAISE EXCEPTION 'Invalid assessment context' USING ERRCODE='22023'; END IF;
 FOR k,v IN SELECT * FROM jsonb_each(p_context) LOOP
  IF k NOT IN('rawGrade','grade','programName','programCode','degreeLevel','selectedStream','selectedCategory','learnerType')
   OR (v<>'null'::jsonb AND (jsonb_typeof(v)<>'string' OR length(v#>>'{}')>300)) THEN
   RAISE EXCEPTION 'Unsupported assessment context' USING ERRCODE='22023'; END IF;
 END LOOP;
 BEGIN SELECT id INTO STRICT learner FROM public.learners WHERE user_id=p_owner FOR SHARE;
 EXCEPTION WHEN NO_DATA_FOUND THEN RETURN NULL; END;
 SELECT * INTO attempt FROM public.personal_assessment_attempts WHERE id=p_attempt AND learner_id=learner FOR UPDATE;
 IF NOT FOUND THEN RETURN NULL; END IF;
 IF attempt.status IS DISTINCT FROM 'in_progress' THEN RAISE EXCEPTION 'Assessment state changed' USING ERRCODE='P0001'; END IF;
 UPDATE public.personal_assessment_attempts SET learner_context=p_context,updated_at=clock_timestamp() WHERE id=attempt.id AND learner_id=learner;
 RETURN jsonb_build_object('attemptId',attempt.id);
END $$;
REVOKE ALL ON FUNCTION public.patch_owned_assessment_context(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.patch_owned_assessment_context(uuid,uuid,jsonb) TO service_role;
COMMIT;
