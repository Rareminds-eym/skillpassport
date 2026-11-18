BEGIN;

-- Read code tokens rather than matching a keyword inside comments, quoted
-- identifiers or literal text. Dynamic statements remain unsupported even when
-- comments separate their keyword from the expression.
CREATE FUNCTION public.zoho_job_sql_tokens(p_source text) RETURNS text[]
LANGUAGE plpgsql IMMUTABLE STRICT SET search_path=pg_catalog AS $$
DECLARE i integer:=1; size integer:=length(p_source); depth integer; quote text;
 tag text; word text; stop integer; escaped boolean; start integer; tokens text[]:='{}';
 normalized text[]:='{}'; escape_char text; decoded text; digits text; j integer;
 literal_values jsonb:='{}'; reference_tokens text[]:='{}'; reference_type text;
BEGIN
 WHILE i<=size LOOP
  IF substring(p_source FROM i FOR 2)='--' THEN
   stop:=strpos(substring(p_source FROM i),chr(10));
   IF stop=0 THEN EXIT; END IF;
   i:=i+stop;
  ELSIF substring(p_source FROM i FOR 2)='/*' THEN
   depth:=1;i:=i+2;
   WHILE i<=size AND depth>0 LOOP
    IF substring(p_source FROM i FOR 2)='/*' THEN depth:=depth+1;i:=i+2;
    ELSIF substring(p_source FROM i FOR 2)='*/' THEN depth:=depth-1;i:=i+2;
    ELSE i:=i+1; END IF;
   END LOOP;
   IF depth<>0 THEN RAISE EXCEPTION 'Unterminated SQL comment in job dependency' USING ERRCODE='ZJ001'; END IF;
  ELSIF substring(p_source FROM i FOR 1) IN (chr(39),chr(34)) THEN
   start:=i;quote:=substring(p_source FROM i FOR 1);
   escaped:=quote=chr(39) AND i>1 AND lower(substring(p_source FROM i-1 FOR 1))='e'
    AND (i=2 OR substring(p_source FROM i-2 FOR 1)!~'[[:alnum:]_$]');
   i:=i+1;stop:=0;
   WHILE i<=size LOOP
    IF escaped AND substring(p_source FROM i FOR 1)=chr(92) THEN i:=i+2;
    ELSIF substring(p_source FROM i FOR 1)=quote THEN
     i:=i+1;
     IF substring(p_source FROM i FOR 1)<>quote THEN stop:=1;EXIT; END IF;
     i:=i+1;
    ELSE i:=i+1; END IF;
   END LOOP;
   IF stop=0 THEN RAISE EXCEPTION 'Unterminated SQL quote in job dependency' USING ERRCODE='ZJ001'; END IF;
   IF quote=chr(39) AND NOT escaped THEN
    literal_values:=literal_values||jsonb_build_object((cardinality(tokens)+1)::text,
     replace(substring(p_source FROM start+1 FOR i-start-2),chr(39)||chr(39),chr(39)));
   END IF;
   tokens:=array_append(tokens,CASE WHEN quote=chr(34) OR tokens[cardinality(tokens)]='uescape'
    THEN substring(p_source FROM start FOR i-start) ELSE '[literal]' END);
  ELSIF substring(p_source FROM i FOR 1)='$' AND
   substring(p_source FROM i) ~ '^\$([[:alpha:]_][[:alnum:]_]*)?\$' THEN
   tag:=substring(substring(p_source FROM i) FROM '^\$([[:alpha:]_][[:alnum:]_]*)?\$');
   tag:='$'||coalesce(tag,'')||'$';
   stop:=strpos(substring(p_source FROM i+length(tag)),tag);
   IF stop=0 THEN RAISE EXCEPTION 'Unterminated SQL dollar quote in job dependency' USING ERRCODE='ZJ001'; END IF;
   literal_values:=literal_values||jsonb_build_object((cardinality(tokens)+1)::text,
    substring(p_source FROM i+length(tag) FOR stop-1));
   i:=i+2*length(tag)+stop-1;tokens:=array_append(tokens,'[literal]');
  ELSIF substring(p_source FROM i FOR 1) ~ '[[:alpha:]_]' THEN
   word:=substring(substring(p_source FROM i) FROM '^[[:alpha:]_][[:alnum:]_$]*');
   tokens:=array_append(tokens,lower(word));i:=i+length(word);
  ELSE
   IF substring(p_source FROM i FOR 1)!~'[[:space:]]' THEN tokens:=array_append(tokens,substring(p_source FROM i FOR 1)); END IF;
   i:=i+1;
  END IF;
 END LOOP;
 -- Normalize PostgreSQL Unicode identifiers before dependency matching. Keep
 -- literal values masked, except the single UESCAPE character consumed here.
 i:=1;
 WHILE i<=cardinality(tokens) LOOP
  -- Constant regclass/regprocedure references and sequence operations are
  -- executable dependencies, unlike ordinary messages or JSON string values.
  IF tokens[i]='[literal]' THEN
   reference_type:=CASE WHEN tokens[i+1]=':' AND tokens[i+2]=':' THEN
    CASE WHEN tokens[i+3]='pg_catalog' AND tokens[i+4]='.' THEN tokens[i+5] ELSE tokens[i+3] END END;
   IF reference_type IN ('regclass','regproc','regprocedure','regtype','regoperator','regcollation','regnamespace')
    OR (tokens[i-1]='(' AND tokens[i-2] IN ('nextval','currval','setval','to_regclass','to_regproc','to_regprocedure','to_regtype','to_regoperator','to_regcollation','to_regnamespace'))
    OR (tokens[i-1]='e' AND tokens[i-2]='(' AND tokens[i-3] IN ('nextval','currval','setval','to_regclass','to_regproc','to_regprocedure','to_regtype','to_regoperator','to_regcollation','to_regnamespace')) THEN
    IF NOT literal_values ? i::text THEN
     RAISE EXCEPTION 'Escaped catalog reference requires static SQL in job dependency' USING ERRCODE='ZJ001';
    END IF;
    reference_tokens:=reference_tokens||public.zoho_job_sql_tokens(literal_values->>i::text);
   END IF;
  END IF;
  IF tokens[i]='u' AND tokens[i+1]='&' AND (left(tokens[i+2],1)=chr(34) OR tokens[i+2]='[literal]') THEN
   word:=tokens[i+2];escape_char:=chr(92);i:=i+3;
   IF tokens[i]='uescape' THEN
    escape_char:=replace(substring(tokens[i+1] FROM 2 FOR length(tokens[i+1])-2),chr(39)||chr(39),chr(39));
    IF length(escape_char)<>1 OR escape_char ~ '[[:xdigit:]+[:space:]]' OR escape_char IN (chr(34),chr(39)) THEN
     RAISE EXCEPTION 'Invalid Unicode identifier escape in job dependency' USING ERRCODE='ZJ001';
    END IF;
    i:=i+2;
   END IF;
   IF word='[literal]' THEN normalized:=array_append(normalized,word);CONTINUE; END IF;
   word:=replace(substring(word FROM 2 FOR length(word)-2),chr(34)||chr(34),chr(34));
   decoded:='';j:=1;
   WHILE j<=length(word) LOOP
    IF substring(word FROM j FOR 1)<>escape_char THEN
     decoded:=decoded||replace(substring(word FROM j FOR 1),chr(92),chr(92)||chr(92));j:=j+1;
    ELSIF substring(word FROM j+1 FOR 1)=escape_char THEN
     decoded:=decoded||replace(escape_char,chr(92),chr(92)||chr(92));j:=j+2;
    ELSE
     start:=CASE WHEN substring(word FROM j+1 FOR 1)='+' THEN 6 ELSE 4 END;
     stop:=CASE WHEN start=6 THEN 2 ELSE 1 END;
     digits:=substring(word FROM j+stop FOR start);
     IF length(digits)<>start OR digits !~ '^[[:xdigit:]]+$' THEN
      RAISE EXCEPTION 'Invalid Unicode identifier in job dependency' USING ERRCODE='ZJ001';
     END IF;
     decoded:=decoded||chr(92)||CASE WHEN start=6 THEN 'U00' ELSE 'u' END||digits;
     j:=j+stop+start;
    END IF;
   END LOOP;
   normalized:=array_append(normalized,chr(34)||replace(unistr(decoded),chr(34),chr(34)||chr(34))||chr(34));
  ELSE normalized:=array_append(normalized,tokens[i]);i:=i+1;
  END IF;
 END LOOP;
 -- Catalog names are identifiers, never executable statement keywords.
 RETURN normalized||ARRAY(SELECT CASE WHEN token ~ '^[[:alpha:]_][[:alnum:]_$]*$'
  THEN chr(34)||replace(token,chr(34),chr(34)||chr(34))||chr(34) ELSE token END
  FROM unnest(reference_tokens) token);
