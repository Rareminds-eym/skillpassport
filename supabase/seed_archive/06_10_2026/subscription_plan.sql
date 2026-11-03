-- Complete plans_cache seed update for the new subscription catalogue
-- Includes all 14 plans provided:
-- 4 Learner, 4 School Admin, 3 College Admin, 3 University Admin

BEGIN;

WITH new_plans AS (
  SELECT * FROM (VALUES
    (
      'ef4a94ac-17b7-4a35-b47a-3a031f049b31'::uuid,
      'discover',
      'Discover',
      'b2c',
      ARRAY['all']::text[],
      '{"all":{"yearly":0,"monthly":0,"currency":"INR"}}'::jsonb,
      '["Create learner profile","Explore marketplace","View sample career paths","Limited dashboard access","1 basic assessment","Basic opportunity view"]'::jsonb,
      '{"all":{"tagline":"Start free and explore career paths","duration":"lifetime","ideal_for":"Learners who want to explore the platform before upgrading","max_users":1,"description":"Free learner plan with profile creation, marketplace exploration, sample career paths and one basic assessment","positioning":"Free discovery plan for learners","display_name":"Discover","storage_limit":"0GB","is_recommended":false}}'::jsonb,
      0,
      true,
      '912d5049-e195-46e9-a319-49e3502bf7e7'::uuid
    ),
    (
      'd8d9828a-8f24-490b-81f9-6c03bcf77255'::uuid,
      'skill_starter',
      'Skill Starter',
      'b2c',
      ARRAY['all']::text[],
      '{"all":{"yearly":499,"currency":"INR"}}'::jsonb,
      '["Full learner dashboard","Basic skill assessment","Course recommendations","Profile completion score","Marketplace access","Opportunity access"]'::jsonb,
      '{"all":{"tagline":"Start building your skills","duration":"yearly","ideal_for":"Learners starting their skill-building journey","max_users":1,"description":"Entry learner plan with dashboard access, basic skill assessment, recommendations and marketplace access","positioning":"Essential skill-building tools for learners","display_name":"Skill Starter","storage_limit":"5GB","is_recommended":false}}'::jsonb,
      1,
      true,
      '912d5049-e195-46e9-a319-49e3502bf7e7'::uuid
    ),
    (
      'b3d700e3-da45-4e3d-9387-5f5dbff06c0b'::uuid,
      'career_builder',
      'Career Builder',
      'b2c',
      ARRAY['all']::text[],
      '{"all":{"yearly":749,"currency":"INR"}}'::jsonb,
      '["Advanced career assessment","Skill gap report","6-month learning plan","Portfolio creation","Course/LTE access","Opportunity matching"]'::jsonb,
      '{"all":{"tagline":"Build a clear career path","duration":"yearly","ideal_for":"Learners who want structured career planning and skill-gap guidance","max_users":1,"description":"Career plan with advanced assessment, skill gap report, portfolio creation and opportunity matching","positioning":"Structured career-building plan for serious learners","display_name":"Career Builder","storage_limit":"10GB","is_recommended":true}}'::jsonb,
      2,
      true,
      '912d5049-e195-46e9-a319-49e3502bf7e7'::uuid
    ),
    (
      '8460ee67-18ff-4c2e-ac57-7e1f87dc8316'::uuid,
      'career_accelerator',
      'Career Accelerator',
      'b2c',
      ARRAY['all']::text[],
      '{"all":{"yearly":999,"currency":"INR"}}'::jsonb,
      '["Advanced career assessment","Skill gap report","6-month learning plan","Portfolio creation","Course/LTE access","Opportunity matching","Interview readiness tools","Resume/profile review","Priority opportunity matching","Advanced portfolio proof","Career progress analytics"]'::jsonb,
      '{"all":{"tagline":"Accelerate your career readiness","duration":"yearly","ideal_for":"Learners preparing for interviews, opportunities and career growth","max_users":1,"description":"Includes Career Builder features plus interview readiness, resume review, priority matching, advanced portfolio proof and progress analytics","positioning":"Complete learner acceleration plan","display_name":"Career Accelerator","storage_limit":"50GB","is_recommended":false}}'::jsonb,
      3,
      true,
      '912d5049-e195-46e9-a319-49e3502bf7e7'::uuid
    ),
    (
      'a0000000-0000-4000-8000-000000000010'::uuid,
      'institution_trial',
      'Institution Trial',
      'b2b',
      ARRAY['school']::text[],
      '{"school":{"yearly":0,"currency":"INR"}}'::jsonb,
      '["Admin dashboard preview","Sample learner reports","1 trial assessment","Institution profile setup","Limited marketplace view","Demo access"]'::jsonb,
      '{"school":{"tagline":"Preview the institution platform","duration":"yearly","ideal_for":"Schools evaluating the platform before choosing a paid plan","max_users":null,"description":"Trial plan with admin dashboard preview, sample reports, one assessment, institution setup and demo access","positioning":"Free institution trial for schools","display_name":"Institution Trial","learner_volume":"trial","storage_limit":"1GB","is_recommended":false}}'::jsonb,
      10,
      true,
      NULL::uuid
    ),
    (
      'a0000000-0000-4000-8000-000000000011'::uuid,
      'school_starter',
      'School Starter',
      'b2b',
      ARRAY['school']::text[],
      '{"school":{"yearly":3999,"currency":"INR"}}'::jsonb,
      '["Up to 250 learners","Basic learner dashboard","Assessment allocation","Basic reports","Course listing access","Parent/counsellor view optional"]'::jsonb,
      '{"school":{"tagline":"Essential school tools","duration":"yearly","ideal_for":"Schools starting with learner dashboards and basic reporting","max_users":250,"description":"School starter plan for up to 250 learners with assessment allocation, basic reports and course listing access","positioning":"Starter plan for schools","display_name":"School Starter","learner_volume":"Up to 250 learners","storage_limit":"5GB","is_recommended":false}}'::jsonb,
      11,
      true,
      NULL::uuid
    ),
    (
      'a0000000-0000-4000-8000-000000000012'::uuid,
      'school_professional',
      'School Professional',
      'b2b',
      ARRAY['school']::text[],
      '{"school":{"yearly":9999,"currency":"INR"}}'::jsonb,
      '["Up to 1,000 learners","Career assessment reports","Class-wise analytics","Student capability wheel","Counsellor dashboard","Parent report exports"]'::jsonb,
      '{"school":{"tagline":"Advanced analytics for schools","duration":"yearly","ideal_for":"Schools that need learner analytics, counsellor tools and parent reporting","max_users":1000,"description":"Professional school plan for up to 1,000 learners with class-wise analytics, capability wheel, counsellor dashboard and parent exports","positioning":"Professional school analytics plan","display_name":"School Professional","learner_volume":"Up to 1,000 learners","storage_limit":"10GB","is_recommended":true}}'::jsonb,
      12,
      true,
      NULL::uuid
    ),
    (
      'a0000000-0000-4000-8000-000000000013'::uuid,
      'school_enterprise',
      'School Enterprise',
      'b2b',
      ARRAY['school']::text[],
      '{"school":{"yearly":29999,"currency":"INR"}}'::jsonb,
      '["Custom learner volume","Multi-branch school support","Advanced analytics","Custom reports","Dedicated onboarding","Priority support"]'::jsonb,
      '{"school":{"tagline":"Enterprise school deployment","duration":"yearly","ideal_for":"Large or multi-branch schools needing custom scale and support","max_users":null,"description":"Enterprise school plan with custom learner volume, multi-branch support, advanced analytics, custom reports and dedicated onboarding","positioning":"Enterprise plan for schools","display_name":"School Enterprise","learner_volume":"Custom learner volume","storage_limit":"50GB","is_recommended":false}}'::jsonb,
      13,
      true,
      NULL::uuid
    ),
    (
      'a0000000-0000-4000-8000-000000000021'::uuid,
      'college_starter',
      'College Starter',
      'b2b',
      ARRAY['college']::text[],
      '{"college":{"yearly":4999,"currency":"INR"}}'::jsonb,
      '["Up to 500 learners","Department dashboard","Course listing access","Assessment allocation","Basic placement readiness view","Marketplace access"]'::jsonb,
      '{"college":{"tagline":"Starter tools for colleges","duration":"yearly","ideal_for":"Colleges beginning learner management and placement readiness tracking","max_users":500,"description":"College starter plan for up to 500 learners with department dashboard, course listing, assessment allocation and marketplace access","positioning":"Starter plan for colleges","display_name":"College Starter","learner_volume":"Up to 500 learners","storage_limit":"5GB","is_recommended":false}}'::jsonb,
      21,
      true,
      NULL::uuid
    ),
    (
      'a0000000-0000-4000-8000-000000000022'::uuid,
      'college_professional',
      'College Professional',
      'b2b',
      ARRAY['college']::text[],
      '{"college":{"yearly":14999,"currency":"INR"}}'::jsonb,
      '["Up to 2,000 learners","Skill gap analytics","LTE/course assignment","Placement readiness reports","Opportunity tracking","Faculty/mentor dashboard"]'::jsonb,
      '{"college":{"tagline":"Placement and skill analytics for colleges","duration":"yearly","ideal_for":"Colleges needing skill-gap analytics, placement reporting and mentor dashboards","max_users":2000,"description":"College professional plan for up to 2,000 learners with skill gap analytics, LTE/course assignment, placement readiness reports and opportunity tracking","positioning":"Professional placement-readiness plan for colleges","display_name":"College Professional","learner_volume":"Up to 2,000 learners","storage_limit":"10GB","is_recommended":true}}'::jsonb,
      22,
      true,
      NULL::uuid
    ),
    (
      'a0000000-0000-4000-8000-000000000023'::uuid,
      'college_enterprise',
      'College Enterprise',
      'b2b',
      ARRAY['college']::text[],
      '{"college":{"yearly":49999,"currency":"INR"}}'::jsonb,
      '["Up to 5,000 learners or custom","Multi-department analytics","Recruiter access","Advanced placement dashboard","Bulk onboarding","Dedicated success manager"]'::jsonb,
      '{"college":{"tagline":"Enterprise college deployment","duration":"yearly","ideal_for":"Large colleges needing recruiter access, multi-department analytics and dedicated success support","max_users":5000,"description":"College enterprise plan for up to 5,000 learners or custom volume with recruiter access, advanced placement dashboard and bulk onboarding","positioning":"Enterprise plan for colleges","display_name":"College Enterprise","learner_volume":"Up to 5,000 learners or custom","storage_limit":"50GB","is_recommended":false}}'::jsonb,
      23,
      true,
      NULL::uuid
    ),
    (
      'a0000000-0000-4000-8000-000000000031'::uuid,
      'university_starter',
      'University Starter',
      'b2b',
      ARRAY['university']::text[],
      '{"university":{"yearly":9999,"currency":"INR"}}'::jsonb,
      '["Single department pilot","Basic learner management","Course and assessment access","Department-level dashboard","Basic reports","Marketplace access"]'::jsonb,
      '{"university":{"tagline":"Pilot one department","duration":"yearly","ideal_for":"Universities starting with a single department pilot","max_users":null,"description":"University starter plan for a single department pilot with learner management, course and assessment access, reports and marketplace access","positioning":"Starter pilot plan for universities","display_name":"University Starter","learner_volume":"Single department pilot","storage_limit":"5GB","is_recommended":false}}'::jsonb,
      31,
      true,
      NULL::uuid
    ),
    (
      'a0000000-0000-4000-8000-000000000032'::uuid,
      'university_professional',
      'University Professional',
      'b2b',
      ARRAY['university']::text[],
      '{"university":{"yearly":24999,"currency":"INR"}}'::jsonb,
      '["Multi-department access","Advanced learner analytics","Placement readiness dashboard","LTE assignment and tracking","Faculty/mentor access","Opportunity management"]'::jsonb,
      '{"university":{"tagline":"Multi-department learner analytics","duration":"yearly","ideal_for":"Universities needing multi-department access, placement readiness and opportunity management","max_users":null,"description":"University professional plan with multi-department access, advanced learner analytics, placement dashboard, LTE tracking and faculty/mentor access","positioning":"Professional plan for universities","display_name":"University Professional","learner_volume":"Multi-department access","storage_limit":"10GB","is_recommended":true}}'::jsonb,
      32,
      true,
      NULL::uuid
    ),
    (
      'a0000000-0000-4000-8000-000000000033'::uuid,
      'university_enterprise',
      'University Enterprise',
      'b2b',
      ARRAY['university']::text[],
      '{"university":{"yearly":99999,"currency":"INR"}}'::jsonb,
      '["University-wide deployment","Multi-campus management","API/LMS integration","Custom dashboards","Recruiter ecosystem access","Dedicated account manager"]'::jsonb,
      '{"university":{"tagline":"University-wide enterprise deployment","duration":"yearly","ideal_for":"Universities needing campus-wide deployment, integrations, custom dashboards and recruiter ecosystem access","max_users":null,"description":"University enterprise plan with university-wide deployment, multi-campus management, API/LMS integration, custom dashboards and dedicated account management","positioning":"Enterprise plan for universities","display_name":"University Enterprise","learner_volume":"University-wide deployment","storage_limit":"50GB","is_recommended":false}}'::jsonb,
      33,
      true,
      NULL::uuid
    )
  ) AS v(
    id,
    plan_code,
    name,
    business_type,
    applicable_entities,
    pricing_matrix,
    base_features,
    entity_config,
    display_order,
    is_active,
    product_id
  )
)
INSERT INTO public.plans_cache (
  id,
  plan_code,
  name,
  business_type,
  applicable_entities,
  pricing_matrix,
  base_features,
  entity_config,
  display_order,
  is_active,
  synced_at,
  auth_updated_at,
  created_at,
  updated_at,
  product_id
)
SELECT
  id,
  plan_code,
  name,
  business_type,
  applicable_entities,
  pricing_matrix,
  base_features,
  entity_config,
  display_order,
  is_active,
  now(),
  NULL,
  now(),
  now(),
  product_id
