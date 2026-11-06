BEGIN;
DO $$ BEGIN
 CREATE TYPE public.ai_worksheet_difficulty AS ENUM ('beginner','intermediate','advanced');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
 CREATE TYPE public.ai_worksheet_status AS ENUM ('draft','generating','ready','published','failed','stopped','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.ai_worksheet_sets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 generation_group_id uuid NOT NULL,
 organization_id uuid NOT NULL REFERENCES public.organizations(id),
 educator_user_id uuid NOT NULL REFERENCES public.users(id),
 source_conversation_id uuid REFERENCES public.tutor_conversations(id) ON DELETE SET NULL,
 source_message_id uuid NOT NULL,
 course_id uuid REFERENCES public.courses(course_id),
 lesson_id uuid REFERENCES public.lessons(lesson_id),
 title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
 difficulty public.ai_worksheet_difficulty NOT NULL,
 student_content text NOT NULL CHECK (length(student_content) BETWEEN 1 AND 200000),
 question_count integer NOT NULL CHECK (question_count BETWEEN 5 AND 30),
 generation_config jsonb NOT NULL DEFAULT '{}',
 instructions text NOT NULL DEFAULT '',
 due_at timestamptz,
 status public.ai_worksheet_status NOT NULL DEFAULT 'draft',
 version integer NOT NULL DEFAULT 1 CHECK (version > 0),
 published_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (generation_group_id,difficulty)
);
CREATE TABLE IF NOT EXISTS public.ai_worksheet_solutions (
 worksheet_id uuid PRIMARY KEY REFERENCES public.ai_worksheet_sets(id) ON DELETE CASCADE,
 content text NOT NULL DEFAULT '' CHECK (length(content) <= 200000)
);
CREATE TABLE IF NOT EXISTS public.ai_worksheet_recipients (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 worksheet_id uuid NOT NULL REFERENCES public.ai_worksheet_sets(id) ON DELETE CASCADE,
 learner_id uuid NOT NULL REFERENCES public.learners(id),
 assigned_at timestamptz NOT NULL DEFAULT now(),
 opened_at timestamptz,
 UNIQUE (worksheet_id,learner_id)
);
CREATE INDEX IF NOT EXISTS ai_worksheet_recipients_learner_idx ON public.ai_worksheet_recipients(learner_id);
ALTER TABLE public.ai_worksheet_sets ADD COLUMN IF NOT EXISTS publication_request_hash text NOT NULL DEFAULT '';
-- Deleting chat history must not remove delivered worksheets or block deletion.
ALTER TABLE public.ai_worksheet_sets ALTER COLUMN source_conversation_id DROP NOT NULL;
ALTER TABLE public.ai_worksheet_sets DROP CONSTRAINT IF EXISTS ai_worksheet_sets_source_conversation_id_fkey;
ALTER TABLE public.ai_worksheet_sets ADD CONSTRAINT ai_worksheet_sets_source_conversation_id_fkey FOREIGN KEY(source_conversation_id) REFERENCES public.tutor_conversations(id) ON DELETE SET NULL;
ALTER TABLE public.ai_worksheet_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_worksheet_solutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_worksheet_recipients ENABLE ROW LEVEL SECURITY;
-- Access is through authenticated Pages handlers. Never grant browser table access.
REVOKE ALL ON public.ai_worksheet_sets,public.ai_worksheet_solutions,public.ai_worksheet_recipients FROM anon,authenticated;
GRANT ALL ON public.ai_worksheet_sets,public.ai_worksheet_solutions,public.ai_worksheet_recipients TO service_role;

