BEGIN;
SET LOCAL lock_timeout = '5s';

-- Drain existing writers before moving managed targets and their ownership links.
-- Ordinary jobs without a Zoho ledger link are not part of this migration.
LOCK TABLE public.zoho_connections, public.zoho_staged_records,
  public.zoho_approved_operations, public.opportunities, public.zoho_job_links
  IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.organizations
    WHERE id='00000000-0000-0000-0000-000000000001' AND name='SkillPassport Platform') THEN
    RAISE EXCEPTION 'SkillPassport Platform organization must exist before configuring Zoho job ownership';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.features WHERE feature_key='active_job_posts') THEN
    RAISE EXCEPTION 'The active_job_posts feature must exist before configuring Zoho job ownership';
  END IF;
  IF EXISTS (SELECT 1 FROM public.zoho_approved_operations WHERE state='processing') THEN
    RAISE EXCEPTION 'Reconcile in-flight Zoho operations before changing publisher ownership';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.zoho_job_links l JOIN public.opportunities j ON j.id=l.target_id
    WHERE (l.publisher_id<>'00000000-0000-0000-0000-000000000001'
      OR j.organization_id IS DISTINCT FROM '00000000-0000-0000-0000-000000000001'::uuid)
      AND (j.organization_id IS DISTINCT FROM l.publisher_id
        OR public.zoho_job_target_fingerprint(j) IS DISTINCT FROM l.target_fingerprint)
  ) THEN
    RAISE EXCEPTION 'A managed Zoho job changed outside the import; reconcile it before transferring ownership';
  END IF;
END $$;

-- Old approvals cannot authorize writes under a different publisher or policy.
UPDATE public.zoho_approved_operations o SET state='approval_stale'
FROM public.zoho_staged_records r JOIN public.zoho_connections c ON c.id=r.connection_id
WHERE o.record_id=r.id AND o.state IN ('queued','failed')
  AND (c.publisher_organization_id<>'00000000-0000-0000-0000-000000000001'
    OR EXISTS (SELECT 1 FROM public.zoho_job_publisher_policies p
      WHERE p.connection_id=c.id AND (p.enabled OR p.no_email_reviewed)));
UPDATE public.zoho_staged_records r SET decision='approval_stale', updated_at=now()
WHERE r.decision IN ('approved','failed') AND EXISTS (
  SELECT 1 FROM public.zoho_approved_operations o WHERE o.record_id=r.id AND o.state='approval_stale');

UPDATE public.opportunities j SET organization_id='00000000-0000-0000-0000-000000000001'
FROM public.zoho_job_links l WHERE l.target_id=j.id
  AND j.organization_id IS DISTINCT FROM '00000000-0000-0000-0000-000000000001'::uuid;
UPDATE public.zoho_job_links l SET publisher_id='00000000-0000-0000-0000-000000000001',
  target_fingerprint=public.zoho_job_target_fingerprint(j)
FROM public.opportunities j WHERE j.id=l.target_id
  AND l.publisher_id<>'00000000-0000-0000-0000-000000000001';
UPDATE public.zoho_connections SET publisher_organization_id='00000000-0000-0000-0000-000000000001',
  config_revision=config_revision+1
WHERE publisher_organization_id<>'00000000-0000-0000-0000-000000000001';

-- Changing database executable code invalidates the prior no-email review.
-- The existing policy trigger also advances the source configuration revision.
UPDATE public.zoho_job_publisher_policies SET enabled=false, no_email_reviewed=false
WHERE enabled OR no_email_reviewed;

ALTER TABLE public.zoho_connections
  ALTER COLUMN publisher_organization_id SET DEFAULT '00000000-0000-0000-0000-000000000001',
  ADD CONSTRAINT zoho_platform_publisher_only
    CHECK (publisher_organization_id='00000000-0000-0000-0000-000000000001');
ALTER TABLE public.zoho_job_links ADD CONSTRAINT zoho_platform_job_link_only
  CHECK (publisher_id='00000000-0000-0000-0000-000000000001');

-- Serialize link creation against target reparenting. A CHECK on the link alone
-- cannot protect an opportunity from a later UPDATE through another write path.
CREATE FUNCTION public.zoho_enforce_platform_job_owner() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE owner_id uuid;
BEGIN
  IF TG_TABLE_NAME='zoho_job_links' THEN
    SELECT organization_id INTO owner_id FROM public.opportunities WHERE id=NEW.target_id FOR UPDATE;
    IF NOT FOUND OR owner_id IS DISTINCT FROM '00000000-0000-0000-0000-000000000001'::uuid THEN
      RAISE EXCEPTION 'Imported Zoho jobs must belong to SkillPassport Platform' USING ERRCODE='23514';
    END IF;
  ELSIF NEW.organization_id IS DISTINCT FROM '00000000-0000-0000-0000-000000000001'::uuid
    AND EXISTS (SELECT 1 FROM public.zoho_job_links WHERE target_id=NEW.id) THEN
    RAISE EXCEPTION 'Imported Zoho jobs must belong to SkillPassport Platform' USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.zoho_enforce_platform_job_owner() FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;
CREATE TRIGGER zoho_platform_job_link_owner BEFORE INSERT OR UPDATE OF target_id,publisher_id
  ON public.zoho_job_links FOR EACH ROW EXECUTE FUNCTION public.zoho_enforce_platform_job_owner();
CREATE TRIGGER zoho_platform_job_owner BEFORE UPDATE OF organization_id
  ON public.opportunities FOR EACH ROW EXECUTE FUNCTION public.zoho_enforce_platform_job_owner();

-- The platform publisher retains unlimited first-party job import capacity.
-- An explicit existing administrative override remains authoritative.
INSERT INTO public.tenant_entitlement_overrides
  (tenant_id,feature_id,is_enabled,value_numeric,expires_at,notes)
SELECT '00000000-0000-0000-0000-000000000001',id,true,NULL,NULL,
  'SkillPassport Platform default: unlimited active job posts for platform-owned imports.'
FROM public.features WHERE feature_key='active_job_posts'
ON CONFLICT (tenant_id,feature_id) DO NOTHING;

COMMIT;
