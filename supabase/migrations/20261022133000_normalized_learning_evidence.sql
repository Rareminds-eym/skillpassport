-- Existing standalone evidence stays unchanged. No historical conversion.
BEGIN;
SET LOCAL lock_timeout='5s';
ALTER TABLE public.learning_equivalencies
 ADD COLUMN evidence_format smallint NOT NULL DEFAULT 1 CHECK(evidence_format IN (1,2)),
 ADD COLUMN training_id uuid REFERENCES public.trainings(id) ON DELETE RESTRICT,
 ADD COLUMN certificate_id uuid REFERENCES public.certificates(id) ON DELETE RESTRICT,
 ADD COLUMN experience_id uuid REFERENCES public.experience(id) ON DELETE RESTRICT,
 ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE RESTRICT,
 ADD COLUMN source_revision bigint CHECK(source_revision>0),
 ADD COLUMN assessed_evidence jsonb,
 ALTER COLUMN title DROP NOT NULL,ALTER COLUMN evidence_url DROP NOT NULL,ALTER COLUMN description DROP NOT NULL;
ALTER TABLE public.learning_equivalencies ADD CONSTRAINT learning_evidence_source_shape CHECK(
 (evidence_format=1 AND num_nonnulls(training_id,certificate_id,experience_id,project_id)=0 AND assessed_evidence IS NULL AND source_revision IS NULL)
 OR (evidence_format=2 AND num_nonnulls(training_id,certificate_id,experience_id,project_id)=1 AND source_revision IS NOT NULL
 AND title IS NULL AND evidence_url IS NULL AND description IS NULL AND evidence_content IS NULL
 AND assessed_evidence IS NOT NULL AND jsonb_typeof(assessed_evidence)='object'
 AND assessed_evidence ?& ARRAY['schemaVersion','title','content']
 AND jsonb_typeof(assessed_evidence->'title')='string' AND jsonb_typeof(assessed_evidence->'content')='string'
 AND assessed_evidence->>'schemaVersion'='1'
 AND length(assessed_evidence->>'title') BETWEEN 1 AND 200
 AND length(assessed_evidence->>'content') BETWEEN 1 AND 10000
 AND ((training_id IS NOT NULL AND evidence_type='course') OR (certificate_id IS NOT NULL AND evidence_type='certification') OR ((experience_id IS NOT NULL OR project_id IS NOT NULL) AND evidence_type='work'))));
CREATE INDEX learning_equivalencies_training_id ON public.learning_equivalencies(training_id) WHERE training_id IS NOT NULL;
ALTER TABLE public.trainings ADD COLUMN learning_evidence_revision bigint NOT NULL DEFAULT 1 CHECK(learning_evidence_revision>0);
CREATE INDEX learning_equivalencies_certificate_id ON public.learning_equivalencies(certificate_id) WHERE certificate_id IS NOT NULL;
ALTER TABLE public.certificates ADD COLUMN learning_evidence_revision bigint NOT NULL DEFAULT 1 CHECK(learning_evidence_revision>0);
CREATE INDEX learning_equivalencies_experience_id ON public.learning_equivalencies(experience_id) WHERE experience_id IS NOT NULL;
ALTER TABLE public.experience ADD COLUMN learning_evidence_revision bigint NOT NULL DEFAULT 1 CHECK(learning_evidence_revision>0);
CREATE INDEX learning_equivalencies_project_id ON public.learning_equivalencies(project_id) WHERE project_id IS NOT NULL;
ALTER TABLE public.projects ADD COLUMN learning_evidence_revision bigint NOT NULL DEFAULT 1 CHECK(learning_evidence_revision>0);
-- Audit provenance is queryable, typed state, not a metadata payload.
ALTER TABLE public.learning_equivalency_audit ADD COLUMN evaluation_type text CHECK(evaluation_type IN ('human','ai')),
 ADD COLUMN evaluation_model text,ADD COLUMN evaluation_score integer CHECK(evaluation_score BETWEEN 0 AND 100),
 ADD COLUMN source_revision bigint CHECK(source_revision>0);
