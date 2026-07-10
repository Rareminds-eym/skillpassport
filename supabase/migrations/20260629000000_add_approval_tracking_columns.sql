-- Consolidated migration: Add approval tracking and pending edit columns
-- This migration adds all necessary columns for:
-- 1. Training versioning (pending_edit_data, has_pending_edit, verified_data, enabled)
-- 2. Approval tracking for certificates, education, skills, and achievements

-- ============================================================
-- PART 1: Add pending edit columns to trainings table
-- ============================================================
ALTER TABLE public.trainings
  ADD COLUMN IF NOT EXISTS pending_edit_data jsonb,
  ADD COLUMN IF NOT EXISTS has_pending_edit boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_data jsonb,
  ADD COLUMN IF NOT EXISTS enabled boolean DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN public.trainings.pending_edit_data IS 'Stores the edited version of data awaiting verification';
COMMENT ON COLUMN public.trainings.has_pending_edit IS 'Flag to indicate if there is a pending edit for this record';
COMMENT ON COLUMN public.trainings.verified_data IS 'Stores the last verified version of the data';
COMMENT ON COLUMN public.trainings.enabled IS 'Controls visibility of training item on profile (true = visible, false = hidden)';

-- ============================================================
-- PART 2: Add approval tracking columns to certificates
-- ============================================================
ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS rejected_by uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS approval_notes text;

-- Add comments
COMMENT ON COLUMN public.certificates.approved_by IS 'User who approved the certificate';
COMMENT ON COLUMN public.certificates.approved_at IS 'Timestamp when certificate was approved';
COMMENT ON COLUMN public.certificates.rejected_by IS 'User who rejected the certificate';
COMMENT ON COLUMN public.certificates.rejected_at IS 'Timestamp when certificate was rejected';
COMMENT ON COLUMN public.certificates.approval_notes IS 'Notes from approver/rejector';

-- ============================================================
-- PART 3: Add approval tracking columns to education
-- ============================================================
ALTER TABLE public.education
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS rejected_by uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS approval_notes text;

COMMENT ON COLUMN public.education.approved_by IS 'User who approved the education record';
COMMENT ON COLUMN public.education.approved_at IS 'Timestamp when education was approved';
COMMENT ON COLUMN public.education.rejected_by IS 'User who rejected the education record';
COMMENT ON COLUMN public.education.rejected_at IS 'Timestamp when education was rejected';
COMMENT ON COLUMN public.education.approval_notes IS 'Notes from approver/rejector';

-- ============================================================
-- PART 4: Add approval tracking columns to skills
-- ============================================================
ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS rejected_by uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS approval_notes text;

COMMENT ON COLUMN public.skills.approved_by IS 'User who approved the skill';
COMMENT ON COLUMN public.skills.approved_at IS 'Timestamp when skill was approved';
COMMENT ON COLUMN public.skills.rejected_by IS 'User who rejected the skill';
COMMENT ON COLUMN public.skills.rejected_at IS 'Timestamp when skill was rejected';
COMMENT ON COLUMN public.skills.approval_notes IS 'Notes from approver/rejector';

-- ============================================================
-- PART 5: Add approval tracking columns to achievements
-- ============================================================
ALTER TABLE public.achievements
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS rejected_by uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS approval_notes text;

COMMENT ON COLUMN public.achievements.approved_by IS 'User who approved the achievement';
COMMENT ON COLUMN public.achievements.approved_at IS 'Timestamp when achievement was approved';
COMMENT ON COLUMN public.achievements.rejected_by IS 'User who rejected the achievement';
COMMENT ON COLUMN public.achievements.rejected_at IS 'Timestamp when achievement was rejected';
COMMENT ON COLUMN public.achievements.approval_notes IS 'Notes from approver/rejector';
