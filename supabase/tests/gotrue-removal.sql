-- Run with psql -v ON_ERROR_STOP=1 after migrations. Fixtures are rolled back.
BEGIN;

INSERT INTO public.users (id, email, role, "isActive", "createdAt") VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'active-admin@gotrue-test.invalid', 'super_admin', true, '1900-01-02'),
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', 'inactive-admin@gotrue-test.invalid', 'super_admin', false, '1900-01-01');

-- Attach the actual function to a temporary table to exercise notification
-- delivery without triggering embeddings or other unrelated training side effects.
CREATE TEMP TABLE training_probe (
  learner_id uuid, title text, organization text,
  approval_authority text, approval_status text
);
CREATE TRIGGER notify_probe AFTER INSERT OR UPDATE ON training_probe
FOR EACH ROW EXECUTE FUNCTION public.notify_training_admin();
INSERT INTO training_probe VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', 'GoTrue removal regression', 'Test', 'rareminds_admin', 'pending');

DO $$
BEGIN
  IF public.get_user_email('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1') IS DISTINCT FROM 'active-admin@gotrue-test.invalid' THEN
    RAISE EXCEPTION 'get_user_email must read public.users';
  END IF;
  IF NOT public.check_user_exists('active-admin@gotrue-test.invalid') THEN
    RAISE EXCEPTION 'check_user_exists must read public.users';
  END IF;
  IF public.check_user_exists('missing@gotrue-test.invalid') THEN
    RAISE EXCEPTION 'check_user_exists must reject missing users';
  END IF;
  IF (SELECT count(*) FROM public.notifications
      WHERE recipient_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
      AND message = 'Learner submitted training "GoTrue removal regression" at "Test"') <> 1 THEN
    RAISE EXCEPTION 'Training notifications must reach the active SSO-synced super admin';
  END IF;
  IF EXISTS (SELECT 1 FROM public.notifications WHERE recipient_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2') THEN
    RAISE EXCEPTION 'Inactive admins must not receive notifications';
  END IF;
END;
$$;

-- Updates that do not return to pending must not send duplicate notifications.
UPDATE training_probe SET approval_status = 'approved';
DO $$
BEGIN
  IF (SELECT count(*) FROM public.notifications WHERE recipient_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1') <> 1 THEN
    RAISE EXCEPTION 'Approval updates must not duplicate submission notifications';
  END IF;
END;
$$;
UPDATE training_probe SET approval_status = 'pending';
DO $$
BEGIN
  IF (SELECT count(*) FROM public.notifications WHERE recipient_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1') <> 2 THEN
    RAISE EXCEPTION 'Returning to pending must notify the active admin';
  END IF;
END;
$$;

ROLLBACK;
