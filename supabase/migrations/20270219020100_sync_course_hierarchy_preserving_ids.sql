-- Synchronize a course hierarchy in one transaction while preserving existing IDs.
-- Only the service role may invoke this function; the dashboard checks admin access.
CREATE OR REPLACE FUNCTION public.sync_course_hierarchy(p_course_id uuid, p_modules jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  m jsonb; l jsonb; r jsonb;
  mid uuid; lid uuid; rid uuid;
  module_ids uuid[] := '{}'; lesson_ids uuid[]; resource_ids uuid[];
  raw_id text;
  idx integer;
BEGIN
  IF jsonb_typeof(p_modules) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'modules must be an array';
  END IF;
  PERFORM 1 FROM courses WHERE course_id = p_course_id AND deleted_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Course not found'; END IF;

  FOR m IN SELECT value FROM jsonb_array_elements(p_modules) LOOP
    raw_id := m->>'id';
    mid := NULL;
    IF raw_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
      mid := raw_id::uuid;
      UPDATE course_modules SET title=m->>'title', description=COALESCE(m->>'description',''),
        order_index=COALESCE((m->>'order')::integer,(m->>'orderIndex')::integer,0),
        skill_tags=COALESCE(m->'skillTags','[]'::jsonb), activities=COALESCE(m->'activities','[]'::jsonb)
      WHERE module_id=mid AND course_id=p_course_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'Module does not belong to course'; END IF;
    ELSE
      INSERT INTO course_modules(course_id,title,description,order_index,skill_tags,activities)
      VALUES(p_course_id,m->>'title',COALESCE(m->>'description',''),COALESCE((m->>'order')::integer,(m->>'orderIndex')::integer,0),COALESCE(m->'skillTags','[]'::jsonb),COALESCE(m->'activities','[]'::jsonb)) RETURNING module_id INTO mid;
    END IF;
    IF mid = ANY(module_ids) THEN RAISE EXCEPTION 'Duplicate module'; END IF;
    module_ids := array_append(module_ids,mid);
    lesson_ids := '{}';
    FOR l IN SELECT value FROM jsonb_array_elements(COALESCE(m->'lessons','[]'::jsonb)) LOOP
      raw_id := l->>'id'; lid := NULL;
      IF raw_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        lid := raw_id::uuid;
        UPDATE lessons SET title=l->>'title',description=COALESCE(l->>'description',''),content=COALESCE(l->>'content',''),duration=COALESCE(l->>'duration',''),order_index=COALESCE((l->>'order')::integer,(l->>'orderIndex')::integer,0)
        WHERE lesson_id=lid AND module_id=mid;
        IF NOT FOUND THEN RAISE EXCEPTION 'Lesson does not belong to module'; END IF;
      ELSE
        INSERT INTO lessons(module_id,title,description,content,duration,order_index)
        VALUES(mid,l->>'title',COALESCE(l->>'description',''),COALESCE(l->>'content',''),COALESCE(l->>'duration',''),COALESCE((l->>'order')::integer,(l->>'orderIndex')::integer,0)) RETURNING lesson_id INTO lid;
      END IF;
      IF lid = ANY(lesson_ids) THEN RAISE EXCEPTION 'Duplicate lesson'; END IF;
      lesson_ids := array_append(lesson_ids,lid);
      resource_ids := '{}'; idx := 0;
      FOR r IN SELECT value FROM jsonb_array_elements(COALESCE(l->'resources','[]'::jsonb)) LOOP
        raw_id := r->>'id'; rid := NULL;
        IF raw_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
          rid := raw_id::uuid;
          UPDATE lesson_resources SET name=r->>'name',type=r->>'type',content=CASE WHEN url IS DISTINCT FROM r->>'url' THEN NULL ELSE content END,url=r->>'url',file_size=COALESCE(r->>'size',r->>'fileSize'),thumbnail_url=COALESCE(r->>'thumbnailUrl',r->>'thumbnail_url'),embed_url=COALESCE(r->>'embedUrl',r->>'embed_url'),order_index=COALESCE((r->>'order')::integer,(r->>'orderIndex')::integer,idx)
          WHERE resource_id=rid AND lesson_id=lid;
          IF NOT FOUND THEN RAISE EXCEPTION 'Resource does not belong to lesson'; END IF;
        ELSE
          INSERT INTO lesson_resources(lesson_id,name,type,url,file_size,thumbnail_url,embed_url,order_index)
          VALUES(lid,r->>'name',r->>'type',r->>'url',COALESCE(r->>'size',r->>'fileSize'),COALESCE(r->>'thumbnailUrl',r->>'thumbnail_url'),COALESCE(r->>'embedUrl',r->>'embed_url'),COALESCE((r->>'order')::integer,(r->>'orderIndex')::integer,idx)) RETURNING resource_id INTO rid;
        END IF;
        IF rid = ANY(resource_ids) THEN RAISE EXCEPTION 'Duplicate resource'; END IF;
        resource_ids := array_append(resource_ids,rid); idx := idx + 1;
      END LOOP;
      DELETE FROM lesson_resources WHERE lesson_id=lid AND NOT (resource_id=ANY(resource_ids));
    END LOOP;
    DELETE FROM lessons WHERE module_id=mid AND NOT (lesson_id=ANY(lesson_ids));
  END LOOP;
  DELETE FROM course_modules WHERE course_id=p_course_id AND NOT (module_id=ANY(module_ids));
END;
$$;
REVOKE ALL ON FUNCTION public.sync_course_hierarchy(uuid,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_course_hierarchy(uuid,jsonb) TO service_role;

