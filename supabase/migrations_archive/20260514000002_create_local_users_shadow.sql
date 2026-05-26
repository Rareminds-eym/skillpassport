-- Migration: Create local shadow users table
-- Description: Maintains a local copy of user IDs from SSO service for FK constraints
-- Date: 2026-05-14

-- Create a simple shadow table that just tracks user IDs from SSO
CREATE TABLE IF NOT EXISTS public.users_shadow (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add index on email for lookups
CREATE INDEX IF NOT EXISTS idx_users_shadow_email ON public.users_shadow(email);

-- Update foreign key constraints to point to shadow table
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS fk_subscriptions_public_users;

ALTER TABLE public.subscriptions 
ADD CONSTRAINT fk_subscriptions_users_shadow 
FOREIGN KEY (user_id) REFERENCES public.users_shadow(id) ON DELETE CASCADE;

ALTER TABLE public.audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_actorid_fkey;

ALTER TABLE public.audit_logs 
ADD CONSTRAINT audit_logs_users_shadow_fkey 
FOREIGN KEY ("actorId") REFERENCES public.users_shadow(id) ON DELETE SET NULL;

-- Add comments
COMMENT ON TABLE public.users_shadow 
IS 'Shadow table for SSO users - maintains minimal user data for FK constraints';
