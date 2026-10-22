BEGIN;
CREATE FUNCTION public.list_learning_equivalencies(p_user uuid,p_offset integer DEFAULT 0,p_review boolean DEFAULT false)
RETURNS SETOF public.learning_equivalencies LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT e.* FROM public.learning_equivalencies e JOIN public.learners l ON l.id=e.learner_id
 WHERE (NOT p_review AND l.user_id=p_user) OR (p_review AND l.user_id<>p_user AND (
  EXISTS(SELECT 1 FROM public.school_educators t WHERE t.user_id=p_user AND t.school_id=l.school_id AND t.account_status='active') OR
  EXISTS(SELECT 1 FROM public.college_lecturers t WHERE t.user_id=p_user AND t."collegeId"=l.college_id AND t."accountStatus"='active')
 )) ORDER BY e.created_at DESC,e.id LIMIT 25 OFFSET greatest(0,least(p_offset,100000));
$$;
REVOKE ALL ON FUNCTION public.list_learning_equivalencies(uuid,integer,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.list_learning_equivalencies(uuid,integer,boolean) TO service_role;
COMMIT;
