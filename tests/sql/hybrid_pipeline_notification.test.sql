DO $$ DECLARE result jsonb; candidate uuid;
BEGIN
 DELETE FROM pipeline_candidates WHERE id='60000000-0000-4000-8000-000000000001';
 result:=recruitment_add_pipeline_candidate('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','sourced','{"candidate_name":"Synthetic trigger learner"}');
 candidate:=(result->'candidate'->>'id')::uuid;
 IF candidate IS NULL OR (SELECT count(*) FROM notifications)<>1 OR NOT EXISTS(SELECT 1 FROM notifications WHERE title='Added to recruitment pipeline' AND message='Your profile has been added to the recruitment pipeline.' AND recipient_id='70000000-0000-4000-8000-000000000001') THEN RAISE EXCEPTION 'Sourced notification missing or incorrect'; END IF;
 result:=recruitment_move_pipeline_candidates('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',ARRAY[candidate],'screened');
 IF result->'candidates'->0->>'stage' IS DISTINCT FROM 'screened' OR NOT EXISTS(SELECT 1 FROM notifications WHERE title='Application Screened') OR (SELECT application_status FROM applied_jobs WHERE learner_id='50000000-0000-4000-8000-000000000001') IS DISTINCT FROM 'under_review' THEN RAISE EXCEPTION 'Screened notification/canonical decision changed'; END IF;
 result:=recruitment_move_pipeline_candidates('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001',ARRAY[candidate],'sourced');
 IF result->'candidates'->0->>'stage' IS DISTINCT FROM 'sourced' OR (SELECT count(*) FROM notifications WHERE title='Added to recruitment pipeline')<>2 THEN RAISE EXCEPTION 'Move back to sourced failed'; END IF;
END $$;
