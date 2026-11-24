-- PREPARED ONLY. Applying this schema requires target-specific approval.
BEGIN;
CREATE TABLE public.subscription_recruiter_shortlist_operations (
  operation_id uuid PRIMARY KEY,
  actor_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  identity jsonb NOT NULL,
  "authorization" jsonb NOT NULL,
  credit_receipt jsonb,
  receipt jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
REVOKE ALL ON public.subscription_recruiter_shortlist_operations FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.subscription_recruiter_shortlist_operations TO service_role;

CREATE FUNCTION public.check_subscription_shortlist_deadline() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
  IF floor(extract(epoch FROM clock_timestamp())*1000)>=(NEW.authorization->>'validUntil')::bigint THEN
    RAISE EXCEPTION 'Subscription resource authorization expired at commit' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.check_subscription_shortlist_deadline() FROM PUBLIC,anon,authenticated,service_role;
CREATE CONSTRAINT TRIGGER subscription_shortlist_deadline
  AFTER INSERT ON public.subscription_recruiter_shortlist_operations DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.check_subscription_shortlist_deadline();

CREATE FUNCTION public.generate_subscription_recruiter_shortlist(
  p_actor_id uuid,p_organization_id uuid,p_query jsonb,p_credit_command jsonb,p_authorization jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE operation uuid; deadline bigint; opportunity public.opportunities%ROWTYPE;
  saved public.subscription_recruiter_shortlist_operations%ROWTYPE;
  matched record; candidate record; settings jsonb; candidates jsonb:='[]'::jsonb;
  identity jsonb; receipt jsonb; debit jsonb;
BEGIN
  IF p_actor_id IS NULL OR p_organization_id IS NULL
    OR jsonb_typeof(p_query) IS DISTINCT FROM 'object'
    OR (SELECT count(*) FROM jsonb_object_keys(p_query))<>3
    OR NOT p_query ?& ARRAY['opportunity_id','match_count','min_similarity']
    OR (p_query->>'opportunity_id')::bigint IS NULL OR (p_query->>'opportunity_id')::bigint<=0
    OR (p_query->>'match_count')::integer IS NULL OR (p_query->>'match_count')::integer NOT BETWEEN 1 AND 50
    OR (p_query->>'min_similarity')::double precision IS NULL
    OR (p_query->>'min_similarity')::double precision NOT BETWEEN 0 AND 1
    OR jsonb_typeof(p_authorization) IS DISTINCT FROM 'object'
    OR (SELECT count(*) FROM jsonb_object_keys(p_authorization))<>8
    OR NOT p_authorization ?& ARRAY['actorId','subject','subscriptionId','productId','revisionId','version','actionKey','validUntil']
    OR (p_authorization->>'actorId')::uuid IS DISTINCT FROM p_actor_id
    OR p_authorization#>>'{subject,kind}' IS DISTINCT FROM 'organization'
    OR (p_authorization#>>'{subject,id}')::uuid IS DISTINCT FROM p_organization_id
    OR (p_authorization->>'revisionId')::uuid IS NULL
    OR (p_authorization->>'version')::bigint IS NULL OR (p_authorization->>'version')::bigint<1
    OR p_authorization->>'actionKey' IS DISTINCT FROM 'recruiter.shortlist.generate'
    OR p_credit_command->>'actionKey' IS DISTINCT FROM p_authorization->>'actionKey'
    OR p_credit_command->>'subscriptionId' IS DISTINCT FROM p_authorization->>'subscriptionId'
    OR (p_credit_command->>'subscriptionId')::uuid IS NULL
    OR p_credit_command->>'productId' IS DISTINCT FROM p_authorization->>'productId'
    OR (p_credit_command->>'productId')::uuid IS NULL
    OR p_credit_command#>>'{recipient,kind}' IS DISTINCT FROM 'organization'
    OR (p_credit_command#>>'{recipient,id}')::uuid IS DISTINCT FROM p_organization_id THEN
    RAISE EXCEPTION 'Invalid shortlist scope' USING ERRCODE='42501';
  END IF;
  operation:=(p_credit_command->>'operationId')::uuid;
  deadline:=(p_authorization->>'validUntil')::bigint;
  IF operation IS NULL OR deadline IS NULL OR floor(extract(epoch FROM clock_timestamp())*1000)>=deadline THEN
    RAISE EXCEPTION 'Shortlist authorization expired' USING ERRCODE='42501';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('subscription-shortlist-operation:'||operation::text,0));
  PERFORM 1 FROM public.organization_members WHERE organization_id=p_organization_id AND user_id=p_actor_id AND status='active' FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active recruiter membership required' USING ERRCODE='42501'; END IF;
  PERFORM 1 FROM public.organization_recruitment_verification WHERE organization_id=p_organization_id AND verification_status='approved' FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Recruiter verification required' USING ERRCODE='42501'; END IF;
  SELECT * INTO opportunity FROM public.opportunities
    WHERE id=(p_query->>'opportunity_id')::bigint AND organization_id=p_organization_id FOR SHARE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Owned opportunity required' USING ERRCODE='42501'; END IF;
  identity:=jsonb_build_object('query',p_query,'command',p_credit_command);
  SELECT * INTO saved FROM public.subscription_recruiter_shortlist_operations WHERE operation_id=operation;
  IF FOUND THEN
    IF saved.actor_id<>p_actor_id OR saved.organization_id<>p_organization_id OR saved.identity IS DISTINCT FROM identity THEN
      RAISE EXCEPTION 'Shortlist operation identity differs' USING ERRCODE='22023';
    END IF;
    RETURN saved.receipt;
  END IF;
  IF opportunity.embedding IS NOT NULL THEN
    FOR matched IN SELECT id,user_id,similarity FROM public.match_candidates_to_opportunity(
      opportunity.embedding,(p_query->>'match_count')::integer,(p_query->>'min_similarity')::double precision)
    LOOP
      SELECT id,user_id INTO candidate FROM public.zoho_recruiter_learners WHERE id=matched.id AND user_id=matched.user_id FOR SHARE;
      IF NOT FOUND THEN CONTINUE; END IF;
      SELECT privacy_settings INTO settings FROM public.user_settings WHERE user_id=candidate.user_id FOR SHARE;
      IF FOUND AND settings->>'profileVisibility' IN ('public','recruiters') AND settings->'showInTalentPool'='true'::jsonb THEN
        candidates:=candidates||jsonb_build_array(jsonb_build_object('id',candidate.id,'similarity',matched.similarity));
      END IF;
    END LOOP;
  END IF;
  IF jsonb_array_length(candidates)>0 THEN
    debit:=public.consume_subscription_credits(p_credit_command,p_actor_id);
  END IF;
  IF floor(extract(epoch FROM clock_timestamp())*1000)>=deadline THEN
    RAISE EXCEPTION 'Shortlist authorization expired' USING ERRCODE='42501';
  END IF;
  receipt:=jsonb_build_object('operationId',operation,'query',p_query,'candidates',candidates);
  INSERT INTO public.subscription_recruiter_shortlist_operations(operation_id,actor_id,organization_id,identity,"authorization",credit_receipt,receipt)
    VALUES(operation,p_actor_id,p_organization_id,identity,p_authorization,debit,receipt);
  RETURN receipt;
END; $$;
REVOKE ALL ON FUNCTION public.generate_subscription_recruiter_shortlist(uuid,uuid,jsonb,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.generate_subscription_recruiter_shortlist(uuid,uuid,jsonb,jsonb,jsonb) TO service_role;

-- Preserve the applied contact owner and require its signed action envelope at
-- the public service entrypoint. No service caller can invoke the old signature.
REVOKE ALL ON FUNCTION public.unlock_subscription_candidate_contact(uuid,uuid,uuid,jsonb) FROM service_role;
CREATE TABLE public.subscription_contact_authorizations (
  operation_id uuid PRIMARY KEY,
  actor_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  candidate_id uuid NOT NULL,
  command jsonb NOT NULL,
  "authorization" jsonb NOT NULL
);
REVOKE ALL ON public.subscription_contact_authorizations FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.subscription_contact_authorizations TO service_role;
CREATE CONSTRAINT TRIGGER subscription_contact_deadline
  AFTER INSERT OR UPDATE ON public.subscription_contact_authorizations DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.check_subscription_shortlist_deadline();

CREATE FUNCTION public.unlock_subscription_candidate_contact(
  p_actor_id uuid,p_organization_id uuid,p_candidate_id uuid,p_credit_command jsonb,p_authorization jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE deadline bigint; operation uuid; saved public.subscription_contact_authorizations%ROWTYPE; result jsonb;
BEGIN
  IF p_actor_id IS NULL OR p_organization_id IS NULL OR p_candidate_id IS NULL
    OR jsonb_typeof(p_authorization) IS DISTINCT FROM 'object'
    OR (SELECT count(*) FROM jsonb_object_keys(p_authorization))<>8
    OR NOT p_authorization ?& ARRAY['actorId','subject','subscriptionId','productId','revisionId','version','actionKey','validUntil']
    OR (p_authorization->>'actorId')::uuid IS DISTINCT FROM p_actor_id
    OR p_authorization#>>'{subject,kind}' IS DISTINCT FROM 'organization'
    OR (p_authorization#>>'{subject,id}')::uuid IS DISTINCT FROM p_organization_id
    OR (p_authorization->>'revisionId')::uuid IS NULL
    OR (p_authorization->>'version')::bigint IS NULL OR (p_authorization->>'version')::bigint<1
    OR p_authorization->>'actionKey' IS DISTINCT FROM 'recruiter.contact.unlock'
    OR p_credit_command->>'actionKey' IS DISTINCT FROM p_authorization->>'actionKey'
    OR (p_authorization->>'subscriptionId')::uuid IS NULL
    OR p_credit_command->>'subscriptionId' IS DISTINCT FROM p_authorization->>'subscriptionId'
    OR (p_authorization->>'productId')::uuid IS NULL
    OR p_credit_command->>'productId' IS DISTINCT FROM p_authorization->>'productId' THEN
    RAISE EXCEPTION 'Invalid contact authorization scope' USING ERRCODE='42501';
  END IF;
  deadline:=(p_authorization->>'validUntil')::bigint;
  operation:=(p_credit_command->>'operationId')::uuid;
  IF deadline IS NULL OR operation IS NULL OR floor(extract(epoch FROM clock_timestamp())*1000)>=deadline THEN
    RAISE EXCEPTION 'Contact authorization expired' USING ERRCODE='42501';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('subscription-contact-operation:'||operation::text,0));
  SELECT * INTO saved FROM public.subscription_contact_authorizations WHERE operation_id=operation;
  IF FOUND AND (saved.actor_id<>p_actor_id OR saved.organization_id<>p_organization_id OR saved.candidate_id<>p_candidate_id
    OR saved.command IS DISTINCT FROM p_credit_command) THEN
    RAISE EXCEPTION 'Contact operation identity differs' USING ERRCODE='22023';
  END IF;
  result:=public.unlock_subscription_candidate_contact(p_actor_id,p_organization_id,p_candidate_id,p_credit_command);
  -- Replays also receive a current commit-time authorization check. The inner
  -- owner always rechecks current membership, verification and learner consent.
  INSERT INTO public.subscription_contact_authorizations(operation_id,actor_id,organization_id,candidate_id,command,"authorization")
    VALUES(operation,p_actor_id,p_organization_id,p_candidate_id,p_credit_command,p_authorization)
    ON CONFLICT(operation_id) DO UPDATE SET "authorization"=EXCLUDED."authorization";
  RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.unlock_subscription_candidate_contact(uuid,uuid,uuid,jsonb,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_subscription_candidate_contact(uuid,uuid,uuid,jsonb,jsonb) TO service_role;
-- Course enrollment and the shared Course/LTE reservation have one local commit.
CREATE TABLE public.subscription_course_enrollment_operations (
  operation_id uuid PRIMARY KEY,
  actor_id uuid NOT NULL,
  learner_id uuid NOT NULL REFERENCES public.learners(id),
  course_id uuid NOT NULL REFERENCES public.courses(course_id),
  "authorization" jsonb NOT NULL,
  receipt jsonb NOT NULL
);
REVOKE ALL ON public.subscription_course_enrollment_operations FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.subscription_course_enrollment_operations TO service_role;
CREATE CONSTRAINT TRIGGER subscription_course_enrollment_deadline
  AFTER INSERT ON public.subscription_course_enrollment_operations DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.check_subscription_shortlist_deadline();

CREATE FUNCTION public.enroll_subscription_course(p_actor uuid,p_learner uuid,p_course uuid,p_operation uuid,p_authorization jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE learner public.learners%ROWTYPE; course public.courses%ROWTYPE; enrollment public.course_enrollments%ROWTYPE;
  saved public.subscription_course_enrollment_operations%ROWTYPE; quota jsonb; command jsonb; receipt jsonb;
  created boolean:=false; total integer; educator text; deadline bigint; grant_value jsonb; projection jsonb;
BEGIN
  IF p_actor IS NULL OR p_learner IS NULL OR p_course IS NULL OR p_operation IS NULL
    OR jsonb_typeof(p_authorization) IS DISTINCT FROM 'object'
    OR (SELECT count(*) FROM jsonb_object_keys(p_authorization))<>12
    OR NOT p_authorization ?& ARRAY['schemaVersion','actorId','subject','subscriptionId','productId','revisionId','version','actionKey','featureKey','mode','validUntil','quota']
    OR p_authorization->'schemaVersion' IS DISTINCT FROM '1'::jsonb
    OR (p_authorization->>'actorId')::uuid IS DISTINCT FROM p_actor
    OR p_authorization->'subject' IS DISTINCT FROM jsonb_build_object('kind','user','id',p_actor)
    OR p_authorization->>'actionKey' IS DISTINCT FROM 'course.enroll'
    OR p_authorization->>'mode' IS DISTINCT FROM 'write'
    OR (p_authorization->>'subscriptionId')::uuid IS NULL OR (p_authorization->>'productId')::uuid IS NULL
    OR (p_authorization->>'revisionId')::uuid IS NULL
    OR (p_authorization->>'version')::bigint IS NULL OR (p_authorization->>'version')::bigint<1 THEN
    RAISE EXCEPTION 'Complete course subscription authority required' USING ERRCODE='42501';
  END IF;
  deadline:=(p_authorization->>'validUntil')::bigint;
  IF deadline IS NULL OR floor(extract(epoch FROM clock_timestamp())*1000)>=deadline THEN
    RAISE EXCEPTION 'Course enrollment authority expired' USING ERRCODE='42501';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended('subscription-course-operation:'||p_operation::text,0));
  SELECT * INTO learner FROM public.learners WHERE id=p_learner AND user_id=p_actor AND COALESCE(is_deleted,false)=false FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Owned learner unavailable' USING ERRCODE='P0002'; END IF;
  SELECT * INTO saved FROM public.subscription_course_enrollment_operations WHERE operation_id=p_operation;
  IF FOUND THEN
    IF saved.actor_id<>p_actor OR saved.learner_id<>p_learner OR saved.course_id<>p_course
      OR saved.authorization->>'subscriptionId' IS DISTINCT FROM p_authorization->>'subscriptionId'
      OR saved.authorization->>'productId' IS DISTINCT FROM p_authorization->>'productId' THEN
      RAISE EXCEPTION 'Course enrollment identity differs' USING ERRCODE='22023';
    END IF;
    RETURN saved.receipt;
  END IF;
  SELECT subscription_plan_projections.projection INTO projection FROM public.subscription_plan_projections
    WHERE revision_id=(p_authorization->>'revisionId')::uuid AND product_id=(p_authorization->>'productId')::uuid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Course revision projection unavailable' USING ERRCODE='42501'; END IF;
  SELECT value INTO STRICT grant_value FROM jsonb_array_elements(projection#>'{bundle,draft,features}')
    WHERE value->>'key'=p_authorization->>'featureKey' AND value->'enabled'='true'::jsonb;
  quota:=p_authorization->'quota';
  IF grant_value->>'type'='numeric_limit' THEN
    IF jsonb_typeof(quota) IS DISTINCT FROM 'object'
      OR grant_value#>>'{limit,kind}' IS NULL OR grant_value#>>'{limit,kind}' NOT IN ('finite','unlimited')
      OR quota->>'period' IS NULL OR quota->>'period' NOT IN ('subscription','billing_period')
      OR quota->>'countingEvent' IS DISTINCT FROM 'course_lte_assignment'
      OR quota->'limit' IS DISTINCT FROM (CASE WHEN grant_value#>>'{limit,kind}'='finite' THEN grant_value#>'{limit,value}' ELSE 'null'::jsonb END)
      OR (quota->>'periodEndsAt')::bigint<deadline THEN
      RAISE EXCEPTION 'Course quota differs from retained grant' USING ERRCODE='42501';
    END IF;
  ELSIF grant_value->>'type'<>'boolean' OR quota IS DISTINCT FROM 'null'::jsonb THEN
    RAISE EXCEPTION 'Course grant unavailable' USING ERRCODE='42501';
  END IF;
  SELECT * INTO course FROM public.courses WHERE course_id=p_course AND deleted_at IS NULL AND status='Active' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Active course unavailable' USING ERRCODE='P0002'; END IF;
  SELECT * INTO enrollment FROM public.course_enrollments WHERE learner_id=p_learner AND course_id=p_course FOR UPDATE;
  IF NOT FOUND THEN
    enrollment.id:=gen_random_uuid();
    IF quota IS DISTINCT FROM 'null'::jsonb THEN
      command:=jsonb_build_object('operationId',p_operation,'actorId',p_actor,'subject',p_authorization->'subject',
        'subscriptionId',p_authorization->'subscriptionId','productId',p_authorization->'productId',
        'revisionId',p_authorization->'revisionId','version',p_authorization->'version','actionKey',p_authorization->'actionKey',
        'countingEvent',quota->'countingEvent','resourceId',enrollment.id,'periodStartsAt',quota->'periodStartsAt',
        'periodEndsAt',quota->'periodEndsAt','limit',quota->'limit');
      PERFORM public.reserve_subscription_action_quota(command);
    END IF;
    SELECT count(*) INTO total FROM public.course_modules module JOIN public.lessons lesson ON lesson.module_id=module.module_id
      WHERE module.course_id=p_course;
    SELECT NULLIF(trim(concat_ws(' ',"firstName","lastName")),'') INTO educator FROM public.users WHERE id=course.educator_id;
    INSERT INTO public.course_enrollments(id,learner_id,learner_name,learner_email,course_id,course_title,educator_id,educator_name,
      progress,total_lessons,status,completed_lessons)
      VALUES(enrollment.id,learner.id,learner.name,learner.email,course.course_id,course.title,course.educator_id,educator,
        1,total,'active',ARRAY[]::text[]) RETURNING * INTO enrollment;
    UPDATE public.courses SET enrollment_count=(SELECT count(*) FROM public.course_enrollments WHERE course_id=p_course) WHERE course_id=p_course;
    created:=true;
  ELSE
    UPDATE public.course_enrollments SET last_accessed=now(),progress=CASE WHEN progress=0 THEN 1 ELSE progress END,
      status=CASE WHEN status='completed' THEN status ELSE 'in_progress' END WHERE id=enrollment.id RETURNING * INTO enrollment;
  END IF;
  receipt:=jsonb_build_object('operationId',p_operation,'created',created,'enrollment',to_jsonb(enrollment));
  INSERT INTO public.subscription_course_enrollment_operations(operation_id,actor_id,learner_id,course_id,"authorization",receipt)
    VALUES(p_operation,p_actor,p_learner,p_course,p_authorization,receipt);
  RETURN receipt;
END; $$;
REVOKE ALL ON FUNCTION public.enroll_subscription_course(uuid,uuid,uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.enroll_subscription_course(uuid,uuid,uuid,uuid,jsonb) TO service_role;

-- Included learner licensing is enforced at the actual assignment table so
-- alternate writers and auto-assignment cannot bypass the authoritative grant.
CREATE FUNCTION public.enforce_subscription_learner_capacity() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE authority jsonb; contract public.subscription_cache%ROWTYPE; projection jsonb; grant_value jsonb;
  capacity bigint; used bigint; deadline bigint; replaced_assignment uuid;
BEGIN
  IF NEW.member_type<>'learner' OR NEW.status<>'active' THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' AND OLD.member_type='learner' AND OLD.status='active' AND OLD.user_id=NEW.user_id
    AND OLD.organization_subscription_id=NEW.organization_subscription_id AND OLD.license_pool_id=NEW.license_pool_id THEN RETURN NEW; END IF;
  authority:=NULLIF(current_setting('subscription.learner_authority',true),'')::jsonb;
  IF authority IS NULL OR jsonb_typeof(authority) IS DISTINCT FROM 'object'
    OR (SELECT count(*) FROM jsonb_object_keys(authority))<>12
    OR authority->>'actionKey' IS DISTINCT FROM 'organization.learner.assign'
    OR authority->>'mode' IS DISTINCT FROM 'write'
    OR authority->'schemaVersion' IS DISTINCT FROM '1'::jsonb
    OR authority#>>'{subject,kind}' IS DISTINCT FROM 'organization'
    OR (authority->>'actorId')::uuid IS DISTINCT FROM NEW.assigned_by
    OR (authority->>'subscriptionId')::uuid IS DISTINCT FROM NEW.organization_subscription_id
    OR (authority->>'version')::bigint IS NULL OR (authority->>'version')::bigint<1
    OR authority#>>'{quota,period}' IS DISTINCT FROM 'concurrent'
    OR authority#>>'{quota,countingEvent}' IS DISTINCT FROM 'learner_assignment' THEN
    RAISE EXCEPTION 'Signed included learner capacity required' USING ERRCODE='42501';
  END IF;
  deadline:=(authority->>'validUntil')::bigint;
  IF deadline IS NULL OR floor(extract(epoch FROM clock_timestamp())*1000)>=deadline THEN
    RAISE EXCEPTION 'Learner assignment authority expired' USING ERRCODE='42501';
  END IF;
  SELECT * INTO contract FROM public.subscription_cache WHERE id=NEW.organization_subscription_id FOR UPDATE;
  IF NOT FOUND OR contract.organization_id IS DISTINCT FROM (authority#>>'{subject,id}')::uuid THEN
    RAISE EXCEPTION 'Learner assignment organization differs' USING ERRCODE='42501';
  END IF;
  SELECT subscription_plan_projections.projection INTO projection FROM public.subscription_plan_projections
    WHERE revision_id=(authority->>'revisionId')::uuid AND product_id=(authority->>'productId')::uuid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Learner capacity revision unavailable' USING ERRCODE='42501'; END IF;
  SELECT value INTO STRICT grant_value FROM jsonb_array_elements(projection#>'{bundle,draft,features}')
    WHERE value->>'key'=authority->>'featureKey' AND value->'enabled'='true'::jsonb AND value->>'type'='numeric_limit';
  IF grant_value#>>'{limit,kind}' IS NULL OR grant_value#>>'{limit,kind}' NOT IN ('finite','unlimited')
    OR authority#>'{quota,limit}' IS DISTINCT FROM (CASE WHEN grant_value#>>'{limit,kind}'='finite' THEN grant_value#>'{limit,value}' ELSE 'null'::jsonb END) THEN
    RAISE EXCEPTION 'Learner capacity differs from retained grant' USING ERRCODE='42501';
  END IF;
  capacity:=(authority#>>'{quota,limit}')::bigint;
  IF TG_OP='UPDATE' THEN replaced_assignment:=OLD.id; END IF;
  -- Measure the post-change learner set. Other active assignments belonging to
  -- the old user remain counted; only this particular assignment is replaced.
  SELECT count(DISTINCT user_id) INTO used FROM public.license_assignments
    WHERE organization_subscription_id=NEW.organization_subscription_id AND member_type='learner' AND status='active'
      AND id IS DISTINCT FROM replaced_assignment;
  IF NOT EXISTS(SELECT 1 FROM public.license_assignments WHERE organization_subscription_id=NEW.organization_subscription_id
    AND member_type='learner' AND user_id=NEW.user_id AND status='active'
    AND id IS DISTINCT FROM replaced_assignment) THEN used:=used+1; END IF;
  IF capacity IS NOT NULL AND used>capacity THEN
    RAISE EXCEPTION 'Included learner capacity exhausted' USING ERRCODE='54000';
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.enforce_subscription_learner_capacity() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER subscription_learner_capacity BEFORE INSERT OR UPDATE ON public.license_assignments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_subscription_learner_capacity();

CREATE TABLE public.subscription_learner_assignment_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.license_assignments(id),
  "authorization" jsonb NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
REVOKE ALL ON public.subscription_learner_assignment_authorizations FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.subscription_learner_assignment_authorizations TO service_role;
CREATE CONSTRAINT TRIGGER subscription_learner_assignment_deadline
  AFTER INSERT ON public.subscription_learner_assignment_authorizations DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.check_subscription_shortlist_deadline();
CREATE FUNCTION public.retain_subscription_learner_assignment_authority() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF NEW.member_type<>'learner' OR NEW.status<>'active' THEN RETURN NEW; END IF;
  IF TG_OP='UPDATE' AND OLD.member_type='learner' AND OLD.status='active' AND OLD.user_id=NEW.user_id
    AND OLD.organization_subscription_id=NEW.organization_subscription_id AND OLD.license_pool_id=NEW.license_pool_id THEN RETURN NEW; END IF;
  INSERT INTO public.subscription_learner_assignment_authorizations(assignment_id,"authorization")
    VALUES(NEW.id,NULLIF(current_setting('subscription.learner_authority',true),'')::jsonb);
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.retain_subscription_learner_assignment_authority() FROM PUBLIC,anon,authenticated,service_role;
CREATE TRIGGER retain_subscription_learner_assignment_authority AFTER INSERT OR UPDATE ON public.license_assignments
  FOR EACH ROW EXECUTE FUNCTION public.retain_subscription_learner_assignment_authority();

CREATE FUNCTION public.manage_subscription_learner_license(
 p_operation text,p_actor uuid,p_pool uuid,p_target uuid,p_assignment uuid,p_source_user uuid,p_subscription uuid,p_reason text,p_authorization jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result jsonb;
BEGIN
 IF p_operation IS NULL OR p_operation NOT IN ('assign','transfer')
   OR p_actor IS NULL OR (p_authorization->>'actorId')::uuid IS DISTINCT FROM p_actor THEN
   RAISE EXCEPTION 'Learner license authority differs' USING ERRCODE='42501';
 END IF;
 PERFORM set_config('subscription.learner_authority',p_authorization::text,true);
 result:=public.manage_organization_license(p_operation,p_actor,p_pool,p_target,p_assignment,p_source_user,p_subscription,p_reason);
 IF (p_authorization->>'validUntil')::bigint IS NULL
   OR floor(extract(epoch FROM clock_timestamp())*1000)>=(p_authorization->>'validUntil')::bigint THEN
   RAISE EXCEPTION 'Learner license authority expired' USING ERRCODE='42501';
 END IF;
 RETURN result;
END; $$;
REVOKE ALL ON FUNCTION public.manage_subscription_learner_license(text,uuid,uuid,uuid,uuid,uuid,uuid,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.manage_subscription_learner_license(text,uuid,uuid,uuid,uuid,uuid,uuid,text,jsonb) TO service_role;

-- One application-owned Course/LTE counter; pending remote delivery holds its
-- reservation until a trusted, exact durable outcome is acknowledged.
CREATE TABLE public.subscription_resource_deliveries (
  operation_id uuid PRIMARY KEY,
  actor_id uuid NOT NULL,
  target_id uuid NOT NULL,
  "authorization" jsonb NOT NULL,
  quota_receipt jsonb NOT NULL,
  status text NOT NULL CHECK(status IN ('pending','confirmed')),
  outcome jsonb,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  confirmed_at timestamptz,
  CHECK((status='pending' AND outcome IS NULL AND confirmed_at IS NULL)
    OR (status='confirmed' AND outcome IS NOT NULL AND confirmed_at IS NOT NULL))
);
REVOKE ALL ON public.subscription_resource_deliveries FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.subscription_resource_deliveries TO service_role;
CREATE CONSTRAINT TRIGGER subscription_resource_delivery_reservation_deadline
  AFTER INSERT ON public.subscription_resource_deliveries DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION public.check_subscription_shortlist_deadline();

CREATE FUNCTION public.subscription_resource_delivery_receipt(p_row public.subscription_resource_deliveries)
RETURNS jsonb LANGUAGE sql IMMUTABLE SET search_path=pg_catalog,public AS $$
  SELECT jsonb_build_object('schemaVersion',1,'operationId',p_row.operation_id,'actorId',p_row.actor_id,
    'trackId',p_row.target_id,'authorization',p_row.authorization,'quotaReceipt',p_row.quota_receipt,
    'status',p_row.status,'outcome',p_row.outcome);
$$;
REVOKE ALL ON FUNCTION public.subscription_resource_delivery_receipt(public.subscription_resource_deliveries) FROM PUBLIC,anon,authenticated,service_role;

CREATE FUNCTION public.reserve_subscription_resource_delivery(p_operation uuid,p_target uuid,p_authorization jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE saved public.subscription_resource_deliveries%ROWTYPE; authority jsonb:=p_authorization; quota jsonb;
  actor uuid; command jsonb; reserved jsonb; projection jsonb; grant_value jsonb; deadline bigint;
BEGIN
 IF p_operation IS NULL OR p_target IS NULL OR jsonb_typeof(authority) IS DISTINCT FROM 'object'
   OR (SELECT count(*) FROM jsonb_object_keys(authority))<>12
   OR NOT authority ?& ARRAY['schemaVersion','actorId','subject','subscriptionId','productId','revisionId','version','actionKey','featureKey','mode','validUntil','quota']
   OR authority->'schemaVersion' IS DISTINCT FROM '1'::jsonb
   OR authority->>'actionKey' IS DISTINCT FROM 'learning_path.activate' OR authority->>'mode' IS DISTINCT FROM 'write'
   OR authority#>>'{subject,kind}' IS DISTINCT FROM 'user'
   OR (authority->>'actorId')::uuid IS NULL
   OR authority->>'actorId' IS DISTINCT FROM authority#>>'{subject,id}' THEN
   RAISE EXCEPTION 'Complete resource reservation authority required' USING ERRCODE='42501';
 END IF;
 actor:=(authority->>'actorId')::uuid; deadline:=(authority->>'validUntil')::bigint;
 IF deadline IS NULL OR floor(extract(epoch FROM clock_timestamp())*1000)>=deadline THEN
   RAISE EXCEPTION 'Resource reservation authority expired' USING ERRCODE='42501';
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended('subscription-resource-delivery:'||p_operation::text,0));
 SELECT * INTO saved FROM public.subscription_resource_deliveries WHERE operation_id=p_operation FOR UPDATE;
 IF FOUND THEN
   IF saved.actor_id<>actor OR saved.target_id<>p_target
     OR saved.authorization->>'subscriptionId' IS DISTINCT FROM authority->>'subscriptionId'
     OR saved.authorization->>'productId' IS DISTINCT FROM authority->>'productId'
     OR saved.authorization-'validUntil' IS DISTINCT FROM authority-'validUntil'
     OR (saved.authorization->>'validUntil')::bigint>(authority->>'validUntil')::bigint THEN
     RAISE EXCEPTION 'Resource delivery operation differs' USING ERRCODE='22023';
   END IF;
   RETURN public.subscription_resource_delivery_receipt(saved);
 END IF;
 SELECT subscription_plan_projections.projection INTO projection FROM public.subscription_plan_projections
   WHERE revision_id=(authority->>'revisionId')::uuid AND product_id=(authority->>'productId')::uuid;
 IF NOT FOUND THEN RAISE EXCEPTION 'Resource revision unavailable' USING ERRCODE='42501'; END IF;
 SELECT value INTO STRICT grant_value FROM jsonb_array_elements(projection#>'{bundle,draft,features}')
   WHERE value->>'key'=authority->>'featureKey' AND value->>'type'='numeric_limit' AND value->'enabled'='true'::jsonb;
 quota:=authority->'quota';
 IF jsonb_typeof(quota) IS DISTINCT FROM 'object' OR (SELECT count(*) FROM jsonb_object_keys(quota))<>5
   OR quota->>'period' IS DISTINCT FROM 'billing_period'
   OR quota->>'countingEvent' IS DISTINCT FROM 'course_lte_assignment'
   OR grant_value#>>'{limit,kind}' IS NULL OR grant_value#>>'{limit,kind}' NOT IN ('finite','unlimited')
   OR quota->'limit' IS DISTINCT FROM (CASE WHEN grant_value#>>'{limit,kind}'='finite' THEN grant_value#>'{limit,value}' ELSE 'null'::jsonb END)
   OR (quota->>'periodEndsAt')::bigint IS NULL OR deadline>(quota->>'periodEndsAt')::bigint THEN
   RAISE EXCEPTION 'Resource quota differs from immutable grant' USING ERRCODE='42501';
 END IF;
 command:=jsonb_build_object('operationId',p_operation,'actorId',actor,'subject',authority->'subject',
   'subscriptionId',authority->'subscriptionId','productId',authority->'productId','revisionId',authority->'revisionId',
   'version',authority->'version','actionKey',authority->'actionKey','countingEvent',quota->'countingEvent',
   'resourceId',p_operation,'periodStartsAt',quota->'periodStartsAt','periodEndsAt',quota->'periodEndsAt','limit',quota->'limit');
 reserved:=public.reserve_subscription_action_quota(command);
 INSERT INTO public.subscription_resource_deliveries(operation_id,actor_id,target_id,"authorization",quota_receipt,status)
   VALUES(p_operation,actor,p_target,authority,reserved,'pending') RETURNING * INTO saved;
 RETURN public.subscription_resource_delivery_receipt(saved);
END; $$;
REVOKE ALL ON FUNCTION public.reserve_subscription_resource_delivery(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_subscription_resource_delivery(uuid,uuid,jsonb) TO service_role;

CREATE FUNCTION public.acknowledge_subscription_resource_delivery(p_actor uuid,p_outcome jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE saved public.subscription_resource_deliveries%ROWTYPE; command jsonb; authority jsonb; operation uuid;
BEGIN
 IF p_actor IS NULL OR jsonb_typeof(p_outcome) IS DISTINCT FROM 'object'
   OR (SELECT count(*) FROM jsonb_object_keys(p_outcome))<>11
   OR NOT p_outcome ?& ARRAY['schemaVersion','operationId','reservationId','actorId','trackId','subscriptionId','productId','revisionId','version','created','completedAt']
   OR p_outcome->'schemaVersion' IS DISTINCT FROM '1'::jsonb OR jsonb_typeof(p_outcome->'created') IS DISTINCT FROM 'boolean'
   OR EXISTS(SELECT 1 FROM jsonb_each(p_outcome) item WHERE item.key IN ('version','completedAt')
     AND (jsonb_typeof(item.value) IS DISTINCT FROM 'number'
       OR (item.value#>>'{}')::numeric NOT BETWEEN 1 AND 9007199254740991
       OR (item.value#>>'{}')::numeric<>trunc((item.value#>>'{}')::numeric)))
   OR (p_outcome->>'actorId')::uuid IS DISTINCT FROM p_actor THEN
   RAISE EXCEPTION 'Trusted resource outcome required' USING ERRCODE='42501';
 END IF;
 operation:=(p_outcome->>'operationId')::uuid;
 PERFORM pg_advisory_xact_lock(hashtextextended('subscription-resource-delivery:'||operation::text,0));
 SELECT * INTO saved FROM public.subscription_resource_deliveries WHERE operation_id=operation FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Resource reservation unavailable' USING ERRCODE='22023'; END IF;
 authority:=saved.authorization;command:=saved.quota_receipt->'command';
 IF saved.actor_id<>p_actor OR (p_outcome->>'reservationId')::uuid IS DISTINCT FROM operation
   OR (p_outcome->>'trackId')::uuid IS DISTINCT FROM saved.target_id
   OR p_outcome->>'subscriptionId' IS DISTINCT FROM authority->>'subscriptionId'
   OR p_outcome->>'productId' IS DISTINCT FROM authority->>'productId'
   OR p_outcome->>'revisionId' IS DISTINCT FROM authority->>'revisionId'
   OR p_outcome->'version' IS DISTINCT FROM authority->'version'
   OR (p_outcome->>'completedAt')::bigint IS NULL
   OR (p_outcome->>'completedAt')::bigint>floor(extract(epoch FROM clock_timestamp())*1000)::bigint
   OR (p_outcome->>'completedAt')::bigint<(command->>'periodStartsAt')::bigint
   OR (p_outcome->>'completedAt')::bigint>=(authority->>'validUntil')::bigint THEN
   RAISE EXCEPTION 'Resource outcome scope differs' USING ERRCODE='22023';
 END IF;
 IF saved.status='confirmed' THEN
   IF saved.outcome IS DISTINCT FROM p_outcome THEN RAISE EXCEPTION 'Resource outcome replay differs' USING ERRCODE='22023'; END IF;
   RETURN public.subscription_resource_delivery_receipt(saved);
 END IF;
 IF p_outcome->'created'='false'::jsonb THEN
   -- A durable unchanged outcome is normal zero-consumption accounting. Only
   -- this trusted exact outcome can remove its own pending capacity hold.
   PERFORM pg_advisory_xact_lock(hashtextextended(jsonb_build_array(command#>>'{subject,kind}',
     (command#>>'{subject,id}')::uuid,(command->>'productId')::uuid,(command->>'subscriptionId')::uuid,
     command->>'countingEvent',(command->>'periodStartsAt')::bigint,(command->>'periodEndsAt')::bigint)::text,0));
   DELETE FROM public.subscription_action_quota_reservations WHERE operation_id=operation AND subscription_action_quota_reservations.command=command;
   IF NOT FOUND THEN RAISE EXCEPTION 'Exact pending quota hold unavailable' USING ERRCODE='22023'; END IF;
 END IF;
 UPDATE public.subscription_resource_deliveries SET status='confirmed',outcome=p_outcome,confirmed_at=clock_timestamp()
   WHERE operation_id=operation RETURNING * INTO saved;
 RETURN public.subscription_resource_delivery_receipt(saved);
END; $$;
REVOKE ALL ON FUNCTION public.acknowledge_subscription_resource_delivery(uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.acknowledge_subscription_resource_delivery(uuid,jsonb) TO service_role;
COMMIT;
