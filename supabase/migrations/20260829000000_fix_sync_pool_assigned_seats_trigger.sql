-- Migration: Fix sync_pool_assigned_seats trigger function
-- Context: The trigger public.sync_pool_assigned_seats() was incorrectly updating
-- seat_count instead of assigned_seats on public.subscription_cache when license
-- assignments were added/removed, causing seat_count to artificially inflate (e.g. 5000 + 54 = 5054).

CREATE OR REPLACE FUNCTION public.sync_pool_assigned_seats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status = 'active' THEN
            UPDATE license_pools
            SET assigned_seats = COALESCE(assigned_seats, 0) + 1,
                updated_at = NOW()
            WHERE id = NEW.license_pool_id;
            
            UPDATE subscription_cache
            SET assigned_seats = COALESCE(assigned_seats, 0) + 1,
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
            SET assigned_seats = GREATEST(COALESCE(assigned_seats, 0) - 1, 0),
                updated_at = NOW()
            WHERE id = NEW.organization_subscription_id;
            
        ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
            UPDATE license_pools
            SET assigned_seats = COALESCE(assigned_seats, 0) + 1,
                updated_at = NOW()
            WHERE id = NEW.license_pool_id;
            
            UPDATE subscription_cache
            SET assigned_seats = COALESCE(assigned_seats, 0) + 1,
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
            SET assigned_seats = GREATEST(COALESCE(assigned_seats, 0) - 1, 0),
                updated_at = NOW()
            WHERE id = OLD.organization_subscription_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;
