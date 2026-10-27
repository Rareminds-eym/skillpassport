BEGIN;
DO $$
DECLARE marker text:='facet-test-'||gen_random_uuid(); result jsonb;
BEGIN
 INSERT INTO public.opportunities(title,job_title,company_name,location,department,sector,employment_type,status,is_active)
 VALUES(marker,marker,'Fixture',marker||', India','Engineering',marker,'factory_visit','open',true),
       (marker,marker,'Fixture',marker||', India','Engineering',marker,'factory_visit','open',true),
       (marker,marker,'Fixture',marker||'-hidden, India','Engineering',marker||'-hidden','factory_visit','open',false),
       (marker,marker,'Fixture',marker||'-job, India','Engineering',marker||'-job','Full-time','open',true);
 result:=public.opportunity_visit_facets();
 IF (SELECT count(*) FROM jsonb_array_elements_text(result->'sectors') s WHERE s=marker)<>1 THEN RAISE EXCEPTION 'FAIL: sector facets are missing or duplicated'; END IF;
 IF (SELECT count(*) FROM jsonb_array_elements_text(result->'locations') l WHERE l=marker)<>1 THEN RAISE EXCEPTION 'FAIL: location facets are missing or duplicated'; END IF;
 IF result->'sectors' ? (marker||'-hidden') OR result->'sectors' ? (marker||'-job') THEN RAISE EXCEPTION 'FAIL: facets include inactive visits or ordinary jobs'; END IF;
 IF has_function_privilege('anon','public.opportunity_visit_facets()','EXECUTE') OR has_function_privilege('authenticated','public.opportunity_visit_facets()','EXECUTE') THEN RAISE EXCEPTION 'FAIL: service-only facet RPC exposed'; END IF;
 RAISE NOTICE 'PASS: active visit facets, distinct choices, city extraction, service-only grants';
END $$;
ROLLBACK;
