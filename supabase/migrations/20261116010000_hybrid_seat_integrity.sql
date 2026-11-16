-- Seat writes use service-only transactions; the authenticated actor is supplied
-- by the API, never accepted from its JSON body. No remote application is implied.
BEGIN;

CREATE OR REPLACE FUNCTION public.assert_seat_admin(p_actor uuid, p_organization uuid)
RETURNS void LANGUAGE plpgsql SET search_path = public, pg_temp AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.organization_members WHERE user_id=p_actor
    AND organization_id=p_organization AND status='active'
    AND role IN ('owner','admin','school_admin','college_admin','university_admin','company_admin')) THEN
    RAISE EXCEPTION 'Organization administrator access required' USING ERRCODE='42501';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.organization_seat_usage(p_pool_ids uuid[], p_subscription_ids uuid[])
RETURNS jsonb LANGUAGE sql STABLE SET search_path = public, pg_temp AS $$
 SELECT jsonb_build_object(
  'pools', COALESCE((SELECT jsonb_object_agg(license_pool_id,n) FROM
   (SELECT license_pool_id,count(*) n FROM public.license_assignments WHERE status='active' AND license_pool_id=ANY(p_pool_ids) GROUP BY license_pool_id) counts),'{}'::jsonb),
  'subscriptions', COALESCE((SELECT jsonb_object_agg(organization_subscription_id,n) FROM
   (SELECT organization_subscription_id,count(*) n FROM public.license_assignments WHERE status='active' AND organization_subscription_id=ANY(p_subscription_ids) GROUP BY organization_subscription_id) counts),'{}'::jsonb));
$$;

CREATE OR REPLACE FUNCTION public.validate_pool_allocation()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE capacity integer; tenant uuid; allocated bigint;
BEGIN
 IF TG_OP='UPDATE' AND (NEW.organization_subscription_id<>OLD.organization_subscription_id OR NEW.organization_id<>OLD.organization_id) THEN
   RAISE EXCEPTION 'A license pool cannot change subscription or organization' USING ERRCODE='23514';
 END IF;
 -- Serialize competing pool creations on their parent before reading the sum.
 SELECT seat_count,organization_id INTO capacity,tenant FROM public.subscription_cache WHERE id=NEW.organization_subscription_id FOR UPDATE;
 IF NOT FOUND OR capacity IS NULL OR tenant IS DISTINCT FROM NEW.organization_id THEN
   RAISE EXCEPTION 'Pool subscription does not belong to organization' USING ERRCODE='23514';
 END IF;
 SELECT COALESCE(sum(allocated_seats),0) INTO allocated FROM public.license_pools
 WHERE organization_subscription_id=NEW.organization_subscription_id AND id IS DISTINCT FROM NEW.id;
 IF NEW.allocated_seats<1 OR allocated+NEW.allocated_seats>capacity THEN
   RAISE EXCEPTION 'Pool allocation exceeds contracted seats' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.validate_seat_availability()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE pool public.license_pools%ROWTYPE; contract public.subscription_cache%ROWTYPE;
