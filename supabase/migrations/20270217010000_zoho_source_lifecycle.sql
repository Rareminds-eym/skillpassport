BEGIN;
-- Discovery evidence is separate from approval. No canonical deletion/merge or
-- destination writes occur here; approved job closures enter ordinary review.
CREATE TABLE public.zoho_source_lifecycle_proposals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 connection_id uuid NOT NULL REFERENCES public.zoho_connections(id),
 module text NOT NULL CHECK(module IN ('Candidates','Job_Openings')),
 external_id text NOT NULL CHECK(external_id ~ '^[0-9]{1,40}$'),
 kind text NOT NULL CHECK(kind IN ('recycle','permanent','merge')),
 survivor_external_id text CHECK(survivor_external_id ~ '^[0-9]{1,40}$'),
 observed_at timestamptz NOT NULL,
 evidence_hash text NOT NULL CHECK(evidence_hash ~ '^[0-9a-f]{64}$'),
 revision integer NOT NULL DEFAULT 1 CHECK(revision>0),
 config_revision integer NOT NULL,
 record_revision integer,
 decision text NOT NULL DEFAULT 'pending_approval' CHECK(decision IN ('pending_approval','held','rejected','approved')),
 effect text CHECK(effect IN ('source_suppressed','job_closure_staged','source_linkage_recorded')),
 actor_id uuid,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(connection_id,module,external_id,kind,observed_at),
 CHECK((kind='merge')=(survivor_external_id IS NOT NULL)),
 CHECK(survivor_external_id IS DISTINCT FROM external_id)
);
CREATE TABLE public.zoho_source_lifecycle_decisions (
 connection_id uuid NOT NULL REFERENCES public.zoho_connections(id), request_id uuid NOT NULL,
 proposal_id uuid NOT NULL REFERENCES public.zoho_source_lifecycle_proposals(id),
 manifest jsonb NOT NULL, result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(connection_id,request_id)
);
CREATE TABLE public.zoho_source_linkages (
 source_org_id text NOT NULL, module text NOT NULL, external_id text NOT NULL,
 survivor_external_id text NOT NULL, proposal_id uuid NOT NULL REFERENCES public.zoho_source_lifecycle_proposals(id),
 PRIMARY KEY(source_org_id,module,external_id), CHECK(external_id<>survivor_external_id)
);
CREATE INDEX zoho_lifecycle_review ON public.zoho_source_lifecycle_proposals(connection_id,created_at DESC,id DESC);
REVOKE ALL ON public.zoho_source_lifecycle_proposals,public.zoho_source_lifecycle_decisions,public.zoho_source_linkages
 FROM PUBLIC,anon,authenticated,zoho_discovery,service_role;
GRANT SELECT ON public.zoho_source_lifecycle_proposals,public.zoho_source_lifecycle_decisions,public.zoho_source_linkages TO service_role;

