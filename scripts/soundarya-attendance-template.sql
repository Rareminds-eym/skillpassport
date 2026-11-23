-- Resolve workbook identities against the current college learner mappings by unique roll number.
-- Preserve workbook marks; current program and email determine the target roster.
CREATE TEMP TABLE soundarya_attendance_excluded (
  source_session text, roll_number text, reason text
) ON COMMIT DROP;
DO $$
BEGIN
  IF (SELECT count(*) FROM soundarya_attendance_source) <> __SOURCE_COUNT__ THEN
    RAISE EXCEPTION 'Expected __SOURCE_COUNT__ supported workbook records';
  END IF;
  IF EXISTS (
    SELECT x.roll_number FROM soundarya_attendance_source x
    JOIN public.learners l ON l.roll_number = x.roll_number
      AND l.college_id = '284c9ed9-cd13-584d-b5bc-e198866b917b'
      AND NOT coalesce(l.is_deleted, false)
    GROUP BY x.source_session, x.roll_number HAVING count(*) > 1
  ) THEN RAISE EXCEPTION 'Ambiguous current learner roll number'; END IF;
END $$;
UPDATE soundarya_attendance_source x
SET email = lower(trim(l.email)), program_code = p.code,
    specialization = CASE WHEN p.code = 'MCA' THEN 'MCA' ELSE p.specializations[1] END
FROM public.learners l JOIN public.programs p ON p.id = l.program_id
WHERE l.roll_number = x.roll_number
  AND l.college_id = '284c9ed9-cd13-584d-b5bc-e198866b917b'
  AND NOT coalesce(l.is_deleted, false);

-- Lock the existing session/roster tables for a consistent review and import.
-- SHARE ROW EXCLUSIVE prevents concurrent marking and roster/session edits during this transaction.
LOCK TABLE public.college_attendance_sessions, public.college_attendance_records
  IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE soundarya_attendance_matches ON COMMIT DROP AS
SELECT x.*, ss.id AS session_id, r.id AS record_id, r.status AS existing_status,
       r.time_in AS existing_time_in
FROM soundarya_attendance_source x
LEFT JOIN (
  public.college_attendance_sessions ss
  JOIN public.organizations o ON o.id = ss.college_id
    AND o.name = 'Soundarya Institute of Management and Science' AND o.organization_type = 'college'
  JOIN public.programs p ON p.id = ss.program_id
) ON ss.remarks LIKE '%(' || x.source_session || ')%'
  AND ss.date = x.date AND p.code = x.program_code
  AND (x.program_code = 'MCA' OR p.specializations = ARRAY[x.specialization])
  AND ss.semester = 4 AND ss.section = 'A' AND ss.instructor_source = 'platform_staff'
LEFT JOIN (
  public.college_attendance_records r
  JOIN public.learners l ON l.id = r.learner_id AND NOT coalesce(l.is_deleted, false)
) ON r.session_id = ss.id AND r.date = x.date
  AND l.college_id = ss.college_id AND l.program_id = ss.program_id
  AND lower(trim(l.email)) = x.email AND l.roll_number = x.roll_number;

-- Unavailable current mappings are reported explicitly and left unmarked.
INSERT INTO soundarya_attendance_excluded
SELECT source_session, roll_number,
  CASE WHEN session_id IS NULL THEN 'No session for current learner program'
       ELSE 'No current learner or matching session roster' END
FROM soundarya_attendance_matches WHERE session_id IS NULL OR record_id IS NULL;
DELETE FROM soundarya_attendance_matches WHERE session_id IS NULL OR record_id IS NULL;