END $$;
REVOKE ALL ON FUNCTION public.zoho_job_sql_tokens(text) FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;

CREATE FUNCTION public.zoho_job_has_dynamic_sql(p_source text) RETURNS boolean
LANGUAGE sql IMMUTABLE STRICT SET search_path=pg_catalog,public AS $$
 SELECT 'execute'=ANY(public.zoho_job_sql_tokens(p_source));
$$;
REVOKE ALL ON FUNCTION public.zoho_job_has_dynamic_sql(text) FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;

-- A writer's safety review must not expire whenever an unrelated application
-- object changes. pg_depend covers parsed expressions, but not PL/pgSQL bodies
-- or string-defined SQL bodies. Include every matching identifier/overload from
-- those bodies conservatively, including quoted and cross-schema helpers.
-- Identifier matching deliberately retains ambiguous/overloaded references;
-- comments between a helper name and its call must never hide the helper.
CREATE FUNCTION public.zoho_job_dependency_objects()
RETURNS TABLE(classid oid,objid oid)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE objects jsonb;
BEGIN
 IF current_setting('standard_conforming_strings')<>'on' THEN
  RAISE EXCEPTION 'Job review requires standard SQL string semantics' USING ERRCODE='ZJ001';
 END IF;
 WITH RECURSIVE
 namespaces AS MATERIALIZED (
  SELECT oid FROM pg_namespace WHERE nspname !~ '^pg_' AND nspname<>'information_schema'
 ),
 routines AS MATERIALIZED (
  SELECT p.*,l.lanname FROM pg_proc p JOIN namespaces n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang
 ),
 relations AS MATERIALIZED (
  SELECT c.* FROM pg_class c JOIN namespaces n ON n.oid=c.relnamespace
  WHERE c.relkind IN ('r','p','v','m','f','S','i','I','c')
 ),
 named AS MATERIALIZED (
  SELECT 'pg_proc'::regclass::oid AS classid,p.oid AS objid,p.proname::text AS label,p.pronamespace AS namespace FROM routines p
  UNION ALL SELECT 'pg_class'::regclass,c.oid,c.relname::text,c.relnamespace FROM relations c
  UNION ALL SELECT 'pg_type'::regclass,t.oid,t.typname::text,t.typnamespace FROM pg_type t JOIN namespaces n ON n.oid=t.typnamespace
  UNION ALL SELECT 'pg_collation'::regclass,c.oid,c.collname::text,c.collnamespace FROM pg_collation c JOIN namespaces n ON n.oid=c.collnamespace
 ),
 edges AS MATERIALIZED (
  SELECT d.classid,d.objid,d.refclassid,d.refobjid,
   CASE WHEN d.classid='pg_rewrite'::regclass AND d.refclassid='pg_class'::regclass
    THEN 'write' ELSE 'reference' END AS mode FROM pg_depend d
  -- Only writes fire table triggers/defaults. A read of organizations must not
  -- pull every organization's unrelated child-table effects into the review.
  UNION SELECT 'pg_class'::regclass,t.tgrelid,'pg_trigger'::regclass,t.oid,'effect' FROM pg_trigger t
  UNION SELECT 'pg_class'::regclass,d.adrelid,'pg_attrdef'::regclass,d.oid,'effect' FROM pg_attrdef d
  UNION SELECT 'pg_class'::regclass,r.ev_class,'pg_rewrite'::regclass,r.oid,'reference' FROM pg_rewrite r
  UNION SELECT 'pg_class'::regclass,c.conrelid,'pg_constraint'::regclass,c.oid,'reference' FROM pg_constraint c WHERE c.conrelid<>0
  UNION SELECT 'pg_class'::regclass,i.indrelid,'pg_class'::regclass,i.indexrelid,'reference' FROM pg_index i
  UNION SELECT 'pg_class'::regclass,p.polrelid,'pg_policy'::regclass,p.oid,'reference' FROM pg_policy p
  UNION SELECT 'pg_class'::regclass,i.inhparent,'pg_class'::regclass,i.inhrelid,'partition' FROM pg_inherits i
  UNION SELECT 'pg_class'::regclass,i.inhrelid,'pg_class'::regclass,i.inhparent,'partition' FROM pg_inherits i
  -- Cascades can write children even though a routine never names them.
  UNION SELECT 'pg_class'::regclass,c.confrelid,'pg_class'::regclass,c.conrelid,'cascade'
   FROM pg_constraint c WHERE c.contype='f' AND (c.confupdtype IN ('c','n','d') OR c.confdeltype IN ('c','n','d'))
  -- Identity sequences depend on their column, so their ownership edge runs
  -- opposite to the expression-dependency direction.
  UNION SELECT d.refclassid,d.refobjid,d.classid,d.objid,'reference' FROM pg_depend d
   JOIN pg_class c ON d.classid='pg_class'::regclass AND c.oid=d.objid AND c.relkind='S'
   WHERE d.refclassid='pg_class'::regclass AND d.deptype IN ('a','i')
  UNION SELECT 'pg_opclass'::regclass,c.oid,'pg_opfamily'::regclass,c.opcfamily,'reference' FROM pg_opclass c
  UNION SELECT 'pg_opfamily'::regclass,p.amprocfamily,'pg_amproc'::regclass,p.oid,'reference' FROM pg_amproc p
  UNION SELECT 'pg_opfamily'::regclass,o.amopfamily,'pg_amop'::regclass,o.oid,'reference' FROM pg_amop o
  UNION SELECT 'pg_amproc'::regclass,p.oid,'pg_proc'::regclass,p.amproc,'reference' FROM pg_amproc p
  UNION SELECT 'pg_amop'::regclass,o.oid,'pg_operator'::regclass,o.amopopr,'reference' FROM pg_amop o
  UNION SELECT 'pg_class'::regclass,c.oid,'pg_am'::regclass,c.relam,'reference' FROM relations c WHERE c.relam<>0
  UNION SELECT 'pg_am'::regclass,a.oid,'pg_proc'::regclass,a.amhandler,'reference' FROM pg_am a
  UNION SELECT 'pg_type'::regclass,c.castsource,'pg_cast'::regclass,c.oid,'reference' FROM pg_cast c
  UNION SELECT 'pg_type'::regclass,c.casttarget,'pg_cast'::regclass,c.oid,'reference' FROM pg_cast c
  UNION SELECT 'pg_type'::regclass,o.oprleft,'pg_operator'::regclass,o.oid,'reference' FROM pg_operator o
  UNION SELECT 'pg_type'::regclass,o.oprright,'pg_operator'::regclass,o.oid,'reference' FROM pg_operator o
 ),
 -- System objects are PostgreSQL's trusted runtime. Extension ownership/version
 -- remains visible through pg_depend even for extension objects in pg_catalog.
 candidates AS MATERIALIZED (
  SELECT n.classid,n.objid FROM named n
  UNION SELECT 'pg_namespace'::regclass,oid FROM namespaces
  UNION SELECT 'pg_trigger'::regclass,t.oid FROM pg_trigger t JOIN relations c ON c.oid=t.tgrelid
  UNION SELECT 'pg_attrdef'::regclass,d.oid FROM pg_attrdef d JOIN relations c ON c.oid=d.adrelid
  UNION SELECT 'pg_rewrite'::regclass,r.oid FROM pg_rewrite r JOIN relations c ON c.oid=r.ev_class
  UNION SELECT 'pg_constraint'::regclass,c.oid FROM pg_constraint c JOIN namespaces n ON n.oid=c.connamespace
  UNION SELECT 'pg_policy'::regclass,p.oid FROM pg_policy p JOIN relations c ON c.oid=p.polrelid
  UNION SELECT 'pg_operator'::regclass,o.oid FROM pg_operator o JOIN namespaces n ON n.oid=o.oprnamespace
  UNION SELECT 'pg_cast'::regclass,c.oid FROM pg_cast c WHERE
   c.castsource IN (SELECT n.objid FROM named n WHERE n.classid='pg_type'::regclass)
   OR c.casttarget IN (SELECT n.objid FROM named n WHERE n.classid='pg_type'::regclass)
   OR c.castfunc IN (SELECT oid FROM routines)
  UNION SELECT 'pg_opclass'::regclass,c.oid FROM pg_opclass c JOIN namespaces n ON n.oid=c.opcnamespace
  UNION SELECT 'pg_opfamily'::regclass,f.oid FROM pg_opfamily f JOIN namespaces n ON n.oid=f.opfnamespace
  UNION SELECT 'pg_amproc'::regclass,p.oid FROM pg_amproc p JOIN pg_opfamily f ON f.oid=p.amprocfamily JOIN namespaces n ON n.oid=f.opfnamespace
  UNION SELECT 'pg_amop'::regclass,o.oid FROM pg_amop o JOIN pg_opfamily f ON f.oid=o.amopfamily JOIN namespaces n ON n.oid=f.opfnamespace
  UNION SELECT 'pg_am'::regclass,a.oid FROM pg_am a JOIN routines p ON p.oid=a.amhandler
  UNION SELECT 'pg_extension'::regclass,e.oid FROM pg_extension e
  UNION SELECT 'pg_collation'::regclass,c.oid FROM pg_collation c JOIN namespaces n ON n.oid=c.collnamespace
 ),
 reached(classid,objid,is_write) AS (
  -- Resolve mandatory roots strictly: a missing writer is a configuration error.
  SELECT 'pg_proc'::regclass::oid,'public.zoho_apply_job_operation(jsonb)'::regprocedure::oid,false
  UNION SELECT 'pg_class'::regclass,'public.opportunities'::regclass,true
  -- Review machinery is itself fingerprinted, without interpreting its catalogue
  -- query identifiers as names of application dependencies.
  UNION SELECT 'pg_proc'::regclass,'public.zoho_job_dependency_objects()'::regprocedure,false
  UNION SELECT 'pg_proc'::regclass,'public.zoho_job_executable_surface()'::regprocedure,false
  UNION SELECT 'pg_proc'::regclass,'public.zoho_job_trigger_fingerprint()'::regprocedure,false
  UNION SELECT 'pg_proc'::regclass,'public.zoho_job_has_dynamic_sql(text)'::regprocedure,false
  UNION SELECT 'pg_proc'::regclass,'public.zoho_job_sql_tokens(text)'::regprocedure,false
  UNION SELECT 'pg_proc'::regclass,'public.zoho_job_write_targets(oid)'::regprocedure,false
  UNION SELECT 'pg_proc'::regclass,to_regprocedure('public.zoho_job_write_targets(text[])'),false
  UNION SELECT 'pg_proc'::regclass,to_regprocedure('public.zoho_job_body_references(oid)'),false
  -- User-defined casts between built-in types can alter the meaning of a body
  -- without leaving a dependency on an application type.
  UNION SELECT 'pg_cast'::regclass,c.oid,false FROM pg_cast c JOIN routines p ON p.oid=c.castfunc
   WHERE NOT EXISTS(SELECT 1 FROM named n WHERE n.classid='pg_type'::regclass AND n.objid IN (c.castsource,c.casttarget))
  UNION
  SELECT c.classid,c.objid,(e.mode IN ('write','cascade') OR (e.mode='partition' AND r.is_write))
  FROM reached r CROSS JOIN LATERAL (
   SELECT e.refclassid,e.refobjid,e.mode FROM edges e WHERE e.classid=r.classid AND e.objid=r.objid
   UNION
   SELECT b.classid,b.objid,b.mode FROM public.zoho_job_body_references(
    CASE WHEN r.classid='pg_proc'::regclass THEN r.objid END) b

  ) e
  JOIN candidates c ON c.classid=e.refclassid AND c.objid=e.refobjid
  WHERE e.mode NOT IN ('effect','cascade') OR r.is_write
 )
 SELECT jsonb_agg(jsonb_build_object('classid',r.classid,'objid',r.objid)) INTO objects FROM reached r;
 IF jsonb_array_length(objects)>50000 THEN
  RAISE EXCEPTION 'Job dependency review exceeds supported bounds' USING ERRCODE='ZJ001';
 END IF;
 -- A body that chooses executable SQL at runtime has no verifiable static
 -- dependency closure. Do not replace a failed analysis with a partial review.
 IF EXISTS(SELECT 1 FROM jsonb_to_recordset(objects) AS o(classid oid,objid oid)
  JOIN pg_proc p ON o.classid='pg_proc'::regclass AND p.oid=o.objid
  JOIN pg_language l ON l.oid=p.prolang
  WHERE l.lanname='plpgsql' AND p.oid NOT IN ('public.zoho_job_dependency_objects()'::regprocedure,
   'public.zoho_job_has_dynamic_sql(text)'::regprocedure,'public.zoho_job_sql_tokens(text)'::regprocedure,'public.zoho_job_write_targets(oid)'::regprocedure,to_regprocedure('public.zoho_job_write_targets(text[])'),to_regprocedure('public.zoho_job_body_references(oid)'))
   AND (CASE WHEN p.prosrc ~* '\mEXECUTE\M' THEN public.zoho_job_has_dynamic_sql(p.prosrc) ELSE false END
    OR 'standard_conforming_strings=off'=ANY(p.proconfig))) THEN
  RAISE EXCEPTION 'Dynamic SQL in job dependencies requires an explicit static dependency design' USING ERRCODE='ZJ001';
 END IF;
 RETURN QUERY SELECT DISTINCT o.classid,o.objid FROM jsonb_to_recordset(objects) AS o(classid oid,objid oid);
