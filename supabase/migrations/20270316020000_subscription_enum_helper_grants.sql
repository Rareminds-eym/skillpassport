BEGIN;
REVOKE EXECUTE ON FUNCTION public.subscription_enum_options_valid(text[])
  FROM anon, authenticated;
COMMIT;
