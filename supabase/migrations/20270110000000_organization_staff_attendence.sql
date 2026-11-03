-- Generic educator attendance register, keyed by staff + date.
-- Session-linked rows carry session_id; general day records leave it NULL.
-- Trainer attendance is stored separately from learner/class sessions.
-- No existing attendance data is copied by this migration.

BEGIN;

CREATE TABLE IF NOT EXISTS public.organization_staff_attendence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_staff_id uuid NOT NULL
    REFERENCES public.organization_staff(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL
    CHECK (status IN ('present', 'absent', 'late', 'excused')),
  session_id uuid
    REFERENCES public.college_attendance_sessions(id) ON DELETE RESTRICT,
  organization_id uuid
    REFERENCES public.organizations(id) ON DELETE SET NULL,
  marked_by uuid
    REFERENCES public.users(id),
  marked_at timestamptz NOT NULL DEFAULT now(),
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS organization_staff_attendence_session_unique
  ON public.organization_staff_attendence (organization_staff_id, session_id)
  WHERE session_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS organization_staff_attendence_day_unique
  ON public.organization_staff_attendence (organization_staff_id, date)
  WHERE session_id IS NULL;

CREATE INDEX IF NOT EXISTS organization_staff_attendence_staff_date
  ON public.organization_staff_attendence (organization_staff_id, date DESC);

ALTER TABLE public.organization_staff_attendence ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.organization_staff_attendence TO service_role;

COMMIT;
