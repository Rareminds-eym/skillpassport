-- Legacy profile types contain mixed casing and surrounding whitespace.
-- Keep institutional candidates on reviewer approval regardless of presentation.
BEGIN;
CREATE OR REPLACE FUNCTION public.job_learning_evaluation_policy(p_learner uuid,p_user uuid) RETURNS text
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT CASE WHEN l.school_id IS NULL AND l.college_id IS NULL AND l.university_college_id IS NULL
 AND lower(btrim(coalesce(l.learner_type,''))) NOT IN ('school','school_student','college','college_student')
 AND NOT EXISTS(SELECT 1 FROM public.organization_members m JOIN public.organizations o ON o.id=m.organization_id
  WHERE m.user_id=p_user AND m.status='active' AND o.organization_type IN ('school','college','university'))
 THEN 'ai' ELSE 'human' END FROM public.learners l WHERE l.id=p_learner AND l.user_id=p_user AND l.is_deleted=false;
$$;
REVOKE ALL ON FUNCTION public.job_learning_evaluation_policy(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.job_learning_evaluation_policy(uuid,uuid) TO service_role;
COMMIT;
