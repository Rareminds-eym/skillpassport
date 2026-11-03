-- 100k educators: mark the 60 educators from educators_rows.csv on their existing learners rows.
--
-- For each listed email (matched case/space-insensitively):
--   * learner_type: NULL -> 'teacher'. A learner_type that is already set is never overwritten.
--   * metadata: '100k educators' is added to metadata.events. Existing metadata is kept and the
--     event is never added twice.
-- Nothing else is changed (updated_at is refreshed by the table's own trigger). No users are created
-- and SSO / subscriptions are not touched. Emails that are not found are ignored.
--
-- A learner is skipped, never forced, if it is soft-deleted, has no user_id, has an invalid Aadhaar
-- (the table rejects any update of such a row), has metadata that is not a JSON object or an events
-- value that is not an array, or if its email matches more than one learners row.
--
-- Safe to re-run: a second run changes nothing. Contains real email addresses - do not publish.

BEGIN;

WITH educators(email) AS (
  VALUES
    ('chandrakalakavana@gmail.com'),
    ('dhanas39@gmail.com'),
    ('gitamani3650@gmail.com'),
    ('vu2hrh@gmail.com'),
    ('mathsindhubhc@gmail.com'),
    ('drdentiimu@gmail.com'),
    ('robinsonfranklin1965@gmail.com'),
    ('usharrani1310@gmail.com'),
    ('simranvazirani216@gmail.com'),
    ('poovarasanfrk@gmail.com'),
    ('manikyaspndna@gmail.com'),
    ('padmajakumar2310@gmail.com'),
    ('bjshilpa40@gmail.com'),
    ('sushmamadhukar1985@gmail.com'),
    ('aartir24nn@gmail.com'),
    ('nusrathfathimaofficial@gmail.com'),
    ('heenamulrajani921@gmail.com'),
    ('afzeba2002@gmail.com'),
    ('bojjasankar57@gmail.com'),
    ('bsmarinakumar91@gmail.com'),
    ('lak2985lak@gmail.com'),
    ('reenakour2007@gmail.com'),
    ('rajashreepachankar19@gmail.com'),
    ('kedarsingh459@gmail.com'),
    ('deepakumar03@gmail.com'),
    ('lathaselvan25@gmail.com'),
    ('lavans703@gmail.com'),
    ('usha.prabhu2008@gmail.com'),
    ('52shabbirchikani53@gmail.com'),
    ('joganresearch@gmail.com'),
    ('mskavyarajesh@gmail.com'),
    ('nagarathnaharisha509@gmail.com'),
    ('st.johnsschool2016@gmail.com'),
    ('shrutiguddu1211@gmail.com'),
    ('aiswaryasrini@gmail.com'),
    ('dbabutc@gmail.com'),
    ('rashmikrao1989@gmail.com'),
    ('zaffarniyazi@gmail.com'),
    ('sharon.pragasam@gmail.com'),
    ('hemakan92@gmail.com'),
    ('prabhakvj@gmail.com'),
    ('sabasultana1805@gmail.com'),
    ('jaijain@raisinaschool.com'),
    ('dhanesh.majjagi@gmail.com'),
    ('anjupradi007@gmail.com'),
    ('simharani@gmail.com'),
    ('ayeshathapamysambhav@gmail.com'),
    ('vjlifediaries@gmail.com'),
    ('elavarasans0702@gmail.com'),
    ('saakhthar@gmail.com'),
    ('vaniewps@gmail.com'),
    ('veenanaac77@gmail.com'),
    ('vanikonda1988@gmail.com'),
    ('srikgsmathsdept2023@gmail.com'),
    ('gupsbankiamunda@gmail.com'),
    ('diveshgdp@gmail.com'),
    ('sarvani74@gmail.com'),
    ('salmanahmad00121@gmail.com'),
    ('asrasadath1973@gmail.com'),
    ('hanuthamizh@gmail.com')
),
candidates AS (
  SELECT le.id,
         count(*) OVER (PARTITION BY e.email) AS matches
  FROM educators e
  JOIN public.learners le ON lower(btrim(le.email)) = e.email
)
UPDATE public.learners le
   SET learner_type = COALESCE(le.learner_type, 'teacher'),
       metadata = CASE
         WHEN coalesce(le.metadata->'events', '[]'::jsonb) @> '["100k educators"]'::jsonb
           THEN le.metadata
         ELSE jsonb_set(coalesce(le.metadata, '{}'::jsonb), '{events}',
                        coalesce(le.metadata->'events', '[]'::jsonb) || '["100k educators"]'::jsonb)
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
        OR NOT (coalesce(le.metadata->'events', '[]'::jsonb) @> '["100k educators"]'::jsonb));

COMMIT;
