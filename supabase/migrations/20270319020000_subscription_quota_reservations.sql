-- PREPARED ONLY: applying this migration requires deployment approval.
BEGIN;
-- Prerequisites: installed assessment_owner_start (20270208000000), current
-- personal_assessment_attempts/learners ownership schema, recruitment consent
-- and verification tables, and subscription_credit_execution (20270318010000).
-- Period-event reservations only. Concurrent resource capacity must be checked
-- in the same transaction as the owning resource write; this is not that write.
CREATE TABLE public.subscription_action_quota_reservations (
  operation_id uuid PRIMARY KEY,
  subject_kind text NOT NULL CHECK (subject_kind IN ('user','organization')),
  subject_id uuid NOT NULL,
  product_id uuid NOT NULL,
  subscription_id uuid NOT NULL,
  counting_event text NOT NULL CHECK (length(counting_event)>0),
  resource_id uuid NOT NULL,
  period_starts_at bigint NOT NULL,
  period_ends_at bigint NOT NULL CHECK (period_ends_at>period_starts_at),
  command jsonb NOT NULL CHECK (jsonb_typeof(command)='object'),
  receipt jsonb NOT NULL CHECK (jsonb_typeof(receipt)='object'),
  reserved_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(subject_kind,subject_id,product_id,subscription_id,counting_event,resource_id)
);
CREATE INDEX subscription_action_quota_scope_idx ON public.subscription_action_quota_reservations
  (subject_kind,subject_id,product_id,subscription_id,counting_event,period_starts_at,period_ends_at);
REVOKE ALL ON public.subscription_action_quota_reservations FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.subscription_action_quota_reservations TO service_role;

