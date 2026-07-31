-- Phase: 1 of 1
-- Add user_metadata to store shared identity metadata from SSO

ALTER TABLE users ADD COLUMN IF NOT EXISTS user_metadata JSONB DEFAULT '{}';
