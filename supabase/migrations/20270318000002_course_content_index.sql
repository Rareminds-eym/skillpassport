BEGIN;
CREATE TYPE public.course_resource_status AS ENUM ('queued','extracting','embedding','ready','failed');

-- Service-role-only operations: callers supply the authenticated user, never a browser-selected identity.
CREATE FUNCTION public.can_access_course_ai(p_user_id uuid,p_course_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public,pg_temp AS $$
 SELECT EXISTS(SELECT 1 FROM courses c WHERE c.course_id=p_course_id AND c.deleted_at IS NULL AND (
   EXISTS(SELECT 1 FROM course_enrollments e WHERE e.course_id=c.course_id AND e.learner_id=p_user_id AND e.status IN ('active','completed'))
   OR c.educator_id=p_user_id
   OR EXISTS(SELECT 1 FROM school_educators se WHERE se.id=c.educator_id AND se.user_id=p_user_id AND se.account_status='active')
   OR EXISTS(SELECT 1 FROM course_enrollments e WHERE e.course_id=c.course_id AND e.educator_id=p_user_id AND e.status='active')
   OR (c.status='Active' AND EXISTS(SELECT 1 FROM users u JOIN organization_members om ON om.user_id=u.id AND om.status='active'
    WHERE u.id=p_user_id AND u.role IN ('educator','school_educator','college_educator') AND (c.school_id IS NULL OR c.school_id=om.organization_id)
    AND (EXISTS(SELECT 1 FROM school_educators se WHERE se.user_id=u.id AND se.school_id=om.organization_id AND se.account_status='active')
     OR EXISTS(SELECT 1 FROM college_lecturers cl WHERE cl.user_id=u.id AND cl."collegeId"=om.organization_id AND cl."accountStatus"='active')
     OR EXISTS(SELECT 1 FROM organization_staff os WHERE os.user_id=u.id AND os.organization_id=om.organization_id AND os.account_status='active'))))
 ));
$$;

CREATE TABLE public.course_resource_analysis (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 course_id uuid NOT NULL REFERENCES public.courses(course_id) ON DELETE CASCADE,
 lesson_id uuid NOT NULL REFERENCES public.lessons(lesson_id) ON DELETE CASCADE,
 resource_id uuid REFERENCES public.lesson_resources(resource_id) ON DELETE CASCADE,
 source_key text NOT NULL,
 source_fingerprint text NOT NULL,
 content_hash text,
 version integer NOT NULL CHECK(version>0),
 pipeline_version text NOT NULL,
 status public.course_resource_status NOT NULL DEFAULT 'queued',
 is_current boolean NOT NULL DEFAULT false,
 extracted_text text,
 summary text,
 source_metadata jsonb NOT NULL DEFAULT '{}',
 embedding_model text NOT NULL,
 embedding_dimensions integer NOT NULL DEFAULT 1536 CHECK(embedding_dimensions=1536),
 attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count>=0),
 next_retry_at timestamptz,
 locked_until timestamptz,
 lease_token uuid,
 error_message text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(source_key,version),
 CHECK(NOT is_current OR status='ready'),
 CHECK(source_key=CASE WHEN resource_id IS NULL THEN 'lesson:'||lesson_id::text ELSE 'resource:'||resource_id::text END)
);
CREATE UNIQUE INDEX course_analysis_current_idx ON public.course_resource_analysis(source_key) WHERE is_current;
CREATE INDEX course_analysis_scope_idx ON public.course_resource_analysis(course_id,lesson_id) WHERE is_current;
CREATE INDEX course_analysis_work_idx ON public.course_resource_analysis(status,next_retry_at);
CREATE TABLE public.course_content_chunks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 analysis_id uuid NOT NULL REFERENCES public.course_resource_analysis(id) ON DELETE CASCADE,
 chunk_index integer NOT NULL CHECK(chunk_index>=0),
 content text NOT NULL CHECK(length(content) BETWEEN 1 AND 6000),
 embedding extensions.vector(1536) NOT NULL,
 token_count integer NOT NULL CHECK(token_count>0),
 source_location jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(analysis_id,chunk_index)
);
CREATE INDEX course_chunks_analysis_idx ON public.course_content_chunks(analysis_id);
-- Exact course-scoped ranking is intentional initially: avoids filtered ANN under-return.
ALTER TABLE public.course_resource_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_content_chunks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.course_resource_analysis,public.course_content_chunks FROM anon,authenticated;
GRANT ALL ON public.course_resource_analysis,public.course_content_chunks TO service_role;

CREATE FUNCTION public.enqueue_course_source(p_user_id uuid,p_course_id uuid,p_lesson_id uuid,p_resource_id uuid,
 p_fingerprint text,p_model text,p_pipeline text,p_force boolean DEFAULT false) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE k text; existing course_resource_analysis; result uuid; v integer;
