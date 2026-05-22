-- Migration: Update organization_invitations FK
-- Point subscription_plan_id to plans_cache instead of subscription_plans
-- (subscription_plans will be dropped after data migration to auth DB)

ALTER TABLE IF EXISTS public.organization_invitations
DROP CONSTRAINT IF EXISTS organization_invitations_subscription_plan_id_fkey;

-- Re-point FK to plans_cache (local shadow of auth DB plans)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'organization_invitations'
    AND column_name = 'subscription_plan_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'plans_cache'
  ) THEN
    ALTER TABLE public.organization_invitations
    ADD CONSTRAINT organization_invitations_plans_cache_fkey
    FOREIGN KEY (subscription_plan_id) REFERENCES public.plans_cache(id);
  END IF;
END $$;
