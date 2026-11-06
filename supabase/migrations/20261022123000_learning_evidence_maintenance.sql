BEGIN;
CREATE INDEX learning_equivalencies_level ON public.learning_equivalencies(level_id);
CREATE INDEX learning_equivalencies_reviewer ON public.learning_equivalencies(reviewer_id) WHERE reviewer_id IS NOT NULL;
CREATE INDEX learning_equivalency_audit_request ON public.learning_equivalency_audit(equivalency_id);
CREATE INDEX job_application_verifications_user ON public.job_application_verifications(user_id);
CREATE INDEX applied_jobs_learning_verification ON public.applied_jobs(learning_verification_id) WHERE learning_verification_id IS NOT NULL;
CREATE INDEX job_application_verifications_time ON public.job_application_verifications(verified_at);
CREATE FUNCTION public.purge_unused_learning_verifications() RETURNS integer
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 WITH expired AS (
  SELECT v.id FROM public.job_application_verifications v
  WHERE v.verified_at<now()-interval '1 day'
   AND NOT EXISTS(SELECT 1 FROM public.applied_jobs a WHERE a.learning_verification_id=v.id)
  ORDER BY v.verified_at,v.id LIMIT 1000 FOR UPDATE SKIP LOCKED
 ), removed AS (
  DELETE FROM public.job_application_verifications v USING expired e WHERE v.id=e.id RETURNING v.id
 ) SELECT count(*)::integer FROM removed;
$$;
REVOKE ALL ON FUNCTION public.purge_unused_learning_verifications() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.purge_unused_learning_verifications() TO service_role;
COMMIT;