CREATE FUNCTION public.reserve_subscription_action_quota(p_command jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE
  op uuid; actor uuid; subj uuid; product uuid; subscription uuid; resource uuid;
  kind text; event text; starts bigint; ends bigint; capacity bigint; used bigint;
  saved public.subscription_action_quota_reservations%ROWTYPE; result jsonb; now_ms bigint;
BEGIN
  IF jsonb_typeof(p_command)<>'object' OR p_command IS NULL
    OR (SELECT count(*) FROM jsonb_object_keys(p_command))<>13
    OR NOT p_command ?& ARRAY['operationId','actorId','subject','subscriptionId','productId','revisionId','version',
      'actionKey','countingEvent','resourceId','periodStartsAt','periodEndsAt','limit']
    OR jsonb_typeof(p_command->'subject')<>'object'
    OR (SELECT count(*) FROM jsonb_object_keys(p_command->'subject'))<>2
    OR NOT (p_command->'subject') ?& ARRAY['kind','id'] THEN
    RAISE EXCEPTION 'Invalid quota command' USING ERRCODE='22023';
  END IF;
  op:=(p_command->>'operationId')::uuid; actor:=(p_command->>'actorId')::uuid;
  subj:=(p_command#>>'{subject,id}')::uuid; kind:=p_command#>>'{subject,kind}';
  product:=(p_command->>'productId')::uuid; subscription:=(p_command->>'subscriptionId')::uuid;
  resource:=(p_command->>'resourceId')::uuid; event:=p_command->>'countingEvent';
  starts:=(p_command->>'periodStartsAt')::bigint; ends:=(p_command->>'periodEndsAt')::bigint;
  capacity:=(p_command->>'limit')::bigint;
  IF op IS NULL OR actor IS NULL OR subj IS NULL OR product IS NULL OR subscription IS NULL OR resource IS NULL
    OR kind NOT IN ('user','organization') OR kind IS NULL OR event IS NULL OR length(event)=0
    OR (p_command->>'revisionId')::uuid IS NULL OR (p_command->>'version')::bigint IS NULL OR (p_command->>'version')::bigint<1
    OR p_command->>'actionKey' IS NULL OR length(p_command->>'actionKey')=0
    OR starts IS NULL OR ends IS NULL OR starts<0 OR ends<=starts OR capacity<0 THEN
    RAISE EXCEPTION 'Invalid quota command' USING ERRCODE='22023';
  END IF;
  -- Same operation cannot race across different scopes.
  PERFORM pg_advisory_xact_lock(hashtextextended('subscription-action-operation:'||op::text,0));
  SELECT * INTO saved FROM public.subscription_action_quota_reservations WHERE operation_id=op;
  IF FOUND THEN
    IF saved.command IS DISTINCT FROM p_command THEN RAISE EXCEPTION 'Quota operation identity differs' USING ERRCODE='22023'; END IF;
    RETURN saved.receipt;
  END IF;
  now_ms:=floor(extract(epoch FROM clock_timestamp())*1000)::bigint;
  IF now_ms<starts OR now_ms>=ends THEN RAISE EXCEPTION 'Quota period inactive' USING ERRCODE='42501'; END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(jsonb_build_array(kind,subj,product,subscription,event,starts,ends)::text,0));
  SELECT count(*) INTO used FROM public.subscription_action_quota_reservations
    WHERE subject_kind=kind AND subject_id=subj AND product_id=product AND subscription_id=subscription
      AND counting_event=event AND period_starts_at=starts AND period_ends_at=ends;
  IF capacity IS NOT NULL AND used>=capacity THEN RAISE EXCEPTION 'Subscription quota exceeded' USING ERRCODE='54000'; END IF;
  result:=jsonb_build_object('command',p_command,'used',used+1);
  INSERT INTO public.subscription_action_quota_reservations(operation_id,subject_kind,subject_id,product_id,subscription_id,
    counting_event,resource_id,period_starts_at,period_ends_at,command,receipt)
  VALUES(op,kind,subj,product,subscription,event,resource,starts,ends,p_command,result);
  RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.reserve_subscription_action_quota(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_subscription_action_quota(jsonb) TO service_role;

-- A scoped debit cannot unlock two candidates through operation replay. The
-- existing org/candidate unlock remains the authority for purchased contact.
CREATE TABLE public.subscription_candidate_contact_claims (
  operation_id uuid PRIMARY KEY,
  organization_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  actor_id uuid NOT NULL,
  command jsonb NOT NULL,
  credit_receipt jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(organization_id,candidate_id)
);
REVOKE ALL ON public.subscription_candidate_contact_claims FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.subscription_candidate_contact_claims TO service_role;

CREATE FUNCTION public.unlock_subscription_candidate_contact(p_actor_id uuid,p_organization_id uuid,p_candidate_id uuid,p_credit_command jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE candidate record; settings jsonb; claimed public.subscription_candidate_contact_claims%ROWTYPE;
  debit jsonb; unlock uuid; operation uuid; already boolean;
BEGIN
  IF p_actor_id IS NULL OR p_organization_id IS NULL OR p_candidate_id IS NULL
    OR p_credit_command#>>'{recipient,kind}' IS DISTINCT FROM 'organization'
    OR (p_credit_command#>>'{recipient,id}')::uuid IS DISTINCT FROM p_organization_id
    OR p_credit_command->>'actionKey' IS DISTINCT FROM 'recruiter.contact.unlock' THEN
    RAISE EXCEPTION 'Invalid recruiter credit scope' USING ERRCODE='42501';
  END IF;
  operation:=(p_credit_command->>'operationId')::uuid;
  IF operation IS NULL THEN RAISE EXCEPTION 'Missing recruiter operation' USING ERRCODE='22023'; END IF;
  -- This lock order is stable across all calls and protects resource-bound replay.
  PERFORM pg_advisory_xact_lock(hashtextextended('subscription-contact-operation:'||operation::text,0));
  PERFORM pg_advisory_xact_lock(hashtextextended(p_organization_id::text||':'||p_candidate_id::text,0));
  PERFORM 1 FROM public.organization_members WHERE organization_id=p_organization_id AND user_id=p_actor_id AND status='active' FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active recruiter membership required' USING ERRCODE='42501'; END IF;
  PERFORM 1 FROM public.organization_recruitment_verification WHERE organization_id=p_organization_id AND verification_status='approved' FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Recruiter verification required' USING ERRCODE='42501'; END IF;
  SELECT id,user_id,name,email,contact_number INTO STRICT candidate FROM public.zoho_recruiter_learners WHERE id=p_candidate_id;
  SELECT privacy_settings INTO settings FROM public.user_settings WHERE user_id=candidate.user_id FOR SHARE;
  IF settings IS NULL OR settings->>'profileVisibility' IS NULL OR settings->>'profileVisibility' NOT IN ('public','recruiters')
    OR settings->'allowRecruiterContact' IS DISTINCT FROM 'true'::jsonb
    OR (settings->'showEmail' IS DISTINCT FROM 'true'::jsonb AND settings->'showPhone' IS DISTINCT FROM 'true'::jsonb) THEN
    RAISE EXCEPTION 'Candidate contact consent required' USING ERRCODE='42501';
  END IF;
  SELECT * INTO claimed FROM public.subscription_candidate_contact_claims WHERE operation_id=operation;
  IF FOUND AND (claimed.organization_id<>p_organization_id OR claimed.candidate_id<>p_candidate_id
    OR claimed.actor_id<>p_actor_id OR claimed.command IS DISTINCT FROM p_credit_command) THEN
    RAISE EXCEPTION 'Recruiter operation identity differs' USING ERRCODE='22023';
  END IF;
  SELECT id INTO unlock FROM public.candidate_contact_unlocks WHERE organization_id=p_organization_id AND candidate_id=p_candidate_id::text;
  already:=FOUND;
  IF NOT already THEN
    debit:=public.consume_subscription_credits(p_credit_command,p_actor_id);
    INSERT INTO public.candidate_contact_unlocks(organization_id,candidate_id,unlocked_by,credits_consumed)
      VALUES(p_organization_id,p_candidate_id::text,p_actor_id,(p_credit_command->>'amount')::integer);
    INSERT INTO public.subscription_candidate_contact_claims(operation_id,organization_id,candidate_id,actor_id,command,credit_receipt)
      VALUES(operation,p_organization_id,p_candidate_id,p_actor_id,p_credit_command,debit);
  END IF;
  RETURN jsonb_build_object('alreadyUnlocked',already,'candidate',jsonb_build_object('id',candidate.id,'name',candidate.name,
    'email',CASE WHEN settings->'showEmail'='true'::jsonb THEN candidate.email ELSE NULL END,
    'phone',CASE WHEN settings->'showPhone'='true'::jsonb THEN candidate.contact_number ELSE NULL END));
END; $$;
REVOKE ALL ON FUNCTION public.unlock_subscription_candidate_contact(uuid,uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_subscription_candidate_contact(uuid,uuid,uuid,jsonb) TO service_role;

-- Service-only authorization comes from the signed/live SSO binding in the
-- authenticated application handler. No client payment flags or RLS authority.
CREATE TABLE public.subscription_assessment_claims (
  operation_id uuid PRIMARY KEY,
  actor_id uuid NOT NULL,
  attempt_id uuid NOT NULL UNIQUE REFERENCES public.personal_assessment_attempts(id),
  settlement_id uuid UNIQUE,
  identity jsonb NOT NULL,
  owner_proof jsonb,
  receipt jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
REVOKE ALL ON public.subscription_assessment_claims FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.subscription_assessment_claims TO service_role;

-- Deferred constraint validation runs at transaction completion, including when
-- an RPC caller holds the transaction open after this function has returned.
CREATE FUNCTION public.check_subscription_assessment_deadline() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
  IF floor(extract(epoch FROM clock_timestamp())*1000)>=(NEW.identity#>>'{authorization,validUntil}')::bigint THEN
    RAISE EXCEPTION 'Assessment authorization expired at commit' USING ERRCODE='42501'; END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.check_subscription_assessment_deadline() FROM PUBLIC,anon,authenticated;
CREATE CONSTRAINT TRIGGER subscription_assessment_deadline
  AFTER INSERT ON public.subscription_assessment_claims DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.check_subscription_assessment_deadline();

CREATE FUNCTION public.start_subscription_assessment(
  p_owner uuid,p_stream text,p_grade text,p_reference uuid,p_context jsonb,p_reuse boolean,
  p_operation uuid,p_authorization jsonb,p_quota jsonb,p_source_attempt uuid,p_retake_proof jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE learner uuid; source public.personal_assessment_attempts%ROWTYPE;
  saved public.subscription_assessment_claims%ROWTYPE; identity jsonb; result jsonb;
  actual uuid; settlement uuid; valid_until bigint; quota jsonb; current_attempt jsonb;
BEGIN
  IF p_owner IS NULL OR p_operation IS NULL OR jsonb_typeof(p_authorization) IS DISTINCT FROM 'object'
    OR (SELECT count(*) FROM jsonb_object_keys(p_authorization))<>8
    OR NOT p_authorization ?& ARRAY['actorId','subject','subscriptionId','productId','revisionId','version','actionKey','validUntil']
    OR (p_authorization->>'actorId')::uuid IS DISTINCT FROM p_owner
    OR p_authorization#>>'{subject,kind}' IS DISTINCT FROM 'user'
    OR (p_authorization#>>'{subject,id}')::uuid IS DISTINCT FROM p_owner
    OR (p_authorization->>'subscriptionId')::uuid IS NULL OR (p_authorization->>'productId')::uuid IS NULL
    OR (p_authorization->>'revisionId')::uuid IS NULL OR (p_authorization->>'version')::bigint IS NULL OR (p_authorization->>'version')::bigint<1
    OR p_authorization->>'actionKey' IS DISTINCT FROM (CASE WHEN p_source_attempt IS NULL THEN 'assessment.start' ELSE 'assessment.retake' END) THEN
    RAISE EXCEPTION 'Invalid assessment authorization' USING ERRCODE='42501';
  END IF;
  valid_until:=(p_authorization->>'validUntil')::bigint;
  IF valid_until IS NULL OR floor(extract(epoch FROM clock_timestamp())*1000)>=valid_until THEN
    RAISE EXCEPTION 'Assessment authorization expired' USING ERRCODE='42501'; END IF;
  identity:=jsonb_build_object('owner',p_owner,'stream',p_stream,'grade',p_grade,'reference',p_reference,
    'context',p_context,'reuse',p_reuse,'authorization',p_authorization,'quota',p_quota,'sourceAttemptId',p_source_attempt,'proof',p_retake_proof);
  PERFORM pg_advisory_xact_lock(hashtextextended('subscription-assessment-operation:'||p_operation::text,0));
  BEGIN SELECT id INTO STRICT learner FROM public.learners WHERE user_id=p_owner FOR UPDATE;
  EXCEPTION WHEN NO_DATA_FOUND THEN RETURN NULL; END;
  IF floor(extract(epoch FROM clock_timestamp())*1000)>=valid_until THEN
    RAISE EXCEPTION 'Assessment authorization expired' USING ERRCODE='42501'; END IF;
  SELECT * INTO saved FROM public.subscription_assessment_claims WHERE operation_id=p_operation;
  IF FOUND THEN
    IF saved.actor_id<>p_owner OR saved.identity IS DISTINCT FROM identity THEN
      RAISE EXCEPTION 'Assessment operation identity differs' USING ERRCODE='22023'; END IF;
    SELECT to_jsonb(a) INTO current_attempt FROM public.personal_assessment_attempts a WHERE id=saved.attempt_id AND learner_id=learner;
    IF current_attempt->>'status' IS DISTINCT FROM 'in_progress' THEN
      RAISE EXCEPTION 'Assessment operation already finished' USING ERRCODE='P0001'; END IF;
    RETURN jsonb_build_object('attempt',current_attempt,'created',NOT p_reuse);
  END IF;
  IF p_source_attempt IS NOT NULL THEN
    SELECT * INTO source FROM public.personal_assessment_attempts WHERE id=p_source_attempt AND learner_id=learner FOR SHARE;
    IF NOT FOUND OR source.status IS DISTINCT FROM 'completed' OR source.stream_id IS DISTINCT FROM p_stream
      OR (p_stream IS NULL AND source.grade_level IS DISTINCT FROM p_grade) THEN
      RAISE EXCEPTION 'Retake source must be an owned completed assessment of the same stream' USING ERRCODE='42501'; END IF;
    IF EXISTS(SELECT 1 FROM public.subscription_assessment_claims WHERE attempt_id=source.id AND settlement_id IS NOT NULL) THEN
      RAISE EXCEPTION 'Retake source must reference the original assessment' USING ERRCODE='42501'; END IF;
    IF jsonb_typeof(p_retake_proof) IS DISTINCT FROM 'object'
      OR (p_retake_proof->>'schemaVersion')::integer IS DISTINCT FROM 1
      OR (p_retake_proof->>'actorId')::uuid IS DISTINCT FROM p_owner
      OR p_retake_proof->'subject' IS DISTINCT FROM p_authorization->'subject'
      OR p_retake_proof->>'subscriptionId' IS DISTINCT FROM p_authorization->>'subscriptionId'
      OR p_retake_proof->>'productId' IS DISTINCT FROM p_authorization->>'productId'
      OR p_retake_proof->>'stateVersion' IS DISTINCT FROM p_authorization->>'version'
      OR (p_retake_proof->>'validUntil')::bigint IS DISTINCT FROM valid_until
      OR p_retake_proof#>>'{settlement,purpose}' IS DISTINCT FROM 'retake'
      OR p_retake_proof#>>'{settlement,referenceId}' IS DISTINCT FROM p_source_attempt::text
      OR p_retake_proof#>'{settlement,subject}' IS DISTINCT FROM p_authorization->'subject'
      OR p_retake_proof#>>'{settlement,subscriptionId}' IS DISTINCT FROM p_authorization->>'subscriptionId'
      OR p_retake_proof#>>'{settlement,productId}' IS DISTINCT FROM p_authorization->>'productId'
      OR (p_retake_proof#>>'{settlement,amountMinor}')::bigint IS NULL
      OR (p_retake_proof#>>'{settlement,amountMinor}')::bigint<1 THEN
      RAISE EXCEPTION 'Settled retake proof differs' USING ERRCODE='42501'; END IF;
    settlement:=(p_retake_proof#>>'{settlement,id}')::uuid;
    IF settlement IS NULL THEN RAISE EXCEPTION 'Retake settlement missing' USING ERRCODE='42501'; END IF;
    PERFORM pg_advisory_xact_lock(hashtextextended('subscription-assessment-settlement:'||settlement::text,0));
    PERFORM 1 FROM public.subscription_assessment_claims WHERE settlement_id=settlement;
    IF FOUND THEN RAISE EXCEPTION 'Retake settlement already consumed' USING ERRCODE='42501'; END IF;
  ELSIF p_retake_proof IS NOT NULL THEN
    RAISE EXCEPTION 'Unexpected retake proof' USING ERRCODE='22023';
  ELSIF EXISTS(SELECT 1 FROM public.personal_assessment_attempts WHERE learner_id=learner AND status='completed'
      AND stream_id IS NOT DISTINCT FROM p_stream AND (p_stream IS NOT NULL OR grade_level=p_grade))
    AND NOT (p_reuse AND EXISTS(SELECT 1 FROM public.personal_assessment_attempts WHERE learner_id=learner AND status='in_progress')) THEN
    RAISE EXCEPTION 'Retake payment required' USING ERRCODE='P0002';
  END IF;
  result:=public.start_owned_assessment(p_owner,p_stream,p_grade,p_reference,p_context,p_reuse);
  IF result IS NULL THEN RETURN NULL; END IF;
  IF floor(extract(epoch FROM clock_timestamp())*1000)>=valid_until THEN
    RAISE EXCEPTION 'Assessment authorization expired' USING ERRCODE='42501'; END IF;
  IF result->'created'='false'::jsonb THEN RETURN result; END IF;
  actual:=(result#>>'{attempt,id}')::uuid;
  IF p_quota IS NOT NULL THEN
    IF jsonb_typeof(p_quota) IS DISTINCT FROM 'object' OR p_quota ? 'resourceId'
      OR (p_quota->>'operationId')::uuid IS DISTINCT FROM p_operation
      OR (p_quota->>'actorId')::uuid IS DISTINCT FROM p_owner
      OR p_quota->'subject' IS DISTINCT FROM p_authorization->'subject'
      OR p_quota->>'subscriptionId' IS DISTINCT FROM p_authorization->>'subscriptionId'
      OR p_quota->>'productId' IS DISTINCT FROM p_authorization->>'productId'
      OR p_quota->>'revisionId' IS DISTINCT FROM p_authorization->>'revisionId'
      OR p_quota->>'version' IS DISTINCT FROM p_authorization->>'version'
      OR p_quota->>'actionKey' IS DISTINCT FROM p_authorization->>'actionKey' THEN
      RAISE EXCEPTION 'Assessment quota scope differs' USING ERRCODE='42501'; END IF;
    quota:=public.reserve_subscription_action_quota(p_quota||jsonb_build_object('resourceId',actual));
  END IF;
  -- Recheck after every contended lock/write. An expired proof rolls back the
  -- new attempt, quota and settlement claim together; no distributed lock claim.
  IF floor(extract(epoch FROM clock_timestamp())*1000)>=valid_until THEN
    RAISE EXCEPTION 'Assessment authorization expired' USING ERRCODE='42501'; END IF;
  INSERT INTO public.subscription_assessment_claims(operation_id,actor_id,attempt_id,settlement_id,identity,owner_proof,receipt)
    VALUES(p_operation,p_owner,actual,settlement,identity,p_retake_proof,result);
  RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.start_subscription_assessment(uuid,text,text,uuid,jsonb,boolean,uuid,jsonb,jsonb,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.start_subscription_assessment(uuid,text,text,uuid,jsonb,boolean,uuid,jsonb,jsonb,uuid,jsonb) TO service_role;
COMMIT;
