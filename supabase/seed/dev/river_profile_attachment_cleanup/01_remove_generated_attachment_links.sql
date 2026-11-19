-- Remove only generated profile-attachment references from the two local fixtures.
BEGIN;
UPDATE public.learners SET
 "resumeUrl"=CASE WHEN "resumeUrl" LIKE '%/seed-profiles/%' THEN NULL ELSE "resumeUrl" END,
 "profilePicture"=CASE WHEN "profilePicture" LIKE '%/seed-profiles/%' THEN NULL ELSE "profilePicture" END,
 portfolio_link=CASE WHEN portfolio_link LIKE '%/seed-profiles/%' THEN NULL ELSE portfolio_link END,
 documents=CASE WHEN jsonb_typeof(documents)='array' THEN
  COALESCE((SELECT jsonb_agg(d) FROM jsonb_array_elements(documents) d WHERE coalesce(d->>'url','') NOT LIKE '%/seed-profiles/%'),'[]'::jsonb)
  ELSE documents END,
 updated_at=now()
WHERE id IN ('77feba55-cc92-5f00-9ff6-49df5ec581b3','6d1c48f6-b3a9-57fb-998c-6a7255713e0c');
UPDATE public.certificates SET
 link=CASE WHEN link LIKE '%/seed-profiles/%' THEN NULL ELSE link END,
 upload=CASE WHEN document_url LIKE '%/seed-profiles/%' OR link LIKE '%/seed-profiles/%' THEN NULL ELSE upload END,
 document_url=CASE WHEN document_url LIKE '%/seed-profiles/%' THEN NULL ELSE document_url END,
 updated_at=now()
WHERE learner_id IN ('77feba55-cc92-5f00-9ff6-49df5ec581b3','6d1c48f6-b3a9-57fb-998c-6a7255713e0c');
UPDATE public.projects SET demo_link=NULL, updated_at=now()
WHERE learner_id IN ('77feba55-cc92-5f00-9ff6-49df5ec581b3','6d1c48f6-b3a9-57fb-998c-6a7255713e0c') AND demo_link LIKE '%/seed-profiles/%';
COMMIT;
