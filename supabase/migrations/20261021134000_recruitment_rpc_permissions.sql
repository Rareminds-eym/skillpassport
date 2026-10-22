-- Supabase defaults can grant anon/authenticated EXECUTE independently of
-- PUBLIC. These functions trust the permission checks in the Pages API and
-- must never be callable directly with a client JWT.
BEGIN;
REVOKE ALL ON FUNCTION public.recruitment_accept_proposal(uuid,uuid,uuid,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.recruitment_accept_proposal(uuid,uuid,uuid,timestamptz) TO service_role;
REVOKE ALL ON FUNCTION public.save_recruitment_preferences(uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_recruitment_preferences(uuid,jsonb) TO service_role;
REVOKE ALL ON FUNCTION public.save_recruitment_team_settings(uuid,integer,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_recruitment_team_settings(uuid,integer,boolean) TO service_role;
REVOKE ALL ON FUNCTION public.recruitment_delete_draft_project(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.recruitment_delete_draft_project(uuid,uuid) TO service_role;
REVOKE ALL ON FUNCTION public.recruitment_pipeline_operation(uuid,uuid,uuid[],text,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.recruitment_pipeline_operation(uuid,uuid,uuid[],text,uuid,text) TO service_role;
REVOKE ALL ON FUNCTION public.record_recruitment_application_change() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_recruitment_application_change() TO service_role;
REVOKE ALL ON FUNCTION public.record_recruitment_work_review() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_recruitment_work_review() TO service_role;
REVOKE ALL ON FUNCTION public.guard_recruitment_project_record() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.guard_recruitment_project_record() TO service_role;
REVOKE ALL ON FUNCTION public.create_notification_from_pipeline_activity() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_notification_from_pipeline_activity() TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
