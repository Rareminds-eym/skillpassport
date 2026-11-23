BEGIN;
SET LOCAL search_path=pg_catalog,public;

-- Extend the existing boundary attestation without changing its identity checks.
-- pg_net 0.20.3 and 0.20.4 expose two supabase_admin-owned HTTP queue helpers.
-- They enqueue caller-supplied requests without reading private identities;
-- postgres cannot revoke their extension-managed browser grants. Attest only
-- these reviewed definitions and their extension membership, as for pg_graphql.
CREATE OR REPLACE FUNCTION public.zoho_private_boundary_safe_routine(p_oid oid) RETURNS boolean
LANGUAGE sql STABLE SET search_path=pg_catalog,public AS $safe$
 SELECT EXISTS(
  SELECT 1 FROM pg_proc p JOIN pg_depend d ON d.classid='pg_proc'::regclass
   AND d.objid=p.oid AND d.refclassid='pg_extension'::regclass AND d.deptype='e'
   JOIN pg_extension e ON e.oid=d.refobjid
  WHERE p.oid=p_oid AND ((e.extname='pg_graphql'
   AND encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex') IN (
    'f61f2f82caf3e62d73892d1767b3419fa1ce354371acca1636afd73f9f3b4840',
    '0e461d6c599638cc70f1e14d4175b3f002709e08b55e27b16b7b17245e9f00b8')
   AND EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='graphql' AND c.relname='seq_schema_version' AND c.relkind='S'))
   OR (e.extname='pg_net' AND e.extversion IN ('0.20.3','0.20.4')
    AND encode(sha256(convert_to(pg_get_functiondef(p.oid),'UTF8')),'hex') IN (
     'a314aa28b0562dc66cc6816ef80ac8572f0f8dad52a2384436aead7f5773e391',
     '0f55d7f307a02151f2ced9329d5b5ac8274a7099254fed625aaaa2722764a39b')))
 );
$safe$;
REVOKE ALL ON FUNCTION public.zoho_private_boundary_safe_routine(oid) FROM PUBLIC,anon,authenticated;

SELECT public.zoho_assert_private_projection_boundary();
NOTIFY pgrst,'reload schema';
COMMIT;
