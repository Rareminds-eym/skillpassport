BEGIN;

-- Align the byte budget with the existing 32,000-character job description
-- contract. Preserve publisher-policy, revision and in-flight fences verbatim;
-- privacy and retention wrappers remain the only permitted callers.
CREATE OR REPLACE FUNCTION public.zoho_stage_record_before_privacy(p_connection uuid,p_module text,p_external_id text,p_modified timestamptz,p_data jsonb,p_errors jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; v public.zoho_staged_records; h text; policy public.zoho_job_publisher_policies; errors_value jsonb:=p_errors;
BEGIN
  SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;

  IF p_module='Job_Openings' THEN
    SELECT * INTO policy FROM public.zoho_job_publisher_policies WHERE connection_id=p_connection;
    IF FOUND AND policy.enabled AND policy.no_email_reviewed AND policy.config_revision=c.config_revision
      AND policy.trigger_fingerprint=public.zoho_job_trigger_fingerprint()
      AND policy.status_map->>(p_data->>'source_status') IN ('open','closed','draft')
      AND policy.employment_map->>(p_data->>'employment_type') IN ('job','internship','contract') THEN
      SELECT coalesce(jsonb_agg(value),'[]'::jsonb) INTO errors_value FROM jsonb_array_elements(p_errors)
        WHERE value IS DISTINCT FROM to_jsonb('Job publication and status mapping requires review.'::text);
    ELSIF jsonb_typeof(errors_value)='array' AND NOT errors_value @> '["Job publication and status mapping requires review."]'::jsonb THEN
      errors_value:=errors_value||'["Job publication and status mapping requires review."]'::jsonb;
    END IF;
  END IF;
  IF c.status <> 'connected' THEN RAISE EXCEPTION 'Connection is not active' USING ERRCODE='22023'; END IF;
  IF p_modified IS NULL OR p_modified > now()+interval '5 minutes' OR octet_length(p_data::text)>(CASE WHEN p_module='Job_Openings' THEN 131072 ELSE 65536 END)
    OR jsonb_typeof(p_data)<>'object' OR jsonb_typeof(errors_value)<>'array' THEN
    RAISE EXCEPTION 'Invalid staged record' USING ERRCODE='22023';
  END IF;
  h:=encode(sha256(convert_to(p_data::text,'UTF8')),'hex');
  SELECT * INTO v FROM public.zoho_staged_records WHERE connection_id=p_connection AND module=p_module AND external_id=p_external_id FOR UPDATE;
  IF FOUND THEN
    IF p_modified<v.source_modified_at THEN RETURN jsonb_build_object('id',v.id,'revision',v.revision,'unchanged',true); END IF;
    IF h=v.source_hash AND c.config_revision=v.config_revision AND errors_value=v.validation_errors THEN
      UPDATE public.zoho_staged_records SET source_modified_at=greatest(source_modified_at,p_modified) WHERE id=v.id;
      RETURN jsonb_build_object('id',v.id,'revision',v.revision,'unchanged',true);
    END IF;
    UPDATE public.zoho_approved_operations SET state='approval_stale' WHERE record_id=v.id AND state IN ('queued','failed');
    IF EXISTS(SELECT 1 FROM public.zoho_approved_operations WHERE record_id=v.id AND state='processing') THEN
      RAISE EXCEPTION 'Record execution is in flight; retry staging' USING ERRCODE='40001';
    END IF;
    UPDATE public.zoho_staged_records SET source_modified_at=p_modified,source_hash=h,revision=revision+1,
      config_revision=c.config_revision,proposed_data=p_data,validation_errors=errors_value,decision='pending_approval',
      execution_state='not_approved',updated_at=now() WHERE id=v.id RETURNING * INTO v;
  ELSE
    INSERT INTO public.zoho_staged_records(connection_id,module,external_id,source_modified_at,source_hash,config_revision,proposed_data,validation_errors)
    VALUES(p_connection,p_module,p_external_id,p_modified,h,c.config_revision,p_data,errors_value) RETURNING * INTO v;
  END IF;
  RETURN jsonb_build_object('id',v.id,'revision',v.revision,'decision',v.decision);
END;
$$;

REVOKE ALL ON FUNCTION public.zoho_stage_record_before_privacy(uuid,text,text,timestamptz,jsonb,jsonb)
 FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;

COMMIT;
