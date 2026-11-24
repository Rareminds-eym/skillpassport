-- Prepared only: requires specific approval for the target application database.
-- Preserve feature IDs, existing entitlements, overrides and canonical SSO revisions.
BEGIN;

CREATE FUNCTION public.subscription_enum_options_valid(options text[])
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = pg_catalog AS $$
  SELECT coalesce(array_ndims(options) = 1 AND array_lower(options, 1) = 1
    AND cardinality(options) > 0
    AND NOT EXISTS (SELECT 1 FROM unnest(options) AS item(value)
      WHERE value IS NULL OR value !~ '^[a-z][a-z0-9_]*$')
    AND cardinality(options) = (SELECT count(DISTINCT value) FROM unnest(options) AS item(value)), false)
$$;
REVOKE ALL ON FUNCTION public.subscription_enum_options_valid(text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.subscription_enum_options_valid(text[]) TO service_role;

ALTER TABLE public.features ADD COLUMN value_options text[];
-- The name is the existing foundation migration's generated column-check name.
-- Fail on unexpected schema drift instead of dropping unrelated constraints.
ALTER TABLE public.features DROP CONSTRAINT features_feature_type_check;
ALTER TABLE public.features ADD CONSTRAINT features_feature_type_check
  CHECK (feature_type IN ('boolean', 'numeric_limit', 'metered', 'enum'));
ALTER TABLE public.features ADD CONSTRAINT features_value_options_check CHECK (
  (feature_type = 'enum' AND public.subscription_enum_options_valid(value_options))
  OR (feature_type <> 'enum' AND value_options IS NULL)
);
COMMENT ON COLUMN public.features.value_options IS
  'Explicit unordered allowed values for enum features only. Selected grants use existing plan_entitlements.value_text and tenant_entitlement_overrides.value_text.';

COMMIT;
