-- The UPSERT update locks its row; compare against that locked revision,
-- rather than relying on a non-atomic application SELECT before UPSERT.
CREATE OR REPLACE FUNCTION public.guard_credit_cache_revision()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (NEW.id, NEW.user_id, NEW.product_id, NEW.scope)
     IS DISTINCT FROM (OLD.id, OLD.user_id, OLD.product_id, OLD.scope) THEN
    RAISE EXCEPTION 'Credit cache identity cannot change';
  END IF;
  IF NEW.revision <= OLD.revision THEN RETURN NULL; END IF;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;
CREATE TRIGGER guard_credit_cache_revision BEFORE UPDATE ON public.user_ai_credit_accounts_cache
FOR EACH ROW EXECUTE FUNCTION public.guard_credit_cache_revision();
