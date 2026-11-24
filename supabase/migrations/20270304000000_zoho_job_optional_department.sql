BEGIN;

-- Department is not a required Recruit field. Keep the reviewed payload shape
-- and all live grant/receipt/ownership/quota checks; only allow an empty value.
DO $migration$
DECLARE definition text; required_fields text := $$ARRAY['title','company_name','department','location','employment_type']$$;
BEGIN
  definition := pg_get_functiondef('public.zoho_apply_job_operation_effect(jsonb)'::regprocedure);
  IF position(required_fields IN definition) = 0 THEN
    RAISE EXCEPTION 'Unexpected job publisher validation definition';
  END IF;
  definition := replace(definition, ' FOREACH field IN ARRAY ' || required_fields || ' LOOP',
    $$ IF jsonb_typeof(d->'department') IS DISTINCT FROM 'string' OR length(d->>'department')>150 THEN
   RAISE EXCEPTION 'Invalid optional job department' USING ERRCODE='ZJ001';
 END IF;
 FOREACH field IN ARRAY ARRAY['title','company_name','location','employment_type'] LOOP$$);
  IF position('Invalid optional job department' IN definition) = 0 THEN
    RAISE EXCEPTION 'Job publisher validation patch was not applied';
  END IF;
  EXECUTE definition;
END;
$migration$;

-- Cached exports may carry the former validation error. Drop only that obsolete
-- job error at staging; keep source hashes, revision checks and every other issue.
DO $migration$
DECLARE definition text;
BEGIN
  definition := pg_get_functiondef('public.zoho_stage_record_before_privacy(uuid,text,text,timestamptz,jsonb,jsonb)'::regprocedure);
  IF position('errors_value jsonb:=p_errors' IN definition) = 0
    OR position('FROM jsonb_array_elements(p_errors)' IN definition) = 0 THEN
    RAISE EXCEPTION 'Unexpected job staging validation definition';
  END IF;
  definition := replace(definition, $$IF p_module='Job_Openings' THEN$$,
    $$IF p_module='Job_Openings' THEN
    IF jsonb_typeof(errors_value)='array' THEN
      SELECT coalesce(jsonb_agg(value),'[]'::jsonb) INTO errors_value FROM jsonb_array_elements(errors_value)
        WHERE value IS DISTINCT FROM to_jsonb('department mapping is required.'::text);
    END IF;$$);
  definition := replace(definition, 'FROM jsonb_array_elements(p_errors)', 'FROM jsonb_array_elements(errors_value)');
  EXECUTE definition;
END;
$migration$;

-- Existing policies must be reviewed again against the changed executable
-- fingerprint. No approvals, account creation or publication happens here.
COMMIT;
