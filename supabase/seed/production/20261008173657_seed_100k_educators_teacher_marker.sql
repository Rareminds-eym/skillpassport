-- 100k educators: mark 60 known educators on their existing learners rows.
--
-- For each listed email (matched case/space-insensitively) this seed changes ONLY learners:
--   1. learner_type : NULL -> 'teacher'. A learner_type that is already set is NEVER overwritten.
--   2. metadata     : adds '100k educators' to metadata.events. The existing metadata object is
--                     merged, never replaced (all other keys are kept); the event is appended to an
--                     existing events array and is never added twice.
-- Every matched educator gets the event, even if learner_type is already 'teacher'.
--
-- It does NOT create users, touch SSO (users / roles / memberships / membership_roles), touch
-- subscriptions, or change any other column (updated_at is refreshed by the table's own trigger).
-- Unmatched emails are left alone and only counted. Nothing sensitive is output (no emails in the
-- result, no Aadhaar, no phone numbers).
--
-- Skipped and counted (never forced): soft-deleted learners, learners without user_id, learners whose
-- stored Aadhaar is invalid (the table rejects ANY update of such a row), emails matching more than
-- one learners row, and rows whose metadata is not a JSON object / whose events is not an array.
--
-- Safe to re-run: a second run changes 0 rows. All-or-nothing: guards and a rows-changed self-check
-- abort with an error and keep nothing. Apply by hand (see README); the last SELECT shows the result.
-- Contains real email addresses - do not publish.

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '120s';

DO $seed_100k_educators$
DECLARE
  v_event  CONSTANT text := '100k educators';
  v_emails text[] := ARRAY[
    'chandrakalakavana@gmail.com',
    'dhanas39@gmail.com',
    'gitamani3650@gmail.com',
    'vu2hrh@gmail.com',
    'mathsindhubhc@gmail.com',
    'drdentiimu@gmail.com',
    'robinsonfranklin1965@gmail.com',
    'usharrani1310@gmail.com',
    'simranvazirani216@gmail.com',
    'poovarasanfrk@gmail.com',
    'manikyaspndna@gmail.com',
    'padmajakumar2310@gmail.com',
    'bjshilpa40@gmail.com',
    'sushmamadhukar1985@gmail.com',
    'aartir24nn@gmail.com',
    'nusrathfathimaofficial@gmail.com',
    'heenamulrajani921@gmail.com',
    'afzeba2002@gmail.com',
    'bojjasankar57@gmail.com',
    'bsmarinakumar91@gmail.com',
    'lak2985lak@gmail.com',
    'reenakour2007@gmail.com',
    'rajashreepachankar19@gmail.com',
    'kedarsingh459@gmail.com',
    'deepakumar03@gmail.com',
    'lathaselvan25@gmail.com',
    'lavans703@gmail.com',
    'usha.prabhu2008@gmail.com',
    '52shabbirchikani53@gmail.com',
    'joganresearch@gmail.com',
    'mskavyarajesh@gmail.com',
    'nagarathnaharisha509@gmail.com',
    'st.johnsschool2016@gmail.com',
    'shrutiguddu1211@gmail.com',
    'aiswaryasrini@gmail.com',
    'dbabutc@gmail.com',
    'rashmikrao1989@gmail.com',
    'zaffarniyazi@gmail.com',
    'sharon.pragasam@gmail.com',
    'hemakan92@gmail.com',
    'prabhakvj@gmail.com',
    'sabasultana1805@gmail.com',
    'jaijain@raisinaschool.com',
    'dhanesh.majjagi@gmail.com',
    'anjupradi007@gmail.com',
    'simharani@gmail.com',
    'ayeshathapamysambhav@gmail.com',
    'vjlifediaries@gmail.com',
    'elavarasans0702@gmail.com',
    'saakhthar@gmail.com',
    'vaniewps@gmail.com',
    'veenanaac77@gmail.com',
    'vanikonda1988@gmail.com',
    'srikgsmathsdept2023@gmail.com',
    'gupsbankiamunda@gmail.com',
    'diveshgdp@gmail.com',
    'sarvani74@gmail.com',
    'salmanahmad00121@gmail.com',
    'asrasadath1973@gmail.com',
    'hanuthamizh@gmail.com'
  ];
  v_expected_emails CONSTANT integer := 60;
  v_total           integer;
  v_to_update       integer;
  v_type_set        integer;
  v_event_added     integer;
  v_complete        integer;
  v_kept_other_type integer;
  v_not_found       integer;
  v_multiple        integer;
  v_soft_deleted    integer;
  v_no_user_id      integer;
  v_bad_aadhar      integer;
  v_blocked_meta    integer;
  v_updated         integer;
  v_unmatched       text[];
  v_state_matched   integer;
  v_state_teacher   integer;
  v_state_event     integer;
BEGIN
  -- Guards: this is the schema the seed was written for.
  IF (SELECT count(*) FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'learners'
         AND column_name IN ('email', 'user_id', 'learner_type', 'metadata', 'is_deleted', 'aadhar_number')) <> 6 THEN
    RAISE EXCEPTION 'public.learners is missing an expected column (email, user_id, learner_type, metadata, is_deleted, aadhar_number)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'learners'
                    AND column_name = 'metadata' AND data_type = 'jsonb') THEN
    RAISE EXCEPTION 'public.learners.metadata is not jsonb';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                  WHERE n.nspname = 'public' AND p.proname = 'validate_aadhar_number') THEN
    RAISE EXCEPTION 'function public.validate_aadhar_number does not exist';
  END IF;

  IF (SELECT count(DISTINCT lower(btrim(e))) FROM unnest(v_emails) AS e WHERE btrim(e) <> '') <> v_expected_emails THEN
    RAISE EXCEPTION 'The educator list must contain exactly % distinct emails', v_expected_emails;
  END IF;

  -- 1) Classify every email BEFORE changing anything.
  WITH list AS (
    SELECT DISTINCT lower(btrim(e)) AS email
    FROM unnest(v_emails) AS e
    WHERE btrim(e) <> ''
  ),
  matched AS (
    SELECT li.email, le.id, le.user_id, le.learner_type, le.is_deleted, le.metadata,
           (le.aadhar_number IS NOT NULL
              AND NOT validate_aadhar_number(le.aadhar_number)) AS bad_aadhar,
           count(le.id) OVER (PARTITION BY li.email) AS matches
    FROM list li
    LEFT JOIN public.learners le ON lower(btrim(le.email)) = li.email
  ),
  classified AS (
    SELECT email, learner_type,
           CASE
             WHEN id IS NULL                                                  THEN 'NOT_FOUND'
             WHEN matches > 1                                                 THEN 'MULTIPLE_MATCHES'
             WHEN is_deleted IS TRUE                                          THEN 'SOFT_DELETED'
             WHEN user_id IS NULL                                             THEN 'NO_USER_ID'
             WHEN bad_aadhar                                                  THEN 'BAD_AADHAR'
             WHEN metadata IS NOT NULL AND jsonb_typeof(metadata) <> 'object' THEN 'METADATA_BLOCKED'
             WHEN metadata->'events' IS NOT NULL
                  AND jsonb_typeof(metadata->'events') <> 'array'             THEN 'METADATA_BLOCKED'
             ELSE                                                                  'OK'
           END AS outcome,
           (learner_type IS NULL) AS type_change,
           NOT (coalesce(metadata->'events', '[]'::jsonb) @> jsonb_build_array(v_event)) AS event_change
    FROM matched
  )
  SELECT count(DISTINCT email),
         count(DISTINCT email) FILTER (WHERE outcome = 'OK' AND (type_change OR event_change)),
         count(DISTINCT email) FILTER (WHERE outcome = 'OK' AND type_change),
         count(DISTINCT email) FILTER (WHERE outcome = 'OK' AND event_change),
         count(DISTINCT email) FILTER (WHERE outcome = 'OK' AND NOT type_change AND NOT event_change),
         count(DISTINCT email) FILTER (WHERE outcome = 'OK' AND learner_type IS NOT NULL AND learner_type <> 'teacher'),
         count(DISTINCT email) FILTER (WHERE outcome = 'NOT_FOUND'),
         count(DISTINCT email) FILTER (WHERE outcome = 'MULTIPLE_MATCHES'),
         count(DISTINCT email) FILTER (WHERE outcome = 'SOFT_DELETED'),
         count(DISTINCT email) FILTER (WHERE outcome = 'NO_USER_ID'),
         count(DISTINCT email) FILTER (WHERE outcome = 'BAD_AADHAR'),
         count(DISTINCT email) FILTER (WHERE outcome = 'METADATA_BLOCKED'),
         array_agg(DISTINCT email ORDER BY email) FILTER (WHERE outcome = 'NOT_FOUND')
    INTO v_total, v_to_update, v_type_set, v_event_added, v_complete, v_kept_other_type,
         v_not_found, v_multiple, v_soft_deleted, v_no_user_id, v_bad_aadhar, v_blocked_meta,
         v_unmatched
  FROM classified;

  -- 2) The only write: learner_type NULL -> 'teacher' and the event merged into metadata.events.
  WITH list AS (
    SELECT DISTINCT lower(btrim(e)) AS email
    FROM unnest(v_emails) AS e
    WHERE btrim(e) <> ''
  ),
  candidates AS (
    SELECT le.id,
           count(*) OVER (PARTITION BY li.email) AS matches
    FROM list li
    JOIN public.learners le ON lower(btrim(le.email)) = li.email
  )
  UPDATE public.learners le
     SET learner_type = COALESCE(le.learner_type, 'teacher'),
         metadata = CASE
           WHEN coalesce(le.metadata->'events', '[]'::jsonb) @> jsonb_build_array(v_event)
             THEN le.metadata                                   -- event already there: unchanged
           ELSE jsonb_set(coalesce(le.metadata, '{}'::jsonb), '{events}',
                          coalesce(le.metadata->'events', '[]'::jsonb) || to_jsonb(v_event))
         END
    FROM candidates c
   WHERE le.id = c.id
     AND c.matches = 1
     AND le.user_id IS NOT NULL
     AND le.is_deleted IS NOT TRUE
     AND (le.aadhar_number IS NULL OR validate_aadhar_number(le.aadhar_number))
     AND (le.metadata IS NULL OR jsonb_typeof(le.metadata) = 'object')
     AND (le.metadata->'events' IS NULL OR jsonb_typeof(le.metadata->'events') = 'array')
     AND (le.learner_type IS NULL
          OR NOT (coalesce(le.metadata->'events', '[]'::jsonb) @> jsonb_build_array(v_event)));
  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- 3) Self-check: what we changed must equal what we predicted. If not, undo everything.
  IF v_updated <> v_to_update THEN
    RAISE EXCEPTION '100k educators seed: predicted % row(s) to change but changed %. Aborting; no changes kept.',
      v_to_update, v_updated;
  END IF;

  -- 4) State of the listed learners right now (after the update).
  SELECT count(*),
         count(*) FILTER (WHERE le.learner_type = 'teacher'),
         count(*) FILTER (WHERE coalesce(le.metadata->'events', '[]'::jsonb) @> jsonb_build_array(v_event))
    INTO v_state_matched, v_state_teacher, v_state_event
  FROM public.learners le
  WHERE lower(btrim(le.email)) IN (SELECT lower(btrim(e)) FROM unnest(v_emails) AS e);

  -- 5) Keep the result for the final SELECT below (session setting only; nothing is stored in a table).
  PERFORM set_config('seed_100k_educators.summary', jsonb_build_object(
    'emails_in_list',        v_total,
    'rows_changed',          v_updated,
    'learner_type_set',      v_type_set,
    'event_added',           v_event_added,
    'already_complete',      v_complete,
    'learner_type_kept',     v_kept_other_type,
    'not_found',             v_not_found,
    'skipped_soft_deleted',  v_soft_deleted,
    'skipped_no_user_id',    v_no_user_id,
    'skipped_bad_aadhaar',   v_bad_aadhar,
    'skipped_metadata',      v_blocked_meta,
    'skipped_multiple',      v_multiple,
    'now_matched_learners',  v_state_matched,
    'now_learner_type_teacher', v_state_teacher,
    'now_with_event',        v_state_event
  )::text, false);

  -- Also printed where notices are visible (psql). The unmatched list is for follow-up only.
  RAISE NOTICE '100k educators seed: % emails, % row(s) changed, % not found', v_total, v_updated, v_not_found;
  IF v_unmatched IS NOT NULL THEN
    RAISE NOTICE '  unmatched emails: %', array_to_string(v_unmatched, ', ');
  END IF;
