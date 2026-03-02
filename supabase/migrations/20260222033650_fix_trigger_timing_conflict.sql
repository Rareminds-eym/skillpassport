-- Fix trigger timing conflict by changing BEFORE to AFTER trigger
-- This prevents the "tuple already modified" error when accepting offers

-- Update the function to work with AFTER trigger
CREATE OR REPLACE FUNCTION decrease_openings_on_offer_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if offer status changed to 'accepted'
  IF NEW.offer_status = 'accepted' AND (OLD.offer_status IS NULL OR OLD.offer_status != 'accepted') THEN
    -- Decrease openings count
    UPDATE opportunities
    SET openings_count = GREATEST(0, openings_count - 1),
        updated_at = NOW()
    WHERE id = NEW.opportunity_id
    AND openings_count > 0;

    -- Set acceptance timestamp (separate update since this is AFTER trigger)
    UPDATE applied_jobs
    SET offer_accepted_at = NOW()
    WHERE id = NEW.id
    AND offer_accepted_at IS NULL;

    -- If openings reach 0, mark opportunity as filled
    UPDATE opportunities
    SET status = 'filled',
        is_active = false,
        updated_at = NOW()
    WHERE id = NEW.opportunity_id
    AND openings_count = 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger as AFTER instead of BEFORE
DROP TRIGGER IF EXISTS trigger_decrease_openings_on_acceptance ON applied_jobs;
CREATE TRIGGER trigger_decrease_openings_on_acceptance
  AFTER UPDATE ON applied_jobs
  FOR EACH ROW
  EXECUTE FUNCTION decrease_openings_on_offer_acceptance();