BEGIN
 IF NEW.status<>'active' THEN RETURN NEW; END IF;
 IF TG_OP='UPDATE' AND OLD.status='active' THEN
   IF NEW.license_pool_id<>OLD.license_pool_id OR NEW.organization_subscription_id<>OLD.organization_subscription_id OR NEW.user_id<>OLD.user_id THEN
     RAISE EXCEPTION 'Transfer licenses through the transactional transfer operation' USING ERRCODE='23514';
   END IF;
   RETURN NEW;
 END IF;
 SELECT * INTO contract FROM public.subscription_cache WHERE id=NEW.organization_subscription_id FOR UPDATE;
 SELECT * INTO pool FROM public.license_pools WHERE id=NEW.license_pool_id FOR UPDATE;
 IF pool.id IS NULL OR contract.id IS NULL OR pool.organization_subscription_id<>contract.id
   OR pool.organization_id IS DISTINCT FROM contract.organization_id OR pool.is_active IS DISTINCT FROM true
   OR contract.status<>'active' OR contract.subscription_start_date>now()
   OR NOT COALESCE(contract.subscription_end_date>now() OR (contract.subscription_end_date IS NULL AND contract.billing_cycle='lifetime'),false) THEN
   RAISE EXCEPTION 'An active pool and current subscription are required' USING ERRCODE='23514';
 END IF;
 IF EXISTS (SELECT 1 FROM public.organization_members WHERE user_id=NEW.user_id AND organization_id=pool.organization_id AND status<>'active') THEN
   RAISE EXCEPTION 'Recipient membership is inactive' USING ERRCODE='23514';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM public.organization_members WHERE user_id=NEW.user_id AND organization_id=pool.organization_id AND status='active')
   AND NOT EXISTS (SELECT 1 FROM public.learners WHERE user_id=NEW.user_id AND COALESCE(is_deleted,false)=false AND (school_id=pool.organization_id OR college_id=pool.organization_id))
   AND NOT EXISTS (SELECT 1 FROM public.school_educators WHERE user_id=NEW.user_id AND school_id=pool.organization_id)
   AND NOT EXISTS (SELECT 1 FROM public.college_lecturers WHERE user_id=NEW.user_id AND "collegeId"=pool.organization_id) THEN
   RAISE EXCEPTION 'Recipient must belong to the organization' USING ERRCODE='23514';
 END IF;
 IF (SELECT count(*) FROM public.license_assignments WHERE license_pool_id=pool.id AND status='active')>=pool.allocated_seats THEN
   RAISE EXCEPTION 'No available seats in license pool' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trigger_validate_seat_availability ON public.license_assignments;
CREATE TRIGGER trigger_validate_seat_availability BEFORE INSERT OR UPDATE ON public.license_assignments
 FOR EACH ROW EXECUTE FUNCTION public.validate_seat_availability();

-- Recalculate counters inside the assignment transaction instead of applying
-- deltas to counters that may already be stale. No API-side counter writes.
CREATE OR REPLACE FUNCTION public.sync_pool_assigned_seats()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE pool_id uuid; subscription_id uuid;
BEGIN
 IF TG_OP='DELETE' THEN pool_id:=OLD.license_pool_id;subscription_id:=OLD.organization_subscription_id;
 ELSE pool_id:=NEW.license_pool_id;subscription_id:=NEW.organization_subscription_id; END IF;
 PERFORM 1 FROM public.subscription_cache WHERE id=subscription_id FOR UPDATE;
 UPDATE public.license_pools SET assigned_seats=(SELECT count(*) FROM public.license_assignments WHERE license_pool_id=pool_id AND status='active'),updated_at=now() WHERE id=pool_id;
 UPDATE public.subscription_cache SET assigned_seats=(SELECT count(*) FROM public.license_assignments WHERE organization_subscription_id=subscription_id AND status='active'),updated_at=now() WHERE id=subscription_id;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.validate_cached_seat_capacity()
RETURNS trigger LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
BEGIN
 IF COALESCE(NEW.seat_count,0)<COALESCE((SELECT sum(allocated_seats) FROM public.license_pools WHERE organization_subscription_id=NEW.id),0)
 OR COALESCE(NEW.seat_count,0)<(SELECT count(*) FROM public.license_assignments WHERE organization_subscription_id=NEW.id AND status='active') THEN
   RAISE EXCEPTION 'Contracted seats cannot be less than allocated or assigned seats' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS validate_cached_seat_capacity ON public.subscription_cache;
CREATE TRIGGER validate_cached_seat_capacity BEFORE UPDATE OF seat_count ON public.subscription_cache FOR EACH ROW EXECUTE FUNCTION public.validate_cached_seat_capacity();

