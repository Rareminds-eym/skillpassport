DO $$
DECLARE f public.fixture_platform_ownership; rejected boolean; grant_value jsonb; result jsonb;
BEGIN
  SELECT * INTO STRICT f FROM public.fixture_platform_ownership;
  ASSERT (SELECT organization_id='00000000-0000-0000-0000-000000000001' FROM public.opportunities WHERE id=f.target_id);
  ASSERT (SELECT publisher_organization_id='00000000-0000-0000-0000-000000000001' AND config_revision>2 FROM public.zoho_connections WHERE id=f.connection_id);
  ASSERT (SELECT publisher_id='00000000-0000-0000-0000-000000000001' AND target_fingerprint=public.zoho_job_target_fingerprint(j)
    FROM public.zoho_job_links l JOIN public.opportunities j ON j.id=l.target_id WHERE l.record_id=f.record_id);
  ASSERT (SELECT organization_id='10000000-0000-4000-8000-000000000001' FROM public.opportunities WHERE id=f.manual_id),'Manual job was reassigned';
  ASSERT (SELECT state='approval_stale' FROM public.zoho_approved_operations WHERE id=f.operation_id);
  ASSERT (SELECT decision='approval_stale' FROM public.zoho_staged_records WHERE id=f.record_id);
  ASSERT (SELECT NOT enabled AND NOT no_email_reviewed FROM public.zoho_job_publisher_policies WHERE connection_id=f.connection_id);
  ASSERT EXISTS(SELECT 1 FROM public.tenant_entitlement_overrides o JOIN public.features x ON x.id=o.feature_id
    WHERE o.tenant_id='00000000-0000-0000-0000-000000000001' AND x.feature_key='active_job_posts' AND o.is_enabled AND o.value_numeric IS NULL);

  rejected:=false;
  BEGIN UPDATE public.zoho_connections SET publisher_organization_id='10000000-0000-4000-8000-000000000001' WHERE id=f.connection_id;
  EXCEPTION WHEN check_violation THEN rejected:=true; END;
  ASSERT rejected,'Database allowed a non-Platform publisher';
  rejected:=false;
  BEGIN UPDATE public.opportunities SET organization_id='10000000-0000-4000-8000-000000000001' WHERE id=f.target_id;
  EXCEPTION WHEN check_violation THEN rejected:=true; END;
  ASSERT rejected,'Another write path reassigned an imported job';
  rejected:=false;
  BEGIN UPDATE public.zoho_job_links SET target_id=f.manual_id WHERE record_id=f.record_id;
  EXCEPTION WHEN check_violation THEN rejected:=true; END;
  ASSERT rejected,'A Platform link attached to another organization’s job';
  rejected:=false;
  BEGIN UPDATE public.zoho_job_links SET publisher_id='10000000-0000-4000-8000-000000000001' WHERE record_id=f.record_id;
  EXCEPTION WHEN check_violation THEN rejected:=true; END;
  ASSERT rejected,'A link allowed a non-Platform publisher';

  PERFORM public.zoho_register_connection('New Platform fixture','77777777777777777778','in',
    '00000000-0000-0000-0000-000000000001','10000000-0000-4000-8000-000000000002');
  rejected:=false;
  BEGIN PERFORM public.zoho_register_connection('Wrong publisher fixture','77777777777777777779','in',
    '10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002');
  EXCEPTION WHEN check_violation THEN rejected:=true; END;
  ASSERT rejected,'Registration accepted another publisher';
  PERFORM public.zoho_configure_job_policy(f.connection_id,'10000000-0000-4000-8000-000000000002',
    (SELECT config_revision FROM public.zoho_connections WHERE id=f.connection_id),
    '{"Open":"open"}','{"Full time":"job"}',true,true,public.zoho_job_trigger_fingerprint(),'Reviewed Platform-owned job publication');
  grant_value:=public.fixture_job_grant(f.connection_id,'779');
  result:=public.zoho_apply_job_operation(grant_value);
  ASSERT result->>'state'='completed','Platform-owned job publication failed';
  ASSERT (SELECT j.organization_id='00000000-0000-0000-0000-000000000001'
    FROM public.zoho_job_receipts r JOIN public.opportunities j ON j.id=r.target_id
    WHERE r.operation_id=(grant_value->>'operationId')::uuid);
  ASSERT NOT EXISTS(SELECT 1 FROM public.learning_job_notification_work),'Ownership migration queued notifications';
END $$;
