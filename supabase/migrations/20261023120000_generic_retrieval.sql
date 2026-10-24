-- Consolidated, unapplied RAG setup: generic source-keyed retrieval.
-- Preserve career-rag-v1 metadata and hashes; no vector copies or paid indexing.
BEGIN;
-- Course vectors share the canonical embeddings table with role vectors.
ALTER TABLE public.embeddings DROP CONSTRAINT IF EXISTS chk_entity_type;
ALTER TABLE public.embeddings ADD CONSTRAINT chk_entity_type CHECK (entity_type IN ('role','course'));
CREATE FUNCTION public.rag_invalidate_vector_metadata()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
  -- Existing browser table grants must not let an actor attest model provenance.
  IF current_user IN ('anon','authenticated') THEN
    NEW.metadata:=coalesce(NEW.metadata,'{}'::jsonb)-'career_rag';
    RETURN NEW;
  END IF;
  IF TG_OP='UPDATE' AND NEW.embedding::text IS DISTINCT FROM OLD.embedding::text THEN
      IF NEW.metadata->'career_rag' IS NOT DISTINCT FROM OLD.metadata->'career_rag' THEN
        NEW.metadata:=coalesce(NEW.metadata,'{}'::jsonb)-'career_rag';
      END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER rag_vector_changed BEFORE INSERT OR UPDATE OF embedding,metadata ON public.embeddings
 FOR EACH ROW EXECUTE FUNCTION public.rag_invalidate_vector_metadata();

