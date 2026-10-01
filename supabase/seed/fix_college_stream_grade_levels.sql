-- Fix college program streams that were imported as after12/legacy streams.
-- These ids match the college fallback metadata in
-- functions/api/assessment/utils/ensureStreamExists.ts.

WITH college_streams(id) AS (
  VALUES
    ('college'),
    ('engineering'),
    ('bsc'),
    ('bba'),
    ('bca'),
    ('dm'),
    ('bcom'),
    ('finance'),
    ('ba'),
    ('law'),
    ('medical'),
    ('design'),
    ('animation'),
    ('psychology'),
    ('finearts'),
    ('pharmacy'),
    ('nursing'),
    ('physiotherapy'),
    ('journalism'),
    ('bmc'),
    ('bjmc'),
    ('bhm'),
    ('bttm'),
    ('ca'),
    ('cs'),
    ('cma'),
    ('mbbs'),
    ('bds'),
    ('bams'),
    ('bhms'),
    ('ba_llb'),
    ('bba_llb')
)
UPDATE public.personal_assessment_streams pas
SET grade_level = 'college',
    updated_at = now()
FROM college_streams cs
WHERE pas.id = cs.id
  AND pas.grade_level IS DISTINCT FROM 'college';

WITH college_streams(id) AS (
  VALUES
    ('college'),
    ('engineering'),
    ('bsc'),
    ('bba'),
    ('bca'),
    ('dm'),
    ('bcom'),
    ('finance'),
    ('ba'),
    ('law'),
    ('medical'),
    ('design'),
    ('animation'),
    ('psychology'),
    ('finearts'),
    ('pharmacy'),
    ('nursing'),
    ('physiotherapy'),
    ('journalism'),
    ('bmc'),
    ('bjmc'),
    ('bhm'),
    ('bttm'),
    ('ca'),
    ('cs'),
    ('cma'),
    ('mbbs'),
    ('bds'),
    ('bams'),
    ('bhms'),
    ('ba_llb'),
    ('bba_llb')
)
UPDATE public.personal_assessment_attempts paa
SET grade_level = 'college'
FROM college_streams cs
WHERE paa.stream_id = cs.id
  AND paa.grade_level IS DISTINCT FROM 'college'
  AND (
    paa.learner_context->>'degreeLevel' IN ('undergraduate', 'postgraduate', 'diploma')
    OR paa.learner_context->>'rawGrade' = 'college'
  );

WITH college_streams(id) AS (
  VALUES
    ('college'),
    ('engineering'),
    ('bsc'),
    ('bba'),
    ('bca'),
    ('dm'),
    ('bcom'),
    ('finance'),
    ('ba'),
    ('law'),
    ('medical'),
    ('design'),
    ('animation'),
    ('psychology'),
    ('finearts'),
    ('pharmacy'),
    ('nursing'),
    ('physiotherapy'),
    ('journalism'),
    ('bmc'),
    ('bjmc'),
    ('bhm'),
    ('bttm'),
    ('ca'),
    ('cs'),
    ('cma'),
    ('mbbs'),
    ('bds'),
    ('bams'),
    ('bhms'),
    ('ba_llb'),
    ('bba_llb')
)
UPDATE public.personal_assessment_results par
SET grade_level = 'college'
FROM college_streams cs
WHERE par.stream_id = cs.id
  AND par.grade_level IS DISTINCT FROM 'college'
  AND EXISTS (
    SELECT 1
    FROM public.personal_assessment_attempts paa
    WHERE paa.id = par.attempt_id
      AND paa.grade_level = 'college'
  );

WITH college_streams(id) AS (
  VALUES
    ('college'),
    ('engineering'),
    ('bsc'),
    ('bba'),
    ('bca'),
    ('dm'),
    ('bcom'),
    ('finance'),
    ('ba'),
    ('law'),
    ('medical'),
    ('design'),
    ('animation'),
    ('psychology'),
    ('finearts'),
    ('pharmacy'),
    ('nursing'),
    ('physiotherapy'),
    ('journalism'),
    ('bmc'),
    ('bjmc'),
    ('bhm'),
    ('bttm'),
    ('ca'),
    ('cs'),
    ('cma'),
    ('mbbs'),
    ('bds'),
    ('bams'),
    ('bhms'),
    ('ba_llb'),
    ('bba_llb')
)
UPDATE public.career_assessment_ai_questions caq
SET grade_level = 'college',
    updated_at = now()
FROM college_streams cs
WHERE caq.stream_id = cs.id
  AND caq.grade_level IS DISTINCT FROM 'college';