FROM new_plans
ON CONFLICT (id) DO UPDATE SET
  plan_code = EXCLUDED.plan_code,
  name = EXCLUDED.name,
  business_type = EXCLUDED.business_type,
  applicable_entities = EXCLUDED.applicable_entities,
  pricing_matrix = EXCLUDED.pricing_matrix,
  base_features = EXCLUDED.base_features,
  entity_config = EXCLUDED.entity_config,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  synced_at = now(),
  auth_updated_at = EXCLUDED.auth_updated_at,
  updated_at = now(),
  product_id = EXCLUDED.product_id;

-- Deactivate old cached plan codes that are no longer part of the new catalogue.
UPDATE public.plans_cache
SET is_active = false,
    updated_at = now(),
    synced_at = now()
WHERE plan_code IN (
  'freemium',
  'basic',
  'professional',
  'premium',
  'school_freemium',
  'college_freemium',
  'university_freemium'
)
AND plan_code NOT IN (
  'discover',
  'skill_starter',
  'career_builder',
  'career_accelerator',
  'institution_trial',
  'school_starter',
  'school_professional',
  'school_enterprise',
  'college_starter',
  'college_professional',
  'college_enterprise',
  'university_starter',
  'university_professional',
  'university_enterprise'
);

-- Validation: fail if any required active plan is missing.
DO $$
DECLARE
  missing_plan_codes text[];
