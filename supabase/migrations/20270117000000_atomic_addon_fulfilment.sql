-- Existing entitlements form the completion marker; all grants commit atomically.
BEGIN;
ALTER TABLE public.user_entitlements ADD COLUMN addon_purchase_id uuid, ADD COLUMN razorpay_payment_id text,
  ADD COLUMN grant_tenant_id uuid, ADD COLUMN target_feature_key text,
  ADD COLUMN fulfilment_kind text, ADD COLUMN grant_quantity integer CHECK(grant_quantity>0);
ALTER TABLE public.user_entitlements DROP CONSTRAINT user_entitlements_billing_period_check;
ALTER TABLE public.user_entitlements ADD CONSTRAINT user_entitlements_billing_period_check CHECK(length(btrim(billing_period))>0);
CREATE UNIQUE INDEX user_entitlement_addon_purchase ON public.user_entitlements(addon_purchase_id) WHERE addon_purchase_id IS NOT NULL;
CREATE UNIQUE INDEX user_entitlement_addon_payment ON public.user_entitlements(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;
CREATE FUNCTION public.fulfil_addon_purchase(p_purchase jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE
  purchase_id uuid:=(p_purchase->>'id')::uuid; user_id_value uuid:=(p_purchase->>'user_id')::uuid;
  tenant_id_value uuid:=coalesce((p_purchase->>'organization_id')::uuid,user_id_value);
  payment_id text:=p_purchase->>'razorpay_payment_id'; feature_key_value text:=p_purchase->>'feature_key';
  offer jsonb:=p_purchase->'offer'; kind text:=offer->>'fulfilment_kind'; target_key text:=offer->>'target_feature_key';
  quantity_value integer:=(offer->>'quantity')::integer; days_value integer:=(offer->>'duration_days')::integer;
  feature_id_value uuid; base_value numeric; override_value numeric; existing public.user_entitlements; result public.user_entitlements;
  until_value timestamptz; opportunity_id_value bigint:=(p_purchase->>'opportunity_id')::bigint;
BEGIN
  IF purchase_id IS NULL OR user_id_value IS NULL OR payment_id IS NULL OR feature_key_value IS NULL OR quantity_value IS NULL OR quantity_value<=0 OR target_key IS NULL THEN RAISE EXCEPTION 'Invalid recorded purchase'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('addon-payment:'||payment_id,0));
  SELECT * INTO existing FROM public.user_entitlements WHERE razorpay_payment_id=payment_id OR razorpay_subscription_id=(p_purchase->>'razorpay_order_id')||'_'||feature_key_value FOR UPDATE;
  IF FOUND THEN
    IF existing.user_id<>user_id_value OR existing.feature_key<>feature_key_value THEN RAISE EXCEPTION 'Payment entitlement ownership mismatch'; END IF;
    IF existing.addon_purchase_id IS NOT NULL THEN
      IF existing.addon_purchase_id<>purchase_id THEN RAISE EXCEPTION 'Payment purchase mismatch'; END IF;
      RETURN jsonb_build_object('entitlement',to_jsonb(existing),'already_fulfilled',true);
    END IF;
  END IF;
  IF (offer->>'requires_organization')::boolean THEN
    IF p_purchase->>'organization_id' IS NULL OR NOT EXISTS(SELECT 1 FROM public.organization_members m WHERE m.organization_id=tenant_id_value AND m.user_id=user_id_value AND m.status='active') THEN RAISE EXCEPTION 'Purchaser is not an active organization member'; END IF;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('addon-target:'||tenant_id_value::text||':'||target_key,0));
  CASE kind
    WHEN 'access' THEN NULL;
    WHEN 'credits' THEN
      IF NOT EXISTS(SELECT 1 FROM public.features WHERE feature_key=target_key AND feature_type='metered') THEN RAISE EXCEPTION 'Credit pool is not configured'; END IF;
      INSERT INTO public.credit_ledger(tenant_id,feature_key,transaction_type,amount,reference_id,notes) VALUES(tenant_id_value,target_key,'topup_purchase',quantity_value,payment_id,feature_key_value) ON CONFLICT DO NOTHING;
    WHEN 'numeric_limit' THEN
      IF existing.id IS NOT NULL AND existing.addon_purchase_id IS NULL THEN RAISE EXCEPTION 'LEGACY_NUMERIC_RECONCILIATION_REQUIRED'; END IF;
      SELECT id INTO STRICT feature_id_value FROM public.features WHERE feature_key=target_key AND feature_type='numeric_limit';
      SELECT value_numeric INTO override_value FROM public.tenant_entitlement_overrides WHERE tenant_id=tenant_id_value AND feature_id=feature_id_value AND is_enabled AND (expires_at IS NULL OR expires_at>now()) FOR UPDATE;
      SELECT pe.value_numeric INTO base_value FROM public.subscription_cache sc JOIN public.plan_entitlements pe ON pe.plan_id=sc.plan_id WHERE sc.status='active' AND (sc.organization_id=tenant_id_value OR sc.user_id=tenant_id_value) AND pe.feature_id=feature_id_value AND pe.is_enabled ORDER BY sc.created_at DESC LIMIT 1;
      IF coalesce(override_value,base_value) IS NULL THEN RAISE EXCEPTION 'Base numeric entitlement is not configured'; END IF;
      -- Numeric add-ons are read from their individual, expiring purchase rows.
      -- Do not merge independently expiring seats into a single manual override.
    WHEN 'opportunity_visibility' THEN
      IF days_value IS NULL OR days_value<=0 OR opportunity_id_value IS NULL THEN RAISE EXCEPTION 'Opportunity and duration are required'; END IF;
      UPDATE public.opportunities SET featured_until=greatest(coalesce(featured_until,now()),now())+make_interval(days=>days_value),updated_at=now() WHERE id=opportunity_id_value AND organization_id=tenant_id_value AND status<>'closed';
      IF NOT FOUND THEN RAISE EXCEPTION 'Opportunity is not eligible in this organization'; END IF;
    WHEN 'tenant_visibility' THEN
      IF days_value IS NULL OR days_value<=0 THEN RAISE EXCEPTION 'Visibility duration is required'; END IF;
      SELECT id INTO STRICT feature_id_value FROM public.features WHERE feature_key=target_key;
      SELECT expires_at INTO until_value FROM public.tenant_entitlement_overrides WHERE tenant_id=tenant_id_value AND feature_id=feature_id_value FOR UPDATE;
      until_value:=greatest(coalesce(until_value,now()),now())+make_interval(days=>days_value);
      INSERT INTO public.tenant_entitlement_overrides(tenant_id,feature_id,is_enabled,value_numeric,expires_at,notes) VALUES(tenant_id_value,feature_id_value,true,quantity_value,until_value,feature_key_value)
      ON CONFLICT(tenant_id,feature_id) DO UPDATE SET is_enabled=true,value_numeric=EXCLUDED.value_numeric,expires_at=EXCLUDED.expires_at,updated_at=now();
    ELSE RAISE EXCEPTION 'Unsupported fulfilment kind';
  END CASE;
  INSERT INTO public.user_entitlements(user_id,feature_key,status,billing_period,price_at_purchase,razorpay_subscription_id,start_date,end_date,auto_renew,addon_purchase_id,razorpay_payment_id,grant_tenant_id,target_feature_key,fulfilment_kind,grant_quantity)
  VALUES(user_id_value,feature_key_value,'active',p_purchase->>'billing_period',(p_purchase->>'price_at_purchase')::numeric,(p_purchase->>'razorpay_order_id')||'_'||feature_key_value,(p_purchase->>'start_date')::timestamptz,(p_purchase->>'end_date')::timestamptz,false,purchase_id,payment_id,tenant_id_value,target_key,kind,quantity_value)
  ON CONFLICT(razorpay_subscription_id) DO UPDATE SET addon_purchase_id=EXCLUDED.addon_purchase_id,razorpay_payment_id=EXCLUDED.razorpay_payment_id,grant_tenant_id=EXCLUDED.grant_tenant_id,target_feature_key=EXCLUDED.target_feature_key,fulfilment_kind=EXCLUDED.fulfilment_kind,grant_quantity=EXCLUDED.grant_quantity,start_date=EXCLUDED.start_date,end_date=EXCLUDED.end_date,status=EXCLUDED.status,updated_at=now() RETURNING * INTO result;
  RETURN jsonb_build_object('entitlement',to_jsonb(result),'already_fulfilled',false);
END; $$;
REVOKE ALL ON FUNCTION public.fulfil_addon_purchase(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.fulfil_addon_purchase(jsonb) TO service_role;
CREATE FUNCTION public.get_addon_numeric_grants(p_tenant_id uuid)
RETURNS TABLE(feature_key text,quantity bigint) LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
  SELECT target_feature_key,sum(grant_quantity)::bigint FROM public.user_entitlements
  WHERE grant_tenant_id=p_tenant_id AND fulfilment_kind='numeric_limit'
    AND status IN ('active','grace_period','cancelled') AND end_date>now()
  GROUP BY target_feature_key;
$$;
CREATE INDEX user_entitlements_numeric_grants ON public.user_entitlements(grant_tenant_id,target_feature_key,end_date) WHERE fulfilment_kind='numeric_limit';
REVOKE ALL ON FUNCTION public.get_addon_numeric_grants(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_addon_numeric_grants(uuid) TO service_role;
COMMIT;
