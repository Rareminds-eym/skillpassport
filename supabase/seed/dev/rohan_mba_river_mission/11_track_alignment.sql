-- LOCAL MBA DEMO ONLY. Reassign six existing role objects; retain IDs, salary and overview data.
BEGIN;
DO $tracks$
DECLARE fit jsonb; gap_data jsonb; spec jsonb; role_name text; choices jsonb; cluster jsonb; old_clusters jsonb; n integer:=0;
BEGIN
 SELECT r.career_fit,r.skill_gap INTO STRICT fit,gap_data FROM public.personal_assessment_results r JOIN public.learners l ON l.id=r.learner_id
 WHERE r.id='851403af-f1a6-5d48-94e2-0a4b6e2e47ae' AND l.email='rohan.iyer.mba@example.com' FOR UPDATE OF r;
 old_clusters:=fit->'clusters';
 CREATE TEMP TABLE mba_original_role_options ON COMMIT DROP AS SELECT o.value AS role FROM jsonb_each(fit->'specificOptions') g CROSS JOIN LATERAL jsonb_array_elements(g.value) o;
 FOR spec IN SELECT value FROM jsonb_array_elements('[{"group": "highFit", "title": "Water Project Finance, Environmental Analytics and Compliance", "description": "Numerical reasoning, spreadsheet analysis and careful record-keeping support water-project budgets, procurement comparisons, environmental dashboards and compliance documentation. These roles combine MBA financial and analytical skills with environmental evidence review.", "names": ["Water Project Finance & Procurement Associate", "Environmental Data Analyst", "Environmental Compliance Support Associate"]}, {"group": "mediumFit", "title": "Water Operations, WASH and Monitoring Support", "description": "Project coordination, stakeholder communication and management reporting support exploring treatment-operation records, community water programmes and monitoring systems. Technical training and supervised practice are needed for specialist operational tasks.", "names": ["Water Treatment Operations Assistant", "Water Resources / WASH Project Associate", "Water Monitoring Technology Associate"]}]'::jsonb) LOOP
  choices:='[]'::jsonb;
  FOR role_name IN SELECT jsonb_array_elements_text(spec->'names') LOOP
   IF (SELECT count(*) FROM mba_original_role_options WHERE role->>'name'=role_name)<>1 THEN RAISE EXCEPTION 'Missing or ambiguous MBA role %',role_name; END IF;
   choices:=choices||jsonb_build_array((SELECT role FROM mba_original_role_options WHERE role->>'name'=role_name));
  END LOOP;
  fit:=jsonb_set(fit,ARRAY['specificOptions',spec->>'group'],choices);
  cluster:=old_clusters->n;
  cluster:=cluster||jsonb_build_object('title',spec->>'title','domains',jsonb_build_array(spec->>'title'),'description',spec->>'description','whyItFits',spec->>'description','derivation',spec->>'description','examples',spec->'names','occupationIds',(SELECT jsonb_agg(o->>'occupationId' ORDER BY position) FROM jsonb_array_elements(choices) WITH ORDINALITY a(o,position)));
  cluster:=jsonb_set(cluster,'{roles,entry}',spec->'names');
  fit:=jsonb_set(fit,ARRAY['clusters',n::text],cluster);
  gap_data:=jsonb_set(gap_data,ARRAY['learningTracks',n::text],coalesce(gap_data#>ARRAY['learningTracks',n::text],'{}'::jsonb)||jsonb_build_object('track',spec->>'title','suggestedIf',spec->>'description','topics',spec->>'title'));
  IF n=0 THEN gap_data:=jsonb_set(gap_data,'{recommendedTrack}',spec->'title'); END IF;
  n:=n+1;
 END LOOP;
 UPDATE public.personal_assessment_results SET career_fit=fit,skill_gap=gap_data,gemini_results=jsonb_set(jsonb_set(coalesce(gemini_results,'{}'::jsonb),'{careerFit}',fit),'{skillGap}',gap_data)
 WHERE id='851403af-f1a6-5d48-94e2-0a4b6e2e47ae';
END $tracks$;
COMMIT;
