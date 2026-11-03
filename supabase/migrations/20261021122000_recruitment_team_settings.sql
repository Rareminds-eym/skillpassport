BEGIN;
CREATE OR REPLACE FUNCTION public.save_recruitment_team_settings(p_organization_id uuid,p_max_recruiters integer,p_require_approval boolean) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=public,pg_temp AS $$
 INSERT INTO public.organization_recruitment_settings(organization_id,max_recruiters,metadata)
 VALUES(p_organization_id,p_max_recruiters,jsonb_build_object('require_approval',p_require_approval,'onboarding_settings_saved_at',now()))
 ON CONFLICT(organization_id) DO UPDATE SET max_recruiters=p_max_recruiters,metadata=COALESCE(organization_recruitment_settings.metadata,'{}'::jsonb)||jsonb_build_object('require_approval',p_require_approval,'onboarding_settings_saved_at',now()),updated_at=now();
$$;
REVOKE ALL ON FUNCTION public.save_recruitment_team_settings(uuid,integer,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.save_recruitment_team_settings(uuid,integer,boolean) TO service_role;
COMMIT;
