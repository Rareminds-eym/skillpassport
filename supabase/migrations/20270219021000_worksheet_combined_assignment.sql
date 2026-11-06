BEGIN;
CREATE OR REPLACE FUNCTION public.ai_worksheet_context(p_user_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT jsonb_build_object('organization',jsonb_build_object('id',s.organization_id,'name',s.organization_name),
  'learnerCount',(SELECT count(*) FROM ai_worksheet_eligible_learners(p_user_id)),
  'gradeLevel',COALESCE((SELECT string_agg(DISTINCT CASE WHEN l.college_id=s.organization_id THEN 'College/University'
    ELSE 'Grade '||sc.grade::text END, ', ' ORDER BY CASE WHEN l.college_id=s.organization_id THEN 'College/University' ELSE 'Grade '||sc.grade::text END)
   FROM ai_worksheet_eligible_learners(p_user_id) e JOIN learners l ON l.id=e.id LEFT JOIN school_classes sc ON sc.id=l.school_class_id),''))
 FROM ai_worksheet_educator_scope(p_user_id) s;
$$;
REVOKE ALL ON FUNCTION public.ai_worksheet_context(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ai_worksheet_context(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.publish_ai_worksheet_bundle(p_user_id uuid,p_conversation_id uuid,p_message_id uuid,
 p_group_id uuid,p_title text,p_instructions text,p_due_at timestamptz,p_variants jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE org uuid; conv tutor_conversations%ROWTYPE; source jsonb; existing ai_worksheet_sets%ROWTYPE;
 request_hash text; worksheet uuid; recipients uuid[]; levels text[]; student text; answers text; amount integer;
BEGIN
 SELECT organization_id INTO org FROM ai_worksheet_educator_scope(p_user_id);
 SELECT * INTO conv FROM tutor_conversations WHERE id=p_conversation_id AND learner_id=p_user_id;
 IF NOT FOUND OR conv.course_id IS NULL THEN RAISE EXCEPTION 'Owned course conversation required'; END IF;
 SELECT item INTO source FROM jsonb_array_elements(conv.messages) item WHERE item->>'id'=p_message_id::text AND item->>'role'='assistant';
 IF source IS NULL OR jsonb_typeof(source->'worksheetVariants') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Completed worksheet required'; END IF;
 IF jsonb_typeof(p_variants) IS DISTINCT FROM 'array' OR jsonb_array_length(p_variants) NOT BETWEEN 1 AND 3
  OR jsonb_array_length(p_variants)<>jsonb_array_length(source->'worksheetVariants') THEN RAISE EXCEPTION 'All generated levels required'; END IF;
 SELECT array_agg(v->>'difficulty' ORDER BY ord),string_agg('## '||initcap(v->>'difficulty')||E'\n\n'||(v->>'studentContent'),E'\n\n' ORDER BY ord),
  string_agg('## '||initcap(v->>'difficulty')||E'\n\n'||COALESCE(v->>'solutions',''),E'\n\n' ORDER BY ord)
 INTO levels,student,answers FROM jsonb_array_elements(p_variants) WITH ORDINALITY x(v,ord);
 IF (SELECT count(DISTINCT x) FROM unnest(levels) x)<>cardinality(levels) OR EXISTS(
  SELECT 1 FROM unnest(levels) x WHERE x NOT IN ('beginner','intermediate','advanced') OR NOT EXISTS(
   SELECT 1 FROM jsonb_array_elements(source->'worksheetVariants') v WHERE v->>'difficulty'=x)) THEN RAISE EXCEPTION 'Invalid levels'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(p_variants) v WHERE length(trim(COALESCE(v->>'studentContent','')))=0) THEN RAISE EXCEPTION 'Empty worksheet'; END IF;
 request_hash:=md5(jsonb_build_object('conversation',p_conversation_id,'message',p_message_id,'title',p_title,'instructions',p_instructions,'due',p_due_at,'variants',p_variants)::text);
 PERFORM pg_advisory_xact_lock(hashtextextended(p_group_id::text,0));
 SELECT * INTO existing FROM ai_worksheet_sets WHERE generation_group_id=p_group_id LIMIT 1;
 IF FOUND THEN
  IF existing.educator_user_id IS DISTINCT FROM p_user_id OR existing.organization_id IS DISTINCT FROM org OR existing.publication_request_hash IS DISTINCT FROM request_hash THEN RAISE EXCEPTION 'Publication conflict'; END IF;
  RETURN jsonb_build_object('groupId',p_group_id,'learnerCount',(SELECT count(*) FROM ai_worksheet_recipients WHERE worksheet_id=existing.id));
 END IF;
 SELECT array_agg(id ORDER BY id) INTO recipients FROM ai_worksheet_eligible_learners(p_user_id);
 IF COALESCE(cardinality(recipients),0)=0 THEN RAISE EXCEPTION 'No mapped active learners'; END IF;
 amount:=(source->'worksheetConfig'->>'questionCount')::integer;
 INSERT INTO ai_worksheet_sets(generation_group_id,organization_id,educator_user_id,source_conversation_id,source_message_id,course_id,lesson_id,title,
  difficulty,student_content,question_count,generation_config,instructions,due_at,status,published_at,publication_request_hash)
 VALUES(p_group_id,org,p_user_id,p_conversation_id,p_message_id,conv.course_id,conv.lesson_id,p_title,
  CASE WHEN cardinality(levels)>1 THEN 'mixed'::ai_worksheet_difficulty ELSE levels[1]::ai_worksheet_difficulty END,
  student,amount,COALESCE(source->'worksheetConfig','{}')||jsonb_build_object('assignmentMode','all-mapped','includedDifficulties',to_jsonb(levels),'totalQuestionCount',amount*cardinality(levels)),
  COALESCE(p_instructions,''),p_due_at,'published',now(),request_hash) RETURNING id INTO worksheet;
 INSERT INTO ai_worksheet_solutions(worksheet_id,content) VALUES(worksheet,answers);
 INSERT INTO ai_worksheet_recipients(worksheet_id,learner_id) SELECT worksheet,id FROM unnest(recipients) id;
 RETURN jsonb_build_object('groupId',p_group_id,'learnerCount',cardinality(recipients));
END $$;
REVOKE ALL ON FUNCTION public.publish_ai_worksheet_bundle(uuid,uuid,uuid,uuid,text,text,timestamptz,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.publish_ai_worksheet_bundle(uuid,uuid,uuid,uuid,text,text,timestamptz,jsonb) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
