BEGIN;
SET LOCAL lock_timeout='5s';

-- Job mutations use application server endpoints. Keep browser reads and RLS
-- intact; remove direct writes that bypass the publisher's approval boundary.
DO $$
DECLARE relation record; columns text;
BEGIN
 FOR relation IN
  WITH RECURSIVE protected(oid) AS (
   SELECT 'public.opportunities'::regclass::oid
   UNION
   SELECT r.ev_class FROM protected p JOIN pg_depend d
    ON d.refobjid=p.oid AND d.refclassid='pg_class'::regclass
    AND d.classid='pg_rewrite'::regclass
    JOIN pg_rewrite r ON r.oid=d.objid WHERE r.ev_class<>p.oid
  ) SELECT c.oid,n.nspname,c.relname FROM protected p
   JOIN pg_class c ON c.oid=p.oid JOIN pg_namespace n ON n.oid=c.relnamespace
 LOOP
  EXECUTE format('REVOKE INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON TABLE %I.%I FROM PUBLIC,anon,authenticated',relation.nspname,relation.relname);
  SELECT string_agg(quote_ident(attname),',' ORDER BY attnum) INTO columns
   FROM pg_attribute WHERE attrelid=relation.oid AND attnum>0 AND NOT attisdropped;
  IF columns IS NOT NULL THEN
   EXECUTE format('REVOKE INSERT (%s),UPDATE (%s),REFERENCES (%s) ON TABLE %I.%I FROM PUBLIC,anon,authenticated',columns,columns,columns,relation.nspname,relation.relname);
  END IF;
  IF EXISTS(SELECT 1 FROM (VALUES('anon'),('authenticated')) b(role)
    WHERE has_table_privilege(b.role,relation.oid,'INSERT,UPDATE,DELETE')
      OR has_any_column_privilege(b.role,relation.oid,'INSERT,UPDATE')) THEN
   RAISE EXCEPTION 'Job browser write privileges remain on %.%',relation.nspname,relation.relname;
  END IF;
 END LOOP;
END $$;
NOTIFY pgrst,'reload schema';
COMMIT;
