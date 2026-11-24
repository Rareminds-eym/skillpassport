-- Fast account-scoped lookup for the paid-access requirement of accepted promo offers.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '15s';
CREATE INDEX IF NOT EXISTS promo_redemptions_accepted_user_role_idx
  ON public.promo_redemptions(user_id, role) WHERE accepted_plan_id IS NOT NULL;
COMMIT;
