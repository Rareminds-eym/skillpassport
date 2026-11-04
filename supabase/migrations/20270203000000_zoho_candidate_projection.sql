BEGIN;
CREATE TABLE public.zoho_candidate_projections (
  receipt_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL,
  source_hash text NOT NULL CHECK(source_hash ~ '^[a-f0-9]{64}$'),
  projection_hash text NOT NULL CHECK(projection_hash ~ '^[a-f0-9]{64}$'),
  target_id uuid NOT NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  learner_id uuid REFERENCES public.learners(id) ON DELETE SET NULL,
  private_profile boolean NOT NULL,
  subscription_ids uuid[] NOT NULL,
  plan_ids uuid[] NOT NULL,
  postcondition_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(operation_id,projection_hash)
);
CREATE INDEX zoho_candidate_projection_target ON public.zoho_candidate_projections(target_id);
-- Internal state is protected with database grants, independently of RLS.
REVOKE ALL ON public.zoho_candidate_projections FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.zoho_protect_candidate_owner() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF TG_TABLE_NAME='learners' THEN
    IF NEW.user_id IS DISTINCT FROM OLD.user_id AND EXISTS(SELECT 1 FROM public.zoho_candidate_projections WHERE target_id=OLD.user_id AND private_profile) THEN
      RAISE EXCEPTION 'Imported profile owner is immutable' USING ERRCODE='22023'; END IF;
  ELSE
    IF NEW.id IS DISTINCT FROM OLD.id AND EXISTS(SELECT 1 FROM public.zoho_candidate_projections WHERE target_id=OLD.id AND private_profile) THEN
      RAISE EXCEPTION 'Imported mirror owner is immutable' USING ERRCODE='22023'; END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.zoho_protect_candidate_owner() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER zoho_private_learner_owner BEFORE UPDATE OF user_id ON public.learners
  FOR EACH ROW EXECUTE FUNCTION public.zoho_protect_candidate_owner();
CREATE TRIGGER zoho_private_shadow_owner BEFORE UPDATE OF id ON public.users_shadow
  FOR EACH ROW EXECUTE FUNCTION public.zoho_protect_candidate_owner();

CREATE FUNCTION public.zoho_candidate_projection_fingerprint(p_user uuid,p_learner uuid,p_subs uuid[],p_plans uuid[]) RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
  SELECT encode(sha256(convert_to(jsonb_build_object(
    'user',(SELECT jsonb_build_object('id',id,'email',email,'role',role,'organizationId',"organizationId",'active',"isActive") FROM public.users WHERE id=p_user),
    'shadow',(SELECT jsonb_build_object('id',id,'email',email) FROM public.users_shadow WHERE id=p_user),
    'learner',(SELECT jsonb_build_object('id',id,'user_id',user_id,'email',email,'deleted',is_deleted,
      'school_id',school_id,'college_id',college_id,'universityId',"universityId",'notifications',notification_settings) FROM public.learners WHERE id=p_learner),
    'subscriptions',(SELECT jsonb_agg(to_jsonb(s)-ARRAY['synced_at','created_at','updated_at'] ORDER BY id) FROM public.subscription_cache s WHERE id=ANY(p_subs)),
    'personalInventory',(SELECT jsonb_agg(s.id ORDER BY s.id) FROM public.subscription_cache s WHERE s.user_id=p_user
      AND s.organization_id IS NULL AND s.is_organization_subscription IS FALSE
      AND s.product_id IN (SELECT product_id FROM public.subscription_cache WHERE id=ANY(p_subs))),
    'plans',(SELECT jsonb_agg(to_jsonb(p)-ARRAY['synced_at','created_at','updated_at'] ORDER BY id) FROM public.plans_cache p WHERE id=ANY(p_plans))
  )::text,'UTF8')),'hex');
$$;

CREATE FUNCTION public.zoho_apply_candidate_projection(p_snapshot text,p_projection_hash text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE b jsonb; u jsonb; v jsonb; expected jsonb; actual jsonb; target uuid; operation uuid; learner uuid;
  source_hash text; private_profile boolean:=false; existing public.users; profile public.learners;
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
  PERFORM pg_advisory_xact_lock(hashtextextended('zoho-projection:'||target::text,0));
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
      IF existing.role::text IS DISTINCT FROM 'learner' OR u->>'primaryRole' IS DISTINCT FROM 'learner'
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
    IF b->>'identityOutcome' NOT IN ('created','existing_access_preserved') OR u->>'primaryRole' IS DISTINCT FROM 'learner'
      OR length(trim(u->>'name')) NOT BETWEEN 2 AND 150 OR u->>'name' IS NULL THEN
      RAISE EXCEPTION 'New profile requires review' USING ERRCODE='22023'; END IF;
    INSERT INTO public.users(id,email,role,"organizationId","firstName","lastName",metadata)
      VALUES(target,u->>'email','learner',NULL,split_part(u->>'name',' ',1),trim(substr(u->>'name',length(split_part(u->>'name',' ',1))+1)),
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

CREATE FUNCTION public.zoho_check_candidate_projection(p_operation uuid,p_source_hash text,p_projection_hash text,p_receipt uuid) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF EXISTS(SELECT 1 FROM public.zoho_candidate_projections WHERE operation_id=p_operation AND private_profile) THEN
    PERFORM public.zoho_assert_private_projection_boundary();
  END IF;
  RETURN EXISTS(SELECT 1 FROM public.zoho_candidate_projections r
    JOIN public.users u ON u.id=r.user_id AND u."isActive" IS TRUE
    JOIN public.learners l ON l.id=r.learner_id AND l.user_id=u.id AND l.is_deleted IS FALSE
    WHERE r.operation_id=p_operation AND r.source_hash=p_source_hash AND r.projection_hash=p_projection_hash AND r.receipt_id=p_receipt
      AND r.postcondition_hash=public.zoho_candidate_projection_fingerprint(r.user_id,r.learner_id,r.subscription_ids,r.plan_ids)
      AND EXISTS(SELECT 1 FROM public.subscription_cache s WHERE s.id=ANY(r.subscription_ids) AND s.user_id=r.user_id
        AND s.status IN ('active','grace_period') AND (s.subscription_end_date IS NULL OR s.subscription_end_date>now())));
END;
$$;
REVOKE ALL ON FUNCTION public.zoho_candidate_projection_fingerprint(uuid,uuid,uuid[],uuid[]),public.zoho_apply_candidate_projection(text,text),
  public.zoho_check_candidate_projection(uuid,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.zoho_apply_candidate_projection(text,text),public.zoho_check_candidate_projection(uuid,text,text,uuid) TO service_role;
COMMIT;
