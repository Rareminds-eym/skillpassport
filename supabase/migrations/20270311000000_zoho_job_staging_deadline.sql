BEGIN;
-- Keep the existing lease/transport checks and persisted geometry. Smaller job
-- pages leave room for both conversion streams under the Data API deadline.
CREATE OR REPLACE FUNCTION public.zoho_claim_discovery_batch(p_run uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE r public.zoho_discovery_runs; result jsonb;
BEGIN
 r:=public.zoho_lock_discovery_run(p_run);
 IF r.transport<>'rest' THEN RETURN jsonb_build_object('claimed',false); END IF;
 result:=public.zoho_claim_discovery_before_transport(p_run);
 IF result->>'claimed'='true' AND r.module='Job_Openings' THEN
  IF r.next_page=1 AND r.received_count=0 THEN
   UPDATE public.zoho_discovery_runs SET page_size=5 WHERE id=r.id;
   result:=jsonb_set(result,'{run,page_size}','5'::jsonb);
  END IF;
 END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.zoho_claim_discovery_batch(uuid) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.zoho_claim_discovery_batch(uuid) TO zoho_discovery;
COMMIT;
