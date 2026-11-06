-- Aggregate filter choices in the database instead of downloading the visits catalog.
BEGIN;
SET LOCAL lock_timeout='5s';
CREATE FUNCTION public.opportunity_visit_facets() RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog,public AS $$
 WITH visits AS (
  SELECT nullif(btrim(sector),'') sector,nullif(btrim(split_part(location,',',1)),'') location
  FROM public.opportunities WHERE employment_type='factory_visit' AND is_active=true
 )
 SELECT jsonb_build_object(
  'sectors',coalesce((SELECT jsonb_agg(sector ORDER BY sector) FROM (SELECT DISTINCT sector FROM visits WHERE sector IS NOT NULL) s),'[]'),
  'locations',coalesce((SELECT jsonb_agg(location ORDER BY location) FROM (SELECT DISTINCT location FROM visits WHERE location IS NOT NULL) l),'[]')
 );
$$;
REVOKE ALL ON FUNCTION public.opportunity_visit_facets() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.opportunity_visit_facets() TO service_role;
COMMIT;
