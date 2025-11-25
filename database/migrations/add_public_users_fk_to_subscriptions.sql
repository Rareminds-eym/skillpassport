-- Migration: Add foreign key relationship to public.users table
-- This allows proper joins between subscriptions and users tables

-- Step 1: Ensure all user_ids in subscriptions exist in public.users
-- (This is a safety check before adding the constraint)
DO $$
BEGIN
  -- Check if there are any orphaned records
  IF EXISTS (
    SELECT 1 
    FROM public.subscriptions s
    LEFT JOIN public.users u ON s.user_id = u.id
    WHERE u.id IS NULL
  ) THEN
    RAISE NOTICE 'Warning: Found subscriptions with user_ids not in public.users table';
    -- You may want to handle these orphaned records before proceeding
  END IF;
END $$;

-- Step 2: Add foreign key constraint to public.users
-- Note: This is in addition to the existing auth.users foreign key
ALTER TABLE public.subscriptions
ADD CONSTRAINT fk_subscriptions_public_users
FOREIGN KEY (user_id) 
REFERENCES public.users(id) 
ON DELETE CASCADE;

-- Step 3: Create an index for better join performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id 
ON public.subscriptions(user_id);

-- Benefits:
-- 1. Allows Supabase to automatically detect the relationship for joins
-- 2. Ensures data integrity between subscriptions and public.users
-- 3. Improves query performance with the index
-- 4. Enables cascade deletes if a user is removed from public.users
