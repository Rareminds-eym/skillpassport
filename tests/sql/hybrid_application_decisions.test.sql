DO $$
DECLARE org uuid:='20000000-0000-4000-8000-000000000001'; actor uuid:='10000000-0000-4000-8000-000000000001';
 candidate uuid:='60000000-0000-4000-8000-000000000001'; application uuid:='40000000-0000-4000-8000-000000000001'; learner uuid:='50000000-0000-4000-8000-000000000001'; result jsonb;
BEGIN
 result:=recruitment_move_pipeline_candidates(org,actor,ARRAY[candidate],'screened');
 IF result->'candidates'->0->>'stage' IS DISTINCT FROM 'screened' OR (SELECT application_status FROM applied_jobs WHERE id=application) IS DISTINCT FROM 'under_review' THEN RAISE EXCEPTION 'Eligible move failed'; END IF;
 ALTER TABLE pipeline_activities ADD CONSTRAINT test_offer_failure CHECK(to_stage IS DISTINCT FROM 'offer');
 BEGIN
  PERFORM recruitment_move_pipeline_candidates(org,actor,ARRAY[candidate],'offer');
  RAISE EXCEPTION 'Activity failure did not reject the transaction';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 IF (SELECT stage FROM pipeline_candidates WHERE id=candidate) IS DISTINCT FROM 'screened'
   OR (SELECT application_status FROM applied_jobs WHERE id=application) IS DISTINCT FROM 'under_review' THEN
   RAISE EXCEPTION 'Activity failure left partially committed decisions';
 END IF;
 ALTER TABLE pipeline_activities DROP CONSTRAINT test_offer_failure;
 result:=recruitment_move_pipeline_candidates(org,actor,ARRAY[candidate,'60000000-0000-4000-8000-000000000002'::uuid],'offer');
 IF result->>'code' IS DISTINCT FROM 'NOT_FOUND' OR (SELECT stage FROM pipeline_candidates WHERE id=candidate) IS DISTINCT FROM 'screened' THEN RAISE EXCEPTION 'Cross-tenant bulk was partially committed'; END IF;
 result:=recruitment_move_pipeline_candidates(org,'10000000-0000-4000-8000-000000000002',ARRAY[candidate],'offer');
 IF result->>'code' IS DISTINCT FROM 'FORBIDDEN' THEN RAISE EXCEPTION 'Missing membership permitted'; END IF;
 result:=recruitment_move_pipeline_candidates(org,actor,ARRAY[candidate],'invented');
 IF result->>'code' IS DISTINCT FROM 'VALIDATION_ERROR' THEN RAISE EXCEPTION 'Invalid stage permitted'; END IF;
 UPDATE applied_jobs SET application_status='rejected' WHERE id=application;
 result:=recruitment_move_pipeline_candidates(org,actor,ARRAY[candidate],'offer');
 IF result->>'code' IS DISTINCT FROM 'APPLICATION_REJECTED' THEN RAISE EXCEPTION 'Rejected move permitted'; END IF;
 result:=recruitment_shortlist_application(org,actor,application,'qa-list',learner);
 IF result->>'code' IS DISTINCT FROM 'APPLICATION_REJECTED' OR EXISTS(SELECT 1 FROM shortlist_candidates) THEN RAISE EXCEPTION 'Rejected applicant shortlisted'; END IF;
 UPDATE applied_jobs SET application_status='under_review' WHERE id=application;
 result:=recruitment_shortlist_application(org,actor,application,'foreign-list',learner);
 IF result->>'code' IS DISTINCT FROM 'NOT_FOUND' THEN RAISE EXCEPTION 'Foreign list allowed'; END IF;
 result:=recruitment_shortlist_application(org,actor,application,'qa-list',learner);
 IF result->'data'->>'shortlist_id' IS DISTINCT FROM 'qa-list' THEN RAISE EXCEPTION 'Eligible shortlist failed'; END IF;
 result:=recruitment_shortlist_application(org,actor,application,'qa-list',learner);
 IF result->>'code' IS DISTINCT FROM 'DUPLICATE_CANDIDATE' THEN RAISE EXCEPTION 'Duplicate membership not reported'; END IF;
 IF EXISTS(SELECT 1 FROM pg_proc WHERE proname IN ('recruitment_move_pipeline_candidates','recruitment_shortlist_application','recruitment_add_pipeline_candidate')
  AND (has_function_privilege('anon',oid,'EXECUTE') OR has_function_privilege('authenticated',oid,'EXECUTE'))) THEN RAISE EXCEPTION 'Browser role can execute privileged decision'; END IF;
 result:=recruitment_add_pipeline_candidate(org,actor,'30000000-0000-4000-8000-000000000001',learner,'screened','{"candidate_name":"Synthetic learner"}');
 IF result->>'code' IS DISTINCT FROM 'DUPLICATE_CANDIDATE' THEN RAISE EXCEPTION 'Active duplicate not reported'; END IF;
 UPDATE pipeline_candidates SET status='rejected',stage='rejected' WHERE id=candidate;
 UPDATE applied_jobs SET application_status='rejected' WHERE id=application;
 result:=recruitment_add_pipeline_candidate(org,actor,'30000000-0000-4000-8000-000000000001',learner,'screened','{"candidate_name":"Synthetic learner"}');
 IF result->>'code' IS DISTINCT FROM 'APPLICATION_REJECTED' THEN RAISE EXCEPTION 'Rejected pipeline reactivated'; END IF;
 UPDATE applied_jobs SET application_status='applied' WHERE id=application;
 result:=recruitment_add_pipeline_candidate(org,actor,'30000000-0000-4000-8000-000000000001',learner,'screened','{"candidate_name":"Synthetic learner"}');
 IF result->'candidate'->>'status' IS DISTINCT FROM 'active' THEN RAISE EXCEPTION 'Explicit reset did not allow reactivation'; END IF;
 DELETE FROM pipeline_candidates WHERE id=candidate;
 result:=recruitment_add_pipeline_candidate(org,actor,'30000000-0000-4000-8000-000000000001',learner,'screened','{"candidate_name":"Synthetic learner","source":"talent_pool"}');
 IF result->'candidate'->>'organization_id' IS DISTINCT FROM org::text OR (SELECT application_status FROM applied_jobs WHERE id=application) IS DISTINCT FROM 'under_review' THEN RAISE EXCEPTION 'New atomic addition failed'; END IF;
 UPDATE pipeline_candidates SET id=candidate WHERE opportunity_id='30000000-0000-4000-8000-000000000001' AND learner_id=learner;
 UPDATE applied_jobs SET application_status='applied' WHERE id=application;
 UPDATE pipeline_candidates SET stage='sourced',status='active' WHERE id=candidate;
 DELETE FROM shortlist_candidates;
 RAISE NOTICE 'Atomic decision contract checks passed';
END $$;