BEGIN
 IF p_user_id IS NOT NULL AND NOT can_access_course_ai(p_user_id,p_course_id) THEN RAISE EXCEPTION 'Course access denied'; END IF;
 IF NOT EXISTS(SELECT 1 FROM lessons l JOIN course_modules m ON m.module_id=l.module_id WHERE l.lesson_id=p_lesson_id AND m.course_id=p_course_id)
 OR (p_resource_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM lesson_resources WHERE resource_id=p_resource_id AND lesson_id=p_lesson_id)) THEN RAISE EXCEPTION 'Source outside course'; END IF;
 k:=CASE WHEN p_resource_id IS NULL THEN 'lesson:'||p_lesson_id ELSE 'resource:'||p_resource_id END;
 PERFORM pg_advisory_xact_lock(hashtextextended(k,0));
 SELECT * INTO existing FROM course_resource_analysis WHERE source_key=k ORDER BY version DESC LIMIT 1;
 IF FOUND AND existing.source_fingerprint=p_fingerprint AND existing.embedding_model=p_model AND existing.pipeline_version=p_pipeline
 AND (NOT p_force OR existing.status IN ('queued','extracting','embedding')) THEN RETURN existing.id; END IF;
 v:=COALESCE(existing.version,0)+1;
 -- Invalidate old content immediately if its source changed. Manual refresh keeps old ready evidence until activation.
 IF existing.source_fingerprint IS DISTINCT FROM p_fingerprint THEN UPDATE course_resource_analysis SET is_current=false WHERE source_key=k; END IF;
 INSERT INTO course_resource_analysis(course_id,lesson_id,resource_id,source_key,source_fingerprint,version,pipeline_version,embedding_model)
 VALUES(p_course_id,p_lesson_id,p_resource_id,k,p_fingerprint,v,p_pipeline,p_model) RETURNING id INTO result;
 RETURN result;
END $$;

CREATE FUNCTION public.claim_course_source(p_course_id uuid DEFAULT NULL) RETURNS SETOF public.course_resource_analysis
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE chosen uuid;
BEGIN
 SELECT a.id INTO chosen FROM course_resource_analysis a
 WHERE (p_course_id IS NULL OR a.course_id=p_course_id) AND ((a.status IN ('queued','failed') AND (a.next_retry_at IS NULL OR a.next_retry_at<=now()))
 OR (a.status IN ('extracting','embedding') AND a.locked_until<now())) AND a.attempt_count<4
 AND NOT EXISTS(SELECT 1 FROM course_resource_analysis newer WHERE newer.source_key=a.source_key AND newer.version>a.version)
 ORDER BY a.created_at FOR UPDATE SKIP LOCKED LIMIT 1;
 IF chosen IS NULL THEN RETURN; END IF;
 RETURN QUERY UPDATE course_resource_analysis SET status='extracting',attempt_count=attempt_count+1,
 lease_token=gen_random_uuid(),locked_until=now()+interval '10 minutes',updated_at=now(),error_message=NULL WHERE id=chosen RETURNING *;
END $$;

CREATE FUNCTION public.finish_course_source(p_id uuid,p_lease uuid,p_text text,p_hash text,p_metadata jsonb,p_chunks jsonb) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE source course_resource_analysis; item jsonb;
BEGIN
 SELECT * INTO source FROM course_resource_analysis WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR source.lease_token IS DISTINCT FROM p_lease OR source.locked_until<=now() OR source.status NOT IN ('extracting','embedding') THEN RETURN false; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(source.source_key,0));
 IF EXISTS(SELECT 1 FROM course_resource_analysis WHERE source_key=source.source_key AND version>source.version) THEN RETURN false; END IF;
 IF jsonb_array_length(p_chunks) NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'Invalid chunk count'; END IF;
 DELETE FROM course_content_chunks WHERE analysis_id=p_id;
 FOR item IN SELECT value FROM jsonb_array_elements(p_chunks) LOOP
 INSERT INTO course_content_chunks(analysis_id,chunk_index,content,embedding,token_count,source_location)
 VALUES(p_id,(item->>'chunk_index')::integer,item->>'content',(item->>'embedding')::extensions.vector(1536),
 (item->>'token_count')::integer,COALESCE(item->'source_location','{}'));
 END LOOP;
 UPDATE course_resource_analysis SET is_current=false WHERE source_key=source.source_key AND is_current;
 UPDATE course_resource_analysis SET status='ready',is_current=true,extracted_text=p_text,content_hash=p_hash,source_metadata=p_metadata,
 locked_until=NULL,lease_token=NULL,updated_at=now() WHERE id=p_id;
 RETURN true;
END $$;

