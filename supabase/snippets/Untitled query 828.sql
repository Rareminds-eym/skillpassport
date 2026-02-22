-- Add openings_count column to opportunities table
ALTER TABLE public.opportunities 
ADD COLUMN openings_count integer NULL DEFAULT 1;

-- Add comment to explain the column
COMMENT ON COLUMN public.opportunities.openings_count IS 'Number of open positions available for this opportunity';

-- Add a check constraint to ensure non-negative values (0 means all positions filled)
ALTER TABLE public.opportunities 
ADD CONSTRAINT openings_count_non_negative CHECK (openings_count >= 0);

-- Update existing records to have a default value of 1
UPDATE public.opportunities 
SET openings_count = 1 
WHERE openings_count IS NULL;
