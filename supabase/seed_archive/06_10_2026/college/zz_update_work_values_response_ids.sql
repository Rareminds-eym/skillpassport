-- Repair imported college assessment work-values response IDs.
--
-- Some imported attempts contain old work-values question IDs inside
-- personal_assessment_attempts.all_responses. The current scoring expects the
-- IDs from personal_assessment_questions where section name = 'values'.
--
-- This seed:
-- 1. Reads the current values questions from the questions table by order_number.
-- 2. Maps old imported IDs to current values IDs by question order.
-- 3. Removes old IDs from all_responses.
-- 4. Adds the current values IDs with the learner's existing answers.
--
-- Note: the current table has 24 values questions, while the import has 23 old
-- values IDs. The 24th current Lifestyle question reuses the old 23rd answer.

WITH old_value_questions(old_order, old_id) AS (
  VALUES
    (1,  '01c0e5be-c1ca-4631-a435-ae24a72ad52e'),
    (2,  '05d2ad97-b710-498b-8bf3-38783458f017'),
    (3,  '1a1d4a4d-a6c5-49eb-b69e-079a7cbf8d82'),
    (4,  '2232eb8e-790e-43f6-9fab-29708d6ac351'),
    (5,  '275b30cd-ab23-48c8-8418-02366fe05d45'),
    (6,  '2d489adf-e237-4fc1-b9c7-d7e8c47aa7a1'),
    (7,  '2e703b76-81c1-4751-a5b1-83e54ca8438a'),
    (8,  '3ab491ae-dad3-4c55-8923-041421c5afc0'),
    (9,  '3bc21600-cfc8-4609-abcd-0a717b743365'),
    (10, '4b3120c7-e95c-45d4-a16f-603034963d68'),
    (11, '5b74476a-eac9-4e29-bed3-3b685c8d5653'),
    (12, '5ba86e06-a7be-4d49-a9ed-c4e0f022e50e'),
    (13, '5fbcb1a1-b843-4e6b-84b0-cccb2688b52e'),
    (14, '60966df4-8a11-4256-b99a-eae057a53907'),
    (15, '658dc658-137c-46fb-9abe-94f917610564'),
    (16, '7c09d6ec-378b-4e66-8a72-08dea9952342'),
    (17, '924ce5b4-c523-49a6-aebf-29674cc2dc64'),
    (18, 'a11a1520-8576-4762-97d4-73596450eec0'),
    (19, 'c67cc0ae-03a2-4806-b350-b05baff61848'),
    (20, 'dd3a6dbe-78aa-4fb6-8321-7bacd0362dbf'),
    (21, 'ea7d178f-730e-4f78-8c1f-dce39cdc1fbe'),
    (22, 'faac271d-0ade-4fee-ae0d-976793779f88'),
    (23, 'fd807f20-f77e-479a-b9fe-a97effe0ab79')
),
current_value_questions AS (
  SELECT
    q.order_number,
    q.id::text AS current_id
  FROM public.personal_assessment_questions q
  JOIN public.personal_assessment_sections s ON s.id = q.section_id
  WHERE s.name = 'values'
),
question_mapping AS (
  SELECT
    cq.order_number,
    cq.current_id,
    ovq.old_id
  FROM current_value_questions cq
  JOIN old_value_questions ovq
    ON ovq.old_order = CASE
      WHEN cq.order_number = 24 THEN 23
      ELSE cq.order_number
    END
),
attempts_to_update AS (
  SELECT
    paa.id,
    paa.all_responses
  FROM public.personal_assessment_attempts paa
  WHERE jsonb_typeof(paa.all_responses) = 'object'
    AND EXISTS (
      SELECT 1
      FROM old_value_questions ovq
      WHERE paa.all_responses ? ovq.old_id
    )
),
mapped_responses AS (
  SELECT
    atu.id,
    jsonb_object_agg(qm.current_id, atu.all_responses -> qm.old_id) AS current_value_responses
  FROM attempts_to_update atu
  JOIN question_mapping qm ON atu.all_responses ? qm.old_id
  GROUP BY atu.id
),
old_ids AS (
  SELECT array_agg(old_id) AS ids
  FROM old_value_questions
)
UPDATE public.personal_assessment_attempts paa
SET
  all_responses = (paa.all_responses - old_ids.ids) || mapped_responses.current_value_responses,
  updated_at = now()
FROM mapped_responses
CROSS JOIN old_ids
WHERE paa.id = mapped_responses.id
RETURNING
  paa.id,
  jsonb_array_length(jsonb_path_query_array(mapped_responses.current_value_responses, '$.*')) AS values_responses_added,
  jsonb_array_length(jsonb_path_query_array(paa.all_responses, '$.*')) AS total_response_count;
