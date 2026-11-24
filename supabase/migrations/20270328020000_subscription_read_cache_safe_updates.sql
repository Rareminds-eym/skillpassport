-- Preserve full cache invalidation while satisfying safe-update protection.
-- Apply only to the explicitly approved target database.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '15s';

CREATE OR REPLACE FUNCTION public.invalidate_subscription_read_cache_on_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  -- These application tables are the existing synchronization boundary. Statement triggers
  -- invalidate bulk updates once and also cover changes made outside the subscription BFF.
  UPDATE public.subscription_read_cache_generations SET generation=gen_random_uuid() WHERE product_id IS NOT NULL;
  DELETE FROM public.subscription_read_cache WHERE cache_key IS NOT NULL;
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.invalidate_subscription_read_cache_for_subject()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE before_row jsonb := to_jsonb(OLD); after_row jsonb := to_jsonb(NEW);
  actors uuid[]; organizations uuid[];
BEGIN
  IF TG_OP='UPDATE' AND before_row IS NOT DISTINCT FROM after_row THEN RETURN NULL; END IF;
  IF TG_TABLE_NAME='users' THEN
    actors := ARRAY[(before_row->>'id')::uuid,(after_row->>'id')::uuid];
  ELSE
    actors := ARRAY[(before_row->>'user_id')::uuid,(after_row->>'user_id')::uuid];
  END IF;
  IF TG_TABLE_NAME='organizations' THEN
    organizations := ARRAY[(before_row->>'id')::uuid,(after_row->>'id')::uuid];
  ELSE
    organizations := ARRAY[(before_row->>'organization_id')::uuid,(after_row->>'organization_id')::uuid];
  END IF;
  -- An organization read may still be filling its first entry, so cached rows
  -- cannot enumerate every affected actor. Fence all in-flight scopes for these
  -- changes; individual user changes without an organization remain scoped.
  IF EXISTS(SELECT 1 FROM unnest(organizations) AS affected(id) WHERE id IS NOT NULL) THEN
    UPDATE public.subscription_read_cache_generations SET generation=gen_random_uuid() WHERE product_id IS NOT NULL;
    DELETE FROM public.subscription_read_cache WHERE cache_key IS NOT NULL;
    RETURN NULL;
  END IF;
  UPDATE public.subscription_read_cache_generations g SET generation=gen_random_uuid()
    WHERE g.actor_id=ANY(actors);
  DELETE FROM public.subscription_read_cache WHERE actor_id=ANY(actors);
  RETURN NULL;
END;
$$;

COMMIT;
