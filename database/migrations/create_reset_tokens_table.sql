-- Create reset_tokens table for password reset functionality
-- This table stores temporary tokens for password reset links

CREATE TABLE IF NOT EXISTS public.reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ DEFAULT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reset_tokens_email ON public.reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON public.reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires_at ON public.reset_tokens(expires_at);

-- Add RLS policies
ALTER TABLE public.reset_tokens ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for the API)
CREATE POLICY "Service role can manage reset tokens"
  ON public.reset_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Cleanup old/expired tokens function
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.reset_tokens
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$;

-- Optional: Create a scheduled job to cleanup expired tokens daily
-- This can be done via Supabase Dashboard > Database > Cron Jobs
-- Or manually run: SELECT cleanup_expired_reset_tokens();

COMMENT ON TABLE public.reset_tokens IS 'Stores temporary tokens for password reset functionality';
COMMENT ON COLUMN public.reset_tokens.email IS 'Email address of the user requesting password reset';
COMMENT ON COLUMN public.reset_tokens.token IS 'Unique 32-character hex token for password reset';
COMMENT ON COLUMN public.reset_tokens.expires_at IS 'Token expiration timestamp (typically 30 minutes from creation)';
COMMENT ON COLUMN public.reset_tokens.used_at IS 'Timestamp when the token was used (NULL if not used yet)';