END $$;
REVOKE ALL ON FUNCTION public.zoho_job_dependency_objects() FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;

-- Reuse already-tokenized bodies so each reachable routine is lexed once.
CREATE FUNCTION public.zoho_job_write_targets(p_tokens text[]) RETURNS SETOF oid
LANGUAGE sql STABLE STRICT SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 WITH source AS MATERIALIZED (
  SELECT array_to_string(p_tokens,' ') AS code
 ), targets AS (
  SELECT m[1] AS reference FROM source CROSS JOIN LATERAL regexp_matches(code,
   '\m(?:INSERT[[:space:]]+INTO|UPDATE|DELETE[[:space:]]+FROM|MERGE[[:space:]]+INTO|COPY|TRUNCATE(?:[[:space:]]+TABLE)?)[[:space:]]+(?:ONLY[[:space:]]+)?((?:"(?:[^"]|"")*"|[[:alpha:]_][[:alnum:]_$]*)(?:[[:space:]]*\.[[:space:]]*(?:"(?:[^"]|"")*"|[[:alpha:]_][[:alnum:]_$]*))?)','gi') m
  UNION
  -- A single TRUNCATE can affect several independently triggered relations.
  SELECT name[1] FROM source
  CROSS JOIN LATERAL regexp_matches(code,'\mTRUNCATE[[:space:]]+(?:TABLE[[:space:]]+)?((?:ONLY[[:space:]]+)?(?:"(?:[^"]|"")*"|[[:alpha:]_][[:alnum:]_$]*)(?:[[:space:]]*\.[[:space:]]*(?:"(?:[^"]|"")*"|[[:alpha:]_][[:alnum:]_$]*))?(?:[[:space:]]*\*)?(?:[[:space:]]*,[[:space:]]*(?:ONLY[[:space:]]+)?(?:"(?:[^"]|"")*"|[[:alpha:]_][[:alnum:]_$]*)(?:[[:space:]]*\.[[:space:]]*(?:"(?:[^"]|"")*"|[[:alpha:]_][[:alnum:]_$]*))?(?:[[:space:]]*\*)?)*)','gi') list
  CROSS JOIN LATERAL regexp_matches(list[1],'((?:"(?:[^"]|"")*"|[[:alpha:]_][[:alnum:]_$]*)(?:[[:space:]]*\.[[:space:]]*(?:"(?:[^"]|"")*"|[[:alpha:]_][[:alnum:]_$]*))?)','g') name
 )
 SELECT DISTINCT c.oid FROM targets t JOIN pg_class c ON c.relkind IN ('r','p','v','m','f')
 JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname !~ '^pg_' AND n.nspname<>'information_schema'
 AND (regexp_replace(lower(t.reference),'[[:space:]"]','','g')=regexp_replace(lower(c.relname),'[[:space:]"]','','g')
  OR regexp_replace(lower(t.reference),'[[:space:]"]','','g')=regexp_replace(lower(n.nspname||'.'||c.relname),'[[:space:]"]','','g'));
