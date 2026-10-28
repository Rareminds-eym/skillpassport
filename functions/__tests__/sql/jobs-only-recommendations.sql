-- Run against the disposable matching fixture. All data changes roll back.
BEGIN;
DO $$
DECLARE
 learner_id uuid:=gen_random_uuid(); actor_id uuid:=gen_random_uuid();
 job_id uuid:=gen_random_uuid(); internship_id uuid:=gen_random_uuid(); visit_id uuid:=gen_random_uuid();
 opportunity public.opportunities; state jsonb; revision bigint; readiness jsonb; signature text; role_name text;
 query_vector extensions.vector:=('['||array_to_string(ARRAY[1,0]::numeric[]||array_fill(0::numeric,ARRAY[1534]),',')||']')::extensions.vector;
 job_vector extensions.vector:=('['||array_to_string(ARRAY[0.8,0.6]::numeric[]||array_fill(0::numeric,ARRAY[1534]),',')||']')::extensions.vector;
BEGIN
 INSERT INTO public.learners(id,user_id,name) VALUES(learner_id,actor_id,'Jobs-only fixture');
 INSERT INTO public.opportunities(id,title,company_name,employment_type,location,department,status,is_active)
 VALUES(job_id,'Job fixture','Fixture','Full-time','Remote','Engineering','open',true),
       (internship_id,'Internship fixture','Fixture','Internship','Remote','Engineering','open',true),
       (visit_id,'Industrial Visit','Fixture','factory_visit','Remote','Visits','open',true);

 SELECT * INTO opportunity FROM public.opportunities WHERE id=visit_id;
 ASSERT NOT public.publish_job_matching_vector(visit_id,'jobs-only-test',md5(public.job_matching_text(opportunity)),query_vector),'industrial visit accepted by job-vector publisher';
 ASSERT NOT EXISTS(SELECT 1 FROM public.get_job_matching_index_batch('jobs-only-test',100) WHERE id=visit_id),'industrial visit entered job indexing backlog';
 readiness:=public.job_matching_index_status('jobs-only-test');
 ASSERT (readiness->>'total')::integer=2,'industrial visit counted in job index readiness';

 FOR opportunity IN SELECT * FROM public.opportunities WHERE id IN (job_id,internship_id) LOOP
  ASSERT public.publish_job_matching_vector(opportunity.id,'jobs-only-test',md5(public.job_matching_text(opportunity)),job_vector),'valid job vector rejected';
 END LOOP;
 readiness:=public.job_matching_index_status('jobs-only-test');
 ASSERT (readiness->>'verified')::integer=2,'unindexed visit blocked verified jobs';
 ASSERT NOT EXISTS(SELECT 1 FROM public.get_job_matching_index_batch('jobs-only-test',100)),'ready jobs still reported an indexing backlog';

 -- Simulate a visit vector published before the jobs-only rule. It is the
 -- closest vector, so excluding it must happen before the ranker LIMIT.
 SELECT * INTO opportunity FROM public.opportunities WHERE id=visit_id;
 INSERT INTO public.embeddings(entity_type,entity_id,embedding,model_version,input_hash)
 VALUES('opportunity',visit_id,query_vector,'jobs-only-test',md5(public.job_matching_text(opportunity)));
 state:=public.get_recommendation_state_v3(learner_id,actor_id,'jobs-only-test','learner-text-1','semantic-ranking-4-jobs-only');
 revision:=(state->>'revision')::bigint;
 ASSERT public.publish_recommendation_vector_v3(learner_id,actor_id,revision,'jobs-only-test',query_vector,'learner-text-1'),'learner matching vector rejected';
 ASSERT (SELECT count(*) FROM public.match_verified_opportunities(learner_id,actor_id,'jobs-only-test',revision,1))=1,'visit consumed the first ranked job slot';
 ASSERT NOT EXISTS(SELECT 1 FROM public.match_verified_opportunities(learner_id,actor_id,'jobs-only-test',revision,50) WHERE id=visit_id),'previously indexed visit was recommended';
 ASSERT EXISTS(SELECT 1 FROM public.match_verified_opportunities(learner_id,actor_id,'jobs-only-test',revision,50) WHERE id=job_id),'full-time job missing';
 ASSERT EXISTS(SELECT 1 FROM public.match_verified_opportunities(learner_id,actor_id,'jobs-only-test',revision,50) WHERE id=internship_id),'internship missing';

 FOREACH signature IN ARRAY ARRAY['public.get_job_matching_index_batch(text,integer)','public.publish_job_matching_vector(uuid,text,text,extensions.vector)','public.match_verified_opportunities(uuid,uuid,text,bigint,integer)','public.job_matching_index_status(text)'] LOOP
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
   ASSERT NOT has_function_privilege(role_name,signature,'EXECUTE'),'client can execute job matching maintenance RPC';
  END LOOP;
 END LOOP;
END; $$;
ROLLBACK;
