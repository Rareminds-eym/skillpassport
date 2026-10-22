BEGIN;
ALTER TABLE public.trainings ADD COLUMN source_revision bigint;
CREATE FUNCTION public.apply_lte_progress_snapshot(p_learner uuid,p_payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE course uuid:=(p_payload->>'lteCourseId')::uuid; revision bigint:=(p_payload->>'sourceRevision')::bigint;
 prior public.trainings; training uuid; skill jsonb; skillrow uuid; completed integer; total integer;
BEGIN
 IF p_payload->>'schemaVersion' IS DISTINCT FROM '2' OR revision IS NULL OR revision<0 OR course IS NULL
  OR jsonb_typeof(p_payload->'levels') IS DISTINCT FROM 'array'
  OR jsonb_array_length(p_payload->'levels')>100 THEN RAISE EXCEPTION 'INVALID_PROGRESS_SNAPSHOT' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('lte-progress:'||p_learner||':'||course,0));
 SELECT * INTO prior FROM public.trainings WHERE learner_id=p_learner AND source='lte' AND lte_course_id=course FOR UPDATE;
 IF FOUND AND prior.source_revision IS NOT NULL AND prior.source_revision>=revision THEN RETURN jsonb_build_object('synced',true,'stale',true,'trainingId',prior.id); END IF;
 total:=greatest(0,(p_payload->>'totalModules')::integer);
 completed:=least(total,greatest(0,(p_payload->>'completedModules')::integer));
 training:=prior.id;
 IF training IS NULL THEN
  INSERT INTO public.trainings(learner_id,source,lte_course_id,title,organization,status,approval_status)
  VALUES(p_learner,'lte',course,left(p_payload->>'courseTitle',500),'Rareminds LTE','ongoing','approved') RETURNING id INTO training;
 END IF;
 UPDATE public.trainings SET source_revision=revision,title=left(p_payload->>'courseTitle',500),
  lte_course_code=p_payload->>'lteCourseCode',lte_levels=p_payload->'levels',
  completed_modules=completed,total_modules=total,
  status=CASE WHEN p_payload->>'status'='completed' THEN 'completed' ELSE 'ongoing' END,
  lte_total_levels=jsonb_array_length(p_payload->'levels'),
  lte_current_level=coalesce((SELECT n::integer FROM jsonb_array_elements(p_payload->'levels') WITH ORDINALITY l(v,n) WHERE v->>'status'='in_progress' ORDER BY n LIMIT 1),jsonb_array_length(p_payload->'levels')),
  resume_url=p_payload->>'resumeUrl',updated_at=now() WHERE id=training;
 FOR skill IN SELECT value FROM jsonb_array_elements(coalesce(p_payload->'earnedSkillsDetail','[]')) LOOP
  IF skill->>'id' IS NULL OR length(trim(coalesce(skill->>'name','')))=0 OR (skill->>'level') IS NULL OR (skill->>'level')::integer NOT BETWEEN 1 AND 100 THEN
   RAISE EXCEPTION 'INVALID_EARNED_SKILL' USING ERRCODE='22023'; END IF;
  SELECT id INTO skillrow FROM public.skills WHERE learner_id=p_learner AND lte_skill_id=(skill->>'id')::uuid;
  IF skillrow IS NULL THEN
   INSERT INTO public.skills(learner_id,name,type,level,training_id,verified,approval_status,source,lte_skill_id)
   VALUES(p_learner,left(skill->>'name',255),'technical',(skill->>'level')::integer,training,true,'approved','lte',(skill->>'id')::uuid);
  ELSE UPDATE public.skills SET level=(skill->>'level')::integer,training_id=training,updated_at=now() WHERE id=skillrow;
  END IF;
 END LOOP;
 RETURN jsonb_build_object('synced',true,'trainingId',training);
END $$;
REVOKE ALL ON FUNCTION public.apply_lte_progress_snapshot(uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_lte_progress_snapshot(uuid,jsonb) TO service_role;
COMMIT;
