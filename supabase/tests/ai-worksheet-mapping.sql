-- Read-only, rollback-only checks for the shared teaching functions after legacy removal.
BEGIN;
DO $$
DECLARE educator uuid; org uuid; context jsonb; expected bigint;
BEGIN
 SELECT assigned_by INTO educator FROM ai_assignment_learners LIMIT 1;
 IF educator IS NULL THEN RAISE EXCEPTION 'Requires an educator with an existing saved assignment'; END IF;
 SELECT organization_id INTO org FROM ai_worksheet_educator_scope(educator);
 context:=ai_worksheet_context(educator);
 SELECT count(*) INTO expected FROM ai_worksheet_eligible_learners(educator);
 IF (context->>'learnerCount')::bigint<>expected OR (context->'organization'->>'id')::uuid<>org THEN RAISE EXCEPTION 'Teaching context mismatch'; END IF;
 IF EXISTS(SELECT 1 FROM ai_worksheet_eligible_learners(educator) e WHERE NOT EXISTS(SELECT 1 FROM organization_members m WHERE m.user_id=e.user_id AND m.organization_id=org AND m.status='active')) THEN RAISE EXCEPTION 'Unmapped learner returned'; END IF;
 IF has_function_privilege('authenticated','public.ai_worksheet_context(uuid)','EXECUTE') OR has_function_privilege('authenticated','public.ai_worksheet_eligible_learners(uuid)','EXECUTE') THEN RAISE EXCEPTION 'Browser can access private teaching functions'; END IF;
 IF to_regclass('public.ai_worksheet_sets') IS NOT NULL OR to_regclass('public.ai_worksheet_solutions') IS NOT NULL OR to_regclass('public.ai_worksheet_recipients') IS NOT NULL THEN RAISE EXCEPTION 'Legacy tables remain'; END IF;
 RAISE NOTICE 'PASS: teaching context, mapped learners, private execution permissions, and no legacy tables';
END $$;
ROLLBACK;