CREATE FUNCTION public.rag_catalog_document(p_kind text, p_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, extensions, pg_temp AS $$
DECLARE doc jsonb;
BEGIN
  IF p_kind = 'role' THEN
    SELECT jsonb_build_object('id', c.id, 'kind', 'role', 'title', r.name,
      'description', left(coalesce(c.description,''),1600),
      'requirements', left(coalesce(c.direct_degree_mapping,''),400),
      'degree_gate', c.degree_gate::text,
      'activities', left(coalesce(c.typical_work_activities,''),800)) INTO doc
    FROM role_family_roles c JOIN role r ON r.id=c.role_id
    WHERE c.id=p_id AND c.is_active;
  ELSIF p_kind = 'course' THEN
    SELECT jsonb_build_object('id', c.course_id, 'kind', 'course', 'title', c.title,
      'description', left(coalesce(c.description,''),1600), 'outcomes', left(c.target_outcomes::text,800),
      'category', c.category, 'duration', c.duration,
      'classification', c.classification::text) INTO doc
    FROM courses c WHERE c.course_id=p_id AND c.status='Active' AND c.deleted_at IS NULL
      AND c.approval_status='approved' AND c.school_id IS NULL;
  ELSE RAISE EXCEPTION 'Unsupported catalog kind' USING ERRCODE='22023';
  END IF;
  IF doc IS NULL THEN RETURN NULL; END IF;
  RETURN doc || jsonb_build_object('revision', encode(sha256(convert_to(doc::text,'UTF8')),'hex'),
    'text', left(concat_ws('. ',doc->>'title',doc->>'description',doc->>'requirements',
      doc->>'activities',doc->>'outcomes',doc->>'category',doc->>'classification'),6000));
END $$;

CREATE FUNCTION public.rag_catalog_pending(p_kind text, p_after text DEFAULT '', p_limit integer DEFAULT 10)
RETURNS SETOF jsonb LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, extensions, pg_temp AS $$
  WITH candidates AS (
    SELECT 'role:'||r.id AS cursor, 'role' AS kind, r.id, CASE WHEN e.embedding IS NOT NULL THEN e.metadata->'career_rag' END AS meta
      FROM role_family_roles r LEFT JOIN embeddings e ON e.entity_type='role' AND e.entity_id=r.id
      WHERE r.is_active AND coalesce(r.degree_gate::text,'Preferred')<>'Mandatory'
    UNION ALL
    SELECT 'course:'||c.course_id, 'course', c.course_id, CASE WHEN e.embedding IS NOT NULL THEN e.metadata->'career_rag' END
      FROM courses c LEFT JOIN embeddings e ON e.entity_type='course' AND e.entity_id=c.course_id
      WHERE c.status='Active' AND c.deleted_at IS NULL
        AND c.approval_status='approved' AND c.school_id IS NULL AND c.classification IS NULL AND c.university IS NULL
  ), docs AS (
    SELECT cursor, kind, meta, rag_catalog_document(kind,id) AS doc FROM candidates WHERE cursor>coalesce(p_after,'')
  ) SELECT doc || jsonb_build_object('cursor',cursor) FROM docs
    WHERE (p_kind IS NULL OR kind=p_kind) AND doc IS NOT NULL AND (meta IS NULL OR meta->>'revision' IS DISTINCT FROM doc->>'revision'
      OR meta->>'model' IS DISTINCT FROM 'google/gemini-embedding-2-preview'
      OR meta->>'version' IS DISTINCT FROM 'career-rag-v1' OR meta->>'dimensions' IS DISTINCT FROM '1536')
    ORDER BY cursor LIMIT greatest(1,least(coalesce(p_limit,10),25));
$$;

CREATE FUNCTION public.rag_catalog_store(p_kind text, p_id uuid, p_revision text,
  p_embedding extensions.vector, p_model text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions, pg_temp AS $$
DECLARE doc jsonb; meta jsonb;
BEGIN
  IF p_model IS DISTINCT FROM 'google/gemini-embedding-2-preview' OR p_embedding IS NULL
    OR vector_dims(p_embedding)<>1536 OR (p_embedding <#> p_embedding)>=0 THEN
    RAISE EXCEPTION 'Incompatible embedding space' USING ERRCODE='22023';
  END IF;
  IF p_kind='course' THEN
    PERFORM 1 FROM courses WHERE course_id=p_id FOR UPDATE;
  ELSIF p_kind='role' THEN
    PERFORM 1 FROM role_family_roles WHERE id=p_id FOR UPDATE;
    PERFORM 1 FROM role r JOIN role_family_roles c ON c.role_id=r.id WHERE c.id=p_id FOR UPDATE OF r;
  ELSE RAISE EXCEPTION 'Unsupported catalog kind' USING ERRCODE='22023'; END IF;
  doc:=rag_catalog_document(p_kind,p_id);
  IF doc IS NULL OR doc->>'revision' IS DISTINCT FROM p_revision THEN RETURN false; END IF;
  meta:=jsonb_build_object('revision',p_revision,'model',p_model,'dimensions',1536,
    'version','career-rag-v1','indexed_at',now());
    INSERT INTO embeddings(entity_type,entity_id,embedding,metadata)
      VALUES(p_kind,p_id,p_embedding,jsonb_build_object('career_rag',meta))
      ON CONFLICT(entity_type,entity_id) DO UPDATE SET embedding=excluded.embedding,
        metadata=coalesce(embeddings.metadata,'{}'::jsonb)||excluded.metadata,updated_at=now()
      WHERE embeddings.metadata->'career_rag'->>'revision' IS DISTINCT FROM p_revision
        OR embeddings.metadata->'career_rag'->>'model' IS DISTINCT FROM p_model
        OR embeddings.metadata->'career_rag'->>'version' IS DISTINCT FROM 'career-rag-v1'
        OR embeddings.metadata->'career_rag'->>'dimensions' IS DISTINCT FROM '1536'
        OR embeddings.embedding IS NULL;
  RETURN true;
END $$;

CREATE FUNCTION public.rag_catalog_search(p_actor_id uuid, p_kind text,
  p_query extensions.vector, p_query_text text, p_limit integer DEFAULT 3)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, extensions, pg_temp SET statement_timeout='2000ms' AS $$
DECLARE learner public.learners%ROWTYPE; result jsonb; coverage integer; eligible integer;
BEGIN
  IF p_query IS NULL OR vector_dims(p_query)<>1536 OR (p_query <#> p_query)>=0
    OR p_kind NOT IN ('role','course') OR length(p_query_text)>3000 THEN
    RAISE EXCEPTION 'Invalid retrieval query' USING ERRCODE='22023';
  END IF;
  SELECT * INTO learner FROM learners WHERE user_id=p_actor_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Actor is not a learner' USING ERRCODE='42501'; END IF;
  WITH catalog AS (
    SELECT r.id, e.embedding, e.metadata->'career_rag' AS meta, rag_catalog_document('role',r.id) AS doc
      FROM role_family_roles r LEFT JOIN embeddings e ON e.entity_type='role' AND e.entity_id=r.id
      WHERE p_kind='role' AND r.is_active AND coalesce(r.degree_gate::text,'Preferred')<>'Mandatory'
    UNION ALL
    SELECT c.course_id,e.embedding,e.metadata->'career_rag',rag_catalog_document('course',c.course_id)
      FROM courses c LEFT JOIN embeddings e ON e.entity_type='course' AND e.entity_id=c.course_id
      WHERE p_kind='course' AND c.status='Active' AND c.deleted_at IS NULL
        AND c.approval_status='approved' AND c.school_id IS NULL
        -- Initial catalog scope is general courses; no guessed grade/institution access.
        AND c.classification IS NULL AND c.university IS NULL
  ), compatible AS (
    SELECT * FROM catalog WHERE embedding IS NOT NULL AND doc IS NOT NULL
      AND meta->>'model'='google/gemini-embedding-2-preview'
      AND meta->>'version'='career-rag-v1' AND meta->>'dimensions'='1536'
      AND meta->>'revision'=doc->>'revision'
  ), ranked AS (
    SELECT doc,meta,1-(embedding <=> p_query) AS similarity,
      (0.85*(1-(embedding <=> p_query)) + 0.15*least(1.0,
        ts_rank(to_tsvector('english',doc->>'text'),plainto_tsquery('english',left(p_query_text,3000))))) AS score
      FROM compatible
  ), best AS (
    SELECT doc,meta,similarity,score FROM ranked WHERE similarity>=0.25
      ORDER BY score DESC,doc->>'id' LIMIT greatest(1,least(coalesce(p_limit,3),3))
  ) SELECT (SELECT count(*) FROM catalog),(SELECT count(*) FROM compatible),coalesce(jsonb_agg(
      (doc-'text')||jsonb_build_object('similarity',similarity,'retrieval_score',score,
        'model',meta->>'model','index_version',meta->>'version','indexed_at',meta->>'indexed_at')),'[]'::jsonb)
    INTO eligible,coverage,result FROM best;
  RETURN jsonb_build_object('status',CASE WHEN coverage<eligible THEN 'index_unavailable'
    WHEN jsonb_array_length(result)=0 THEN 'no_matches' ELSE 'matches' END,'items',result);
END $$;

CREATE FUNCTION public.rag_catalog_verify(p_actor_id uuid,p_pins jsonb)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path=public,extensions,pg_temp SET statement_timeout='2000ms' AS $$
DECLARE pin jsonb; doc jsonb; meta jsonb;
BEGIN
  IF NOT EXISTS(SELECT 1 FROM learners WHERE user_id=p_actor_id) THEN RETURN false; END IF;
  IF p_pins IS NULL OR jsonb_typeof(p_pins)<>'array' OR jsonb_array_length(p_pins)>6 THEN RETURN false; END IF;
  FOR pin IN SELECT value FROM jsonb_array_elements(p_pins) LOOP
    doc:=rag_catalog_document(pin->>'kind',(pin->>'id')::uuid);
    IF doc IS NULL OR doc->>'revision' IS DISTINCT FROM pin->>'revision' THEN RETURN false; END IF;
    meta:=NULL;
    IF pin->>'kind'='role' THEN
      IF doc->>'degree_gate'='Mandatory' THEN RETURN false; END IF;
      SELECT metadata->'career_rag' INTO meta FROM embeddings WHERE entity_type='role' AND entity_id=(pin->>'id')::uuid AND embedding IS NOT NULL;
    ELSIF pin->>'kind'='course' THEN
      SELECT e.metadata->'career_rag' INTO meta FROM embeddings e JOIN courses c ON c.course_id=e.entity_id
        WHERE e.entity_type='course' AND c.course_id=(pin->>'id')::uuid
        AND c.classification IS NULL AND c.university IS NULL AND e.embedding IS NOT NULL;
    ELSE RETURN false; END IF;
    IF meta IS NULL OR meta->>'revision' IS DISTINCT FROM pin->>'revision'
      OR meta->>'model' IS DISTINCT FROM 'google/gemini-embedding-2-preview'
      OR meta->>'version' IS DISTINCT FROM 'career-rag-v1' OR meta->>'dimensions' IS DISTINCT FROM '1536' THEN RETURN false; END IF;
  END LOOP;
  RETURN true;
END $$;


CREATE FUNCTION public.rag_source_kind(p_source text) RETURNS text
LANGUAGE plpgsql IMMUTABLE SET search_path=public,pg_temp AS $$
BEGIN
 CASE p_source WHEN 'catalog.roles' THEN RETURN 'role'; WHEN 'catalog.courses' THEN RETURN 'course';
 ELSE RAISE EXCEPTION 'Unknown retrieval source' USING ERRCODE='22023'; END CASE;
END $$;
CREATE FUNCTION public.rag_document(p_source text,p_id uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
 SELECT rag_catalog_document(rag_source_kind(p_source),p_id);
$$;
CREATE FUNCTION public.rag_pending(p_source text,p_after text DEFAULT '',p_limit integer DEFAULT 10) RETURNS SETOF jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
 SELECT * FROM rag_catalog_pending(rag_source_kind(p_source),p_after,p_limit);
$$;
CREATE FUNCTION public.rag_store(p_source text,p_id uuid,p_revision text,p_embedding extensions.vector,p_model text) RETURNS boolean
LANGUAGE sql SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
 SELECT rag_catalog_store(rag_source_kind(p_source),p_id,p_revision,p_embedding,p_model);
$$;
-- Only trusted app service callers can supply actor scope. These initial public catalog
-- adapters require a current learner; other actor/source policies need explicit adapters.
CREATE FUNCTION public.rag_search(p_actor_id uuid,p_source text,p_query extensions.vector,p_query_text text,p_limit integer DEFAULT 3) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,extensions,pg_temp SET statement_timeout='2000ms' AS $$
 SELECT rag_catalog_search(p_actor_id,rag_source_kind(p_source),p_query,p_query_text,p_limit);
$$;
CREATE FUNCTION public.rag_verify(p_actor_id uuid,p_references jsonb) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
DECLARE ref jsonb; pins jsonb:='[]'::jsonb;
BEGIN
 IF p_references IS NULL OR jsonb_typeof(p_references)<>'array' OR jsonb_array_length(p_references)>6 THEN RETURN false; END IF;
 FOR ref IN SELECT value FROM jsonb_array_elements(p_references) LOOP
  IF jsonb_typeof(ref)<>'object' OR ref->>'sourceKey' IS NULL OR ref->>'id' IS NULL OR ref->>'revision' IS NULL THEN RETURN false; END IF;
  pins:=pins||jsonb_build_array(jsonb_build_object('kind',rag_source_kind(ref->>'sourceKey'),'id',ref->>'id','revision',ref->>'revision'));
 END LOOP;
 RETURN rag_catalog_verify(p_actor_id,pins);
END $$;
-- Internal static catalog implementation is private; no dynamic table/SQL dispatch.
REVOKE ALL ON FUNCTION rag_source_kind(text),rag_catalog_document(text,uuid),rag_catalog_pending(text,text,integer),rag_catalog_store(text,uuid,text,extensions.vector,text),rag_catalog_search(uuid,text,extensions.vector,text,integer),rag_catalog_verify(uuid,jsonb),rag_invalidate_vector_metadata() FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION rag_document(text,uuid),rag_pending(text,text,integer),rag_store(text,uuid,text,extensions.vector,text),rag_search(uuid,text,extensions.vector,text,integer),rag_verify(uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION rag_document(text,uuid),rag_pending(text,text,integer),rag_store(text,uuid,text,extensions.vector,text),rag_search(uuid,text,extensions.vector,text,integer),rag_verify(uuid,jsonb) TO service_role;

COMMIT;