DO $$
DECLARE problems text;
BEGIN
  IF (SELECT count(*) FROM soundarya_attendance_matches) +
     (SELECT count(*) FROM soundarya_attendance_excluded) <> __SOURCE_COUNT__ THEN
    RAISE EXCEPTION 'Expected __SOURCE_COUNT__ matched or explicitly excluded records';
  END IF;
  SELECT string_agg(source_session || '/' || roll_number, ', ') INTO problems
  FROM (SELECT source_session, roll_number FROM soundarya_attendance_matches
        GROUP BY 1,2 HAVING count(*) <> 1) d;
  IF problems IS NOT NULL THEN RAISE EXCEPTION 'Ambiguous session/learner matches: %', problems; END IF;
  SELECT string_agg(source_session || '/' || roll_number, ', ') INTO problems
  FROM soundarya_attendance_matches
  WHERE (session_id IS NULL)
     OR (session_id IS NOT NULL AND record_id IS NULL);
  IF problems IS NOT NULL THEN
    RAISE EXCEPTION 'Missing session or matching learner roster record; run prerequisite seeds/check learner identity: %', problems;
  END IF;
  SELECT string_agg(source_session || '/' || roll_number, ', ') INTO problems
  FROM soundarya_attendance_matches
  WHERE existing_status IS NOT NULL AND
    (existing_status IS DISTINCT FROM status OR existing_time_in IS DISTINCT FROM time_in);
  IF problems IS NOT NULL THEN RAISE EXCEPTION 'Existing attendance conflicts with workbook: %', problems; END IF;
  IF EXISTS (SELECT 1 FROM soundarya_attendance_matches m
             JOIN public.college_attendance_sessions s ON s.id = m.session_id
             WHERE m.record_id IS NOT NULL AND m.existing_status IS NULL
               AND (s.locked_at IS NOT NULL OR s.status IN ('cancelled','completed'))) THEN
    RAISE EXCEPTION 'A target session is locked, cancelled or completed; reconcile it before importing';
  END IF;
END $$;

CREATE TEMP TABLE soundarya_attendance_changed ON COMMIT DROP AS
WITH changed AS (
  UPDATE public.college_attendance_records r
  SET status = x.status, time_in = x.time_in, remarks = x.remarks,
      marked_at = now(),
      revision_history = coalesce(r.revision_history, '[]'::jsonb) || jsonb_build_array(
        jsonb_build_object('status', r.status, 'markedBy', r.marked_by, 'at', r.marked_at,
                          'source', 'Soundarya learner attendance workbook seed')),
      version = r.version + 1
  FROM soundarya_attendance_matches x
  WHERE r.id = x.record_id AND r.status IS NULL
  RETURNING r.id, r.session_id
)
SELECT * FROM changed;

-- Recount the full roster, including learners without workbook rows. Never invent absent marks.
WITH stats AS (
  SELECT r.session_id, count(*) AS total,
    count(*) FILTER (WHERE status = 'present') AS present,
    count(*) FILTER (WHERE status = 'absent') AS absent,
    count(*) FILTER (WHERE status = 'late') AS late,
    count(*) FILTER (WHERE status = 'excused') AS excused,
    count(*) FILTER (WHERE status IS NULL) AS unmarked
  FROM public.college_attendance_records r
  WHERE session_id IN (SELECT session_id FROM soundarya_attendance_changed)
  GROUP BY r.session_id
)
UPDATE public.college_attendance_sessions s
SET total_learners = t.total, present_count = t.present, absent_count = t.absent,
    late_count = t.late, excused_count = t.excused,
    attendance_percentage = round(100.0 * (t.present + t.late + t.excused) / t.total, 2),
    status = CASE WHEN t.unmarked > 0 THEN 'ongoing' ELSE 'completed' END,
    attendance_revision = s.attendance_revision + 1, version = s.version + 1, updated_at = now()
FROM stats t WHERE s.id = t.session_id;

FOR attendance_report IN
SELECT (SELECT count(*) FROM soundarya_attendance_source) AS source_records,
  (SELECT count(*) FROM soundarya_attendance_excluded) AS excluded_records,
  count(*) FILTER (WHERE record_id IS NOT NULL) AS matched_records,
  (SELECT count(*) FROM soundarya_attendance_changed) AS newly_marked,
  count(*) FILTER (WHERE existing_status IS NOT NULL) AS already_identical,
  count(*) FILTER (WHERE session_id IS NULL) AS missing_session_records
FROM soundarya_attendance_matches
LOOP
  RAISE NOTICE 'Soundarya attendance: %', row_to_json(attendance_report);
END LOOP;

FOR attendance_report IN
SELECT reason, count(*) AS excluded_marks,
       count(DISTINCT roll_number) AS learners
FROM soundarya_attendance_excluded GROUP BY reason ORDER BY reason
LOOP
  RAISE NOTICE 'Soundarya attendance: %', row_to_json(attendance_report);
END LOOP;

FOR attendance_report IN
SELECT roll_number, reason, count(*) AS excluded_marks
FROM soundarya_attendance_excluded GROUP BY roll_number, reason ORDER BY roll_number
LOOP
  RAISE NOTICE 'Soundarya attendance: %', row_to_json(attendance_report);
END LOOP;

END;
$soundarya_attendance_batch$;
