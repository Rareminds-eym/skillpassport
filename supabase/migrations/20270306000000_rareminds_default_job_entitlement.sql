BEGIN;

-- The first-party rareminds tenant has unlimited active job posts by default.
-- Bind this grant to its stable tenant ID, never a user-editable organization name.
-- No organization FK is required by the entitlement engine: this also covers a
-- fresh database where the organization is restored after migrations run.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = '6e607ffc-9d3c-4e94-abd6-72375cf9f33c'
      AND lower(btrim(name)) IS DISTINCT FROM 'rareminds'
  ) THEN
    RAISE EXCEPTION 'The rareminds default entitlement tenant identity does not match';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.features WHERE feature_key = 'active_job_posts') THEN
    RAISE EXCEPTION 'The active_job_posts feature must exist before its default grant';
  END IF;
END $$;

INSERT INTO public.tenant_entitlement_overrides
  (tenant_id, feature_id, is_enabled, value_numeric, expires_at, notes)
SELECT '6e607ffc-9d3c-4e94-abd6-72375cf9f33c', id, true, NULL, NULL,
  'First-party rareminds default: unlimited active job posts, explicitly authorized by administrator.'
FROM public.features
WHERE feature_key = 'active_job_posts'
-- Defaults must not overwrite an explicit administrative override.
ON CONFLICT (tenant_id, feature_id) DO NOTHING;

COMMIT;
