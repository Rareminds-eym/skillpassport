-- ============================================
-- Dynamic Openings Count Management System
-- ============================================

-- Step 1: Add openings_count column if not exists
ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS openings_count integer NULL DEFAULT 1;

-- Add constraint to ensure non-negative values
ALTER TABLE public.opportunities 
DROP CONSTRAINT IF EXISTS openings_count_non_negative;

ALTER TABLE public.opportunities 
ADD CONSTRAINT openings_count_non_negative CHECK (openings_count >= 0);

-- Add comment
COMMENT ON COLUMN public.opportunities.openings_count IS 'Number of open positions available. Decreases when candidates accept offers.';

-- Update existing records to have a default value of 1
UPDATE public.opportunities 
SET openings_count = 1 
WHERE openings_count IS NULL;

-- Step 2: Add status tracking columns to applied_jobs if not exists
ALTER TABLE public.applied_jobs
ADD COLUMN IF NOT EXISTS offer_status text NULL CHECK (offer_status IN ('pending', 'accepted', 'rejected', 'withdrawn'));

ALTER TABLE public.applied_jobs
ADD COLUMN IF NOT EXISTS offer_accepted_at timestamp with time zone NULL;

ALTER TABLE public.applied_jobs
ADD COLUMN IF NOT EXISTS position_closed_notification_sent boolean DEFAULT false;

COMMENT ON COLUMN public.applied_jobs.offer_status IS 'Status of job offer: pending, accepted, rejected, withdrawn';
COMMENT ON COLUMN public.applied_jobs.offer_accepted_at IS 'Timestamp when candidate accepted the offer';
COMMENT ON COLUMN public.applied_jobs.position_closed_notification_sent IS 'Whether candidate was notified about position closure';

-- Step 3: Create function to decrease openings count when offer is accepted
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
    
    -- Set acceptance timestamp
    NEW.offer_accepted_at = NOW();
    
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

-- Create trigger for offer acceptance
DROP TRIGGER IF EXISTS trigger_decrease_openings_on_acceptance ON applied_jobs;
CREATE TRIGGER trigger_decrease_openings_on_acceptance
  BEFORE UPDATE OF offer_status ON applied_jobs
  FOR EACH ROW
  EXECUTE FUNCTION decrease_openings_on_offer_acceptance();

-- Step 4: Create function to notify candidates when position closes
CREATE OR REPLACE FUNCTION notify_candidates_position_closed()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if openings_count reached 0
  IF NEW.openings_count = 0 AND (OLD.openings_count IS NULL OR OLD.openings_count > 0) THEN
    -- Insert notifications for all candidates who haven't been notified
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_id,
      created_at
    )
    SELECT 
      aj.student_id,
      'position_closed',
      'Position Filled - ' || NEW.job_title,
      'The position for ' || NEW.job_title || ' at ' || NEW.company_name || ' has been filled. All openings are now closed.',
      NEW.id::text,
      NOW()
    FROM applied_jobs aj
    WHERE aj.opportunity_id = NEW.id
    AND aj.offer_status IS DISTINCT FROM 'accepted'
    AND aj.position_closed_notification_sent = false
    AND aj.application_status NOT IN ('rejected', 'withdrawn');
    
    -- Mark notifications as sent
    UPDATE applied_jobs
    SET position_closed_notification_sent = true
    WHERE opportunity_id = NEW.id
    AND offer_status IS DISTINCT FROM 'accepted';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for position closure notifications
DROP TRIGGER IF EXISTS trigger_notify_position_closed ON opportunities;
CREATE TRIGGER trigger_notify_position_closed
  AFTER UPDATE OF openings_count ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION notify_candidates_position_closed();

-- Step 5: Create function to prevent applications when openings = 0
CREATE OR REPLACE FUNCTION prevent_application_when_closed()
RETURNS TRIGGER AS $$
DECLARE
  v_openings_count integer;
  v_job_title text;
  v_company_name text;
BEGIN
  -- Get current openings count
  SELECT openings_count, job_title, company_name
  INTO v_openings_count, v_job_title, v_company_name
  FROM opportunities
  WHERE id = NEW.opportunity_id;
  
  -- Prevent application if no openings
  IF v_openings_count = 0 THEN
    RAISE EXCEPTION 'Cannot apply: All openings for % at % have been filled.', 
      v_job_title, v_company_name;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent applications
DROP TRIGGER IF EXISTS trigger_prevent_closed_applications ON applied_jobs;
CREATE TRIGGER trigger_prevent_closed_applications
  BEFORE INSERT ON applied_jobs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_application_when_closed();

-- Step 6: Create function to increase openings when offer is rejected/withdrawn
CREATE OR REPLACE FUNCTION increase_openings_on_offer_rejection()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if offer status changed from 'accepted' to 'rejected' or 'withdrawn'
  IF OLD.offer_status = 'accepted' AND NEW.offer_status IN ('rejected', 'withdrawn') THEN
    -- Increase openings count
    UPDATE opportunities
    SET openings_count = openings_count + 1,
        status = CASE WHEN status = 'filled' THEN 'open' ELSE status END,
        is_active = true,
        updated_at = NOW()
    WHERE id = NEW.opportunity_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for offer rejection
DROP TRIGGER IF EXISTS trigger_increase_openings_on_rejection ON applied_jobs;
CREATE TRIGGER trigger_increase_openings_on_rejection
  AFTER UPDATE OF offer_status ON applied_jobs
  FOR EACH ROW
  EXECUTE FUNCTION increase_openings_on_offer_rejection();

-- Step 7: Create view to show application eligibility
CREATE OR REPLACE VIEW v_opportunity_application_status AS
SELECT 
  o.id,
  o.job_title,
  o.company_name,
  o.openings_count,
  o.is_active,
  o.status,
  CASE 
    WHEN o.openings_count = 0 THEN false
    WHEN o.is_active = false THEN false
    WHEN o.status = 'filled' THEN false
    ELSE true
  END as can_accept_applications,
  COUNT(DISTINCT aj.id) FILTER (WHERE aj.offer_status = 'accepted') as accepted_offers,
  COUNT(DISTINCT aj.id) FILTER (WHERE aj.application_status NOT IN ('rejected', 'withdrawn')) as active_applications
FROM opportunities o
LEFT JOIN applied_jobs aj ON aj.opportunity_id = o.id
GROUP BY o.id, o.job_title, o.company_name, o.openings_count, o.is_active, o.status;

-- Step 8: Create index for performance
CREATE INDEX IF NOT EXISTS idx_applied_jobs_offer_status 
ON applied_jobs(opportunity_id, offer_status) 
WHERE offer_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_opportunities_openings_count 
ON opportunities(openings_count) 
WHERE openings_count >= 0;

-- Step 9: Create helper function to check if candidate can proceed in pipeline
CREATE OR REPLACE FUNCTION can_proceed_in_pipeline(p_application_id uuid)
RETURNS boolean AS $$
DECLARE
  v_openings_count integer;
  v_opportunity_id uuid;
BEGIN
  -- Get opportunity details
  SELECT aj.opportunity_id, o.openings_count
  INTO v_opportunity_id, v_openings_count
  FROM applied_jobs aj
  JOIN opportunities o ON o.id = aj.opportunity_id
  WHERE aj.id = p_application_id;
  
  -- Return false if no openings
  RETURN v_openings_count > 0;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION can_proceed_in_pipeline IS 'Check if a candidate can proceed in the recruitment pipeline based on available openings';