-- Atomic publication with membership, ownership and retry checks inside the transaction.
CREATE OR REPLACE FUNCTION public.publish_ai_worksheets(p_user_id uuid,p_organization_id uuid,
 p_conversation_id uuid,p_message_id uuid,p_group_id uuid,p_title text,p_instructions text,
 p_due_at timestamptz,p_variants jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public,pg_temp AS $$
DECLARE v jsonb; source jsonb; conv public.tutor_conversations%ROWTYPE;
 worksheet uuid; learner uuid; seen uuid[] := '{}'; existing_owner uuid; request_hash text;
BEGIN
 IF p_group_id IS NULL OR p_user_id IS NULL OR p_organization_id IS NULL OR p_conversation_id IS NULL OR p_message_id IS NULL THEN RAISE EXCEPTION 'Missing publication identity'; END IF;
 request_hash:=md5(jsonb_build_object('title',p_title,'instructions',COALESCE(p_instructions,''),'dueAt',extract(epoch FROM p_due_at),'variants',p_variants)::text);
 IF NOT EXISTS (SELECT 1 FROM users u JOIN organization_members m ON m.user_id=u.id
  WHERE u.id=p_user_id AND u.role IN ('educator','school_educator','college_educator')
  AND m.organization_id=p_organization_id AND m.status='active') THEN
  RAISE EXCEPTION 'Educator organization access denied'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_group_id::text,0));
 SELECT educator_user_id INTO existing_owner FROM ai_worksheet_sets WHERE generation_group_id=p_group_id LIMIT 1;
 IF FOUND THEN
  IF existing_owner<>p_user_id OR EXISTS(SELECT 1 FROM ai_worksheet_sets WHERE generation_group_id=p_group_id AND (organization_id IS DISTINCT FROM p_organization_id OR source_message_id IS DISTINCT FROM p_message_id OR (source_conversation_id IS NOT NULL AND source_conversation_id IS DISTINCT FROM p_conversation_id) OR publication_request_hash IS DISTINCT FROM request_hash)) THEN RAISE EXCEPTION 'Publication conflict'; END IF;
  RETURN p_group_id;
 END IF;
 SELECT * INTO conv FROM tutor_conversations WHERE id=p_conversation_id AND learner_id=p_user_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Source conversation access denied'; END IF;
 SELECT item INTO source FROM jsonb_array_elements(conv.messages) item WHERE item->>'id'=p_message_id::text AND item->>'role'='assistant';
 IF source IS NULL OR jsonb_array_length(COALESCE(source->'worksheetVariants','[]'))=0 THEN RAISE EXCEPTION 'Completed worksheet required'; END IF;
 IF p_variants IS NULL OR jsonb_typeof(p_variants)<>'array' THEN RAISE EXCEPTION 'Select worksheet variants'; END IF;
 IF jsonb_array_length(p_variants) NOT BETWEEN 1 AND 3 THEN RAISE EXCEPTION 'Select worksheet variants'; END IF;
 FOR v IN SELECT * FROM jsonb_array_elements(p_variants) LOOP
  IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(source->'worksheetVariants') s WHERE s->>'difficulty'=v->>'difficulty') THEN RAISE EXCEPTION 'Invalid source variant'; END IF;
  IF v->'learnerIds' IS NULL OR jsonb_typeof(v->'learnerIds')<>'array' THEN RAISE EXCEPTION 'Select 1 to 500 learners per level'; END IF;
  IF jsonb_array_length(v->'learnerIds') NOT BETWEEN 1 AND 500 THEN RAISE EXCEPTION 'Select 1 to 500 learners per level'; END IF;
  INSERT INTO ai_worksheet_sets(generation_group_id,organization_id,educator_user_id,source_conversation_id,source_message_id,course_id,lesson_id,title,difficulty,student_content,question_count,generation_config,instructions,due_at,status,published_at)
  VALUES(p_group_id,p_organization_id,p_user_id,p_conversation_id,p_message_id,conv.course_id,conv.lesson_id,p_title,(v->>'difficulty')::ai_worksheet_difficulty,v->>'studentContent',(source->'worksheetConfig'->>'questionCount')::integer,source->'worksheetConfig',COALESCE(p_instructions,''),p_due_at,'published',now()) RETURNING id INTO worksheet;
  UPDATE ai_worksheet_sets SET publication_request_hash=request_hash WHERE id=worksheet;
  INSERT INTO ai_worksheet_solutions VALUES(worksheet,COALESCE(v->>'solutions',''));
  FOR learner IN SELECT value::uuid FROM jsonb_array_elements_text(v->'learnerIds') LOOP
   IF learner=ANY(seen) THEN RAISE EXCEPTION 'A learner can receive only one difficulty per publication'; END IF;
   IF NOT EXISTS (SELECT 1 FROM learners l JOIN organization_members m ON m.user_id=l.user_id WHERE l.id=learner AND m.organization_id=p_organization_id AND m.status='active') THEN RAISE EXCEPTION 'Learner is outside the active organization'; END IF;
   seen:=array_append(seen,learner);
   INSERT INTO ai_worksheet_recipients(worksheet_id,learner_id) VALUES(worksheet,learner);
  END LOOP;
 END LOOP;
 RETURN p_group_id;
END $$;
REVOKE ALL ON FUNCTION public.publish_ai_worksheets(uuid,uuid,uuid,uuid,uuid,text,text,timestamptz,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.publish_ai_worksheets(uuid,uuid,uuid,uuid,uuid,text,text,timestamptz,jsonb) TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
