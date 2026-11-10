BEGIN;
DO $$
DECLARE c uuid; org uuid; actor uuid:=gen_random_uuid(); payload jsonb; result jsonb; n integer;
BEGIN
 SELECT id INTO STRICT org FROM public.organizations LIMIT 1;
 c:=(public.zoho_register_connection('Unicode job payload fixture','99999999999999999993','in',org,actor)->>'id')::uuid;
 PERFORM public.zoho_complete_connection(c,'{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"AAAAAAAAAAAAAAAAAAAAAAAA"}',actor);
 payload:=jsonb_build_object('title',repeat('漢',500),'company_name',repeat('漢',300),'department',repeat('漢',150),
  'location',repeat('漢',302),'employment_type',repeat('漢',100),'source_status',repeat('漢',100),
  'application_link',repeat('漢',2048),'description',repeat('漢',32000));
 ASSERT octet_length(payload::text)>65536 AND octet_length(payload::text)<131072;
 FOR n IN 1..40 LOOP
  result:=public.zoho_stage_record(c,'Job_Openings',n::text,now(),payload,'[]');
  ASSERT (SELECT proposed_data=payload AND decision='pending_approval'
   AND validation_errors @> '["Job publication and status mapping requires review."]'::jsonb
   FROM public.zoho_staged_records WHERE id=(result->>'id')::uuid);
 END LOOP;
 ASSERT (SELECT count(*)=40 FROM public.zoho_staged_records WHERE connection_id=c);
 -- Stable source content still reuses its revision; no approval is granted.
 result:=public.zoho_stage_record(c,'Job_Openings','1',now(),payload,'[]');
 ASSERT result->>'revision'='1' AND result->>'unchanged'='true';
 BEGIN
  PERFORM public.zoho_stage_record(c,'Job_Openings','41',now(),jsonb_build_object('description',repeat('x',131072)),'[]');
  RAISE EXCEPTION 'Unbounded job accepted';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 BEGIN
  PERFORM public.zoho_stage_record(c,'Candidates','42',now(),jsonb_build_object('name',repeat('x',65536)),'[]');
  RAISE EXCEPTION 'Candidate budget widened';
 EXCEPTION WHEN invalid_parameter_value THEN NULL; END;
 ASSERT NOT has_function_privilege('anon','public.zoho_stage_record(uuid,text,text,timestamptz,jsonb,jsonb)','EXECUTE');
 ASSERT NOT has_function_privilege('service_role','public.zoho_stage_record_before_privacy(uuid,text,text,timestamptz,jsonb,jsonb)','EXECUTE');
 ASSERT NOT has_function_privilege('zoho_discovery','public.zoho_stage_record_before_privacy(uuid,text,text,timestamptz,jsonb,jsonb)','EXECUTE');
END $$;
ROLLBACK;
