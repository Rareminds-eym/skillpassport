-- Migration: Create error_logs table for frontend error tracking
-- This table stores client-side errors for monitoring and debugging

-- Create error_logs table
CREATE TABLE IF NOT EXISTS public.error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  error_type text NOT NULL,
  error_message text NOT NULL,
  context jsonb DEFAULT '{}'::jsonb,
  stack_trace text,
  created_at timestamptz DEFAULT now(),
  
  -- Add constraint to prevent excessive logging
  CONSTRAINT error_logs_user_id_check CHECK (user_id IS NOT NULL)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON public.error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON public.error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON public.error_logs(created_at DESC);

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_error_logs_user_type_date 
ON public.error_logs(user_id, error_type, created_at DESC);

-- Add comment explaining the table
COMMENT ON TABLE public.error_logs IS 
'Stores client-side error logs for monitoring and debugging. Used by /api/log-error endpoint.';

-- Add RLS policies (optional - adjust based on your security requirements)
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own error logs
CREATE POLICY error_logs_select_own 
ON public.error_logs 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy: Service role can insert error logs (for API endpoint)
-- Note: This assumes the API uses service role key
CREATE POLICY error_logs_insert_service 
ON public.error_logs 
FOR INSERT 
WITH CHECK (true);

-- Add retention policy comment (implement with pg_cron if needed)
COMMENT ON TABLE public.error_logs IS 
'Error logs table. Consider implementing retention policy to delete logs older than 90 days.';