CREATE FUNCTION public.capture_learning_audit_provenance() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
 SELECT e.evaluation_type,e.evaluation_model,e.evaluation_score,e.source_revision
 INTO NEW.evaluation_type,NEW.evaluation_model,NEW.evaluation_score,NEW.source_revision
 FROM public.learning_equivalencies e WHERE e.id=NEW.equivalency_id;
 RETURN NEW;
END $$;
CREATE TRIGGER capture_learning_audit_provenance BEFORE INSERT ON public.learning_equivalency_audit FOR EACH ROW EXECUTE FUNCTION public.capture_learning_audit_provenance();
REVOKE ALL ON FUNCTION public.capture_learning_audit_provenance() FROM PUBLIC,anon,authenticated;
-- Read and lock the assessed source before the equivalency row. All review,
-- claim, submission and application paths use the same source-first lock order.
CREATE FUNCTION public.read_learning_evidence_source(p_kind text,p_id uuid,p_learner uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE source jsonb; label text; link text; content text;
BEGIN
 CASE p_kind
 WHEN 'training' THEN SELECT jsonb_build_object('title',t.title,'description',t.description,'enabled',t.enabled,'learning_evidence_revision',t.learning_evidence_revision) INTO source FROM public.trainings t WHERE id=p_id AND learner_id=p_learner FOR SHARE;
 WHEN 'certificate' THEN SELECT jsonb_build_object('title',t.title,'link',t.link,'document_url',t.document_url,'expiry_date',t.expiry_date,'description',t.description,'enabled',t.enabled,'learning_evidence_revision',t.learning_evidence_revision) INTO source FROM public.certificates t WHERE id=p_id AND learner_id=p_learner FOR SHARE;
 WHEN 'experience' THEN SELECT jsonb_build_object('role',t.role,'organization',t.organization,'description',t.description,'enabled',t.enabled,'learning_evidence_revision',t.learning_evidence_revision) INTO source FROM public.experience t WHERE id=p_id AND learner_id=p_learner FOR SHARE;
 WHEN 'project' THEN SELECT jsonb_build_object('title',t.title,'demo_link',t.demo_link,'github_link',t.github_link,'description',t.description,'enabled',t.enabled,'learning_evidence_revision',t.learning_evidence_revision) INTO source FROM public.projects t WHERE id=p_id AND learner_id=p_learner FOR SHARE;
 ELSE RAISE EXCEPTION 'INVALID_EVIDENCE_SOURCE' USING ERRCODE='22023';
 END CASE;
 IF source IS NULL OR source->>'enabled'='false' OR (p_kind='certificate' AND nullif(source->>'expiry_date','')::date<current_date) THEN
  RAISE EXCEPTION 'EVIDENCE_SOURCE_UNAVAILABLE' USING ERRCODE='42501';
 END IF;
 label:=CASE WHEN p_kind='experience' THEN concat_ws(' at ',source->>'role',source->>'organization') ELSE source->>'title' END;
 content:=trim(coalesce(source->>'description',''));
 IF length(trim(coalesce(label,''))) NOT BETWEEN 1 AND 200 OR length(content) NOT BETWEEN 1 AND 10000 THEN
  RAISE EXCEPTION 'EVIDENCE_SOURCE_INCOMPLETE' USING ERRCODE='22023';
 END IF;
 link:=CASE p_kind WHEN 'certificate' THEN coalesce(nullif(source->>'link',''),nullif(source->>'document_url','')) WHEN 'project' THEN coalesce(nullif(source->>'demo_link',''),nullif(source->>'github_link','')) ELSE NULL END;
 IF link IS NOT NULL AND link!~'^https://' THEN link:=NULL; END IF;
 RETURN jsonb_build_object('schemaVersion',1,'title',label,'content',content,'url',link,'revision',(source->>'learning_evidence_revision')::bigint,'expiresOn',CASE WHEN p_kind='certificate' THEN source->>'expiry_date' END);
END $$;
CREATE FUNCTION public.lock_learning_equivalency_source(p_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE item public.learning_equivalencies; source jsonb;
BEGIN
 SELECT * INTO item FROM public.learning_equivalencies WHERE id=p_id;
 IF item.evidence_format=2 THEN
  source:=public.read_learning_evidence_source(CASE WHEN item.training_id IS NOT NULL THEN 'training' WHEN item.certificate_id IS NOT NULL THEN 'certificate' WHEN item.experience_id IS NOT NULL THEN 'experience' ELSE 'project' END,
    coalesce(item.training_id,item.certificate_id,item.experience_id,item.project_id),item.learner_id);
  IF (source->>'revision')::bigint<>item.source_revision THEN RAISE EXCEPTION 'EVIDENCE_SOURCE_CHANGED' USING ERRCODE='40001'; END IF;
 END IF;
END $$;
CREATE FUNCTION public.guard_learning_evidence_source() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE source jsonb; policy text;
BEGIN
 IF TG_OP='UPDATE' THEN
  IF ROW(NEW.evidence_format,NEW.training_id,NEW.certificate_id,NEW.experience_id,NEW.project_id,NEW.source_revision,NEW.assessed_evidence,NEW.learner_id,NEW.level_id,NEW.fingerprint,NEW.evidence_digest)
   IS DISTINCT FROM ROW(OLD.evidence_format,OLD.training_id,OLD.certificate_id,OLD.experience_id,OLD.project_id,OLD.source_revision,OLD.assessed_evidence,OLD.learner_id,OLD.level_id,OLD.fingerprint,OLD.evidence_digest) THEN
   RAISE EXCEPTION 'ASSESSED_EVIDENCE_IMMUTABLE' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
 END IF;
 -- All new requests must reference existing evidence, including direct writers.
 IF NEW.evidence_format<>2 THEN RAISE EXCEPTION 'EVIDENCE_SOURCE_REQUIRED' USING ERRCODE='22023'; END IF;
 source:=public.read_learning_evidence_source(CASE WHEN NEW.training_id IS NOT NULL THEN 'training' WHEN NEW.certificate_id IS NOT NULL THEN 'certificate' WHEN NEW.experience_id IS NOT NULL THEN 'experience' ELSE 'project' END,
  coalesce(NEW.training_id,NEW.certificate_id,NEW.experience_id,NEW.project_id),NEW.learner_id);
 IF num_nonnulls(NEW.training_id,NEW.certificate_id,NEW.experience_id,NEW.project_id)<>1 THEN RAISE EXCEPTION 'INVALID_EVIDENCE_SOURCE' USING ERRCODE='22023'; END IF;
 NEW.source_revision:=(source->>'revision')::bigint;NEW.assessed_evidence:=source-'revision';
 NEW.title:=NULL;NEW.description:=NULL;NEW.evidence_url:=NULL;NEW.evidence_content:=NULL;
 NEW.evidence_digest:=md5(trim(source->>'content'));
 SELECT public.job_learning_evaluation_policy(NEW.learner_id,l.user_id) INTO policy FROM public.learners l WHERE l.id=NEW.learner_id;
 IF policy IS NULL OR NEW.status<>'pending' OR NEW.reviewer_id IS NOT NULL THEN RAISE EXCEPTION 'INVALID_EVIDENCE_REQUEST' USING ERRCODE='42501'; END IF;
 NEW.evaluation_type:=policy;
 IF policy='ai' AND length(source->>'content')<200 THEN RAISE EXCEPTION 'EVIDENCE_CONTENT_REQUIRED' USING ERRCODE='22023'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER aa_guard_learning_evidence_source BEFORE INSERT OR UPDATE ON public.learning_equivalencies FOR EACH ROW EXECUTE FUNCTION public.guard_learning_evidence_source();
CREATE OR REPLACE FUNCTION public.guard_learning_ai_evidence() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE content text;
BEGIN
 IF NEW.evaluation_type='ai' THEN
  content:=CASE WHEN NEW.evidence_format=2 THEN NEW.assessed_evidence->>'content' ELSE NEW.evidence_content END;
  IF length(trim(coalesce(content,''))) NOT BETWEEN 200 AND 10000 THEN RAISE EXCEPTION 'EVIDENCE_CONTENT_REQUIRED' USING ERRCODE='22023'; END IF;
  NEW.evidence_digest:=md5(trim(content));
 END IF;
 RETURN NEW;
END $$;
CREATE FUNCTION public.submit_learning_equivalency(p_user uuid,p_level uuid,p_fingerprint text,p_kind text,p_source uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE learner uuid; source jsonb; item public.learning_equivalencies;
BEGIN
 SELECT id INTO STRICT learner FROM public.learners WHERE user_id=p_user AND NOT is_deleted;
 IF NOT EXISTS(SELECT 1 FROM public.job_learning_catalog WHERE level_id=p_level AND fingerprint=p_fingerprint) THEN RAISE EXCEPTION 'CATALOG_CHANGED' USING ERRCODE='40001'; END IF;
 source:=public.read_learning_evidence_source(p_kind,p_source,learner);
 PERFORM pg_advisory_xact_lock(hashtextextended('learning-evidence:'||learner||':'||p_level||':'||p_fingerprint||':'||md5(trim(source->>'content')),0));
 -- Expiry does not perform an UPDATE on the source. Retire stale live
 -- requests only when this learner submits matching evidence, so their unique
 -- digest cannot prevent assessment of an available replacement source.
 FOR item IN UPDATE public.learning_equivalencies e SET status='revoked',version=e.version+1,ai_lease_until=NULL,
  feedback='The assessed evidence is no longer available or current. Submit current evidence for evaluation.'
  WHERE e.learner_id=learner AND e.level_id=p_level AND e.fingerprint=p_fingerprint
   AND e.evidence_digest=md5(trim(source->>'content')) AND e.status IN ('pending','approved')
   AND NOT public.learning_equivalency_source_current(e) RETURNING e.* LOOP
  INSERT INTO public.learning_equivalency_audit(equivalency_id,actor_id,decision,version,feedback)
   VALUES(item.id,p_user,'source_unavailable',item.version,item.feedback);
 END LOOP;
 SELECT * INTO item FROM public.learning_equivalencies WHERE learner_id=learner AND level_id=p_level AND fingerprint=p_fingerprint
  AND evidence_digest=md5(trim(source->>'content')) AND status IN ('pending','approved','rejected')
  AND public.learning_equivalency_source_current(learning_equivalencies)
  AND (evaluation_type=public.job_learning_evaluation_policy(learner,p_user) OR (public.job_learning_evaluation_policy(learner,p_user)='human' AND status='pending'))
  ORDER BY created_at,id LIMIT 1;
 IF FOUND THEN RETURN jsonb_build_object('item',to_jsonb(item),'duplicate',true); END IF;
 INSERT INTO public.learning_equivalencies(learner_id,level_id,fingerprint,evidence_type,evidence_format,training_id,certificate_id,experience_id,project_id)
 VALUES(learner,p_level,p_fingerprint,CASE p_kind WHEN 'training' THEN 'course' WHEN 'certificate' THEN 'certification' ELSE 'work' END,2,
 CASE WHEN p_kind='training' THEN p_source END,CASE WHEN p_kind='certificate' THEN p_source END,CASE WHEN p_kind='experience' THEN p_source END,CASE WHEN p_kind='project' THEN p_source END)
 RETURNING * INTO item;
 RETURN jsonb_build_object('item',to_jsonb(item),'duplicate',false);
END $$;
CREATE FUNCTION public.revise_learning_evidence_source() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE fields text[]; changed boolean; new_state jsonb; old_state jsonb;
BEGIN
 IF TG_OP='INSERT' THEN NEW.learning_evidence_revision:=1;RETURN NEW; END IF;
 fields:=ARRAY['learner_id','title','description','enabled','approval_status','status']||CASE TG_TABLE_NAME
 WHEN 'trainings' THEN ARRAY['organization','source','course_id','lte_course_id','start_date','end_date']
 WHEN 'certificates' THEN ARRAY['issuer','credential_id','expiry_date','issued_on','link','document_url','training_id']
 WHEN 'experience' THEN ARRAY['role','organization','start_date','end_date','verified']
 WHEN 'projects' THEN ARRAY['organization','role','demo_link','github_link','video_url','ppt_url','certificate_url'] ELSE ARRAY[]::text[] END;
 new_state:=to_jsonb(NEW);old_state:=to_jsonb(OLD);
 SELECT EXISTS(SELECT 1 FROM unnest(fields) field WHERE new_state->field IS DISTINCT FROM old_state->field) INTO changed;
 -- UI draft payloads, embeddings, sync counters and timestamps are not evidence.
 NEW.learning_evidence_revision:=OLD.learning_evidence_revision+CASE WHEN changed THEN 1 ELSE 0 END;
 RETURN NEW;
END $$;
CREATE FUNCTION public.invalidate_learning_source_decisions() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE item public.learning_equivalencies;
BEGIN
 IF NEW.learning_evidence_revision=OLD.learning_evidence_revision THEN RETURN NULL; END IF;
 FOR item IN UPDATE public.learning_equivalencies SET status='revoked',version=version+1,ai_lease_until=NULL,feedback='Evidence changed; submit its current revision for evaluation.'
 WHERE evidence_format=2 AND status IN ('pending','approved') AND source_revision<>NEW.learning_evidence_revision
 AND CASE TG_TABLE_NAME WHEN 'trainings' THEN training_id=NEW.id WHEN 'certificates' THEN certificate_id=NEW.id WHEN 'experience' THEN experience_id=NEW.id WHEN 'projects' THEN project_id=NEW.id ELSE false END
 RETURNING * LOOP
  INSERT INTO public.learning_equivalency_audit(equivalency_id,actor_id,decision,version,feedback)
   SELECT item.id,l.user_id,'source_changed',item.version,item.feedback FROM public.learners l WHERE l.id=item.learner_id;
 END LOOP;
 RETURN NULL;
END $$;
CREATE TRIGGER learning_source_revision BEFORE INSERT OR UPDATE ON public.trainings FOR EACH ROW EXECUTE FUNCTION public.revise_learning_evidence_source();
CREATE TRIGGER learning_source_invalidation AFTER UPDATE ON public.trainings FOR EACH ROW EXECUTE FUNCTION public.invalidate_learning_source_decisions();
CREATE TRIGGER learning_source_revision BEFORE INSERT OR UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.revise_learning_evidence_source();
CREATE TRIGGER learning_source_invalidation AFTER UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.invalidate_learning_source_decisions();
CREATE TRIGGER learning_source_revision BEFORE INSERT OR UPDATE ON public.experience FOR EACH ROW EXECUTE FUNCTION public.revise_learning_evidence_source();
CREATE TRIGGER learning_source_invalidation AFTER UPDATE ON public.experience FOR EACH ROW EXECUTE FUNCTION public.invalidate_learning_source_decisions();
CREATE TRIGGER learning_source_revision BEFORE INSERT OR UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.revise_learning_evidence_source();
CREATE TRIGGER learning_source_invalidation AFTER UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.invalidate_learning_source_decisions();
CREATE OR REPLACE FUNCTION public.review_learning_equivalency(p_id uuid,p_reviewer uuid,p_version integer,p_decision text,p_feedback text)
RETURNS public.learning_equivalencies LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE item public.learning_equivalencies; learner public.learners;
BEGIN
 IF p_decision<>'revoked' THEN PERFORM public.lock_learning_equivalency_source(p_id); END IF;
 SELECT * INTO STRICT item FROM public.learning_equivalencies WHERE id=p_id FOR UPDATE;
 SELECT * INTO STRICT learner FROM public.learners WHERE id=item.learner_id;
 IF NOT public.learning_equivalency_reviewer_allowed(item.learner_id,p_reviewer) THEN RAISE EXCEPTION 'REVIEWER_FORBIDDEN' USING ERRCODE='42501'; END IF;
 IF item.version<>p_version THEN RAISE EXCEPTION 'REVIEW_CHANGED' USING ERRCODE='40001'; END IF;
 IF p_decision NOT IN ('approved','rejected','revoked') OR length(trim(coalesce(p_feedback,''))) NOT BETWEEN 1 AND 4000 THEN
  RAISE EXCEPTION 'INVALID_REVIEW' USING ERRCODE='22023'; END IF;
 IF (item.status='approved' AND p_decision<>'revoked') OR (item.status<>'pending' AND p_decision<>'revoked') THEN
  RAISE EXCEPTION 'INVALID_REVIEW_TRANSITION' USING ERRCODE='22023'; END IF;
 IF p_decision='approved' AND NOT EXISTS(SELECT 1 FROM public.job_learning_catalog WHERE level_id=item.level_id AND fingerprint=item.fingerprint) THEN
  RAISE EXCEPTION 'CATALOG_CHANGED' USING ERRCODE='40001'; END IF;
 UPDATE public.learning_equivalencies SET status=p_decision,reviewer_id=p_reviewer,feedback=trim(p_feedback),reviewed_at=now(),version=version+1,evaluation_model=NULL,evaluation_score=NULL,ai_lease_until=NULL WHERE id=p_id RETURNING * INTO item;
 INSERT INTO public.learning_equivalency_audit(equivalency_id,actor_id,decision,version,feedback) VALUES(item.id,p_reviewer,p_decision,item.version,trim(p_feedback));
 RETURN item;
END $$;

CREATE OR REPLACE FUNCTION public.record_learning_ai_equivalency(p_id uuid,p_user uuid,p_version integer,p_decision text,p_feedback text,p_model text,p_score integer)
 RETURNS public.learning_equivalencies LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE item public.learning_equivalencies;
BEGIN
 PERFORM public.lock_learning_equivalency_source(p_id);
 SELECT * INTO STRICT item FROM public.learning_equivalencies WHERE id=p_id FOR UPDATE;
 IF public.job_learning_evaluation_policy(item.learner_id,p_user) IS DISTINCT FROM 'ai' THEN RAISE EXCEPTION 'AI_POLICY_FORBIDDEN' USING ERRCODE='42501'; END IF;
 IF item.version<>p_version OR item.status<>'pending' OR item.evaluation_type<>'ai' THEN RAISE EXCEPTION 'REVIEW_CHANGED' USING ERRCODE='40001'; END IF;
 IF p_decision IS NULL OR p_decision NOT IN ('approved','rejected','pending') OR p_model IS NULL OR length(p_model)<1 OR p_score IS NULL OR p_score NOT BETWEEN 0 AND 100
 OR length(trim(coalesce(p_feedback,''))) NOT BETWEEN 1 AND 4000 THEN RAISE EXCEPTION 'INVALID_AI_EVALUATION' USING ERRCODE='22023'; END IF;
 IF p_decision='approved' AND NOT EXISTS(SELECT 1 FROM public.job_learning_catalog c WHERE c.level_id=item.level_id AND c.fingerprint=item.fingerprint) THEN RAISE EXCEPTION 'CATALOG_CHANGED' USING ERRCODE='40001'; END IF;
 UPDATE public.learning_equivalencies SET status=p_decision,feedback=p_feedback,evaluation_model=p_model,evaluation_score=p_score,reviewed_at=now(),version=version+1,ai_lease_until=NULL WHERE id=p_id RETURNING * INTO item;
 INSERT INTO public.learning_equivalency_audit(equivalency_id,actor_id,decision,version,feedback) VALUES(item.id,p_user,'ai_'||p_decision,item.version,p_feedback);
 RETURN item;
END $$;
CREATE OR REPLACE FUNCTION public.claim_learning_ai_equivalency(p_id uuid,p_user uuid,p_version integer) RETURNS public.learning_equivalencies
 LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE item public.learning_equivalencies;
BEGIN
 PERFORM public.lock_learning_equivalency_source(p_id);
 PERFORM pg_advisory_xact_lock(hashtextextended('learning-ai:'||p_user,0));
 SELECT * INTO item FROM public.learning_equivalencies WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR item.version<>p_version OR item.status<>'pending' OR item.evaluation_type<>'ai' OR item.ai_attempts>=5
 OR item.ai_next_attempt_at>now() OR item.ai_lease_until>now() OR public.job_learning_evaluation_policy(item.learner_id,p_user) IS DISTINCT FROM 'ai' THEN RETURN NULL; END IF;
 IF EXISTS(SELECT 1 FROM public.learning_equivalencies e JOIN public.learners l ON l.id=e.learner_id WHERE l.user_id=p_user AND e.ai_lease_until>now()) THEN RAISE EXCEPTION 'AI_CONCURRENT_EVALUATION' USING ERRCODE='P0001'; END IF;
 UPDATE public.learning_equivalencies SET ai_attempts=ai_attempts+1,ai_lease_until=now()+interval '2 minutes',version=version+1,
 ai_last_attempt_at=now(),ai_last_error=NULL,ai_next_attempt_at=now()+least(60,power(2,ai_attempts))*interval '1 minute' WHERE id=p_id RETURNING * INTO item;
 RETURN item;
END $$;
REVOKE ALL ON FUNCTION public.read_learning_evidence_source(text,uuid,uuid),public.lock_learning_equivalency_source(uuid),public.guard_learning_evidence_source(),public.submit_learning_equivalency(uuid,uuid,text,text,uuid),public.revise_learning_evidence_source(),public.invalidate_learning_source_decisions() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_learning_equivalency(uuid,uuid,text,text,uuid) TO service_role;
-- Digest uniqueness applies to live requests; a revoked source revision may
-- be assessed again without overwriting the earlier decision or its audit.
DROP INDEX public.learning_ai_evidence_unique;
CREATE UNIQUE INDEX learning_evidence_active_digest ON public.learning_equivalencies(learner_id,level_id,fingerprint,evidence_digest,evaluation_type)
 WHERE evidence_digest IS NOT NULL AND status IN ('pending','approved');
CREATE FUNCTION public.learning_equivalency_source_current(p_item public.learning_equivalencies) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT p_item.evidence_format=1 OR CASE
 WHEN p_item.training_id IS NOT NULL THEN EXISTS(SELECT 1 FROM public.trainings WHERE id=p_item.training_id AND learner_id=p_item.learner_id AND enabled IS DISTINCT FROM false AND learning_evidence_revision=p_item.source_revision)
 WHEN p_item.certificate_id IS NOT NULL THEN EXISTS(SELECT 1 FROM public.certificates WHERE id=p_item.certificate_id AND learner_id=p_item.learner_id AND enabled IS DISTINCT FROM false AND (expiry_date IS NULL OR expiry_date>=current_date) AND learning_evidence_revision=p_item.source_revision)
 WHEN p_item.experience_id IS NOT NULL THEN EXISTS(SELECT 1 FROM public.experience WHERE id=p_item.experience_id AND learner_id=p_item.learner_id AND enabled IS DISTINCT FROM false AND learning_evidence_revision=p_item.source_revision)
 WHEN p_item.project_id IS NOT NULL THEN EXISTS(SELECT 1 FROM public.projects WHERE id=p_item.project_id AND learner_id=p_item.learner_id AND enabled IS DISTINCT FROM false AND learning_evidence_revision=p_item.source_revision)
 ELSE false END;
$$;
-- Expired pending sources must not occupy the two due-worker slots forever.
CREATE OR REPLACE FUNCTION public.due_learning_ai_equivalencies() RETURNS SETOF public.learning_equivalencies
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT e.* FROM public.learning_equivalencies e JOIN public.learners l ON l.id=e.learner_id
 WHERE e.status='pending' AND e.evaluation_type='ai' AND e.ai_attempts<5 AND e.ai_next_attempt_at<=now()
 AND (e.ai_lease_until IS NULL OR e.ai_lease_until<now()) AND public.job_learning_evaluation_policy(l.id,l.user_id)='ai'
 AND public.learning_equivalency_source_current(e)
 ORDER BY e.ai_next_attempt_at,e.id LIMIT 2;
$$;
CREATE FUNCTION public.approved_learning_equivalencies(p_learner uuid,p_policy text,p_offset integer DEFAULT 0)
RETURNS TABLE(id uuid,level_id uuid,fingerprint text,status text,version integer,reviewed_at timestamptz,evaluation_type text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 SELECT e.id,e.level_id,e.fingerprint,e.status,e.version,e.reviewed_at,e.evaluation_type FROM public.learning_equivalencies e WHERE e.learner_id=p_learner AND e.status='approved'
 AND (p_policy='ai' OR (p_policy='human' AND e.evaluation_type='human')) AND public.learning_equivalency_source_current(e)
 ORDER BY e.id LIMIT 200 OFFSET greatest(0,least(p_offset,100000));
$$;
CREATE FUNCTION public.list_learning_evidence_sources(p_user uuid,p_kind text,p_offset integer DEFAULT 0) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
 WITH owner AS (SELECT id FROM public.learners WHERE user_id=p_user AND NOT is_deleted), sources AS (
 SELECT 'training' kind,t.id,t.title::text title,t.description::text description FROM public.trainings t JOIN owner o ON o.id=t.learner_id WHERE t.enabled IS DISTINCT FROM false AND p_kind='training'
 UNION ALL SELECT 'certificate',t.id,t.title::text,t.description::text FROM public.certificates t JOIN owner o ON o.id=t.learner_id WHERE t.enabled IS DISTINCT FROM false AND (expiry_date IS NULL OR expiry_date>=current_date) AND p_kind='certificate'
 UNION ALL SELECT 'experience',t.id,concat_ws(' at ',t.role,t.organization),t.description::text FROM public.experience t JOIN owner o ON o.id=t.learner_id WHERE t.enabled IS DISTINCT FROM false AND p_kind='experience'
 UNION ALL SELECT 'project',t.id,t.title::text,t.description::text FROM public.projects t JOIN owner o ON o.id=t.learner_id WHERE t.enabled IS DISTINCT FROM false AND p_kind='project'
 ), page AS (SELECT kind,id,title,length(trim(coalesce(description,''))) content_length FROM sources ORDER BY id LIMIT 50 OFFSET greatest(0,least(p_offset,100000)))
 SELECT jsonb_build_object('items',coalesce((SELECT jsonb_agg(to_jsonb(page) ORDER BY id) FROM page),'[]'),'total',(SELECT count(*) FROM sources));
$$;
REVOKE ALL ON FUNCTION public.learning_equivalency_source_current(public.learning_equivalencies),public.approved_learning_equivalencies(uuid,text,integer),public.list_learning_evidence_sources(uuid,text,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.approved_learning_equivalencies(uuid,text,integer),public.list_learning_evidence_sources(uuid,text,integer) TO service_role;
CREATE OR REPLACE FUNCTION public.guard_learning_application_integrity() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE proof public.job_application_verifications; criterion jsonb; evidence jsonb; equivalent public.learning_equivalencies;
BEGIN
 IF TG_OP='UPDATE' THEN
  IF NEW.learning_snapshot IS DISTINCT FROM OLD.learning_snapshot
   OR NEW.learning_verification_id IS DISTINCT FROM OLD.learning_verification_id
   OR NEW.learner_id IS DISTINCT FROM OLD.learner_id
   OR NEW.opportunity_id IS DISTINCT FROM OLD.opportunity_id THEN
   RAISE EXCEPTION 'APPLICATION_EVIDENCE_IMMUTABLE' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
 END IF;
 SELECT * INTO proof FROM public.job_application_verifications WHERE id=NEW.learning_verification_id;
 FOR criterion IN SELECT value FROM jsonb_array_elements(coalesce(proof.evidence->'criteria','[]')) LOOP
  IF criterion->>'mandatory'='true' THEN
   FOR evidence IN SELECT value FROM jsonb_array_elements(coalesce(criterion->'evidence','[]')) LOOP
    IF evidence ? 'equivalencyId' THEN
     PERFORM public.lock_learning_equivalency_source((evidence->>'equivalencyId')::uuid);
     SELECT * INTO equivalent FROM public.learning_equivalencies
      WHERE id=(evidence->>'equivalencyId')::uuid AND learner_id=NEW.learner_id
       AND level_id=(criterion->>'levelId')::uuid AND fingerprint=criterion->>'fingerprint'
       AND version=(evidence->>'version')::integer AND status='approved' AND public.learning_equivalency_source_current(learning_equivalencies) FOR SHARE;
     IF NOT FOUND OR (equivalent.evaluation_type='ai' AND public.job_learning_evaluation_policy(NEW.learner_id,proof.user_id) IS DISTINCT FROM 'ai') THEN
      RAISE EXCEPTION 'EQUIVALENT_EVIDENCE_CHANGED' USING ERRCODE='42501';
     END IF;
    END IF;
   END LOOP;
  END IF;
 END LOOP;
 RETURN NEW;
END $$;
COMMIT;
