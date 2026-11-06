BEGIN;
DO $$
DECLARE
  c uuid := 'dd000001-0000-4000-8000-000000000001';
  lesson uuid := 'dd000001-0000-4000-8000-000000000003';
  before_progress bigint; after_progress bigint; before_content text; payload jsonb; first_resource uuid; old_order integer;
BEGIN
  SELECT count(*) INTO before_progress FROM learner_course_progress WHERE lesson_id=lesson;
  IF before_progress = 0 THEN RAISE EXCEPTION 'Test requires existing demo progress'; END IF;
  SELECT content INTO before_content FROM lessons WHERE lesson_id=lesson;
  SELECT resource_id, order_index INTO first_resource, old_order FROM lesson_resources WHERE lesson_id=lesson ORDER BY order_index LIMIT 1;
  SELECT jsonb_agg(jsonb_build_object('id',m.module_id,'title',m.title,'description',m.description,'order',m.order_index,'skillTags',m.skill_tags,'activities',m.activities,'lessons',
    COALESCE((SELECT jsonb_agg(jsonb_build_object('id',l.lesson_id,'title',l.title,'description',l.description,'content',l.content,'duration',l.duration,'order',l.order_index,'resources',
      COALESCE((SELECT jsonb_agg(jsonb_build_object('id',r.resource_id,'name',r.name,'type',r.type,'url',r.url,'size',r.file_size,'order',r.order_index,'thumbnailUrl',r.thumbnail_url,'embedUrl',r.embed_url) ORDER BY r.order_index) FROM lesson_resources r WHERE r.lesson_id=l.lesson_id),'[]'::jsonb)) ORDER BY l.order_index) FROM lessons l WHERE l.module_id=m.module_id),'[]'::jsonb)) ORDER BY m.order_index)
  INTO payload FROM course_modules m WHERE m.course_id=c;
  PERFORM sync_course_hierarchy(c,payload);
  SELECT count(*) INTO after_progress FROM learner_course_progress WHERE lesson_id=lesson;
  IF before_progress <> after_progress OR NOT EXISTS (SELECT 1 FROM lessons WHERE lesson_id=lesson AND content IS NOT DISTINCT FROM before_content) THEN
    RAISE EXCEPTION 'Lesson or learner progress was not preserved';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM lesson_resources WHERE resource_id=first_resource AND order_index=old_order) THEN
    RAISE EXCEPTION 'Resource identity or order was not preserved';
  END IF;
  payload := jsonb_set(payload, '{0,lessons,0,resources,0,order}', '8'::jsonb);
  payload := jsonb_set(payload, '{0,lessons,0,title}', to_jsonb('Test edited title'::text));
  PERFORM sync_course_hierarchy(c,payload);
  IF NOT EXISTS (SELECT 1 FROM lessons WHERE lesson_id=lesson AND title='Test edited title') OR
     NOT EXISTS (SELECT 1 FROM lesson_resources WHERE resource_id=first_resource AND order_index=8) OR
     (SELECT count(*) FROM learner_course_progress WHERE lesson_id=lesson) <> before_progress THEN
    RAISE EXCEPTION 'Edited title or order was not saved while preserving progress';
  END IF;
  -- A resource from another lesson must fail and roll back all changes.
  BEGIN
    PERFORM sync_course_hierarchy(c, jsonb_set(payload, '{0,lessons,0,resources,0,id}', to_jsonb('00000000-0000-4000-8000-000000000000'::text)));
    RAISE EXCEPTION 'Invalid resource unexpectedly accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM = 'Invalid resource unexpectedly accepted' THEN RAISE; END IF;
  END;
  IF NOT EXISTS (SELECT 1 FROM lesson_resources WHERE resource_id=first_resource) THEN RAISE EXCEPTION 'Failed edit removed existing resource'; END IF;
  RAISE NOTICE 'Lesson content, IDs, and % progress records preserved', after_progress;
END $$;
ROLLBACK;
