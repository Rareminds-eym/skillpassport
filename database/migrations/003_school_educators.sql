-- Migration: Create school_educators table
-- Description: Comprehensive educator profile table with all professional and personal information

-- Ensure pgcrypto extension exists for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create the school_educators table
CREATE TABLE IF NOT EXISTS public.school_educators (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    school_id uuid NOT NULL,
    employee_id character varying(50) NULL,
    specialization character varying(100) NULL,
    qualification character varying(255) NULL,
    experience_years integer NULL,
    date_of_joining date NULL,
    account_status character varying(20) NULL DEFAULT 'active'::character varying,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    metadata jsonb NULL DEFAULT '{}'::jsonb,
    designation character varying(100) NULL,
    department character varying(100) NULL,
    first_name character varying(100) NULL,
    last_name character varying(100) NULL,
    email character varying(255) NULL,
    phone_number character varying(20) NULL,
    dob date NULL,
    gender character varying(20) NULL,
    address text NULL,
    city character varying(100) NULL,
    state character varying(100) NULL,
    country character varying(100) NULL,
    pincode character varying(10) NULL,
    subjects_handled text[] NULL,
    resume_url text NULL,
    id_proof_url text NULL,
    photo_url text NULL,
    verification_status character varying(20) NULL DEFAULT 'Pending'::character varying,
    verified_by uuid NULL,
    verified_at timestamp with time zone NULL,
    CONSTRAINT school_educators_pkey PRIMARY KEY (id),
    CONSTRAINT school_educators_school_id_employee_id_key UNIQUE (school_id, employee_id),
    CONSTRAINT school_educators_user_key UNIQUE (user_id),
    CONSTRAINT school_educators_school_id_fkey FOREIGN KEY (school_id) REFERENCES public.schools (id) ON DELETE CASCADE,
    CONSTRAINT school_educators_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_school_educators_school ON public.school_educators USING btree (school_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_school_educators_user ON public.school_educators USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_school_educators_email ON public.school_educators USING btree (email) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_school_educators_verification_status ON public.school_educators USING btree (verification_status) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_school_educators_account_status ON public.school_educators USING btree (account_status) TABLESPACE pg_default;

-- Create trigger for automatic updated_at timestamp
-- First, ensure the trigger function exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS update_school_educators_updated_at ON public.school_educators;
CREATE TRIGGER update_school_educators_updated_at
BEFORE UPDATE ON public.school_educators
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.school_educators ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own educator profile
CREATE POLICY "Users can view their own educator profile"
ON public.school_educators
FOR SELECT
USING (auth.uid() = user_id);

-- RLS Policy: Users can update their own educator profile
CREATE POLICY "Users can update their own educator profile"
ON public.school_educators
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- RLS Policy: School admins can view educators in their school
CREATE POLICY "School admins can view educators in their school"
ON public.school_educators
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.schools
        WHERE schools.id = school_educators.school_id
        AND schools.admin_id = auth.uid()
    )
);

-- RLS Policy: School admins can update educators in their school
CREATE POLICY "School admins can update educators in their school"
ON public.school_educators
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.schools
        WHERE schools.id = school_educators.school_id
        AND schools.admin_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.schools
        WHERE schools.id = school_educators.school_id
        AND schools.admin_id = auth.uid()
    )
);

-- Add comment to table
COMMENT ON TABLE public.school_educators IS 'Comprehensive educator profile information including personal, professional, and verification details';

-- Add comments to key columns
COMMENT ON COLUMN public.school_educators.verification_status IS 'Status of educator verification: Pending, Verified, Rejected';
COMMENT ON COLUMN public.school_educators.account_status IS 'Status of educator account: active, inactive, suspended';
COMMENT ON COLUMN public.school_educators.subjects_handled IS 'Array of subjects taught by the educator';
COMMENT ON COLUMN public.school_educators.metadata IS 'Additional flexible data storage in JSON format';
