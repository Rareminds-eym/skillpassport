-- Run against a local database after applying the slide quiz migrations.
BEGIN;
DO $$
DECLARE resource uuid; original_id uuid; actual_id uuid; actual jsonb; slide_number integer;
BEGIN
  SELECT resource_id, quiz_id INTO resource, original_id FROM public.ppt_slide_quizzes LIMIT 1;
  IF resource IS NULL THEN RAISE EXCEPTION 'A test slide quiz is required'; END IF;
  SELECT q.slide_number INTO STRICT slide_number FROM public.ppt_slide_quizzes q WHERE q.quiz_id = original_id;
  PERFORM public.sync_ppt_slide_quizzes(resource, jsonb_build_array(jsonb_build_object(
    'slide_number', slide_number,
    'questions', jsonb_build_array(jsonb_build_object('question','Edited question','options',jsonb_build_array('A1','B1','C1','D1'),'correct_option','A'))
  )));
  SELECT quiz_id, questions INTO actual_id, actual FROM public.ppt_slide_quizzes WHERE resource_id = resource;
  IF actual_id IS DISTINCT FROM original_id OR actual->0->>'question' <> 'Edited question' THEN RAISE EXCEPTION 'Quiz edit did not preserve ID or save'; END IF;
  BEGIN
    PERFORM public.sync_ppt_slide_quizzes(resource, '[{"slide_number":1,"questions":[]}]'::jsonb);
    RAISE EXCEPTION 'Invalid quiz unexpectedly accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'Invalid quiz unexpectedly accepted' THEN RAISE; END IF;
  END;
  IF NOT EXISTS (SELECT 1 FROM public.ppt_slide_quizzes WHERE quiz_id = original_id AND questions->0->>'question' = 'Edited question') THEN RAISE EXCEPTION 'Failed validation modified the quiz'; END IF;
  PERFORM public.sync_ppt_slide_quizzes(resource, '[]'::jsonb);
  IF EXISTS (SELECT 1 FROM public.ppt_slide_quizzes WHERE resource_id = resource) THEN RAISE EXCEPTION 'Quiz removal failed'; END IF;
END $$;
ROLLBACK;
