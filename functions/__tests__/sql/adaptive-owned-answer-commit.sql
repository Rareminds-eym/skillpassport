INSERT INTO public.learners VALUES('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001');
INSERT INTO public.adaptive_aptitude_sessions(id,learner_id,grade_level,current_phase_questions) VALUES
 ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','middle_school',
 '[{"id":"first","text":"First","correctAnswer":"A","subtag":"numerical_reasoning","options":{"A":"1","B":"2"}},{"id":"second","text":"Second","correctAnswer":"B","subtag":"numerical_reasoning","options":{"A":"1","B":"2"}},{"id":"third","text":"Third","correctAnswer":"C","subtag":"numerical_reasoning","options":{"A":"1","B":"2"}}]'),
 ('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','middle_school',
 '[{"id":"race-question","text":"Race","correctAnswer":"A","subtag":"numerical_reasoning","options":{"A":"1","B":"2"}}]');
DO $$
DECLARE owner_id uuid:='10000000-0000-4000-8000-000000000001';target_session uuid:='30000000-0000-4000-8000-000000000001';out jsonb;before_count bigint;
BEGIN
 ASSERT public.commit_owned_adaptive_answer(gen_random_uuid(),target_session,'first','A',100,true) IS NULL;
 ASSERT NOT (public.commit_owned_adaptive_answer(owner_id,target_session,'first','A',100,true)->>'recorded')::boolean;
 BEGIN
  PERFORM public.commit_owned_adaptive_answer(owner_id,target_session,'second','B',100,false,0,0,'diagnostic_screener',3,NULL,false);
  RAISE EXCEPTION 'Out of order answer accepted';
 EXCEPTION WHEN serialization_failure THEN NULL;END;
 ASSERT NOT EXISTS(SELECT 1 FROM public.adaptive_aptitude_responses);
 out:=public.commit_owned_adaptive_answer(owner_id,target_session,'first','A',100,false,0,0,'diagnostic_screener',3,NULL,false);
 ASSERT (out->>'isCorrect')::boolean AND NOT (out->>'replayed')::boolean;
 ASSERT (SELECT questions_answered=1 AND correct_answers=1 AND current_question_index=1 FROM public.adaptive_aptitude_sessions WHERE id=target_session);
 out:=public.commit_owned_adaptive_answer(owner_id,target_session,'first','A',100,false,0,0,'diagnostic_screener',3,NULL,false);
 ASSERT (out->>'replayed')::boolean;
 ASSERT (SELECT count(*)=1 FROM public.adaptive_aptitude_responses WHERE adaptive_aptitude_responses.session_id=target_session);
 BEGIN
  PERFORM public.commit_owned_adaptive_answer(owner_id,target_session,'first','B',100,true);
  RAISE EXCEPTION 'Recorded answer replaced';
 EXCEPTION WHEN serialization_failure THEN NULL;END;
 BEGIN
  PERFORM public.commit_owned_adaptive_answer(owner_id,target_session,'second','B',100,false,0,0,'diagnostic_screener',3,NULL,false);
  RAISE EXCEPTION 'Stale version accepted';
 EXCEPTION WHEN serialization_failure THEN NULL;END;
 out:=public.commit_owned_adaptive_answer(owner_id,target_session,'second','A',100,false,1,1,'diagnostic_screener',3,NULL,false);
 ASSERT NOT (out->>'isCorrect')::boolean;
 ASSERT(SELECT questions_answered=2 AND correct_answers=1 FROM public.adaptive_aptitude_sessions WHERE id=target_session);
 UPDATE public.adaptive_aptitude_sessions SET status='completed' WHERE id=target_session;
 BEGIN
  PERFORM public.commit_owned_adaptive_answer(owner_id,target_session,'third','C',100,false,2,2,'diagnostic_screener',3,NULL,false);
  RAISE EXCEPTION 'Completed session accepted a new answer';
 EXCEPTION WHEN serialization_failure THEN NULL;END;
 ASSERT (public.commit_owned_adaptive_answer(owner_id,target_session,'first','A',100,true)->>'replayed')::boolean;
 -- Preserve historical duplicates without retroactively certifying their score.
 INSERT INTO public.adaptive_aptitude_responses SELECT gen_random_uuid(),r.session_id,r.question_id,r.selected_answer,r.is_correct,r.response_time_ms,r.difficulty_at_time,r.subtag,r.phase,r.sequence_number,r.answered_at,r.question_text,r.question_options,r.correct_answer,r.explanation FROM public.adaptive_aptitude_responses r WHERE r.session_id=target_session;
 SELECT count(*) INTO before_count FROM public.adaptive_aptitude_responses;
 BEGIN
  PERFORM public.commit_owned_adaptive_answer(owner_id,target_session,'first','A',100,true);RAISE EXCEPTION 'Historical duplicate treated as verified';
 EXCEPTION WHEN serialization_failure THEN NULL;END;
 ASSERT(SELECT count(*)=before_count FROM public.adaptive_aptitude_responses);
 ASSERT NOT has_function_privilege('anon','public.commit_owned_adaptive_answer(uuid,uuid,text,text,integer,boolean,integer,integer,text,integer,integer,boolean)','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','public.commit_owned_adaptive_answer(uuid,uuid,text,text,integer,boolean,integer,integer,text,integer,integer,boolean)','EXECUTE');
END;
$$;
