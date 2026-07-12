-- Run after the client assessment rows have been seeded. Track and role
-- activation are separate so LTE routing can require both data flags.
UPDATE public.personal_assessment_results
SET
  career_fit = jsonb_set(
    jsonb_set(career_fit, '{clusters,0,specificRoles,0,isActive}', 'true'::jsonb, true),
    '{clusters,0,specificRoles,1,isActive}', 'false'::jsonb, true
  ),
  gemini_results = jsonb_set(
    jsonb_set(gemini_results, '{careerFit,clusters,0,specificRoles,0,isActive}', 'true'::jsonb, true),
    '{careerFit,clusters,0,specificRoles,1,isActive}', 'false'::jsonb, true
  )
WHERE id IN (
  '7e749049-8e11-5f77-b993-1827dde01af6'::uuid,
  '9877083a-2fcc-58fc-ac59-78abb2407d5c'::uuid
)
AND career_fit #>> '{clusters,0,specificRoles,0,name}' = 'Junior AI/ML Telemetry Engineer';
