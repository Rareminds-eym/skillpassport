BEGIN;
-- Stable keysets prevent mutable recovery timestamps moving pending work between
-- pages. Existing rows use their last known timestamp once at upgrade time.
ALTER TABLE public.zoho_candidate_administration_progress ADD COLUMN created_at timestamptz;
UPDATE public.zoho_candidate_administration_progress SET created_at=updated_at;
ALTER TABLE public.zoho_candidate_administration_progress ALTER COLUMN created_at SET DEFAULT now(),ALTER COLUMN created_at SET NOT NULL;
CREATE INDEX zoho_administration_pending_history ON public.zoho_candidate_administration_progress(source_org_id,created_at DESC,request_id DESC)
 WHERE NOT(completed AND artifacts_confirmed);
CREATE INDEX zoho_administration_actor_history ON public.zoho_candidate_administration_progress(source_org_id,actor_id,created_at DESC,request_id DESC);
CREATE INDEX zoho_lifecycle_pending_history ON public.zoho_source_lifecycle_proposals(connection_id,created_at DESC,id DESC)
 WHERE decision IN('pending_approval','held');
CREATE FUNCTION public.zoho_operator_history_page(p_connection uuid,p_actor uuid,p_kind text,p_view text,p_after timestamptz DEFAULT NULL,p_after_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE source_org text; items jsonb; more boolean; next_cursor jsonb;
BEGIN
 IF p_actor IS NULL OR coalesce(p_kind,'') NOT IN('lifecycle','administration') OR coalesce(p_view,'') NOT IN('pending','history')
  OR (p_after IS NULL)<>(p_after_id IS NULL) THEN RAISE EXCEPTION 'Invalid operator history scope' USING ERRCODE='22023'; END IF;
 SELECT source_org_id INTO source_org FROM public.zoho_connections WHERE id=p_connection;
 IF NOT FOUND THEN RAISE EXCEPTION 'Operator source unavailable' USING ERRCODE='22023'; END IF;
 IF p_kind='lifecycle' THEN
  WITH page AS(SELECT id,module,external_id,kind,survivor_external_id,revision,decision,effect,created_at
   FROM public.zoho_source_lifecycle_proposals WHERE connection_id=p_connection
    AND CASE p_view WHEN 'pending' THEN decision IN('pending_approval','held') ELSE decision IN('approved','rejected') END
    AND(p_after IS NULL OR(created_at,id)<(p_after,p_after_id)) ORDER BY created_at DESC,id DESC LIMIT 26),
   bounded AS(SELECT * FROM page ORDER BY created_at DESC,id DESC LIMIT 25)
  SELECT coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY created_at DESC,id DESC) FROM bounded x),'[]'),
    (SELECT count(*)>25 FROM page),
    (SELECT jsonb_build_object('timestamp',created_at,'id',id) FROM bounded ORDER BY created_at,id LIMIT 1)
   INTO items,more,next_cursor;
 ELSE
  WITH page AS(SELECT request_id,action,external_id,source_org_id,target_id,actor_id,completed,artifacts_confirmed,created_at,updated_at
   FROM public.zoho_candidate_administration_progress WHERE source_org_id=source_org AND(p_view='pending' OR actor_id=p_actor)
    AND CASE p_view WHEN 'pending' THEN NOT(completed AND artifacts_confirmed) ELSE completed AND artifacts_confirmed END
    AND(p_after IS NULL OR(created_at,request_id)<(p_after,p_after_id)) ORDER BY created_at DESC,request_id DESC LIMIT 26),
   bounded AS(SELECT * FROM page ORDER BY created_at DESC,request_id DESC LIMIT 25)
  SELECT coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY created_at DESC,request_id DESC) FROM bounded x),'[]'),
    (SELECT count(*)>25 FROM page),
    (SELECT jsonb_build_object('timestamp',created_at,'id',request_id) FROM bounded ORDER BY created_at,request_id LIMIT 1)
   INTO items,more,next_cursor;
 END IF;
 RETURN jsonb_build_object('version',1,'kind',p_kind,'view',p_view,'items',items,'nextCursor',CASE WHEN more THEN next_cursor ELSE NULL END);
END $$;
REVOKE ALL ON FUNCTION public.zoho_operator_history_page(uuid,uuid,text,text,timestamptz,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_operator_history_page(uuid,uuid,text,text,timestamptz,uuid) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
