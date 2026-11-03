DO $$
DECLARE actor uuid := '11111111-1111-4111-8111-111111111111'; result jsonb; before_hash text;
BEGIN
 INSERT INTO public.user_capability_level_progress(user_id,level_id,status,updated_at,reviewed)
 SELECT actor,gen_random_uuid(),'completed',now()+n*interval '1 second',n<>51 FROM generate_series(1,51) n;
 result := public.job_learning_recommendation_summary(actor,'human');
 ASSERT (result->>'truncated')::boolean, 'oversized completed set not disclosed';
 ASSERT jsonb_array_length(result->'levels')=49, 'summary did not bound selection or exclude unapproved level';
 ASSERT result::text NOT LIKE '%PRIVATE REVIEW%' AND result::text NOT LIKE '%evidence%', 'summary leaked review payload';
 before_hash := result->>'revision';
 UPDATE public.user_capability_level_progress SET reviewed=false WHERE user_id=actor;
 result := public.job_learning_recommendation_summary(actor,'human');
 -- The fixture snapshot hashes only IDs, so this proves projection of the
 -- current approval result, not the real verifier's content-hash behavior.
 ASSERT jsonb_array_length(result->'levels')=0, 'approval reversal retained achievement';
 ASSERT jsonb_array_length(public.job_learning_recommendation_summary(gen_random_uuid(),'human')->'levels')=0, 'foreign user received achievements';
 ASSERT NOT has_function_privilege('authenticated','public.job_learning_recommendation_summary(uuid,text)','EXECUTE'), 'unsigned browser summary access';
 RAISE NOTICE 'PASS: bounded LTE summary selection, truncation, approval projection and privacy';
END;
$$;
