BEGIN;
-- University college ids and organization ids are different identities. Resolve
-- only the verified FK mapping, never compare the two UUIDs directly.
CREATE FUNCTION public.learning_equivalency_reviewer_allowed(p_learner uuid,p_reviewer uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT coalesce((SELECT l.user_id<>p_reviewer AND NOT l.is_deleted AND (
 EXISTS(SELECT 1 FROM public.school_educators t WHERE t.user_id=p_reviewer AND t.school_id=l.school_id AND t.account_status='active') OR
 EXISTS(SELECT 1 FROM public.college_lecturers t WHERE t.user_id=p_reviewer AND t."accountStatus"='active' AND (
  t."collegeId"=l.college_id OR EXISTS(SELECT 1 FROM public.university_colleges uc WHERE uc.id=l.university_college_id
   AND uc.college_id=t."collegeId" AND uc.account_status='active')))) FROM public.learners l WHERE l.id=p_learner),false);
$$;
CREATE OR REPLACE FUNCTION public.review_learning_equivalency(p_id uuid,p_reviewer uuid,p_version integer,p_decision text,p_feedback text)
RETURNS public.learning_equivalencies LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE item public.learning_equivalencies; learner public.learners;
BEGIN
 SELECT * INTO STRICT item FROM public.learning_equivalencies WHERE id=p_id FOR UPDATE;
 SELECT * INTO STRICT learner FROM public.learners WHERE id=item.learner_id;
 IF NOT public.learning_equivalency_reviewer_allowed(item.learner_id,p_reviewer) THEN RAISE EXCEPTION 'REVIEWER_FORBIDDEN' USING ERRCODE='42501'; END IF;
 IF item.version<>p_version THEN RAISE EXCEPTION 'REVIEW_CHANGED' USING ERRCODE='40001'; END IF;
 IF p_decision NOT IN ('approved','rejected','revoked') OR length(trim(coalesce(p_feedback,''))) NOT BETWEEN 1 AND 4000 THEN
  RAISE EXCEPTION 'INVALID_REVIEW' USING ERRCODE='22023'; END IF;
 IF (item.status='approved' AND p_decision<>'revoked') OR (item.status<>'pending' AND p_decision<>'revoked') THEN
  RAISE EXCEPTION 'INVALID_REVIEW_TRANSITION' USING ERRCODE='22023'; END IF;
 IF p_decision='approved' AND NOT EXISTS(SELECT 1 FROM public.job_learning_catalog WHERE level_id=item.level_id AND fingerprint=item.fingerprint) THEN
  RAISE EXCEPTION 'CATALOG_CHANGED' USING ERRCODE='40001'; END IF;
 UPDATE public.learning_equivalencies SET status=p_decision,reviewer_id=p_reviewer,feedback=trim(p_feedback),reviewed_at=now(),version=version+1 WHERE id=p_id RETURNING * INTO item;
 INSERT INTO public.learning_equivalency_audit(equivalency_id,actor_id,decision,version,feedback) VALUES(item.id,p_reviewer,p_decision,item.version,trim(p_feedback));
 RETURN item;
END $$;

CREATE OR REPLACE FUNCTION public.list_learning_equivalencies(p_user uuid,p_offset integer DEFAULT 0,p_review boolean DEFAULT false)
RETURNS SETOF public.learning_equivalencies LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT e.* FROM public.learning_equivalencies e JOIN public.learners l ON l.id=e.learner_id
 WHERE (NOT p_review AND l.user_id=p_user) OR (p_review AND public.learning_equivalency_reviewer_allowed(l.id,p_user)) ORDER BY e.created_at DESC,e.id LIMIT 25 OFFSET greatest(0,least(p_offset,100000));
$$;

REVOKE ALL ON FUNCTION public.learning_equivalency_reviewer_allowed(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.learning_equivalency_reviewer_allowed(uuid,uuid) TO service_role;
COMMIT;