BEGIN
  WITH required(plan_code) AS (
    VALUES
      ('discover'),
      ('skill_starter'),
      ('career_builder'),
      ('career_accelerator'),
      ('institution_trial'),
      ('school_starter'),
      ('school_professional'),
      ('school_enterprise'),
      ('college_starter'),
      ('college_professional'),
      ('college_enterprise'),
      ('university_starter'),
      ('university_professional'),
      ('university_enterprise')
  )
  SELECT array_agg(r.plan_code ORDER BY r.plan_code)
  INTO missing_plan_codes
  FROM required r
  LEFT JOIN public.plans_cache pc
    ON pc.plan_code = r.plan_code
   AND pc.is_active = true
  WHERE pc.plan_code IS NULL;

  IF missing_plan_codes IS NOT NULL THEN
    RAISE EXCEPTION 'Missing active plans_cache plan_code(s): %', missing_plan_codes;
  END IF;
END $$;

COMMIT;



UPDATE public.plans_cache AS pc
SET
  plan_code = CASE pc.id
    WHEN 'a0000000-0000-4000-8000-000000000010' THEN 'school_freemium'
    WHEN 'b3d700e3-da45-4e3d-9387-5f5dbff06c0b' THEN 'professional'
    WHEN '8460ee67-18ff-4c2e-ac57-7e1f87dc8316' THEN 'premium'
    WHEN 'ef4a94ac-17b7-4a35-b47a-3a031f049b31' THEN 'freemium'
    WHEN 'd8d9828a-8f24-490b-81f9-6c03bcf77255' THEN 'basic'
  END,
  updated_at = NOW()
WHERE pc.id IN (
  'a0000000-0000-4000-8000-000000000010',
  'b3d700e3-da45-4e3d-9387-5f5dbff06c0b',
  '8460ee67-18ff-4c2e-ac57-7e1f87dc8316',
  'ef4a94ac-17b7-4a35-b47a-3a031f049b31',
  'd8d9828a-8f24-490b-81f9-6c03bcf77255'
);
