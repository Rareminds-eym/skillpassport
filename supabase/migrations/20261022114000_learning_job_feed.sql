BEGIN;
CREATE FUNCTION public.learning_job_feed(p_user uuid,p_learner uuid,p_catalog jsonb,p_approved jsonb,p_state text DEFAULT 'eligible',p_search text DEFAULT '',p_offset integer DEFAULT 0)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
WITH matches AS (
 SELECT o job,CASE WHEN jsonb_array_length(o.learning_requirements)=0 THEN 'requirements_unspecified'
 WHEN EXISTS(SELECT 1 FROM jsonb_array_elements(o.learning_requirements) r WHERE (r->>'mandatory')::boolean
  AND EXISTS(SELECT 1 FROM jsonb_array_elements(p_catalog) c WHERE c->>'levelId'=r->>'levelId' AND c->>'fingerprint'=r->>'fingerprint')
  AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_approved) a WHERE a->>'levelId'=r->>'levelId' AND a->>'fingerprint'=r->>'fingerprint')) THEN 'not_yet_eligible'
 WHEN EXISTS(SELECT 1 FROM jsonb_array_elements(o.learning_requirements) r WHERE (r->>'mandatory')::boolean
  AND NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_catalog) c WHERE c->>'levelId'=r->>'levelId' AND c->>'fingerprint'=r->>'fingerprint')) THEN 'unknown'
 ELSE 'eligible' END state
 FROM public.opportunities o WHERE o.status='open' AND o.is_active AND (o.deadline IS NULL OR o.deadline>now())
 AND o.employment_type IS DISTINCT FROM 'factory_visit'
 AND EXISTS(SELECT 1 FROM public.learners WHERE id=p_learner AND user_id=p_user)
 AND position(lower(coalesce(p_search,'')) IN lower(concat_ws(' ',o.job_title,o.title,o.company_name,o.department,o.location)))>0
), filtered AS (SELECT * FROM matches WHERE p_state='all' OR state=p_state), page AS (
 SELECT job,row_number() OVER(ORDER BY CASE state WHEN 'eligible' THEN 0 WHEN 'not_yet_eligible' THEN 1 ELSE 2 END,(job).created_at DESC,(job).id) ord
 FROM filtered ORDER BY CASE state WHEN 'eligible' THEN 0 WHEN 'not_yet_eligible' THEN 1 ELSE 2 END,(job).created_at DESC,(job).id
 LIMIT 12 OFFSET greatest(0,least(p_offset,100000))
)
SELECT jsonb_build_object('jobs',coalesce((SELECT jsonb_agg(to_jsonb(job) ORDER BY ord) FROM page),'[]'),'total',(SELECT count(*) FROM filtered));
$$;
REVOKE ALL ON FUNCTION public.learning_job_feed(uuid,uuid,jsonb,jsonb,text,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.learning_job_feed(uuid,uuid,jsonb,jsonb,text,text,integer) TO service_role;
COMMIT;
