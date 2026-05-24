-- 20260520000002_cleanup_legacy_billing_tables.sql
-- Executes Phase 10: Dropping legacy billing tables and repointing remaining B2B foreign keys
-- to the new subscription_cache shadow table.

BEGIN;

-- 1. Fix sub_cache active user index (same B2B bug as auth db)
DROP INDEX IF EXISTS public.idx_sub_cache_active_user;
CREATE UNIQUE INDEX idx_sub_cache_active_user ON public.subscription_cache USING btree (user_id) 
WHERE (status = ANY (ARRAY['active'::character varying, 'pending'::character varying, 'grace_period'::character varying]::text[])) 
  AND (is_organization_subscription IS NOT TRUE);

-- 2. Repoint foreign keys on tables dependent on organization_subscriptions
ALTER TABLE public.license_pools DROP CONSTRAINT IF EXISTS license_pools_organization_subscription_id_fkey;
ALTER TABLE public.license_assignments DROP CONSTRAINT IF EXISTS license_assignments_organization_subscription_id_fkey;
ALTER TABLE public.user_entitlements DROP CONSTRAINT IF EXISTS user_entitlements_organization_subscription_id_fkey;
ALTER TABLE public.subscription_migrations DROP CONSTRAINT IF EXISTS subscription_migrations_old_subscription_id_fkey;

ALTER TABLE public.license_pools ADD CONSTRAINT license_pools_org_sub_id_fkey FOREIGN KEY (organization_subscription_id) REFERENCES public.subscription_cache(id) ON DELETE CASCADE;
ALTER TABLE public.license_assignments ADD CONSTRAINT license_assignments_org_sub_id_fkey FOREIGN KEY (organization_subscription_id) REFERENCES public.subscription_cache(id) ON DELETE CASCADE;
ALTER TABLE public.user_entitlements ADD CONSTRAINT user_entitlements_org_sub_id_fkey FOREIGN KEY (organization_subscription_id) REFERENCES public.subscription_cache(id) ON DELETE CASCADE;
ALTER TABLE public.subscription_migrations ADD CONSTRAINT subscription_migrations_old_subscription_id_fkey FOREIGN KEY (old_subscription_id) REFERENCES public.subscription_cache(id);

-- 3. Update B2B triggers to query subscription_cache instead of organization_subscriptions
CREATE OR REPLACE FUNCTION public.sync_pool_assigned_seats()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'active' THEN
            UPDATE license_pools
            SET assigned_seats = COALESCE(assigned_seats, 0) + 1,
                updated_at = NOW()
            WHERE id = NEW.license_pool_id;
            
            UPDATE subscription_cache
            SET seat_count = COALESCE(seat_count, 0) + 1,
                updated_at = NOW()
            WHERE id = NEW.organization_subscription_id;
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'active' AND NEW.status != 'active' THEN
            UPDATE license_pools
            SET assigned_seats = GREATEST(COALESCE(assigned_seats, 0) - 1, 0),
                updated_at = NOW()
            WHERE id = NEW.license_pool_id;
            
            UPDATE subscription_cache
            SET seat_count = GREATEST(COALESCE(seat_count, 0) - 1, 0),
                updated_at = NOW()
            WHERE id = NEW.organization_subscription_id;
            
        ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
            UPDATE license_pools
            SET assigned_seats = COALESCE(assigned_seats, 0) + 1,
                updated_at = NOW()
            WHERE id = NEW.license_pool_id;
            
            UPDATE subscription_cache
            SET seat_count = COALESCE(seat_count, 0) + 1,
                updated_at = NOW()
            WHERE id = NEW.organization_subscription_id;
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.status = 'active' THEN
            UPDATE license_pools
            SET assigned_seats = GREATEST(COALESCE(assigned_seats, 0) - 1, 0),
                updated_at = NOW()
            WHERE id = OLD.license_pool_id;
            
            UPDATE subscription_cache
            SET seat_count = GREATEST(COALESCE(seat_count, 0) - 1, 0),
                updated_at = NOW()
            WHERE id = OLD.organization_subscription_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_pool_allocation()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  total_allocated INTEGER;
  subscription_seats INTEGER;
BEGIN
  SELECT COALESCE(SUM(allocated_seats), 0) INTO total_allocated
  FROM license_pools
  WHERE organization_subscription_id = NEW.organization_subscription_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID);
  
  SELECT seat_count INTO subscription_seats
  FROM subscription_cache
  WHERE id = NEW.organization_subscription_id;
  
  IF (total_allocated + NEW.allocated_seats) > subscription_seats THEN
    RAISE EXCEPTION 'Total pool allocation (%) exceeds subscription seats (%)', 
      (total_allocated + NEW.allocated_seats), subscription_seats;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 4. Drop legacy functions that depend on subscription_plans
DROP FUNCTION IF EXISTS public.get_all_plans_for_entity CASCADE;
DROP FUNCTION IF EXISTS public.get_plan_features CASCADE;
DROP FUNCTION IF EXISTS public.get_plan_for_entity CASCADE;

-- 5. Drop legacy billing tables (Phase 10)
DROP TABLE IF EXISTS public.failed_upgrades CASCADE;
DROP TABLE IF EXISTS public.payment_transactions CASCADE;
DROP TABLE IF EXISTS public.subscription_cancellations CASCADE;
DROP TABLE IF EXISTS public.razorpay_orders CASCADE;
DROP TABLE IF EXISTS public.subscription_plan_features CASCADE;
DROP TABLE IF EXISTS public.organization_subscriptions CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;
DROP TABLE IF EXISTS public.addon_pending_orders CASCADE;

COMMIT;
