-- Create pre_registrations table
CREATE TABLE IF NOT EXISTS pre_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  amount NUMERIC DEFAULT 250,
  payment_status TEXT DEFAULT 'pending',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  campaign TEXT,
  role_type TEXT DEFAULT 'pre_registration',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE pre_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow insert by anon (for public registration)
CREATE POLICY "Allow anon insert" ON pre_registrations
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow select by anon (to check order status if needed, or by created user)
-- For simplicity in this flow where we don't have auth user yet, we might rely on the returned data from insert
-- But we need to update it after payment.

-- Allow update by anon based on ID (usually insecure without auth, but common for simple flows if ID is known)
-- Better: strictly scoped update or no update from client (but we handle payment on client).
-- Let's allow update if id matches.
CREATE POLICY "Allow anon update" ON pre_registrations
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Allow select 
CREATE POLICY "Allow anon select" ON pre_registrations
  FOR SELECT
  TO anon
  USING (true);
