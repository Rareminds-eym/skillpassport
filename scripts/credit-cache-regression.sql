DO $$
DECLARE a uuid:=gen_random_uuid(); u uuid; p uuid:=gen_random_uuid(); n bigint;
BEGIN
 SELECT id INTO u FROM public.users LIMIT 1;
 IF u IS NULL THEN RAISE EXCEPTION 'local user fixture missing'; END IF;
 INSERT INTO public.user_ai_credit_accounts_cache(id,user_id,product_id,scope,granted_credits,spent_credits,revision)
 VALUES(a,u,p,'career_ai',30,5,5);
 INSERT INTO public.user_ai_credit_accounts_cache(id,user_id,product_id,scope,granted_credits,spent_credits,revision)
 VALUES(a,u,p,'career_ai',30,1,3)
 ON CONFLICT(id) DO UPDATE SET revision=EXCLUDED.revision,spent_credits=EXCLUDED.spent_credits;
 SELECT revision INTO n FROM public.user_ai_credit_accounts_cache WHERE id=a;
 IF n<>5 THEN RAISE EXCEPTION 'stale UPSERT overwrote newer balance'; END IF;
 UPDATE public.user_ai_credit_accounts_cache SET revision=6,spent_credits=6 WHERE id=a;
 SELECT revision INTO n FROM public.user_ai_credit_accounts_cache WHERE id=a;
 IF n<>6 THEN RAISE EXCEPTION 'new snapshot rejected'; END IF;
 RAISE NOTICE 'Cache SQL regression checks passed';
END $$;
