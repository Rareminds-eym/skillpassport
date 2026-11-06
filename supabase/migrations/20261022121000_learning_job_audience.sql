BEGIN;
-- Preserve existing Opportunities grade-based discovery rules in the new feed.
CREATE FUNCTION public.learning_job_audience_allows(p_learner uuid,p_type text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 WITH learner AS (SELECT upper(trim(coalesce(grade,''))) grade FROM public.learners WHERE id=p_learner AND is_deleted=false),
 audience AS (SELECT grade,CASE WHEN grade~'(UG|PG|YEAR|UNDERGRADUATE|POSTGRADUATE|BACHELOR|MASTER)' THEN NULL
 ELSE (substring(grade FROM '[0-9]+'))::integer END number FROM learner)
 SELECT coalesce((SELECT CASE
 WHEN lower(coalesce(p_type,''))='factory_visit' THEN false
 WHEN number BETWEEN 6 AND 8 THEN false
 WHEN number BETWEEN 9 AND 12 OR grade LIKE '%DIPLOMA%' THEN lower(p_type)='internship'
 ELSE true END FROM audience),false);
$$;
REVOKE ALL ON FUNCTION public.learning_job_audience_allows(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.learning_job_audience_allows(uuid,text) TO service_role;
CREATE OR REPLACE FUNCTION public.learning_job_feed(p_user uuid,p_learner uuid,p_catalog jsonb,p_approved jsonb,p_state text DEFAULT 'eligible',p_search text DEFAULT '',p_offset integer DEFAULT 0)
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
 AND public.learning_job_audience_allows(p_learner,o.employment_type)
 AND EXISTS(SELECT 1 FROM public.learners WHERE id=p_learner AND user_id=p_user)
 AND position(lower(coalesce(p_search,'')) IN lower(concat_ws(' ',o.job_title,o.title,o.company_name,o.department,o.location)))>0
), filtered AS (SELECT * FROM matches WHERE p_state='all' OR state=p_state), page AS (
 SELECT job,row_number() OVER(ORDER BY CASE state WHEN 'eligible' THEN 0 WHEN 'not_yet_eligible' THEN 1 ELSE 2 END,(job).created_at DESC,(job).id) ord
 FROM filtered ORDER BY CASE state WHEN 'eligible' THEN 0 WHEN 'not_yet_eligible' THEN 1 ELSE 2 END,(job).created_at DESC,(job).id
 LIMIT 12 OFFSET greatest(0,least(p_offset,100000))
)
SELECT jsonb_build_object('jobs',coalesce((SELECT jsonb_agg(to_jsonb(job) ORDER BY ord) FROM page),'[]'),'total',(SELECT count(*) FROM filtered));
$$;
CREATE OR REPLACE FUNCTION public.record_learning_job_notification(p_learner uuid,p_job uuid,p_version bigint) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE job public.opportunities; subject uuid;
BEGIN
 SELECT * INTO job FROM public.opportunities WHERE id=p_job AND learning_requirements_version=p_version AND status='open' AND is_active AND (deadline IS NULL OR deadline>now()) FOR SHARE;
 IF NOT FOUND OR jsonb_array_length(job.learning_requirements)=0 THEN RETURN false; END IF;
 SELECT user_id INTO subject FROM public.learners WHERE id=p_learner AND is_deleted=false;
 IF subject IS NULL OR NOT public.learning_job_audience_allows(p_learner,job.employment_type) OR EXISTS(SELECT 1 FROM public.applied_jobs WHERE learner_id=p_learner AND opportunity_id=p_job)
 OR EXISTS(SELECT 1 FROM public.user_settings WHERE user_id=subject AND notification_preferences->>'newOpportunities'='false') THEN RETURN false; END IF;
 INSERT INTO public.learning_job_notification_receipts(learner_id,opportunity_id,requirements_version) VALUES(p_learner,p_job,p_version) ON CONFLICT DO NOTHING;
 IF NOT FOUND THEN RETURN false; END IF;
 INSERT INTO public.notifications(recipient_id,type,title,message) VALUES(subject,'new_opportunity','Your learning matches a job opening',
  coalesce(job.job_title,job.title)||' at '||coalesce(job.company_name,'the employer')||'. Your evaluated learning meets the published requirements. Open Jobs for your learning to view it.');
 RETURN true;
END $$;
COMMIT;