CREATE OR REPLACE FUNCTION public.manage_organization_license(
 p_operation text,p_actor uuid,p_pool uuid DEFAULT NULL,p_target uuid DEFAULT NULL,p_assignment uuid DEFAULT NULL,
 p_source_user uuid DEFAULT NULL,p_subscription uuid DEFAULT NULL,p_reason text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE source public.license_assignments%ROWTYPE; pool public.license_pools%ROWTYPE; result public.license_assignments%ROWTYPE; sub_id uuid; pool_id uuid;
BEGIN
 IF p_operation NOT IN ('assign','revoke','transfer') THEN RAISE EXCEPTION 'Unknown license operation' USING ERRCODE='22023'; END IF;
 IF p_operation='assign' THEN
   SELECT organization_subscription_id,id INTO sub_id,pool_id FROM public.license_pools WHERE id=p_pool;
 ELSE
   SELECT * INTO source FROM public.license_assignments WHERE
    (p_operation='revoke' AND id=p_assignment) OR
    (p_operation='transfer' AND user_id=p_source_user AND organization_subscription_id=p_subscription AND status='active');
   sub_id:=source.organization_subscription_id; pool_id:=source.license_pool_id;
 END IF;
 IF sub_id IS NULL THEN RAISE EXCEPTION 'License or pool not found' USING ERRCODE='P0002'; END IF;
 -- All seat operations take parent, pool, assignment locks in that order.
 PERFORM 1 FROM public.subscription_cache WHERE id=sub_id FOR UPDATE;
 SELECT * INTO pool FROM public.license_pools WHERE id=pool_id FOR UPDATE;
 PERFORM public.assert_seat_admin(p_actor,pool.organization_id);
 IF p_operation<>'assign' THEN
   SELECT * INTO source FROM public.license_assignments WHERE id=source.id FOR UPDATE;
   IF p_operation='transfer' AND source.status<>'active' THEN RAISE EXCEPTION 'Source license is no longer active' USING ERRCODE='23514'; END IF;
 END IF;
 IF p_operation IN ('revoke','transfer') THEN
   UPDATE public.license_assignments SET status='revoked',revoked_at=now(),revoked_by=p_actor,
    revocation_reason=COALESCE(p_reason,'License revoked'),updated_at=now() WHERE id=source.id;
 END IF;
 IF p_operation IN ('assign','transfer') THEN
   IF p_target IS NULL OR (p_operation='transfer' AND p_target=p_source_user) THEN RAISE EXCEPTION 'A different target user is required' USING ERRCODE='22023'; END IF;
   INSERT INTO public.license_assignments(license_pool_id,organization_subscription_id,user_id,member_type,status,assigned_by,transferred_from,expires_at)
   VALUES(pool.id,pool.organization_subscription_id,p_target,pool.member_type,'active',p_actor,
    CASE WHEN p_operation='transfer' THEN source.id ELSE NULL END,
    CASE WHEN p_operation='transfer' THEN source.expires_at ELSE NULL END) RETURNING * INTO result;
   IF p_operation='transfer' THEN UPDATE public.license_assignments SET transferred_to=result.id WHERE id=source.id; END IF;
   RETURN to_jsonb(result);
 END IF;
 RETURN jsonb_build_object('success',true);
END $$;

CREATE OR REPLACE FUNCTION public.remove_organization_seat_member(p_actor uuid,p_organization uuid,p_member uuid,p_member_type text,p_organization_type text)
RETURNS jsonb LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE target uuid;
BEGIN
 PERFORM public.assert_seat_admin(p_actor,p_organization);
 -- Match the seat lock order before revoking rows/counters.
 PERFORM 1 FROM public.subscription_cache WHERE organization_id=p_organization ORDER BY id FOR UPDATE;
 PERFORM 1 FROM public.license_pools WHERE organization_id=p_organization ORDER BY id FOR UPDATE;
 IF p_member_type='learner' AND p_organization_type='school' THEN
  UPDATE public.learners SET school_id=NULL WHERE id=p_member AND school_id=p_organization RETURNING user_id INTO target;
 ELSIF p_member_type='learner' AND p_organization_type IN ('college','university') THEN
  UPDATE public.learners SET college_id=NULL WHERE id=p_member AND college_id=p_organization RETURNING user_id INTO target;
 ELSIF p_member_type='educator' AND p_organization_type='school' THEN
  UPDATE public.school_educators SET school_id=NULL WHERE id=p_member AND school_id=p_organization RETURNING user_id INTO target;
 ELSIF p_member_type='educator' AND p_organization_type='college' THEN
  UPDATE public.college_lecturers SET "collegeId"=NULL WHERE id=p_member AND "collegeId"=p_organization RETURNING user_id INTO target;
 ELSE RAISE EXCEPTION 'Unsupported member type' USING ERRCODE='22023'; END IF;
 IF NOT FOUND THEN RAISE EXCEPTION 'Member not found in organization' USING ERRCODE='P0002'; END IF;
 IF target IS NOT NULL THEN
  UPDATE public.license_assignments SET status='revoked',revoked_at=now(),revoked_by=p_actor,
   revocation_reason='Member removed from organization',updated_at=now()
   WHERE user_id=target AND status='active' AND license_pool_id IN (SELECT id FROM public.license_pools WHERE organization_id=p_organization);
  -- Profile-first members may not have a synced membership yet. Record the
  -- removal explicitly so stale organization claims cannot restore app scope.
  INSERT INTO public.organization_members(user_id,organization_id,role,status)
   VALUES(target,p_organization,'member','inactive')
   ON CONFLICT(user_id,organization_id) DO UPDATE SET status='inactive';
  UPDATE public.users SET "organizationId"=NULL WHERE id=target AND "organizationId"=p_organization;
 END IF;
 RETURN jsonb_build_object('success',true,'message','Member removed from organization');
END $$;

CREATE OR REPLACE FUNCTION public.accept_organization_learner_invitation(p_invitation uuid,p_actor uuid,p_email text)
RETURNS jsonb LANGUAGE plpgsql SET search_path=public,pg_temp AS $$
DECLARE invitation public.organization_invitations%ROWTYPE; pool public.license_pools%ROWTYPE;
BEGIN
 SELECT * INTO invitation FROM public.organization_invitations WHERE id=p_invitation FOR UPDATE;
 IF invitation.id IS NULL OR invitation.status<>'pending' OR invitation.expires_at<=now() THEN
  RAISE EXCEPTION 'Invitation is not pending or has expired' USING ERRCODE='23514'; END IF;
 IF lower(invitation.invitee_email) IS DISTINCT FROM lower(p_email) THEN RAISE EXCEPTION 'Invitation belongs to a different user' USING ERRCODE='42501'; END IF;
 IF invitation.invitee_role NOT IN ('learner','school_learner','college_learner','university_learner') THEN RAISE EXCEPTION 'Only learner invitations are supported' USING ERRCODE='22023'; END IF;
 SELECT * INTO pool FROM public.license_pools WHERE id=invitation.license_pool_id;
 IF pool.id IS NULL OR pool.organization_id<>invitation.organization_id OR pool.member_type<>'learner' THEN
  RAISE EXCEPTION 'Invitation pool does not match organization' USING ERRCODE='23514'; END IF;
 PERFORM 1 FROM public.subscription_cache WHERE id=pool.organization_subscription_id FOR UPDATE;
 PERFORM 1 FROM public.license_pools WHERE id=pool.id FOR UPDATE;
 INSERT INTO public.organization_members(user_id,organization_id,role,status) VALUES(p_actor,invitation.organization_id,'member','active')
 ON CONFLICT(user_id,organization_id) DO UPDATE SET status='active';
 IF invitation.organization_type='school' THEN
  UPDATE public.learners SET school_id=invitation.organization_id WHERE user_id=p_actor;
 ELSIF invitation.organization_type IN ('college','university') THEN
  UPDATE public.learners SET college_id=invitation.organization_id WHERE user_id=p_actor;
 ELSE RAISE EXCEPTION 'Unsupported organization type' USING ERRCODE='22023'; END IF;
 UPDATE public.users SET "organizationId"=invitation.organization_id WHERE id=p_actor;
 IF NOT EXISTS (SELECT 1 FROM public.license_assignments WHERE user_id=p_actor AND organization_subscription_id=pool.organization_subscription_id AND status='active') THEN
  INSERT INTO public.license_assignments(license_pool_id,organization_subscription_id,user_id,member_type,status,assigned_by)
  VALUES(pool.id,pool.organization_subscription_id,p_actor,'learner','active',invitation.invited_by);
 END IF;
 UPDATE public.organization_invitations SET status='accepted',accepted_at=now(),accepted_by_user_id=p_actor,updated_at=now() WHERE id=invitation.id RETURNING * INTO invitation;
 RETURN to_jsonb(invitation);
END $$;

-- Choose an available pool before limiting, preserving oldest-first selection.
CREATE OR REPLACE FUNCTION public.auto_assign_license_to_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE org uuid; kind text; target uuid; pool public.license_pools%ROWTYPE;
BEGIN
 IF TG_TABLE_NAME='learners' THEN org:=COALESCE(NEW.school_id,NEW.college_id);kind:='learner';target:=NEW.user_id;
 ELSIF TG_TABLE_NAME='school_educators' THEN org:=NEW.school_id;kind:='educator';target:=NEW.user_id;
 ELSIF TG_TABLE_NAME='college_lecturers' THEN org:=NEW."collegeId";kind:='educator';target:=NEW.user_id;
 END IF;
 IF org IS NULL OR target IS NULL THEN RETURN NEW; END IF;
 PERFORM 1 FROM public.subscription_cache WHERE organization_id=org ORDER BY id FOR UPDATE;
 IF EXISTS (SELECT 1 FROM public.license_assignments a JOIN public.license_pools p ON p.id=a.license_pool_id WHERE a.user_id=target AND a.status='active' AND p.organization_id=org) THEN RETURN NEW; END IF;
 SELECT p.* INTO pool FROM public.license_pools p JOIN public.subscription_cache s ON s.id=p.organization_subscription_id
 WHERE p.organization_id=org AND p.member_type=kind AND p.auto_assign_new_members AND p.is_active
 AND s.status='active' AND (s.subscription_start_date IS NULL OR s.subscription_start_date<=now())
 AND (s.subscription_end_date>now() OR (s.subscription_end_date IS NULL AND s.billing_cycle='lifetime'))
 AND (SELECT count(*) FROM public.license_assignments a WHERE a.license_pool_id=p.id AND a.status='active')<p.allocated_seats
 ORDER BY p.created_at,p.id LIMIT 1 FOR UPDATE OF p;
 IF pool.id IS NOT NULL THEN
  INSERT INTO public.license_assignments(license_pool_id,organization_subscription_id,user_id,member_type,status,assigned_by)
  VALUES(pool.id,pool.organization_subscription_id,target,kind,'active',COALESCE(pool.created_by,target));
 END IF;
 RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.assert_seat_admin(uuid,uuid),public.organization_seat_usage(uuid[],uuid[]),
 public.manage_organization_license(text,uuid,uuid,uuid,uuid,uuid,uuid,text),
 public.remove_organization_seat_member(uuid,uuid,uuid,text,text),public.accept_organization_learner_invitation(uuid,uuid,text)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.assert_seat_admin(uuid,uuid),public.organization_seat_usage(uuid[],uuid[]),
 public.manage_organization_license(text,uuid,uuid,uuid,uuid,uuid,uuid,text),
 public.remove_organization_seat_member(uuid,uuid,uuid,text,text),public.accept_organization_learner_invitation(uuid,uuid,text)
 TO service_role;
COMMIT;
