-- Synthetic source; no candidate or job destination effects.
DO $$
DECLARE c uuid; actor uuid:=gen_random_uuid(); org uuid; r uuid; continued uuid; claim jsonb; issues jsonb; records jsonb;
BEGIN
 SELECT id INTO STRICT org FROM public.organizations LIMIT 1;
 c:=(public.zoho_register_connection('Batch pagination synthetic fixture','99999999999999999992','in',org,actor)->>'id')::uuid;
 PERFORM public.zoho_complete_connection(c,'{"version":1,"iv":"AAAAAAAAAAAAAAAA","ciphertext":"AAAAAAAAAAAAAAAAAAAAAAAA"}',actor);
 r:=(public.zoho_start_discovery(c,'Candidates',actor)->>'runId')::uuid;
 claim:=public.zoho_claim_discovery_batch(r);
 ASSERT claim->>'claimed'='true' AND claim->'run'->>'page_size'='200';
 SELECT jsonb_agg(jsonb_build_object('externalId',NULL,'code','SOURCE_SCHEMA_INVALID')) INTO issues FROM generate_series(1,400);
 SELECT jsonb_agg(jsonb_build_object('externalId',n::text,'modified','2026-11-06T00:00:00Z',
  'data',jsonb_build_object('email','batch'||n||'@example.invalid','name','Synthetic Candidate'),'errors','[]'::jsonb))
 INTO records FROM generate_series(1,400) n;
 PERFORM public.zoho_commit_claimed_discovery(r,(claim->>'lease')::uuid,1,records,'[]',true);
 ASSERT (SELECT next_page=2 AND received_count=400 AND staged_count=400 AND page_size=200 FROM public.zoho_discovery_runs WHERE id=r);
 -- Mixed-version workers must never advance a large-page run using ten-record pages.
 ASSERT public.zoho_claim_discovery(r)->>'claimed'='false';
 claim:=public.zoho_claim_discovery_batch(r);
 ASSERT claim->'run'->>'page_size'='200' AND claim->'run'->>'next_page'='2';
 BEGIN
  PERFORM public.zoho_commit_claimed_discovery(r,(claim->>'lease')::uuid,2,'[]',issues||'[{}]',true);
  RAISE EXCEPTION 'Oversized page accepted';
 EXCEPTION WHEN invalid_parameter_value THEN NULL;
 END;
 -- A large-page checkpoint must also survive a new run ID at page 501.
 UPDATE public.zoho_discovery_runs SET next_page=500,lease_page=500 WHERE id=r;
 PERFORM public.zoho_commit_claimed_discovery(r,(claim->>'lease')::uuid,500,'[]','[]',true);
 r:=(public.zoho_start_discovery(c,'Candidates',actor)->>'runId')::uuid;
 ASSERT (SELECT page_size=200 AND next_page=501 FROM public.zoho_discovery_runs WHERE id=r);
 -- Simulate an existing ten-record checkpoint; it must keep its geometry.
 UPDATE public.zoho_discovery_runs SET page_size=10,next_page=500,lease_token=NULL,lease_expires_at=NULL WHERE id=r;
 claim:=public.zoho_claim_discovery_batch(r);
 ASSERT claim->'run'->>'page_size'='10';
 PERFORM public.zoho_commit_claimed_discovery(r,(claim->>'lease')::uuid,500,'[]','[]',true);
 continued:=(public.zoho_start_discovery(c,'Candidates',actor)->>'runId')::uuid;
 ASSERT (SELECT page_size=10 AND next_page=501 FROM public.zoho_discovery_runs WHERE id=continued);
 -- Job descriptions use a smaller independent bound.
 r:=(public.zoho_start_discovery(c,'Job_Openings',actor)->>'runId')::uuid;
 claim:=public.zoho_claim_discovery_batch(r);
 ASSERT claim->'run'->>'page_size'='20';
 PERFORM public.zoho_control_discovery(c,r,'pause','Synthetic pause',actor);
 ASSERT public.zoho_claim_discovery_batch(r)->>'claimed'='false';
 ASSERT NOT has_function_privilege('anon','public.zoho_claim_discovery_batch(uuid)','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','public.zoho_claim_discovery_batch(uuid)','EXECUTE');
 ASSERT NOT has_function_privilege('service_role','public.zoho_claim_discovery_before_batching(uuid)','EXECUTE');
 ASSERT has_function_privilege('zoho_discovery','public.zoho_claim_discovery_batch(uuid)','EXECUTE');
END $$;