CREATE FUNCTION public.zoho_stage_source_deletions(p_connection uuid,p_module text,p_page integer,p_records jsonb,p_more boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; item jsonb; n integer:=0;
BEGIN
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 IF c.status<>'connected' OR p_module IS NULL OR p_module NOT IN ('Candidates','Job_Openings') OR p_page IS NULL OR p_page NOT BETWEEN 1 AND 500000
 OR p_more IS NULL OR jsonb_typeof(p_records) IS DISTINCT FROM 'array' OR jsonb_array_length(p_records)>200 THEN
 RAISE EXCEPTION 'Invalid deletion page' USING ERRCODE='22023'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(p_records) LOOP
  IF coalesce(item->>'externalId','') !~ '^[0-9]{1,40}$' OR coalesce(item->>'kind','') NOT IN ('recycle','permanent')
   OR item->>'observedAt' IS NULL OR (item->>'observedAt')::timestamptz>now()+interval '5 minutes' THEN
   RAISE EXCEPTION 'Invalid deletion evidence' USING ERRCODE='22023'; END IF;
  INSERT INTO public.zoho_source_lifecycle_proposals(connection_id,module,external_id,kind,observed_at,evidence_hash,config_revision,record_revision)
  SELECT c.id,p_module,item->>'externalId',item->>'kind',(item->>'observedAt')::timestamptz,
    encode(sha256(convert_to(item::text,'UTF8')),'hex'),c.config_revision,
    (SELECT revision FROM public.zoho_staged_records WHERE connection_id=c.id AND module=p_module AND external_id=item->>'externalId')
  ON CONFLICT(connection_id,module,external_id,kind,observed_at) DO NOTHING;
  n:=n+1;
 END LOOP;
 RETURN jsonb_build_object('received',n,'nextPage',CASE WHEN p_more THEN p_page+1 END,'done',NOT p_more,'destinationEffect',false);
END;
$$;

CREATE FUNCTION public.zoho_stage_source_merge(p_connection uuid,p_module text,p_external text,p_survivor text,p_observed timestamptz,p_evidence text,p_actor uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; v public.zoho_source_lifecycle_proposals;
BEGIN
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 IF c.status<>'connected' OR p_actor IS NULL OR p_module IS NULL OR p_module NOT IN ('Candidates','Job_Openings')
 OR coalesce(p_external,'') !~ '^[0-9]{1,40}$' OR coalesce(p_survivor,'') !~ '^[0-9]{1,40}$' OR p_external=p_survivor
 OR p_observed IS NULL OR p_observed>now()+interval '5 minutes' OR p_evidence IS NULL OR length(trim(p_evidence)) NOT BETWEEN 10 AND 500 THEN
 RAISE EXCEPTION 'Invalid merge evidence' USING ERRCODE='22023'; END IF;
 INSERT INTO public.zoho_source_lifecycle_proposals(connection_id,module,external_id,kind,survivor_external_id,observed_at,evidence_hash,config_revision,record_revision,actor_id)
 SELECT c.id,p_module,p_external,'merge',p_survivor,p_observed,encode(sha256(convert_to(trim(p_evidence),'UTF8')),'hex'),c.config_revision,
  (SELECT revision FROM public.zoho_staged_records WHERE connection_id=c.id AND module=p_module AND external_id=p_external),p_actor
 ON CONFLICT(connection_id,module,external_id,kind,observed_at) DO NOTHING RETURNING * INTO v;
 IF v.id IS NULL THEN
  SELECT * INTO STRICT v FROM public.zoho_source_lifecycle_proposals WHERE connection_id=c.id AND module=p_module AND external_id=p_external AND kind='merge' AND observed_at=p_observed;
  IF v.survivor_external_id<>p_survivor OR v.evidence_hash<>encode(sha256(convert_to(trim(p_evidence),'UTF8')),'hex') THEN
   RAISE EXCEPTION 'Evidence conflict' USING ERRCODE='40001'; END IF;
 END IF;
 RETURN jsonb_build_object('id',v.id,'revision',v.revision,'decision',v.decision,'canonicalMerge',false);
END;
$$;

CREATE FUNCTION public.zoho_source_lifecycle_snapshot(p_connection uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT coalesce(jsonb_agg(to_jsonb(v) ORDER BY v.created_at DESC,v.id DESC),'[]'::jsonb) FROM
 (SELECT id,module,external_id,kind,survivor_external_id,observed_at,evidence_hash,revision,config_revision,record_revision,decision,effect,created_at
 FROM public.zoho_source_lifecycle_proposals WHERE connection_id=p_connection ORDER BY created_at DESC,id DESC LIMIT 100) v;
$$;

CREATE FUNCTION public.zoho_decide_source_lifecycle(p_connection uuid,p_proposal uuid,p_revision integer,p_decision text,p_reason text,p_request uuid,p_actor uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; v public.zoho_source_lifecycle_proposals; r public.zoho_staged_records;
 previous public.zoho_source_lifecycle_decisions; manifest jsonb; result jsonb; staged jsonb; v_effect text; closed_label text;
BEGIN
 IF p_actor IS NULL OR p_request IS NULL OR p_revision IS NULL OR p_decision IS NULL OR p_decision NOT IN ('approve','hold','reject')
 OR p_reason IS NULL OR length(trim(p_reason)) NOT BETWEEN 3 AND 500 THEN RAISE EXCEPTION 'Invalid lifecycle decision' USING ERRCODE='22023'; END IF;
 SELECT * INTO STRICT c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 manifest:=jsonb_build_object('proposal',p_proposal,'revision',p_revision,'decision',p_decision,'actor',p_actor,'reasonHash',encode(sha256(convert_to(trim(p_reason),'UTF8')),'hex'));
 SELECT * INTO previous FROM public.zoho_source_lifecycle_decisions WHERE connection_id=c.id AND request_id=p_request;
 IF FOUND THEN
  IF previous.manifest<>manifest THEN RAISE EXCEPTION 'Idempotency conflict' USING ERRCODE='40001'; END IF;
  RETURN previous.result||jsonb_build_object('replayed',true);
 END IF;
 SELECT * INTO STRICT v FROM public.zoho_source_lifecycle_proposals WHERE id=p_proposal AND connection_id=c.id FOR UPDATE;
 IF v.revision<>p_revision OR v.decision='approved' OR v.config_revision<>c.config_revision THEN
 RAISE EXCEPTION 'Lifecycle review stale' USING ERRCODE='40001'; END IF;
 IF p_decision='approve' THEN
  IF c.status<>'connected' THEN RAISE EXCEPTION 'Source unavailable' USING ERRCODE='22023'; END IF;
  SELECT * INTO r FROM public.zoho_staged_records WHERE connection_id=c.id AND module=v.module AND external_id=v.external_id FOR UPDATE;
  IF r.revision IS DISTINCT FROM v.record_revision OR r.source_modified_at>v.observed_at THEN
   RAISE EXCEPTION 'Record changed after evidence' USING ERRCODE='40001'; END IF;
  IF v.kind='merge' THEN
   -- Neither matching emails nor source survivor IDs authorize canonical merging.
   -- Require a staged survivor, prohibit chains/cycles, record connector linkage.
   IF v.module='Job_Openings' AND r.target_id IS NOT NULL AND NOT EXISTS(
    SELECT 1 FROM public.opportunities WHERE id=r.target_id AND status='closed' AND is_active=false) THEN
    RAISE EXCEPTION 'Approve and execute losing job closure before source linkage' USING ERRCODE='22023'; END IF;
   IF NOT EXISTS(SELECT 1 FROM public.zoho_staged_records WHERE connection_id=c.id AND module=v.module AND external_id=v.survivor_external_id)
    OR EXISTS(SELECT 1 FROM public.zoho_source_linkages WHERE source_org_id=c.source_org_id AND module=v.module
     AND (external_id=v.survivor_external_id OR survivor_external_id=v.external_id)) THEN
    RAISE EXCEPTION 'Survivor requires independent review' USING ERRCODE='22023'; END IF;
   INSERT INTO public.zoho_source_linkages VALUES(c.source_org_id,v.module,v.external_id,v.survivor_external_id,v.id)
    ON CONFLICT(source_org_id,module,external_id) DO UPDATE SET survivor_external_id=excluded.survivor_external_id,proposal_id=excluded.proposal_id;
   PERFORM public.zoho_set_source_suppression(c.id,v.module,v.external_id,true,p_reason,p_actor);
   v_effect:='source_linkage_recorded';
  ELSIF v.module='Candidates' OR r.target_id IS NULL THEN
   PERFORM public.zoho_set_source_suppression(c.id,v.module,v.external_id,true,p_reason,p_actor);
   v_effect:='source_suppressed';
  ELSE
   -- Use configured closed label. Normal job approval, immutable evidence,
   -- destination ownership and trigger fingerprint still authorize the write.
   SELECT key INTO closed_label FROM public.zoho_job_publisher_policies p CROSS JOIN LATERAL jsonb_each_text(p.status_map)
    WHERE p.connection_id=c.id AND p.config_revision=c.config_revision AND p.enabled AND value='closed' ORDER BY key LIMIT 1;
   IF closed_label IS NULL OR r.payload_redacted_at IS NOT NULL THEN RAISE EXCEPTION 'Closure policy unavailable' USING ERRCODE='22023'; END IF;
   staged:=public.zoho_stage_record(c.id,v.module,v.external_id,v.observed_at,r.proposed_data||jsonb_build_object('source_status',closed_label),'[]'::jsonb);
   v_effect:='job_closure_staged';
  END IF;
 END IF;
 UPDATE public.zoho_source_lifecycle_proposals SET decision=CASE p_decision WHEN 'approve' THEN 'approved' WHEN 'hold' THEN 'held' ELSE 'rejected' END,
  effect=v_effect,revision=revision+1,actor_id=p_actor WHERE id=v.id;
 result:=jsonb_build_object('id',v.id,'decision',p_decision,'effect',v_effect,'canonicalDeletion',false,'canonicalMerge',false,
  'jobReviewRequired',coalesce(v_effect='job_closure_staged',false),'staged',staged,'emailPolicy','forbidden');
 INSERT INTO public.zoho_source_lifecycle_decisions VALUES(c.id,p_request,v.id,manifest,result,now());
 RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.zoho_stage_source_deletions(uuid,text,integer,jsonb,boolean),public.zoho_stage_source_merge(uuid,text,text,text,timestamptz,text,uuid),
 public.zoho_source_lifecycle_snapshot(uuid),public.zoho_decide_source_lifecycle(uuid,uuid,integer,text,text,uuid,uuid) FROM PUBLIC,anon,authenticated,zoho_discovery;
GRANT EXECUTE ON FUNCTION public.zoho_stage_source_deletions(uuid,text,integer,jsonb,boolean),public.zoho_stage_source_merge(uuid,text,text,text,timestamptz,text,uuid),
 public.zoho_source_lifecycle_snapshot(uuid),public.zoho_decide_source_lifecycle(uuid,uuid,integer,text,text,uuid,uuid) TO service_role;
COMMIT;
