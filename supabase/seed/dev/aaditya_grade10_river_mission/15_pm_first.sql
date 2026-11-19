-- LOCAL SCHOOL DEMO: show PM first; preserve role objects and IDs.
BEGIN;
DO $pm$
DECLARE fit jsonb; first_cluster jsonb; sorted_options jsonb;
BEGIN
 SELECT r.career_fit INTO STRICT fit FROM public.personal_assessment_results r JOIN public.learners l ON l.id=r.learner_id
 WHERE r.id='ebef6f55-97ce-5d80-b453-4566ac838d33' AND l.email='aaditya.raman10@example.com' FOR UPDATE OF r;
 IF (SELECT count(*) FROM jsonb_array_elements(fit#>'{specificOptions,highFit}') o WHERE o->>'name'='Water Project Manager')<>1 THEN RAISE EXCEPTION 'Expected one PM role'; END IF;
 SELECT jsonb_agg(value ORDER BY CASE WHEN value->>'name'='Water Project Manager' THEN 0 ELSE 1 END,position)
 INTO sorted_options FROM jsonb_array_elements(fit#>'{specificOptions,highFit}') WITH ORDINALITY a(value,position);
 fit:=jsonb_set(fit,'{specificOptions,highFit}',sorted_options);
 first_cluster:=fit#>'{clusters,0}';
 first_cluster:=jsonb_set(first_cluster,'{examples}',(SELECT jsonb_agg(o->>'name' ORDER BY position) FROM jsonb_array_elements(sorted_options) WITH ORDINALITY a(o,position)));
 first_cluster:=jsonb_set(first_cluster,'{occupationIds}',(SELECT jsonb_agg(o->>'occupationId' ORDER BY position) FROM jsonb_array_elements(sorted_options) WITH ORDINALITY a(o,position)));
 first_cluster:=jsonb_set(first_cluster,'{roles,entry}',first_cluster->'examples');
 fit:=jsonb_set(fit,'{clusters,0}',first_cluster);
 UPDATE public.personal_assessment_results SET career_fit=fit,gemini_results=jsonb_set(coalesce(gemini_results,'{}'::jsonb),'{careerFit}',fit)
 WHERE id='ebef6f55-97ce-5d80-b453-4566ac838d33';
END $pm$;
COMMIT;
