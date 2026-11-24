-- Runs only in the disposable database built by test-hybrid-seats-sql.mjs.
CREATE FUNCTION public.seat_test_assert(ok boolean,label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN IF ok IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %',label; END IF; RAISE NOTICE 'PASS: %',label; END $$;
INSERT INTO public.users(id,email) SELECT ('10000000-0000-4000-8000-'||lpad(n::text,12,'0'))::uuid,'synthetic-'||n||'@example.invalid' FROM generate_series(1,8) n;
INSERT INTO public.organization_members VALUES
 ('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','owner','active'),
 ('10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','member','active'),
 ('10000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','member','active');
INSERT INTO public.subscription_cache(id,user_id,plan_id,plan_code,organization_id,is_organization_subscription,status,seat_count,subscription_end_date)
 VALUES('30000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000099','hybrid','20000000-0000-4000-8000-000000000001',true,'active',4,now()+interval '1 year');
INSERT INTO public.license_pools(id,organization_subscription_id,organization_id,organization_type,member_type,allocated_seats,auto_assign_new_members,created_by,created_at) VALUES
 ('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','college','learner',1,true,'10000000-0000-4000-8000-000000000001',now()-interval '1 day'),
 ('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','college','learner',3,true,'10000000-0000-4000-8000-000000000001',now());
SELECT public.manage_organization_license('assign','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002');
SELECT public.seat_test_assert((SELECT assigned_seats=1 AND seat_count=4 FROM public.subscription_cache WHERE id='30000000-0000-4000-8000-000000000001'),'assignment counts usage without inflating capacity');
DO $$ BEGIN
 BEGIN PERFORM public.manage_organization_license('assign','10000000-0000-4000-8000-000000000008','40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003'); RAISE EXCEPTION 'outsider was authorized'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
 BEGIN PERFORM public.manage_organization_license('assign','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000008'); RAISE EXCEPTION 'foreign recipient accepted'; EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN UPDATE public.subscription_cache SET seat_count=1; RAISE EXCEPTION 'unsafe reduction accepted'; EXCEPTION WHEN check_violation THEN NULL; END;
 BEGIN UPDATE public.license_pools SET allocated_seats=4 WHERE id='40000000-0000-4000-8000-000000000002'; RAISE EXCEPTION 'over-allocation accepted'; EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
-- Nullable lifecycle fields must fail closed rather than exploit SQL's NULL truth value.
UPDATE public.subscription_cache SET subscription_end_date=NULL,billing_cycle='annual';
DO $$ BEGIN
 BEGIN PERFORM public.manage_organization_license('assign','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003'); RAISE EXCEPTION 'missing expiry accepted'; EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
UPDATE public.subscription_cache SET subscription_end_date=now()+interval '1 year';
UPDATE public.license_pools SET is_active=NULL WHERE id='40000000-0000-4000-8000-000000000002';
DO $$ BEGIN
 BEGIN PERFORM public.manage_organization_license('assign','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003'); RAISE EXCEPTION 'null pool activity accepted'; EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
UPDATE public.license_pools SET is_active=true WHERE id='40000000-0000-4000-8000-000000000002';
UPDATE public.subscription_cache SET status='expired';
DO $$ BEGIN
 BEGIN PERFORM public.manage_organization_license('assign','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003'); RAISE EXCEPTION 'expired contract accepted'; EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
UPDATE public.subscription_cache SET status='active';
UPDATE public.organization_members SET status='inactive' WHERE user_id='10000000-0000-4000-8000-000000000003';
DO $$ BEGIN
 BEGIN PERFORM public.manage_organization_license('assign','10000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003'); RAISE EXCEPTION 'inactive recipient accepted'; EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
UPDATE public.organization_members SET status='active' WHERE user_id='10000000-0000-4000-8000-000000000003';
UPDATE public.license_assignments SET expires_at='2099-01-01T00:00:00Z' WHERE user_id='10000000-0000-4000-8000-000000000002' AND status='active';
INSERT INTO public.learners(id,user_id,college_id) VALUES('50000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000001');
SELECT public.seat_test_assert(EXISTS(SELECT 1 FROM public.license_assignments WHERE user_id='10000000-0000-4000-8000-000000000004' AND license_pool_id='40000000-0000-4000-8000-000000000002'),'auto-assignment skips oldest full pool');
-- Fail the insert AFTER the transfer revokes its source; the subtransaction must undo that revoke.
CREATE FUNCTION public.seat_test_fail_insert() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'controlled assignment insert failure' USING ERRCODE='23514'; END $$;
CREATE TRIGGER seat_test_fail_insert BEFORE INSERT ON public.license_assignments FOR EACH ROW EXECUTE FUNCTION public.seat_test_fail_insert();
DO $$ BEGIN
 BEGIN PERFORM public.manage_organization_license('transfer','10000000-0000-4000-8000-000000000001',NULL,'10000000-0000-4000-8000-000000000003',NULL,'10000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001'); RAISE EXCEPTION 'controlled transfer unexpectedly succeeded'; EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
SELECT public.seat_test_assert(EXISTS(SELECT 1 FROM public.license_assignments WHERE user_id='10000000-0000-4000-8000-000000000002' AND status='active'),'failed transfer restores source assignment');
DROP TRIGGER seat_test_fail_insert ON public.license_assignments;
SELECT public.manage_organization_license('transfer','10000000-0000-4000-8000-000000000001',NULL,'10000000-0000-4000-8000-000000000003',NULL,'10000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000001');
SELECT public.seat_test_assert((SELECT count(*)=2 FROM public.license_assignments WHERE status='active'),'successful transfer preserves occupied seat total');
SELECT public.seat_test_assert(EXISTS(SELECT 1 FROM public.license_assignments WHERE user_id='10000000-0000-4000-8000-000000000002' AND status='revoked' AND transferred_to IS NOT NULL),'transfer links its audit records');
SELECT public.seat_test_assert(EXISTS(SELECT 1 FROM public.license_assignments WHERE user_id='10000000-0000-4000-8000-000000000003' AND status='active' AND expires_at='2099-01-01T00:00:00Z'),'transfer preserves existing license expiry');
-- Existing learner acceptance is an UPDATE, so the invitation must allocate explicitly.
INSERT INTO public.learners(id,user_id) VALUES('50000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000005');
INSERT INTO public.organization_invitations(id,organization_id,organization_type,invitee_role,invitee_email,license_pool_id,status,expires_at,invited_by) VALUES
 ('60000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000001','college','learner','synthetic-5@example.invalid','40000000-0000-4000-8000-000000000002','pending',now()+interval '1 day','10000000-0000-4000-8000-000000000001');
SELECT public.accept_organization_learner_invitation('60000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000005','synthetic-5@example.invalid');
SELECT public.seat_test_assert(EXISTS(SELECT 1 FROM public.license_assignments WHERE user_id='10000000-0000-4000-8000-000000000005' AND status='active'),'accepted invitation consumes selected pool seat');
-- A failed revoke must roll back profile/membership removal as well.
CREATE FUNCTION public.seat_test_fail_revoke() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN
 IF NEW.status='revoked' AND OLD.status='active' THEN RAISE EXCEPTION 'controlled revocation failure' USING ERRCODE='23514'; END IF; RETURN NEW; END $$;
CREATE TRIGGER seat_test_fail_revoke BEFORE UPDATE ON public.license_assignments FOR EACH ROW EXECUTE FUNCTION public.seat_test_fail_revoke();
DO $$ BEGIN
 BEGIN PERFORM public.remove_organization_seat_member('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000005','learner','college'); RAISE EXCEPTION 'controlled removal unexpectedly succeeded'; EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
SELECT public.seat_test_assert(EXISTS(SELECT 1 FROM public.learners WHERE user_id='10000000-0000-4000-8000-000000000005' AND college_id='20000000-0000-4000-8000-000000000001') AND EXISTS(SELECT 1 FROM public.organization_members WHERE user_id='10000000-0000-4000-8000-000000000005' AND status='active'),'failed revocation rolls back member removal');
DROP TRIGGER seat_test_fail_revoke ON public.license_assignments;
SELECT public.remove_organization_seat_member('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000005','learner','college');
SELECT public.seat_test_assert(EXISTS(SELECT 1 FROM public.organization_members WHERE user_id='10000000-0000-4000-8000-000000000005' AND status='inactive') AND NOT EXISTS(SELECT 1 FROM public.license_assignments WHERE user_id='10000000-0000-4000-8000-000000000005' AND status='active'),'removal deactivates membership and releases assignment');
-- A full selected pool must leave its invitation pending and create no membership.
INSERT INTO public.learners(id,user_id) VALUES('50000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000007');
INSERT INTO public.organization_invitations(id,organization_id,organization_type,invitee_role,invitee_email,license_pool_id,status,expires_at,invited_by) VALUES
 ('60000000-0000-4000-8000-000000000007','20000000-0000-4000-8000-000000000001','college','learner','synthetic-7@example.invalid','40000000-0000-4000-8000-000000000001','pending',now()+interval '1 day','10000000-0000-4000-8000-000000000001');
DO $$ BEGIN
 BEGIN PERFORM public.accept_organization_learner_invitation('60000000-0000-4000-8000-000000000007','10000000-0000-4000-8000-000000000007','synthetic-7@example.invalid'); RAISE EXCEPTION 'full-pool invitation unexpectedly succeeded'; EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
SELECT public.seat_test_assert(EXISTS(SELECT 1 FROM public.organization_invitations WHERE id='60000000-0000-4000-8000-000000000007' AND status='pending') AND NOT EXISTS(SELECT 1 FROM public.organization_members WHERE user_id='10000000-0000-4000-8000-000000000007'),'failed invitation assignment rolls back claim and membership');
-- Profile INSERT can assign a license before a membership sync event exists.
SELECT public.seat_test_assert(NOT EXISTS(SELECT 1 FROM public.organization_members WHERE user_id='10000000-0000-4000-8000-000000000004'),'profile-only removal has no membership positive control');
SELECT public.remove_organization_seat_member('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000004','learner','college');
SELECT public.seat_test_assert(EXISTS(SELECT 1 FROM public.organization_members WHERE user_id='10000000-0000-4000-8000-000000000004' AND organization_id='20000000-0000-4000-8000-000000000001' AND status='inactive'),'profile-only removal records inactive membership against stale claims');
SELECT public.seat_test_assert(NOT has_function_privilege('authenticated','public.manage_organization_license(text,uuid,uuid,uuid,uuid,uuid,uuid,text)','EXECUTE'),'browser roles cannot call service-only seat RPC');
INSERT INTO public.subscriptions VALUES('70000000-0000-4000-8000-000000000001','hybrid',30);
DO $$ BEGIN
 BEGIN UPDATE public.subscriptions SET seat_count=1; RAISE EXCEPTION 'source reduction unexpectedly succeeded'; EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
SELECT public.seat_test_assert((SELECT seat_count=30 FROM public.subscriptions),'source capacity reduction is rejected');
UPDATE public.subscriptions SET seat_count=40;
SELECT public.seat_test_assert((SELECT seat_count=40 FROM public.subscriptions),'source capacity increases remain available');
SELECT 'HYBRID_SEAT_SQL_OK';