END
$seed_100k_educators$;

COMMIT;

-- RESULT (last statement, so editors that show only the final result display it).
-- Counts only: no emails, no Aadhaar, no phone numbers.
SELECT m.ord, m.metric,
       CASE WHEN s.j IS NULL THEN 'n/a (summary not available in this session)' ELSE coalesce(s.j ->> m.key, 'n/a') END AS value
FROM (VALUES
  (1,  '1. emails in the list',                                      'emails_in_list'),
  (2,  '2. ROWS CHANGED in this run (updated)',                      'rows_changed'),
  (3,  '   - learner_type set NULL -> teacher',                      'learner_type_set'),
  (4,  '   - event 100k educators added',                            'event_added'),
  (5,  '3. already complete (nothing to change)',                    'already_complete'),
  (6,  '4. learner_type kept (other value; still got the event)',    'learner_type_kept'),
  (7,  '5. not found (nothing changed)',                             'not_found'),
  (8,  '6. skipped - soft-deleted',                                  'skipped_soft_deleted'),
  (9,  '7. skipped - no user_id',                                    'skipped_no_user_id'),
  (10, '8. skipped - invalid Aadhaar',                               'skipped_bad_aadhaar'),
  (11, '9. skipped - metadata/events not usable',                    'skipped_metadata'),
  (12, '10. skipped - email matches more than one learner',          'skipped_multiple'),
  (13, 'NOW: listed learners found in learners',                     'now_matched_learners'),
  (14, 'NOW: of those, learner_type = teacher',                      'now_learner_type_teacher'),
  (15, 'NOW: of those, with the 100k educators event',               'now_with_event')
) AS m(ord, metric, key)
CROSS JOIN (SELECT nullif(current_setting('seed_100k_educators.summary', true), '')::jsonb AS j) AS s
ORDER BY m.ord;
