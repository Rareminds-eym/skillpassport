-- Assignment time slots: daily availability windows for trainer assignments.
--
-- A slot is just a start_time + end_time. It applies every day inside the
-- assignment's own start_date/end_date window (those dates stay the source
-- of truth for "which days", exactly like the assignment itself).
-- An assignment with zero slot rows means "no restriction" (backfill-safe:
-- every pre-existing assignment keeps today's behavior until slots are added).
-- A session is valid for an assignment when its time overlaps at least one slot.

BEGIN;

CREATE TABLE IF NOT EXISTS public.assignment_time_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.organization_staff_assignments(id) ON DELETE CASCADE,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS assignment_time_slots_assignment
  ON public.assignment_time_slots(assignment_id);

ALTER TABLE public.assignment_time_slots ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignment_time_slots TO service_role;

-- Time-window coverage for one assignment. p_date/p_course/p_section are kept
-- in the signature so existing call sites stay untouched; coverage is purely
-- the daily time window (the assignment's own dates already scope the days).
-- NULL times = day-level match only.
CREATE OR REPLACE FUNCTION public.external_teaching_slot_covers(
  p_assignment uuid, p_date date, p_start time, p_end time, p_course uuid, p_section uuid
) RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.assignment_time_slots s WHERE s.assignment_id = p_assignment)
    OR EXISTS (
      SELECT 1 FROM public.assignment_time_slots s
      WHERE s.assignment_id = p_assignment
        AND (p_start IS NULL OR p_end IS NULL OR (s.start_time < p_end AND s.end_time > p_start))
    );
$$;
REVOKE ALL ON FUNCTION public.external_teaching_slot_covers(uuid, date, time, time, uuid, uuid) FROM PUBLIC, anon, authenticated;

-- Payload validation shared by map / edit / relocate / reassign: every row
-- needs a valid start_time before end_time, and no two rows may overlap
-- (any overlap double-books the trainer for that window). Raises on the
-- first problem. Extra signature params are kept so existing call sites
-- stay untouched.
CREATE OR REPLACE FUNCTION public.external_teaching_validate_slots(
  p_assignment uuid, p_slots jsonb, p_courses jsonb, p_section uuid, p_college uuid
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE
  item jsonb;
  stime time; etime time;
BEGIN
  IF p_slots IS NULL OR jsonb_typeof(p_slots) <> 'array' THEN
    RAISE EXCEPTION 'time_slots must be an array' USING ERRCODE = '22000';
  END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p_slots) LOOP
    stime := (item->>'start_time')::time;
    -- tolerate camelCase from older clients
    IF stime IS NULL THEN stime := (item->>'startTime')::time; END IF;
    etime := (item->>'end_time')::time;
    IF etime IS NULL THEN etime := (item->>'endTime')::time; END IF;
    IF stime IS NULL OR etime IS NULL OR stime >= etime THEN
      RAISE EXCEPTION 'Each time slot needs a start_time before end_time' USING ERRCODE = '22000';
    END IF;
  END LOOP;
  IF EXISTS (
    WITH rows AS (
      SELECT
        coalesce((value->>'start_time'), (value->>'startTime'))::time AS st,
        coalesce((value->>'end_time'), (value->>'endTime'))::time AS et,
        n
      FROM jsonb_array_elements(p_slots) WITH ORDINALITY AS t(value, n)
    )
    SELECT 1 FROM rows a JOIN rows b ON b.n > a.n
      AND a.st < b.et AND b.st < a.et
  ) THEN
    RAISE EXCEPTION 'Time slots overlap' USING ERRCODE = '22000';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.external_teaching_validate_slots(uuid, jsonb, jsonb, uuid, uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.external_teaching_slot_covers(uuid, date, time, time, uuid, uuid),
  public.external_teaching_validate_slots(uuid, jsonb, jsonb, uuid, uuid) TO service_role;

-- The complete teaching RPC is defined once in 20270113000000_staff_attendance_split.sql.
-- Keeping this migration helper-only prevents reapplying time slots from restoring
-- the retired session attendance columns. Apply the full ordered migration chain.

COMMIT;
