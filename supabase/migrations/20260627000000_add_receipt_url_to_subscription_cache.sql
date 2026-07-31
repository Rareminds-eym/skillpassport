-- Migration: Add receipt_url to subscription_cache
-- Date: 2026-06-27
-- Purpose: Store receipt R2 key in subscription_cache for easier access

-- Validate and add receipt_url column with proper type checking
DO $$
DECLARE
  existing_type text;
BEGIN
  -- Check if column exists and get its type
  SELECT data_type
  INTO existing_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'subscription_cache'
    AND column_name = 'receipt_url';
  
  IF existing_type IS NULL THEN
    -- Column doesn't exist, create it
    ALTER TABLE public.subscription_cache 
    ADD COLUMN receipt_url text;
  ELSIF existing_type NOT IN ('text', 'character varying') THEN
    -- Column exists with incompatible type
    RAISE EXCEPTION 'subscription_cache.receipt_url has incompatible type: % (expected text or character varying)', existing_type;
  END IF;
  -- Column exists with compatible type - no action needed
END $$;

-- Add comment explaining what's stored
COMMENT ON COLUMN public.subscription_cache.receipt_url IS 
'R2 key (not presigned URL) to the payment receipt PDF stored in Cloudflare R2. Example: payment_pdf/user_9a754938/pay_ABC12345_1719432000.pdf';

-- Create index for faster lookups when querying by receipt_url
CREATE INDEX IF NOT EXISTS idx_subscription_cache_receipt_url 
ON public.subscription_cache(receipt_url) 
WHERE receipt_url IS NOT NULL;
