
-- Create ENUM type for user_type
CREATE TYPE public.user_type AS ENUM (
  'learner',
  'institution',
  'employer',
  'other'
);

-- Create contact_form table
CREATE TABLE IF NOT EXISTS public.contact_form (
  -- Primary Key
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  
  -- Form Fields (matching About page form structure)
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization TEXT NULL,
  user_type public.user_type NOT NULL DEFAULT 'learner',
  message TEXT NOT NULL,
  
  -- Notes for admin follow-up
  admin_notes TEXT NULL,

   -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT contact_form_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Index on email for quick lookups
CREATE INDEX IF NOT EXISTS idx_contact_form_email 
ON public.contact_form (email);

-- Index on created_at for chronological queries (descending)
CREATE INDEX IF NOT EXISTS idx_contact_form_created_at 
ON public.contact_form (created_at DESC);

-- Index on user_type for filtering by user category
CREATE INDEX IF NOT EXISTS idx_contact_form_user_type 
ON public.contact_form (user_type);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE public.contact_form ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to INSERT (submit contact form)
CREATE POLICY "Allow anonymous contact form submissions"
ON public.contact_form
FOR INSERT
TO anon
WITH CHECK (true);

-- =====================================================
-- Grant Permissions
-- =====================================================

-- Grant INSERT to anonymous users (public form submissions)
GRANT INSERT ON public.contact_form TO anon;

-- =====================================================
-- End of Migration
-- =====================================================
