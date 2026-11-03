-- Isolated fixtures; no persistent changes to learners or job openings.
BEGIN;
DO $$
DECLARE
 subject uuid:=gen_random_uuid(); learner uuid:=gen_random_uuid(); level uuid:=gen_random_uuid();
 marker text:='learning-feed-scope-'||gen_random_uuid(); requirement jsonb; catalog jsonb;
 result jsonb; first_page jsonb;
BEGIN
 INSERT INTO public.users(id,email,role) VALUES(subject,subject||'@learning-test.invalid','learner');
 INSERT INTO public.learners(id,user_id,email,learner_type) VALUES(learner,subject,subject||'@learning-test.invalid','independent');
 INSERT INTO public.job_learning_catalog(level_id,capability_id,capability_name,title,level_number,version,fingerprint)
 VALUES(level,gen_random_uuid(),'Scope fixture','Scope level',1,1,repeat('c',32));
 catalog:=jsonb_build_array(jsonb_build_object('levelId',level,'fingerprint',repeat('c',32)));
 requirement:=jsonb_build_array(jsonb_build_object('levelId',level,'fingerprint',repeat('c',32),'mandatory',true));
 INSERT INTO public.opportunities(title,job_title,company_name,location,department,employment_type,status,is_active,learning_requirements,created_at)
 SELECT marker||' structured '||n,marker||' structured '||n,'Scope fixture','Remote','Engineering','Full-time','open',true,requirement,now()-n*interval '1 minute'
 FROM generate_series(1,13) n;
 -- Newer unrestricted jobs must neither fill a learning page nor inflate its total.
 INSERT INTO public.opportunities(title,job_title,company_name,location,department,employment_type,status,is_active,created_at)
 SELECT marker||' general '||n,marker||' general '||n,'Scope fixture','Remote','Engineering','Full-time','open',true,now()
 FROM generate_series(1,20) n;
 first_page:=public.learning_job_feed(subject,learner,catalog,catalog,'all',marker,0);
 IF (first_page->>'total')::integer<>13 OR jsonb_array_length(first_page->'jobs')<>12 THEN
  RAISE EXCEPTION 'FAIL: unrestricted jobs affect learning count or first page';
 END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(first_page->'jobs') j WHERE jsonb_array_length(j->'learning_requirements')=0) THEN
  RAISE EXCEPTION 'FAIL: unrestricted job appears in learning feed';
 END IF;
 result:=public.learning_job_feed(subject,learner,catalog,catalog,'all',marker,12);
 IF (result->>'total')::integer<>13 OR jsonb_array_length(result->'jobs')<>1 OR EXISTS(
  SELECT 1 FROM jsonb_array_elements(first_page->'jobs') a,jsonb_array_elements(result->'jobs') b WHERE a->>'id'=b->>'id'
 ) THEN RAISE EXCEPTION 'FAIL: learning pagination loses or repeats a structured job'; END IF;
 result:=public.learning_job_feed(subject,learner,catalog,catalog,'eligible',marker,0);
 IF (result->>'total')::integer<>13 THEN RAISE EXCEPTION 'FAIL: approved structured jobs excluded'; END IF;
 result:=public.learning_job_feed(subject,learner,catalog,'[]','not_yet_eligible',marker,0);
 IF (result->>'total')::integer<>13 THEN RAISE EXCEPTION 'FAIL: structured learning gaps excluded'; END IF;
 result:=public.learning_job_feed(subject,learner,catalog,catalog,'all',marker||' general',0);
 IF (result->>'total')::integer<>0 OR jsonb_array_length(result->'jobs')<>0 THEN RAISE EXCEPTION 'FAIL: generic search reintroduces unrestricted jobs'; END IF;
 IF (SELECT count(*) FROM public.opportunities WHERE title LIKE marker||' general%')<>20 THEN RAISE EXCEPTION 'FAIL: general openings were removed'; END IF;
 result:=public.learning_job_feed(gen_random_uuid(),learner,catalog,catalog,'all',marker,0);
 IF (result->>'total')::integer<>0 THEN RAISE EXCEPTION 'FAIL: learner ownership bypass'; END IF;
 RAISE NOTICE 'PASS: structured scope, accurate counts and pagination, approval/gaps, unrestricted search, general job preservation, ownership';
END $$;
ROLLBACK;
