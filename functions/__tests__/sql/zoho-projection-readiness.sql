-- The same capability fails closed on real grant/trigger drift, without RLS.
SET ROLE service_role;
DO $$ BEGIN ASSERT public.zoho_candidate_projection_ready(); END $$;
RESET ROLE;
GRANT SELECT ON public.learners TO anon;
DO $$ BEGIN ASSERT NOT public.zoho_candidate_projection_ready(); END $$;
REVOKE SELECT ON public.learners FROM anon;
ALTER TABLE public.learners DISABLE TRIGGER zoho_private_learner_owner;
DO $$ BEGIN ASSERT NOT public.zoho_candidate_projection_ready(); END $$;
ALTER TABLE public.learners ENABLE TRIGGER zoho_private_learner_owner;
GRANT UPDATE(source_hash) ON public.zoho_candidate_projections TO service_role;
DO $$ BEGIN ASSERT NOT public.zoho_candidate_projection_ready(); END $$;
REVOKE UPDATE(source_hash) ON public.zoho_candidate_projections FROM service_role;
GRANT EXECUTE ON FUNCTION public.zoho_apply_candidate_projection(text,text) TO authenticated;
DO $$ BEGIN ASSERT NOT public.zoho_candidate_projection_ready(); END $$;
REVOKE EXECUTE ON FUNCTION public.zoho_apply_candidate_projection(text,text) FROM authenticated;
SET ROLE service_role;
DO $$ BEGIN ASSERT public.zoho_candidate_projection_ready(); END $$;
RESET ROLE;
DO $$ BEGIN
 ASSERT NOT has_function_privilege('anon','public.zoho_candidate_projection_ready()','EXECUTE');
 ASSERT NOT has_function_privilege('authenticated','public.zoho_candidate_projection_ready()','EXECUTE');
END $$;