$$;
REVOKE ALL ON FUNCTION public.zoho_job_write_targets(text[]) FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;

CREATE FUNCTION public.zoho_job_write_targets(p_routine oid) RETURNS SETOF oid
LANGUAGE sql STABLE STRICT SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT target FROM pg_proc p JOIN pg_language l ON l.oid=p.prolang
 CROSS JOIN LATERAL public.zoho_job_write_targets(public.zoho_job_sql_tokens(p.prosrc)) target
  WHERE p.oid=p_routine AND l.lanname IN ('sql','plpgsql')
   AND p.prosrc ~* '\m(INSERT|UPDATE|DELETE|MERGE|COPY|TRUNCATE)\M'
   AND p.oid NOT IN ('public.zoho_job_dependency_objects()'::regprocedure,
    'public.zoho_job_executable_surface()'::regprocedure,'public.zoho_job_trigger_fingerprint()'::regprocedure,
    'public.zoho_job_has_dynamic_sql(text)'::regprocedure,'public.zoho_job_sql_tokens(text)'::regprocedure,
    'public.zoho_job_write_targets(oid)'::regprocedure,to_regprocedure('public.zoho_job_write_targets(text[])'),to_regprocedure('public.zoho_job_body_references(oid)'))
;
$$;
REVOKE ALL ON FUNCTION public.zoho_job_write_targets(oid) FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;

