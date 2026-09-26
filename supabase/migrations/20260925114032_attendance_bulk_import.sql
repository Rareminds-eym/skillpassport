BEGIN;

-- Bulk attendance import support (columns + function only).
-- 1) program_id on records: pins each row to the exact program so renames /
--    duplicate program names (same name, different specializations) never
--    orphan history.
-- 2) program_id on sessions: exact session identity for import + CODE-specs
--    labels in the session picker (no FK joins used anywhere, so the import
--    list works with and without these columns present).
-- 3) Atomic import RPC: delete-old + insert-all + recount run in one
--    transaction. Percentage formula matches manual marking
--    (src/pages/educator/MarkAttendance.tsx): (present + late + excused) / total * 100.

ALTER TABLE "public"."college_attendance_records"
  ADD COLUMN IF NOT EXISTS "program_id" "uuid";

-- The RPC snapshots program_code per record, but the column never existed on
-- this table (confirmed against supabase/backups/latest/migration_schema.sql:
-- sessions has program_code, records does not). Without this, the function
-- fails at runtime with 42703.
ALTER TABLE "public"."college_attendance_records"
  ADD COLUMN IF NOT EXISTS "program_code" character varying(50);

ALTER TABLE "public"."college_attendance_sessions"
  ADD COLUMN IF NOT EXISTS "program_id" "uuid";

CREATE OR REPLACE FUNCTION "public"."import_college_attendance_records"(
  "p_session_id" "uuid",
  "p_records" "jsonb",
  "p_marked_by" "uuid"
)
RETURNS "jsonb"
LANGUAGE "plpgsql"
AS $function$
DECLARE
  v_session_date "date";
  v_total integer;
  v_present integer;
  v_absent integer;
  v_late integer;
  v_excused integer;
  v_pct numeric(5,2);
  v_inserted integer;
BEGIN
  SELECT "date" INTO v_session_date
  FROM "public"."college_attendance_sessions"
  WHERE "id" = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attendance session % not found', p_session_id
      USING ERRCODE = 'P0002';
  END IF;

  -- Single-write-once: re-upload for the same session is not allowed, so any
  -- pre-existing rows here mean a duplicate import — abort instead of wiping.
  IF EXISTS (
    SELECT 1 FROM "public"."college_attendance_records"
    WHERE "session_id" = p_session_id AND "date" = v_session_date
  ) THEN
    RAISE EXCEPTION 'Attendance already marked for session % on %', p_session_id, v_session_date
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO "public"."college_attendance_records" (
    "session_id", "learner_id", "learner_name", "roll_number",
    "department_name", "program_name", "program_code", "program_id",
    "semester", "section", "date", "status",
    "time_in", "time_out", "subject_name", "subject_code",
    "faculty_id", "faculty_name", "location", "remarks",
    "marked_by", "marked_at", "college_id"
  )
  SELECT
    p_session_id,
    NULLIF("r"->>'learner_id', '')::"uuid",
    "r"->>'learner_name',
    "r"->>'roll_number',
    "r"->>'department_name',
    "r"->>'program_name',
    NULLIF("r"->>'program_code', ''),
    NULLIF("r"->>'program_id', '')::"uuid",
    ("r"->>'semester')::integer,
    "r"->>'section',
    v_session_date,
    "r"->>'status',
    NULLIF("r"->>'time_in', '')::"time",
    NULLIF("r"->>'time_out', '')::"time",
    "r"->>'subject_name',
    NULLIF("r"->>'subject_code', ''),
    NULLIF("r"->>'faculty_id', '')::"uuid",
    "r"->>'faculty_name',
    NULLIF("r"->>'location', ''),
    NULLIF("r"->>'remarks', ''),
    p_marked_by,
    "now"(),
    NULLIF("r"->>'college_id', '')::"uuid"
  FROM "jsonb_array_elements"(p_records) AS "r";

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  SELECT
    "count"(*),
    "count"(*) FILTER (WHERE "status" = 'present'),
    "count"(*) FILTER (WHERE "status" = 'absent'),
    "count"(*) FILTER (WHERE "status" = 'late'),
    "count"(*) FILTER (WHERE "status" = 'excused')
  INTO v_total, v_present, v_absent, v_late, v_excused
  FROM "public"."college_attendance_records"
  WHERE "session_id" = p_session_id AND "date" = v_session_date;

  v_pct := CASE
    WHEN COALESCE(v_total, 0) > 0
    THEN "round"(((v_present + v_late + v_excused)::numeric / v_total) * 100, 2)
    ELSE 0
  END;

  UPDATE "public"."college_attendance_sessions"
  SET "total_learners" = v_total,
      "present_count" = v_present,
      "absent_count" = v_absent,
      "late_count" = v_late,
      "excused_count" = v_excused,
      "attendance_percentage" = v_pct,
      "status" = 'completed',
      "updated_at" = "now"()
  WHERE "id" = p_session_id;

  RETURN "jsonb_build_object"(
    'imported', v_inserted,
    'total_learners', v_total,
    'present', v_present,
    'absent', v_absent,
    'late', v_late,
    'excused', v_excused,
    'attendance_percentage', v_pct
  );
END;
$function$;

COMMIT;
