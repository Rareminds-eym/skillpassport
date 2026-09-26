-- Atomic catalog snapshots; no RLS changes. Retain tombstones for retired keys.
ALTER TABLE public.feature_keys_cache
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS product_code text NOT NULL DEFAULT 'skillpassport';

CREATE OR REPLACE FUNCTION public.refresh_feature_keys_cache(catalog jsonb)
RETURNS void LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF catalog IS NULL OR jsonb_typeof(catalog) <> 'array' THEN
    RAISE EXCEPTION 'catalog must be an array';
  END IF;
  -- Serialize snapshots so overlapping reconcile requests cannot interleave.
  LOCK TABLE public.feature_keys_cache IN SHARE ROW EXCLUSIVE MODE;
  UPDATE public.feature_keys_cache SET is_active = false, synced_at = now(), updated_at = now();
  INSERT INTO public.feature_keys_cache
    (id, product_id, product_code, key, role, nav_group, nav_label, nav_path, display_order, is_active, synced_at, updated_at)
  SELECT id, product_id, product_code, key, role, nav_group, nav_label, nav_path,
    COALESCE(display_order, 0), COALESCE(is_active, false), now(), now()
  FROM jsonb_to_recordset(catalog) AS row(
    id uuid, product_id text, product_code text, key text, role text, nav_group text,
    nav_label text, nav_path text, display_order integer, is_active boolean)
  ON CONFLICT (id) DO UPDATE SET
    product_id = EXCLUDED.product_id, product_code = EXCLUDED.product_code,
    key = EXCLUDED.key, role = EXCLUDED.role, nav_group = EXCLUDED.nav_group,
    nav_label = EXCLUDED.nav_label, nav_path = EXCLUDED.nav_path,
    display_order = EXCLUDED.display_order, is_active = EXCLUDED.is_active,
    synced_at = now(), updated_at = now();
END;
$$;
REVOKE ALL ON FUNCTION public.refresh_feature_keys_cache(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_feature_keys_cache(jsonb) TO service_role;