-- Parse only reachable routine bodies, using the same lexer as write-target
-- analysis. Comments and literals cannot invent dependency edges. Overloads and
-- ambiguous executable identifiers remain conservatively included.
CREATE FUNCTION public.zoho_job_body_references(p_routine oid)
RETURNS TABLE(classid oid,objid oid,mode text)
LANGUAGE sql STABLE STRICT SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 WITH source AS MATERIALIZED (
  SELECT public.zoho_job_sql_tokens(p.prosrc) AS tokens FROM pg_proc p JOIN pg_language l ON l.oid=p.prolang
  WHERE p.oid=p_routine AND l.lanname IN ('sql','plpgsql')
   AND p.oid NOT IN ('public.zoho_job_dependency_objects()'::regprocedure,
    'public.zoho_job_executable_surface()'::regprocedure,'public.zoho_job_trigger_fingerprint()'::regprocedure,
    'public.zoho_job_has_dynamic_sql(text)'::regprocedure,'public.zoho_job_sql_tokens(text)'::regprocedure,
    'public.zoho_job_write_targets(oid)'::regprocedure,to_regprocedure('public.zoho_job_write_targets(text[])'),to_regprocedure('public.zoho_job_body_references(oid)'))
 ), identifiers AS MATERIALIZED (
  SELECT DISTINCT CASE WHEN left(token,1)=chr(34)
   THEN replace(substring(token FROM 2 FOR length(token)-2),chr(34)||chr(34),chr(34)) ELSE token END AS label
  FROM source CROSS JOIN LATERAL unnest(tokens) token
  WHERE left(token,1)=chr(34) OR token ~ '^[[:alpha:]_][[:alnum:]_$]*$'
 ), named AS (
  SELECT 'pg_proc'::regclass::oid AS classid,p.oid AS objid,p.proname AS label,p.pronamespace AS namespace FROM pg_proc p
  UNION ALL SELECT 'pg_class'::regclass,c.oid,c.relname,c.relnamespace FROM pg_class c
  UNION ALL SELECT 'pg_type'::regclass,t.oid,t.typname,t.typnamespace FROM pg_type t
  UNION ALL SELECT 'pg_collation'::regclass,c.oid,c.collname,c.collnamespace FROM pg_collation c
 )
 SELECT DISTINCT n.classid,n.objid,'reference'::text FROM named n JOIN identifiers i ON i.label=n.label
 JOIN pg_namespace ns ON ns.oid=n.namespace WHERE ns.nspname !~ '^pg_' AND ns.nspname<>'information_schema'
 UNION
 SELECT 'pg_operator'::regclass,o.oid,'reference' FROM pg_operator o JOIN pg_namespace ns ON ns.oid=o.oprnamespace
 CROSS JOIN source s WHERE ns.nspname !~ '^pg_' AND ns.nspname<>'information_schema'
  AND strpos(array_to_string(s.tokens,''),o.oprname)>0
 UNION
 SELECT 'pg_class'::regclass,target,'write' FROM source s
 CROSS JOIN LATERAL public.zoho_job_write_targets(s.tokens) target;
