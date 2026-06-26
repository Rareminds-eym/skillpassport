-- Migration: Add receipt_url to subscription_cache
-- Date: 2026-06-27
-- Purpose: Store receipt R2 key in subscription_cache for easier access

-- Add receipt_url column to subscription_cache
ALTER TABLE public.subscription_cache 
ADD COLUMN IF NOT EXISTS receipt_url text;

-- Add comment explaining what's stored
COMMENT ON COLUMN public.subscription_cache.receipt_url IS 
'R2 key (not presigned URL) to the payment receipt PDF stored in Cloudflare R2. Example: payment_pdf/user_9a754938/pay_ABC12345_1719432000.pdf';

-- Create index for faster lookups when querying by receipt_url
CREATE INDEX IF NOT EXISTS idx_subscription_cache_receipt_url 
ON public.subscription_cache(receipt_url) 
WHERE receipt_url IS NOT NULL;
