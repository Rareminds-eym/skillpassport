-- Test explicit SQL predicates and grants, with RLS disabled and no auth.uid().
DO $$ BEGIN
 ASSERT NOT EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND (c.relname LIKE 'zoho_%' OR c.relname IN ('learners','users','users_shadow')) AND c.relrowsecurity);
 ASSERT to_regprocedure('public.zoho_candidate_profile_visible(uuid)') IS NULL;
END $$;
UPDATE public.learners SET embedding=array_fill(1::real,ARRAY[1536])::extensions.vector
 WHERE user_id IN ('10000000-0000-4000-8000-000000000006','10000000-0000-4000-8000-000000000020');
SET ROLE service_role;
DO $$ DECLARE private_id uuid; BEGIN
 SELECT id INTO private_id FROM public.learners WHERE user_id='10000000-0000-4000-8000-000000000006';
 ASSERT (SELECT count(*)=1 FROM public.search_candidates_by_embedding(array_fill(1::real,ARRAY[1536])::extensions.vector,0.5,1));
 ASSERT (SELECT bool_and(user_id='10000000-0000-4000-8000-000000000020')
  FROM public.search_candidates_by_embedding(array_fill(1::real,ARRAY[1536])::extensions.vector,0.5,50));
 ASSERT (SELECT bool_and(user_id='10000000-0000-4000-8000-000000000020')
  FROM public.match_candidates_to_opportunity(array_fill(1::real,ARRAY[1536])::extensions.vector,50,0.5));
 ASSERT (public.unlock_candidate_contact('10000000-0000-4000-8000-000000000030',private_id::text,
  '10000000-0000-4000-8000-000000000099')->>'error')='CANDIDATE_NOT_FOUND';
 BEGIN
  INSERT INTO public.zoho_recruiter_pipeline_candidates(learner_id,stage,status) VALUES(private_id,'new','active');
  RAISE EXCEPTION 'Private candidate inserted through recruiter view';
 EXCEPTION WHEN with_check_option_violation THEN NULL; END;
END $$;
RESET ROLE;
-- Even column-only grants defeat a private boundary without RLS.
GRANT SELECT(name) ON public.learners TO anon;
DO $$ BEGIN
 BEGIN PERFORM public.zoho_assert_private_projection_boundary(); RAISE EXCEPTION 'Column grant accepted';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
REVOKE SELECT(name) ON public.learners FROM anon;
SELECT public.zoho_assert_private_projection_boundary();

-- Use the real interviews definition and foreign key. Its learner_id stores the
-- canonical user UUID, not the distinct learner-record UUID used by pipeline.
INSERT INTO public.interviews(id,learner_id,candidate_name,candidate_email,job_title,interviewer,date,type)
 VALUES('private-interview','10000000-0000-4000-8000-000000000006','Private Interview','private-interview@fixture.example','Fixture Job','Fixture Interviewer',now(),'technical'),
 ('public-interview','10000000-0000-4000-8000-000000000020','Public Interview','public-interview@fixture.example','Fixture Job','Fixture Interviewer',now(),'technical');
DO $$ DECLARE private_learner uuid; BEGIN
 SELECT id INTO private_learner FROM public.learners WHERE user_id='10000000-0000-4000-8000-000000000006';
 ASSERT private_learner<>'10000000-0000-4000-8000-000000000006'::uuid;
 BEGIN
  INSERT INTO public.interviews(id,learner_id,candidate_name,job_title,interviewer,date,type)
   VALUES('wrong-key-interview',private_learner,'Wrong key','Fixture Job','Fixture Interviewer',now(),'technical');
  RAISE EXCEPTION 'Interview accepted a learner-record UUID';
 EXCEPTION WHEN foreign_key_violation THEN NULL; END;
END $$;
SET ROLE service_role;
DO $$ DECLARE affected integer; BEGIN
 ASSERT (SELECT count(*)=0 FROM public.zoho_recruiter_interviews WHERE id='private-interview');
 ASSERT (SELECT count(*)=1 FROM public.zoho_recruiter_interviews WHERE id='public-interview');
 BEGIN
  INSERT INTO public.zoho_recruiter_interviews(id,learner_id,candidate_name,job_title,interviewer,date,type)
   VALUES('denied-private-insert','10000000-0000-4000-8000-000000000006','Private insert','Fixture Job','Fixture Interviewer',now(),'technical');
  RAISE EXCEPTION 'Private interview inserted through the filtered reader';
 EXCEPTION WHEN with_check_option_violation THEN NULL; END;
 BEGIN
  UPDATE public.zoho_recruiter_interviews SET learner_id='10000000-0000-4000-8000-000000000006' WHERE id='public-interview';
  RAISE EXCEPTION 'Public interview reassigned to a private import';
 EXCEPTION WHEN with_check_option_violation THEN NULL; END;
 UPDATE public.zoho_recruiter_interviews SET candidate_name='Updated Public Interview' WHERE id='public-interview';
 ASSERT (SELECT candidate_name='Updated Public Interview' AND learner_id='10000000-0000-4000-8000-000000000020'::uuid
  FROM public.zoho_recruiter_interviews WHERE id='public-interview');
 DELETE FROM public.zoho_recruiter_interviews WHERE id='private-interview';
 GET DIAGNOSTICS affected=ROW_COUNT; ASSERT affected=0;
END $$;
RESET ROLE;
DO $$ BEGIN
 ASSERT EXISTS(SELECT 1 FROM public.interviews WHERE id='private-interview');
 ASSERT NOT EXISTS(SELECT 1 FROM public.interviews WHERE id='denied-private-insert');
 ASSERT NOT has_table_privilege('anon','public.zoho_recruiter_interviews','SELECT');
 ASSERT NOT has_table_privilege('authenticated','public.zoho_recruiter_interviews','SELECT');
END $$;