$$;
REVOKE ALL ON FUNCTION public.zoho_job_body_references(oid) FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;

CREATE OR REPLACE FUNCTION public.zoho_job_executable_surface()
RETURNS TABLE(kind text,name text,definition text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 WITH scope AS MATERIALIZED (SELECT * FROM public.zoho_job_dependency_objects()),
 relations AS MATERIALIZED (
  SELECT c.* FROM pg_class c JOIN scope s ON s.classid='pg_class'::regclass AND s.objid=c.oid
 )
 SELECT 'namespace',n.nspname::text,jsonb_build_object('owner',n.nspowner,'acl',n.nspacl)::text
 FROM pg_namespace n JOIN scope s ON s.classid='pg_namespace'::regclass AND s.objid=n.oid
 UNION ALL
 SELECT 'routine',p.oid::regprocedure::text,
  jsonb_build_object('owner',p.proowner,'acl',p.proacl,'definition',pg_get_functiondef(p.oid))::text
 FROM pg_proc p JOIN scope s ON s.classid='pg_proc'::regclass AND s.objid=p.oid WHERE p.prokind IN ('f','p','w')
 UNION ALL
 SELECT 'aggregate',p.oid::regprocedure::text,(to_jsonb(p)||to_jsonb(a))::text
 FROM pg_proc p JOIN scope s ON s.classid='pg_proc'::regclass AND s.objid=p.oid JOIN pg_aggregate a ON a.aggfnoid=p.oid
 UNION ALL
 SELECT 'index',i.indexrelid::regclass::text,
  jsonb_build_object('definition',pg_get_indexdef(i.indexrelid),'valid',i.indisvalid,'ready',i.indisready,'live',i.indislive)::text
 FROM pg_index i JOIN relations c ON c.oid=i.indexrelid
 UNION ALL
 SELECT 'type',t.oid::regtype::text,to_jsonb(t)::text FROM pg_type t JOIN scope s ON s.classid='pg_type'::regclass AND s.objid=t.oid
 UNION ALL
 SELECT 'enum',e.enumtypid::regtype::text||'.'||e.enumlabel,to_jsonb(e)::text
 FROM pg_enum e JOIN scope s ON s.classid='pg_type'::regclass AND s.objid=e.enumtypid
 UNION ALL
 SELECT 'trigger',t.tgrelid::regclass::text||'.'||t.tgname,
  jsonb_build_object('mode',t.tgenabled,'definition',pg_get_triggerdef(t.oid),'routine',t.tgfoid::regprocedure::text)::text
 FROM pg_trigger t JOIN scope s ON s.classid='pg_trigger'::regclass AND s.objid=t.oid
 UNION ALL
 SELECT 'default',d.adrelid::regclass::text||'.'||a.attname,pg_get_expr(d.adbin,d.adrelid)
 FROM pg_attrdef d JOIN scope s ON s.classid='pg_attrdef'::regclass AND s.objid=d.oid
 JOIN pg_attribute a ON a.attrelid=d.adrelid AND a.attnum=d.adnum
 UNION ALL
 SELECT 'rule',r.ev_class::regclass::text||'.'||r.rulename,
  jsonb_build_object('mode',r.ev_enabled,'definition',pg_get_ruledef(r.oid))::text
 FROM pg_rewrite r JOIN scope s ON s.classid='pg_rewrite'::regclass AND s.objid=r.oid
 UNION ALL
 SELECT 'constraint',c.connamespace::regnamespace::text||'.'||c.conname||':'||c.oid::text,
  jsonb_build_object('validated',c.convalidated,'definition',pg_get_constraintdef(c.oid))::text
 FROM pg_constraint c JOIN scope s ON s.classid='pg_constraint'::regclass AND s.objid=c.oid
 UNION ALL
 SELECT 'relation',c.oid::regclass::text,
  jsonb_build_object('kind',c.relkind,'owner',c.relowner,'acl',c.relacl,'rowSecurity',c.relrowsecurity,
   'forceRowSecurity',c.relforcerowsecurity,'replicaIdentity',c.relreplident,'partition',pg_get_expr(c.relpartbound,c.oid),
   'options',c.reloptions,'sequence',(SELECT to_jsonb(seq) FROM pg_sequence seq WHERE seq.seqrelid=c.oid))::text FROM relations c WHERE c.relkind NOT IN ('i','I')
 UNION ALL
 SELECT 'column',a.attrelid::regclass::text||'.'||a.attname,
  jsonb_build_object('position',a.attnum,'type',format_type(a.atttypid,a.atttypmod),'collation',a.attcollation,
   'notNull',a.attnotnull,'identity',a.attidentity,'generated',a.attgenerated,'acl',a.attacl)::text
 FROM pg_attribute a JOIN relations c ON c.oid=a.attrelid WHERE a.attnum>0 AND NOT a.attisdropped
 UNION ALL
 SELECT 'operator',o.oid::regoperator::text,to_jsonb(o)::text
 FROM pg_operator o JOIN scope s ON s.classid='pg_operator'::regclass AND s.objid=o.oid
 UNION ALL
 SELECT 'cast',c.castsource::regtype::text||' -> '||c.casttarget::regtype::text,to_jsonb(c)::text
 FROM pg_cast c JOIN scope s ON s.classid='pg_cast'::regclass AND s.objid=c.oid
 UNION ALL
 SELECT 'policy',p.polrelid::regclass::text||'.'||p.polname,
  jsonb_build_object('roles',p.polroles,'command',p.polcmd,'permissive',p.polpermissive,
   'using',pg_get_expr(p.polqual,p.polrelid),'check',pg_get_expr(p.polwithcheck,p.polrelid))::text
 FROM pg_policy p JOIN scope s ON s.classid='pg_policy'::regclass AND s.objid=p.oid
 UNION ALL
 SELECT 'opclass',n.nspname||'.'||c.opcname,to_jsonb(c)::text
 FROM pg_opclass c JOIN pg_namespace n ON n.oid=c.opcnamespace JOIN scope s ON s.classid='pg_opclass'::regclass AND s.objid=c.oid
 UNION ALL
 SELECT 'opfamily',n.nspname||'.'||f.opfname,to_jsonb(f)::text
 FROM pg_opfamily f JOIN pg_namespace n ON n.oid=f.opfnamespace JOIN scope s ON s.classid='pg_opfamily'::regclass AND s.objid=f.oid
 UNION ALL
 SELECT 'index_support',p.oid::text,to_jsonb(p)::text
 FROM pg_amproc p JOIN scope s ON s.classid='pg_amproc'::regclass AND s.objid=p.oid
 UNION ALL
 SELECT 'index_operator',o.oid::text,to_jsonb(o)::text
 FROM pg_amop o JOIN scope s ON s.classid='pg_amop'::regclass AND s.objid=o.oid
 UNION ALL
 SELECT 'access_method',a.amname::text,to_jsonb(a)::text
 FROM pg_am a JOIN scope s ON s.classid='pg_am'::regclass AND s.objid=a.oid
 UNION ALL
 SELECT 'extension',e.extname::text,to_jsonb(e)::text
 FROM pg_extension e JOIN scope s ON s.classid='pg_extension'::regclass AND s.objid=e.oid
 UNION ALL
 SELECT 'collation',c.oid::regcollation::text,to_jsonb(c)::text
 FROM pg_collation c JOIN scope s ON s.classid='pg_collation'::regclass AND s.objid=c.oid
$$;
REVOKE ALL ON FUNCTION public.zoho_job_executable_surface() FROM PUBLIC,anon,authenticated,service_role,zoho_discovery;

-- No policy is auto-approved or re-fingerprinted. The changed review format
-- intentionally requires one explicit operator review after this migration.
COMMENT ON FUNCTION public.zoho_job_executable_surface() IS
 'Job-writer dependency review v2. Unrelated application objects are excluded; an existing policy requires explicit re-review after migration.';
COMMIT;
