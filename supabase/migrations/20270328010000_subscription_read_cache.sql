-- Prepared migration: applying it requires approval for the exact target database.
-- BFF-only read snapshots. SSO remains authoritative for subscription mutations.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '15s';

CREATE TABLE public.subscription_read_cache_generations (
  product_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  generation uuid NOT NULL DEFAULT gen_random_uuid(),
  PRIMARY KEY(product_id,actor_id)
);
CREATE INDEX subscription_read_cache_generations_actor_idx ON public.subscription_read_cache_generations(actor_id);
CREATE TABLE public.subscription_read_cache (
  cache_key text PRIMARY KEY CHECK (cache_key ~ '^[a-f0-9]{64}$'),
  product_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  organization_id uuid,
  generation uuid NOT NULL,
  payload jsonb NOT NULL CHECK (jsonb_typeof(payload) = 'object'),
  cached_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY(product_id,actor_id) REFERENCES public.subscription_read_cache_generations(product_id,actor_id)
);
CREATE INDEX subscription_read_cache_actor_idx ON public.subscription_read_cache(actor_id);
CREATE INDEX subscription_read_cache_organization_idx ON public.subscription_read_cache(organization_id);
CREATE INDEX subscription_read_cache_product_idx ON public.subscription_read_cache(product_id);
ALTER TABLE public.subscription_read_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_read_cache_generations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.subscription_read_cache, public.subscription_read_cache_generations FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.read_subscription_read_cache(p_product_id uuid, p_actor_id uuid, p_organization_id uuid, p_cache_key text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE result jsonb;
BEGIN
  IF p_product_id IS NULL OR p_actor_id IS NULL OR p_cache_key IS NULL OR p_cache_key !~ '^[a-f0-9]{64}$' THEN
    RAISE EXCEPTION 'Invalid subscription cache scope';
  END IF;
  -- Existing scopes are a SELECT-only hot path. Initialize only a missing scope.
  SELECT jsonb_build_object('generation', g.generation, 'entry', CASE WHEN c.cache_key IS NULL THEN NULL
    ELSE jsonb_build_object('payload', c.payload, 'cachedAt', c.cached_at) END)
    INTO result FROM public.subscription_read_cache_generations g
    LEFT JOIN public.subscription_read_cache c ON c.product_id=g.product_id AND c.generation=g.generation AND c.cache_key=p_cache_key AND c.actor_id=g.actor_id AND c.organization_id IS NOT DISTINCT FROM p_organization_id
    WHERE g.product_id=p_product_id AND g.actor_id=p_actor_id;
  IF FOUND THEN RETURN result; END IF;
  INSERT INTO public.subscription_read_cache_generations(product_id,actor_id) VALUES (p_product_id,p_actor_id) ON CONFLICT DO NOTHING;
  -- A new generation has no entry. Re-read it after a concurrent initializer or invalidation.
  SELECT jsonb_build_object('generation', generation, 'entry', NULL) INTO result
    FROM public.subscription_read_cache_generations WHERE product_id=p_product_id AND actor_id=p_actor_id;
  RETURN result;
END;
$$;

CREATE FUNCTION public.write_subscription_read_cache(p_product_id uuid, p_actor_id uuid, p_organization_id uuid, p_cache_key text, p_generation uuid, p_payload jsonb)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
DECLARE current_generation uuid;
BEGIN
  IF p_product_id IS NULL OR p_actor_id IS NULL OR p_generation IS NULL OR p_cache_key IS NULL OR p_cache_key !~ '^[a-f0-9]{64}$'
    OR p_payload IS NULL OR jsonb_typeof(p_payload) <> 'object' THEN RAISE EXCEPTION 'Invalid subscription cache snapshot'; END IF;
  -- Serialize the fill with invalidation. A fetch started before an update cannot repopulate stale data.
  SELECT generation INTO current_generation FROM public.subscription_read_cache_generations WHERE product_id=p_product_id AND actor_id=p_actor_id FOR SHARE;
  IF current_generation IS DISTINCT FROM p_generation THEN RETURN false; END IF;
  INSERT INTO public.subscription_read_cache(cache_key,product_id,actor_id,organization_id,generation,payload)
    VALUES(p_cache_key,p_product_id,p_actor_id,p_organization_id,p_generation,p_payload)
    ON CONFLICT(cache_key) DO UPDATE SET product_id=EXCLUDED.product_id,actor_id=EXCLUDED.actor_id,organization_id=EXCLUDED.organization_id,generation=EXCLUDED.generation,
      payload=EXCLUDED.payload,cached_at=clock_timestamp();
  RETURN true;
END;
$$;

CREATE FUNCTION public.invalidate_subscription_read_cache(p_product_id uuid, p_actor_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  IF p_product_id IS NULL THEN RAISE EXCEPTION 'Subscription product is required'; END IF;
  UPDATE public.subscription_read_cache_generations SET generation=gen_random_uuid()
    WHERE product_id=p_product_id AND (p_actor_id IS NULL OR actor_id=p_actor_id);
  DELETE FROM public.subscription_read_cache WHERE product_id=p_product_id AND (p_actor_id IS NULL OR actor_id=p_actor_id);
END;
$$;

CREATE FUNCTION public.invalidate_subscription_read_cache_on_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public AS $$
BEGIN
  -- These application tables are the existing synchronization boundary. Statement triggers
  -- invalidate bulk updates once and also cover changes made outside the subscription BFF.
  UPDATE public.subscription_read_cache_generations SET generation=gen_random_uuid();
  DELETE FROM public.subscription_read_cache;
  RETURN NULL;
END;
$$;
CREATE FUNCTION public.invalidate_subscription_read_cache_for_subject()
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
    UPDATE public.subscription_read_cache_generations SET generation=gen_random_uuid();
    DELETE FROM public.subscription_read_cache;
    RETURN NULL;
  END IF;
  UPDATE public.subscription_read_cache_generations g SET generation=gen_random_uuid()
    WHERE g.actor_id=ANY(actors);
  DELETE FROM public.subscription_read_cache WHERE actor_id=ANY(actors);
  RETURN NULL;
END;
$$;
DO $$
DECLARE target text;
BEGIN
  FOREACH target IN ARRAY ARRAY['plans_cache','subscription_plan_projections','features'] LOOP
    EXECUTE format('CREATE TRIGGER subscription_read_cache_sync AFTER INSERT OR UPDATE OR DELETE OR TRUNCATE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION public.invalidate_subscription_read_cache_on_sync()',target);
  END LOOP;
  FOREACH target IN ARRAY ARRAY['subscription_cache','users','organization_members','organizations','license_assignments','learners'] LOOP
    EXECUTE format('CREATE TRIGGER subscription_read_cache_sync AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.invalidate_subscription_read_cache_for_subject()',target);
    EXECUTE format('CREATE TRIGGER subscription_read_cache_truncate AFTER TRUNCATE ON public.%I FOR EACH STATEMENT EXECUTE FUNCTION public.invalidate_subscription_read_cache_on_sync()',target);
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.read_subscription_read_cache(uuid,uuid,uuid,text),
  public.write_subscription_read_cache(uuid,uuid,uuid,text,uuid,jsonb), public.invalidate_subscription_read_cache(uuid,uuid),
  public.invalidate_subscription_read_cache_on_sync(), public.invalidate_subscription_read_cache_for_subject() FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.read_subscription_read_cache(uuid,uuid,uuid,text),
  public.write_subscription_read_cache(uuid,uuid,uuid,text,uuid,jsonb), public.invalidate_subscription_read_cache(uuid,uuid) TO service_role;
COMMENT ON TABLE public.subscription_read_cache IS 'Validated BFF read responses keyed by product, actor, organization, roles, resource and input hash. No tokens or credentials.';
COMMIT;
