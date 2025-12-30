-- OTP Database Migration
-- Run this in Supabase SQL Editor

-- Table to store OTP records
CREATE TABLE IF NOT EXISTS phone_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL UNIQUE,
  otp_hash VARCHAR(64) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_phone_otps_phone ON phone_otps(phone);
CREATE INDEX IF NOT EXISTS idx_phone_otps_expires_at ON phone_otps(expires_at);

-- Table to log OTP requests for rate limiting
CREATE TABLE IF NOT EXISTS otp_requests_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_otp_requests_log_phone_created ON otp_requests_log(phone, created_at);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_phone_otps_updated_at ON phone_otps;
CREATE TRIGGER update_phone_otps_updated_at
  BEFORE UPDATE ON phone_otps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Cleanup old OTP records (run periodically via cron or scheduled function)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  -- Delete expired OTPs
  DELETE FROM phone_otps WHERE expires_at < NOW();
  
  -- Delete old request logs (older than 24 hours)
  DELETE FROM otp_requests_log WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- RLS Policies (service role bypasses these, but good for security)
ALTER TABLE phone_otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_requests_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access these tables
CREATE POLICY "Service role only" ON phone_otps
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role only" ON otp_requests_log
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON phone_otps TO service_role;
GRANT ALL ON otp_requests_log TO service_role;