CREATE FUNCTION public.search_course_chunks(p_user_id uuid,p_course_id uuid,p_embedding extensions.vector(1536),p_lessons uuid[] DEFAULT NULL,p_limit integer DEFAULT 12)
RETURNS TABLE(chunk_id uuid,analysis_id uuid,lesson_id uuid,resource_id uuid,content text,source_location jsonb,similarity double precision)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public,extensions,pg_temp AS $$
BEGIN
 IF NOT can_access_course_ai(p_user_id,p_course_id) THEN RAISE EXCEPTION 'Course access denied'; END IF;
 RETURN QUERY SELECT ch.id,a.id,a.lesson_id,a.resource_id,ch.content,ch.source_location,(1-(ch.embedding <=> p_embedding))::double precision
 FROM course_content_chunks ch JOIN course_resource_analysis a ON a.id=ch.analysis_id
 JOIN lessons l ON l.lesson_id=a.lesson_id JOIN course_modules m ON m.module_id=l.module_id
 WHERE a.course_id=p_course_id AND m.course_id=p_course_id AND a.is_current AND a.status='ready'
 AND (a.resource_id IS NULL OR EXISTS(SELECT 1 FROM lesson_resources r WHERE r.resource_id=a.resource_id AND r.lesson_id=a.lesson_id))
 AND (p_lessons IS NULL OR a.lesson_id=ANY(p_lessons))
 ORDER BY ch.embedding <=> p_embedding LIMIT LEAST(GREATEST(p_limit,1),40);
END $$;
REVOKE ALL ON FUNCTION public.can_access_course_ai(uuid,uuid),public.enqueue_course_source(uuid,uuid,uuid,uuid,text,text,text,boolean),public.claim_course_source(uuid),public.finish_course_source(uuid,uuid,text,text,jsonb,jsonb),public.search_course_chunks(uuid,uuid,extensions.vector,uuid[],integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_course_ai(uuid,uuid),public.enqueue_course_source(uuid,uuid,uuid,uuid,text,text,text,boolean),public.claim_course_source(uuid),public.finish_course_source(uuid,uuid,text,text,jsonb,jsonb),public.search_course_chunks(uuid,uuid,extensions.vector,uuid[],integer) TO service_role;

-- Source changes invalidate old evidence. Rerun the local course index script to replace it.
CREATE FUNCTION public.queue_changed_course_ai_source() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE l uuid; r uuid; c uuid; k text;
BEGIN
 IF TG_OP='DELETE' THEN l:=OLD.lesson_id; ELSE l:=NEW.lesson_id; END IF;
 IF TG_TABLE_NAME='lesson_resources' THEN
   r:=NEW.resource_id;
   IF TG_OP='UPDATE' AND NEW.url=OLD.url AND NEW.name=OLD.name AND NEW.type=OLD.type AND NEW.lesson_id=OLD.lesson_id
    AND (NEW.content IS NOT DISTINCT FROM OLD.content OR COALESCE(NEW.content,'') LIKE '[COURSE_RESOURCE_ANALYSIS_%') THEN RETURN NEW; END IF;
 ELSIF TG_TABLE_NAME='video_summaries' THEN
   IF TG_OP='UPDATE' AND NEW.transcript IS NOT DISTINCT FROM OLD.transcript AND NEW.summary IS NOT DISTINCT FROM OLD.summary AND NEW.processing_status IS NOT DISTINCT FROM OLD.processing_status THEN RETURN NEW; END IF;
 ELSE
   IF TG_OP='UPDATE' AND NEW.content IS NOT DISTINCT FROM OLD.content AND NEW.module_id=OLD.module_id THEN RETURN NEW; END IF;
 END IF;
 SELECT m.course_id INTO c FROM lessons lesson JOIN course_modules m ON m.module_id=lesson.module_id WHERE lesson.lesson_id=l;
 IF c IS NULL THEN RETURN NEW; END IF;
 k:=CASE WHEN r IS NULL THEN 'lesson:'||l::text ELSE 'resource:'||r::text END;
 PERFORM pg_advisory_xact_lock(hashtextextended(k,0));
 UPDATE course_resource_analysis SET is_current=false,lease_token=NULL,locked_until=NULL,status=CASE WHEN status IN ('extracting','embedding','queued') THEN 'failed'::course_resource_status ELSE status END WHERE source_key=k;
 -- Local imports create replacement versions. No scheduler or automatic jobs are required.
 RETURN NEW;
END $$;
CREATE TRIGGER lesson_ai_index_change AFTER INSERT OR UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.queue_changed_course_ai_source();
CREATE TRIGGER resource_ai_index_change AFTER INSERT OR UPDATE ON public.lesson_resources FOR EACH ROW EXECUTE FUNCTION public.queue_changed_course_ai_source();
CREATE TRIGGER video_ai_index_change AFTER INSERT OR UPDATE OR DELETE ON public.video_summaries FOR EACH ROW EXECUTE FUNCTION public.queue_changed_course_ai_source();
REVOKE ALL ON FUNCTION public.queue_changed_course_ai_source() FROM PUBLIC,anon,authenticated;
COMMIT;
