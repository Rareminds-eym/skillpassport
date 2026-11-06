BEGIN;
-- Source-purpose erasure fences never delete independently established platform accounts.
CREATE TABLE public.zoho_candidate_source_erasure (
 source_org_id text NOT NULL, external_id text NOT NULL, target_id uuid NOT NULL,
 suppressed boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(source_org_id,external_id,target_id)
);
CREATE TABLE public.zoho_candidate_erased_operations (
 operation_id uuid PRIMARY KEY, target_id uuid NOT NULL, request_id uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.zoho_candidate_administration_progress (
 request_id uuid PRIMARY KEY, actor_id uuid NOT NULL, action text NOT NULL, target_id uuid NOT NULL,
 source_org_id text NOT NULL, external_id text NOT NULL, last_operation_id uuid,
 completed boolean NOT NULL DEFAULT false, artifacts_confirmed boolean NOT NULL DEFAULT false, updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.zoho_candidate_source_erasure,public.zoho_candidate_erased_operations,public.zoho_candidate_administration_progress FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.zoho_candidate_administration_progress TO service_role;
CREATE OR REPLACE FUNCTION public.zoho_apply_candidate_projection(p_snapshot text,p_projection_hash text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE b jsonb; u jsonb; v jsonb; expected jsonb; actual jsonb; target uuid; operation uuid; learner uuid;
  source_hash text; learner_context boolean:=false; mirror_role public.users.role%TYPE; private_profile boolean:=false; existing public.users; profile public.learners;
  receipt public.zoho_candidate_projections; subs uuid[]:='{}'; plans uuid[]:='{}'; version timestamptz;
BEGIN
  IF p_snapshot IS NULL OR octet_length(p_snapshot)>131072 OR p_projection_hash IS NULL
    OR encode(sha256(convert_to(p_snapshot,'UTF8')),'hex')<>p_projection_hash THEN
    RAISE EXCEPTION 'Invalid canonical snapshot' USING ERRCODE='22023'; END IF;
  b:=p_snapshot::jsonb; u:=b->'user'; target:=(b->>'targetId')::uuid; operation:=(b->>'operationId')::uuid;
  source_hash:=b->>'sourceHash';
  IF b->>'version' IS DISTINCT FROM '1' OR b->>'emailPolicy' IS DISTINCT FROM 'forbidden'
    OR source_hash IS NULL OR source_hash !~ '^[a-f0-9]{64}$' OR target IS NULL OR operation IS NULL
    OR u->>'id' IS DISTINCT FROM target::text OR u->>'email' IS NULL OR length(u->>'email')>320
    OR b->>'identityOutcome' NOT IN ('created','existing_access_preserved') OR b->>'identityOutcome' IS NULL
    OR jsonb_typeof(b->'subscriptions') IS DISTINCT FROM 'array' OR jsonb_typeof(b->'plans') IS DISTINCT FROM 'array'
    OR jsonb_array_length(b->'subscriptions') NOT BETWEEN 1 AND 25 OR jsonb_array_length(b->'plans') NOT BETWEEN 1 AND 25 THEN
    RAISE EXCEPTION 'Unsupported canonical snapshot' USING ERRCODE='22023'; END IF;
  IF b ? 'learnerContext' THEN
    learner_context:=jsonb_typeof(b->'learnerContext')='object'
      AND b->'learnerContext'->>'version'='1' AND b->'learnerContext'->>'role'='learner'
      AND b->'learnerContext'->>'productCode'='skillpassport' AND b->'learnerContext'->'active'='true'::jsonb
      AND b->'learnerContext'->>'membershipId' ~ '^[0-9a-fA-F-]{36}$'
      AND b->'learnerContext'->>'organizationId' ~ '^[0-9a-fA-F-]{36}$'
      AND b->'learnerContext'->'source'->>'sourceOrgId' ~ '^[0-9]{1,40}$'
      AND b->'learnerContext'->'source'->>'externalId' ~ '^[0-9]{1,40}$';
    IF learner_context IS DISTINCT FROM true THEN RAISE EXCEPTION 'Invalid learner context' USING ERRCODE='22023'; END IF;
    PERFORM (b->'learnerContext'->>'membershipId')::uuid,(b->'learnerContext'->>'organizationId')::uuid;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('zoho-projection:'||target::text,0));
  IF EXISTS(SELECT 1 FROM public.zoho_candidate_erased_operations WHERE operation_id=operation)
    OR (learner_context AND EXISTS(SELECT 1 FROM public.zoho_candidate_source_erasure WHERE source_org_id=b->'learnerContext'->'source'->>'sourceOrgId'
      AND external_id=b->'learnerContext'->'source'->>'externalId' AND target_id=target AND suppressed)) THEN
    RAISE EXCEPTION 'Erased connector operation cannot be replayed' USING ERRCODE='22023'; END IF;

  IF EXISTS(SELECT 1 FROM public.zoho_candidate_projections WHERE (operation_id=operation OR target_id=target)
    AND (user_id IS NULL OR learner_id IS NULL)) THEN
    RAISE EXCEPTION 'Deleted projection requires separate review' USING ERRCODE='22023'; END IF;
  IF EXISTS(SELECT 1 FROM public.zoho_candidate_projections p WHERE p.operation_id=operation AND (p.source_hash<>b->>'sourceHash' OR p.target_id<>target)) THEN
    RAISE EXCEPTION 'Projection operation conflict' USING ERRCODE='40001'; END IF;
  SELECT * INTO existing FROM public.users WHERE id=target FOR UPDATE;
  IF FOUND THEN
    IF existing.email IS DISTINCT FROM u->>'email' OR existing."isActive" IS DISTINCT FROM true THEN
      RAISE EXCEPTION 'Existing profile requires review' USING ERRCODE='22023'; END IF;
    SELECT * INTO profile FROM public.learners WHERE user_id=target FOR UPDATE;
    IF FOUND THEN
      IF profile.email IS DISTINCT FROM existing.email OR profile.is_deleted IS DISTINCT FROM false THEN
        RAISE EXCEPTION 'Existing learner requires review' USING ERRCODE='22023'; END IF;
      learner:=profile.id;
      private_profile:=EXISTS(SELECT 1 FROM public.zoho_candidate_projections p WHERE p.target_id=target AND p.private_profile IS TRUE);
      IF private_profile THEN PERFORM public.zoho_assert_private_projection_boundary(); END IF;
    ELSE
      -- Repair a missing learner mirror without rewriting the existing app user,
      -- its organization, preferences or privileges. Tombstones above still deny.
      PERFORM public.zoho_assert_private_projection_boundary();
      IF (NOT learner_context AND (existing.role::text IS DISTINCT FROM 'learner' OR u->>'primaryRole' IS DISTINCT FROM 'learner'))
        OR u->>'name' IS NULL OR length(trim(u->>'name')) NOT BETWEEN 2 AND 150 THEN
        RAISE EXCEPTION 'Missing learner context requires review' USING ERRCODE='22023'; END IF;
      INSERT INTO public.learners(user_id,email,name,notification_settings,metadata)
        VALUES(target,u->>'email',u->>'name',
          '{"weeklyDigest":false,"monthlyReport":false,"newOpportunities":false,"applicationUpdates":false,"emailNotifications":false,"recruitingMessages":false}',
          '{"origin":"zoho_recruit","emailPolicy":"forbidden"}') RETURNING id INTO learner;
      private_profile:=true;
    END IF;
  ELSE
    -- A flag is not authorization to place private PII into browser-readable tables.
    PERFORM public.zoho_assert_private_projection_boundary();
    IF b->>'identityOutcome' NOT IN ('created','existing_access_preserved') OR (u->>'primaryRole' IS DISTINCT FROM 'learner' AND NOT learner_context)
      OR length(trim(u->>'name')) NOT BETWEEN 2 AND 150 OR u->>'name' IS NULL THEN
      RAISE EXCEPTION 'New profile requires review' USING ERRCODE='22023'; END IF;
    IF learner_context AND (b->'learnerContext'->'primaryContext'->>'role' IS DISTINCT FROM u->>'primaryRole'
      OR b->'learnerContext'->'primaryContext'->>'membershipId' IS NULL OR b->'learnerContext'->'primaryContext'->>'organizationId' IS NULL
      OR u->>'primaryRole' NOT IN ('learner','recruiter','school_educator','college_educator','school_student','college_student')) THEN
      RAISE EXCEPTION 'Canonical primary role requires its existing application context' USING ERRCODE='22023'; END IF;
    IF learner_context THEN PERFORM (b->'learnerContext'->'primaryContext'->>'membershipId')::uuid,(b->'learnerContext'->'primaryContext'->>'organizationId')::uuid; END IF;
    BEGIN mirror_role:=u->>'primaryRole';
    EXCEPTION WHEN invalid_text_representation THEN RAISE EXCEPTION 'Canonical primary role has no application mapping' USING ERRCODE='22023'; END;
    INSERT INTO public.users(id,email,role,"organizationId","firstName","lastName",metadata)
      VALUES(target,u->>'email',mirror_role,NULL,split_part(u->>'name',' ',1),trim(substr(u->>'name',length(split_part(u->>'name',' ',1))+1)),
        '{"origin":"zoho_recruit","emailPolicy":"forbidden"}');
    INSERT INTO public.learners(user_id,email,name,notification_settings,metadata)
      VALUES(target,u->>'email',u->>'name',
        '{"weeklyDigest":false,"monthlyReport":false,"newOpportunities":false,"applicationUpdates":false,"emailNotifications":false,"recruitingMessages":false}',
        '{"origin":"zoho_recruit","emailPolicy":"forbidden"}') RETURNING id INTO learner;
    private_profile:=true;
  END IF;
  INSERT INTO public.users_shadow(id,email) VALUES(target,u->>'email') ON CONFLICT(id) DO NOTHING;
  IF NOT EXISTS(SELECT 1 FROM public.users_shadow WHERE id=target AND email=u->>'email') THEN
    RAISE EXCEPTION 'Identity mirror conflict' USING ERRCODE='40001'; END IF;
  -- A stale/equal conflicting cache version is never overwritten. Compare all
  -- canonical fields after upsert; reject the entire transaction on disagreement.
  FOR v IN SELECT value FROM jsonb_array_elements(b->'plans') ORDER BY value->>'id' LOOP
    version:=(v->>'updated_at')::timestamptz;
    IF version IS NULL THEN RAISE EXCEPTION 'Plan version required' USING ERRCODE='22023'; END IF;
    expected:=(v-'updated_at')||jsonb_build_object('auth_updated_at',version);
    INSERT INTO public.plans_cache(id,plan_code,name,business_type,applicable_entities,pricing_matrix,base_features,entity_config,display_order,is_active,product_id,auth_updated_at)
      SELECT id,plan_code,name,business_type,applicable_entities,pricing_matrix,base_features,entity_config,display_order,is_active,product_id,version
      FROM jsonb_populate_record(NULL::public.plans_cache,expected)
    ON CONFLICT(id) DO UPDATE SET plan_code=excluded.plan_code,name=excluded.name,business_type=excluded.business_type,
      applicable_entities=excluded.applicable_entities,pricing_matrix=excluded.pricing_matrix,base_features=excluded.base_features,
      entity_config=excluded.entity_config,display_order=excluded.display_order,is_active=excluded.is_active,product_id=excluded.product_id,auth_updated_at=excluded.auth_updated_at
      WHERE plans_cache.auth_updated_at IS NULL OR plans_cache.auth_updated_at<excluded.auth_updated_at;
    SELECT jsonb_object_agg(k,to_jsonb(p)->k) INTO actual FROM public.plans_cache p CROSS JOIN jsonb_object_keys(expected) k WHERE p.id=(v->>'id')::uuid;
    IF actual IS DISTINCT FROM expected THEN RAISE EXCEPTION 'Plan version conflict' USING ERRCODE='40001'; END IF;
    plans:=array_append(plans,(v->>'id')::uuid);
  END LOOP;
  FOR v IN SELECT value FROM jsonb_array_elements(b->'subscriptions') ORDER BY value->>'id' LOOP
    version:=(v->>'updated_at')::timestamptz;
    IF v->>'user_id' IS DISTINCT FROM target::text OR version IS NULL OR NOT ((v->>'plan_id')::uuid=ANY(plans)) THEN
      RAISE EXCEPTION 'Subscription context conflict' USING ERRCODE='22023'; END IF;
    expected:=(v-'updated_at')||jsonb_build_object('auth_updated_at',version,'organization_id',NULL,'is_organization_subscription',false,
      'subscription_start_date',(v->>'subscription_start_date')::timestamptz,'subscription_end_date',(v->>'subscription_end_date')::timestamptz,
      'plan_name',(SELECT p->>'name' FROM jsonb_array_elements(b->'plans') p WHERE p->>'id'=v->>'plan_id'));
    INSERT INTO public.subscription_cache(id,user_id,plan_id,plan_code,plan_name,plan_type,plan_amount,billing_cycle,features,status,
      subscription_start_date,subscription_end_date,product_id,auth_updated_at,is_organization_subscription)
      SELECT id,user_id,plan_id,plan_code,plan_name,plan_type,plan_amount,billing_cycle,features,status,subscription_start_date,subscription_end_date,product_id,version,false
      FROM jsonb_populate_record(NULL::public.subscription_cache,expected)
    ON CONFLICT(id) DO UPDATE SET plan_id=excluded.plan_id,plan_code=excluded.plan_code,plan_name=excluded.plan_name,plan_type=excluded.plan_type,plan_amount=excluded.plan_amount,
      billing_cycle=excluded.billing_cycle,features=excluded.features,status=excluded.status,subscription_start_date=excluded.subscription_start_date,
      subscription_end_date=excluded.subscription_end_date,product_id=excluded.product_id,auth_updated_at=excluded.auth_updated_at
      WHERE subscription_cache.user_id=target AND subscription_cache.organization_id IS NULL AND subscription_cache.is_organization_subscription IS FALSE
      AND (subscription_cache.auth_updated_at IS NULL OR subscription_cache.auth_updated_at<excluded.auth_updated_at);
    SELECT jsonb_object_agg(k,to_jsonb(s)->k) INTO actual FROM public.subscription_cache s CROSS JOIN jsonb_object_keys(expected) k WHERE s.id=(v->>'id')::uuid;
    IF actual IS DISTINCT FROM expected THEN
      -- Generic subscription sync historically derives plan_name from plan_type,
      -- while catalog-aware sync uses the catalog name. Reconcile only that label
      -- on an otherwise identical version; never relax access/identity guards.
      IF (actual-'plan_name') IS DISTINCT FROM (expected-'plan_name') THEN
        RAISE EXCEPTION 'Subscription version conflict' USING ERRCODE='40001'; END IF;
      UPDATE public.subscription_cache SET plan_name=expected->>'plan_name' WHERE id=(v->>'id')::uuid;
    END IF;
    subs:=array_append(subs,(v->>'id')::uuid);
  END LOOP;
  IF EXISTS(SELECT 1 FROM public.subscription_cache s WHERE s.user_id=target AND s.organization_id IS NULL
    AND s.is_organization_subscription IS FALSE AND s.product_id IN (SELECT value->>'product_id' FROM jsonb_array_elements(b->'subscriptions'))
    AND NOT (s.id=ANY(subs))) THEN
    RAISE EXCEPTION 'Canonical subscription inventory changed' USING ERRCODE='40001'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.subscription_cache WHERE id=ANY(subs) AND user_id=target
    AND status IN ('active','grace_period') AND (subscription_end_date IS NULL OR subscription_end_date>clock_timestamp())) THEN
    RAISE EXCEPTION 'Effective access unavailable' USING ERRCODE='22023'; END IF;
  INSERT INTO public.zoho_candidate_projections(operation_id,source_hash,projection_hash,target_id,user_id,learner_id,private_profile,subscription_ids,plan_ids,postcondition_hash)
    VALUES(operation,source_hash,p_projection_hash,target,target,learner,private_profile,subs,plans,
      public.zoho_candidate_projection_fingerprint(target,learner,subs,plans))
    ON CONFLICT(operation_id,projection_hash) DO UPDATE SET postcondition_hash=excluded.postcondition_hash
    RETURNING * INTO receipt;
  RETURN jsonb_build_object('operationId',operation,'sourceHash',source_hash,'projectionHash',p_projection_hash,'projectionReceiptId',receipt.receipt_id,'emailPolicy','forbidden');
END;
$$;


-- Canonical administration receipt is obtained by the trusted dashboard through
-- the private authority; the public browser never calls this fixed function.
CREATE FUNCTION public.zoho_apply_candidate_administration(p_connection uuid,p_receipt jsonb,p_actor uuid,p_after uuid DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.zoho_connections; target uuid; request uuid; op uuid; action text; ids jsonb;
 progress public.zoho_candidate_administration_progress; next_id uuid; more boolean;
BEGIN
 IF p_actor IS NULL THEN RAISE EXCEPTION 'Actor required' USING ERRCODE='22023'; END IF;
 IF p_receipt->>'version' IS DISTINCT FROM '1' OR p_receipt->>'emailPolicy' IS DISTINCT FROM 'forbidden'
   OR p_receipt->>'state' IS DISTINCT FROM 'completed' OR p_receipt->'canonicalAccountPreserved' IS DISTINCT FROM 'true'::jsonb THEN
   RAISE EXCEPTION 'Canonical administration receipt required' USING ERRCODE='22023'; END IF;
 target:=(p_receipt->>'targetId')::uuid;request:=(p_receipt->>'requestId')::uuid;action:=p_receipt->>'action';
 IF target IS NULL OR request IS NULL OR action NOT IN ('erase_connector','release_suppression') THEN
   RAISE EXCEPTION 'Unsupported connector administration' USING ERRCODE='22023'; END IF;
 SELECT * INTO c FROM public.zoho_connections WHERE id=p_connection FOR UPDATE;
 IF NOT FOUND OR c.source_org_id IS DISTINCT FROM p_receipt->>'sourceOrgId'
   OR p_receipt->>'externalId' IS NULL OR p_receipt->>'externalId' !~ '^[0-9]{1,40}$' THEN
   RAISE EXCEPTION 'Administration source mismatch' USING ERRCODE='22023'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('zoho-projection:'||target::text,0));
 INSERT INTO public.zoho_candidate_administration_progress(request_id,actor_id,action,target_id,source_org_id,external_id)
 VALUES(request,p_actor,action,target,c.source_org_id,p_receipt->>'externalId') ON CONFLICT DO NOTHING;
 SELECT * INTO progress FROM public.zoho_candidate_administration_progress WHERE request_id=request FOR UPDATE;
 IF progress.actor_id<>p_actor OR progress.action<>action OR progress.target_id<>target OR progress.source_org_id<>c.source_org_id OR progress.external_id<>p_receipt->>'externalId' THEN
   RAISE EXCEPTION 'Administration replay conflict' USING ERRCODE='40001'; END IF;
 IF progress.completed THEN RETURN jsonb_build_object('requestId',request,'state','completed','emailPolicy','forbidden'); END IF;
 IF action='erase_connector' THEN
  ids:=p_receipt->'erasedOperationIds';more:=(p_receipt->>'moreErasedOperations')::boolean;
  IF jsonb_typeof(ids) IS DISTINCT FROM 'array' OR jsonb_array_length(ids)>500 OR more IS NULL
    OR progress.last_operation_id IS DISTINCT FROM p_after THEN RAISE EXCEPTION 'Erasure page conflict' USING ERRCODE='40001'; END IF;
  INSERT INTO public.zoho_candidate_source_erasure(source_org_id,external_id,target_id,suppressed)
   VALUES(c.source_org_id,progress.external_id,target,true)
   ON CONFLICT(source_org_id,external_id,target_id) DO UPDATE SET suppressed=true,updated_at=now();
  FOR op IN SELECT value::uuid FROM jsonb_array_elements_text(ids) ORDER BY value::uuid LOOP
   IF (p_after IS NOT NULL AND op<=p_after) OR EXISTS(SELECT 1 FROM public.zoho_candidate_erased_operations WHERE operation_id=op AND target_id<>target)
     OR EXISTS(SELECT 1 FROM public.zoho_candidate_projections WHERE operation_id=op AND target_id<>target) THEN
    RAISE EXCEPTION 'Erasure operation mismatch' USING ERRCODE='40001'; END IF;
   INSERT INTO public.zoho_candidate_erased_operations(operation_id,target_id,request_id) VALUES(op,target,request) ON CONFLICT DO NOTHING;
   next_id:=op;
  END LOOP;
  IF more AND next_id IS NULL THEN RAISE EXCEPTION 'Empty continuation page' USING ERRCODE='22023'; END IF;
  -- Preserve receipt identifiers and all user-owned profile, access and activity.
  UPDATE public.zoho_staged_records SET proposed_data='{}',validation_errors='[]',payload_redacted_at=now(),
    decision='rejected',execution_state='not_approved',revision=revision+1,updated_at=now()
    WHERE connection_id IN(SELECT id FROM public.zoho_connections WHERE source_org_id=c.source_org_id)
      AND module='Candidates' AND external_id=progress.external_id AND payload_redacted_at IS NULL;
  UPDATE public.zoho_approved_operations SET approved_data='{}',state=CASE WHEN state IN('queued','failed') THEN 'revoked' ELSE state END
    WHERE record_id IN(SELECT id FROM public.zoho_staged_records WHERE module='Candidates' AND external_id=progress.external_id
      AND connection_id IN(SELECT id FROM public.zoho_connections WHERE source_org_id=c.source_org_id));
  DELETE FROM public.zoho_deferred_records WHERE module='Candidates' AND external_id=progress.external_id
    AND connection_id IN(SELECT id FROM public.zoho_connections WHERE source_org_id=c.source_org_id);
  INSERT INTO public.zoho_source_suppressions(source_org_id,module,external_id,actor_id,reason_hash)
    VALUES(c.source_org_id,'Candidates',progress.external_id,p_actor,encode(sha256(convert_to('canonical connector erasure','UTF8')),'hex'))
    ON CONFLICT(source_org_id,module,external_id) DO NOTHING;
 ELSE
  UPDATE public.zoho_candidate_source_erasure SET suppressed=false,updated_at=now()
   WHERE source_org_id=c.source_org_id AND external_id=progress.external_id AND target_id=target;
  DELETE FROM public.zoho_source_suppressions WHERE source_org_id=c.source_org_id AND module='Candidates' AND external_id=progress.external_id;
  more:=false;
 END IF;
 UPDATE public.zoho_candidate_administration_progress AS administration SET last_operation_id=coalesce(next_id,administration.last_operation_id),completed=NOT more,artifacts_confirmed=CASE WHEN administration.action='release_suppression' THEN true ELSE administration.artifacts_confirmed END,updated_at=now() WHERE request_id=request;
 RETURN jsonb_build_object('requestId',request,'state',CASE WHEN more THEN 'application_pending' ELSE 'completed' END,'afterOperationId',next_id,'emailPolicy','forbidden');
END;$$;
REVOKE ALL ON FUNCTION public.zoho_apply_candidate_administration(uuid,jsonb,uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_apply_candidate_administration(uuid,jsonb,uuid,uuid) TO service_role;
CREATE FUNCTION public.zoho_confirm_candidate_administration(p_request uuid,p_actor uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE progress public.zoho_candidate_administration_progress; complete boolean;
BEGIN
 SELECT * INTO progress FROM public.zoho_candidate_administration_progress WHERE request_id=p_request AND actor_id=p_actor FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Administration receipt unavailable' USING ERRCODE='22023'; END IF;
 complete:=progress.completed AND (progress.action='release_suppression' OR NOT EXISTS(
  SELECT 1 FROM public.zoho_bulk_read_runs r JOIN public.zoho_connections c ON c.id=r.connection_id
  WHERE c.source_org_id=progress.source_org_id AND r.module='Candidates' AND (r.artifact_key IS NOT NULL OR r.artifact_write_pending)));
 IF complete THEN UPDATE public.zoho_candidate_administration_progress SET artifacts_confirmed=true,updated_at=now() WHERE request_id=p_request; END IF;
 RETURN jsonb_build_object('requestId',p_request,'state',CASE WHEN complete THEN 'completed' ELSE 'application_pending' END,'emailPolicy','forbidden');
END;$$;
REVOKE ALL ON FUNCTION public.zoho_confirm_candidate_administration(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_confirm_candidate_administration(uuid,uuid) TO service_role;

ALTER FUNCTION public.zoho_check_candidate_projection(uuid,text,text,uuid) RENAME TO zoho_check_candidate_projection_before_erasure;
CREATE FUNCTION public.zoho_check_candidate_projection(p_operation uuid,p_source_hash text,p_projection_hash text,p_receipt uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM public.zoho_candidate_erased_operations WHERE operation_id=p_operation) THEN RETURN false; END IF;
 RETURN public.zoho_check_candidate_projection_before_erasure(p_operation,p_source_hash,p_projection_hash,p_receipt);
END;$$;
REVOKE ALL ON FUNCTION public.zoho_check_candidate_projection_before_erasure(uuid,text,text,uuid) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.zoho_check_candidate_projection(uuid,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_check_candidate_projection(uuid,text,text,uuid) TO service_role;
ALTER FUNCTION public.zoho_assert_private_projection_boundary() RENAME TO zoho_assert_private_projection_boundary_before_administration;
CREATE FUNCTION public.zoho_assert_private_projection_boundary() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM public.zoho_assert_private_projection_boundary_before_administration();
 IF EXISTS(WITH RECURSIVE protected(oid) AS(
   SELECT c.oid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' AND c.relname IN(
    'zoho_candidate_source_erasure','zoho_candidate_erased_operations','zoho_candidate_administration_progress')
   UNION SELECT r.ev_class FROM protected p JOIN pg_depend d ON d.refobjid=p.oid AND d.refclassid='pg_class'::regclass
    AND d.classid='pg_rewrite'::regclass JOIN pg_rewrite r ON r.oid=d.objid WHERE r.ev_class<>p.oid)
   SELECT 1 FROM protected p CROSS JOIN(VALUES('anon'),('authenticated')) browser(role)
   WHERE has_table_privilege(browser.role,p.oid,'SELECT,INSERT,UPDATE,DELETE') OR has_any_column_privilege(browser.role,p.oid,'SELECT,INSERT,UPDATE')) THEN
  RAISE EXCEPTION 'Private projection requires server-only administration grants' USING ERRCODE='42501'; END IF;
END;$$;
REVOKE ALL ON FUNCTION public.zoho_assert_private_projection_boundary_before_administration(),public.zoho_assert_private_projection_boundary() FROM PUBLIC,anon,authenticated,service_role;
ALTER FUNCTION public.zoho_candidate_projection_ready() RENAME TO zoho_candidate_projection_ready_before_administration;
CREATE FUNCTION public.zoho_candidate_projection_ready() RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE oid oid; confirmation_oid oid;
BEGIN
 IF public.zoho_candidate_projection_ready_before_administration() IS DISTINCT FROM true THEN RETURN false; END IF;
 PERFORM public.zoho_assert_private_projection_boundary();
 oid:=to_regprocedure('public.zoho_apply_candidate_administration(uuid,jsonb,uuid,uuid)');
 confirmation_oid:=to_regprocedure('public.zoho_confirm_candidate_administration(uuid,uuid)');
 RETURN oid IS NOT NULL AND has_function_privilege('service_role',oid,'EXECUTE')
  AND NOT has_function_privilege('anon',oid,'EXECUTE') AND NOT has_function_privilege('authenticated',oid,'EXECUTE')
  AND confirmation_oid IS NOT NULL AND has_function_privilege('service_role',confirmation_oid,'EXECUTE')
  AND NOT has_function_privilege('anon',confirmation_oid,'EXECUTE') AND NOT has_function_privilege('authenticated',confirmation_oid,'EXECUTE');
EXCEPTION WHEN OTHERS THEN RETURN false;
END;$$;
REVOKE ALL ON FUNCTION public.zoho_candidate_projection_ready_before_administration(),public.zoho_candidate_projection_ready() FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.zoho_candidate_projection_ready() TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
