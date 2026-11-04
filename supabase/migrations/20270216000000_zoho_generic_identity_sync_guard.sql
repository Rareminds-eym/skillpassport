BEGIN;
-- Local tombstones/private receipts remain authoritative even during pauses.
-- Once candidate work exists, removing the canonical binding cannot enable replay.
CREATE FUNCTION public.zoho_generic_identity_sync_policy(p_user uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE needs_canonical boolean;
BEGIN
 SELECT EXISTS(SELECT 1 FROM public.zoho_candidate_projections) INTO needs_canonical;
 IF NOT needs_canonical AND to_regclass('public.zoho_approved_operations') IS NOT NULL THEN
   SELECT EXISTS(SELECT 1 FROM public.zoho_approved_operations WHERE action='provision_candidate') INTO needs_canonical;
 END IF;
 RETURN jsonb_build_object('version',1,'requiresCanonicalPolicy',needs_canonical,
   'genericSyncAllowed',p_user IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.zoho_candidate_projections
     WHERE target_id=p_user AND (private_profile OR user_id IS NULL OR learner_id IS NULL)));
END;
$$;
REVOKE ALL ON FUNCTION public.zoho_generic_identity_sync_policy(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_generic_identity_sync_policy(uuid) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
