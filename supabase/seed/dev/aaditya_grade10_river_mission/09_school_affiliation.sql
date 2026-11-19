-- Local transfer to the existing school identity from the production seed.
BEGIN;
UPDATE public.users SET "organizationId"='0b2582eb-ff09-495f-ace4-0c2b73d36701', "updatedAt"=now() WHERE id='6d1c48f6-b3a9-57fb-998c-6a7255713e0c' AND email='aaditya.raman10@example.com';
UPDATE public.learners SET school_id='0b2582eb-ff09-495f-ace4-0c2b73d36701', college_school_name='Cambridge School', updated_at=now() WHERE id='6d1c48f6-b3a9-57fb-998c-6a7255713e0c' AND user_id='6d1c48f6-b3a9-57fb-998c-6a7255713e0c';
INSERT INTO public.organization_members (user_id,organization_id,role,status) VALUES ('6d1c48f6-b3a9-57fb-998c-6a7255713e0c','0b2582eb-ff09-495f-ace4-0c2b73d36701','member','active') ON CONFLICT (user_id,organization_id) DO UPDATE SET status='active';
DELETE FROM public.organization_members WHERE user_id='6d1c48f6-b3a9-57fb-998c-6a7255713e0c' AND organization_id='c5f8399c-23cb-5509-9b19-86339eeef941';
UPDATE public.personal_assessment_results SET profile_snapshot=jsonb_set(coalesce(profile_snapshot,'{}'::jsonb),'{schoolName}','"Cambridge School"'::jsonb), gemini_results=jsonb_set(coalesce(gemini_results,'{}'::jsonb),'{profileSnapshot,schoolName}','"Cambridge School"'::jsonb), updated_at=now() WHERE learner_id='6d1c48f6-b3a9-57fb-998c-6a7255713e0c';
UPDATE public.personal_assessment_attempts SET learner_context=jsonb_set(coalesce(learner_context,'{}'::jsonb),'{schoolName}','"Cambridge School"'::jsonb), updated_at=now() WHERE learner_id='6d1c48f6-b3a9-57fb-998c-6a7255713e0c';
COMMIT;
