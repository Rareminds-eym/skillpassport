BEGIN;
CREATE FUNCTION public.has_learning_job_notification_work() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT EXISTS(SELECT 1 FROM public.learning_job_notification_work WHERE completed_at IS NULL AND next_attempt_at<=now() AND (lease_until IS NULL OR lease_until<now()));
$$;
REVOKE ALL ON FUNCTION public.has_learning_job_notification_work() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.has_learning_job_notification_work() TO service_role;
COMMIT;
