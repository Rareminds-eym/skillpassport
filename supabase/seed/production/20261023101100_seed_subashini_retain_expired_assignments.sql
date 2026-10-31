-- Switch ON the retain_expired_assignments flag for ONE trainer: Subashini Ramaswamy (subashini.r@rareminds.in). No other trainer is touched.
-- Her course and learner lists keep showing her assigned courses and learners after the assignment end dates have passed, and she can open and mark the
-- attendance of her past sessions herself. Her assignment dates are NOT changed; Draft, Inactive, deleted, future-assigned and administrator-ended
-- assignments stay restricted. The behaviour itself is in migrations 20270128000000_educator_retain_expired_assignments.sql and
-- 20270129000000_educator_retain_expired_combined_attendance.sql; this seed only sets the flag (organization_staff.metadata.retain_expired_assignments).
-- Runs after the trainer seed (20261023100100_seed_soundarya_trainers_skillpassport.sql). Safe to re-run: it writes only when the flag is not already true.
-- To switch it off again: UPDATE public.organization_staff SET metadata = metadata || '{"retain_expired_assignments": false}' WHERE email = 'subashini.r@rareminds.in';
BEGIN;

DO $$
DECLARE n integer;
BEGIN
  UPDATE public.organization_staff
     SET metadata = coalesce(metadata, '{}'::jsonb) || '{"retain_expired_assignments": true}'::jsonb
   WHERE lower(email) = 'subashini.r@rareminds.in'
     AND organization_id = '00000000-0000-0000-0000-000000000001'
     AND coalesce(metadata->>'retain_expired_assignments', '') <> 'true';
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE 'retain_expired_assignments switched on for % trainer(s) (0 = already on, or the trainer seed has not run yet)', n;
  IF to_regprocedure('public.external_teaching_retains_expired(uuid)') IS NULL THEN
    RAISE NOTICE 'The flag is stored, but it has no effect until migration 20270128000000_educator_retain_expired_assignments.sql is applied';
  END IF;
END $$;

COMMIT;
