-- Create the 5 Combine Class sessions of the Soundarya MBA "Combine" rows that have a Combine group (20 session rows: one per MBA stream class,
-- each event sharing one combined_group_id), plus one blank attendance record per student of that class. Semester 4, section A.
-- Runs after the Combine groups seed (20261023100800_seed_soundarya_mba_combine_class_groups.sql). Nothing is written to the SSO database.
-- Follows the app's create_combined_session action (20270117000000_combined_class_sessions.sql): one session per class with the class's own
-- mapping, one shared combined_group_id per event, the same roster rule as the single-class sessions seed, Total Learners filled from the records.
-- The combined_group_id of a session is NEW for each event; it is not the mapping group id (combined_class_group_id) of the Combine groups seed.
-- Tasks are NOT seeded here: a task is attached to a class (college_assignments.program_section_id), not to a session or a combined group.
--
-- WHAT IS CREATED (Educator Attendance tab of the Soundarya workbook 8; dates and times are copied as they are):
--   row 44  Sandhya Mohan              STUDENT-ASSESSMENT-INTRO-2026      2026-08-29 10:00-13:00
--   row 30  Maheswari                  POWERBI-CORE-FOUND-2026            2026-09-23 09:00-16:00
--   row 40  Koutham K A                SKILL-ECOSYSTEM-ORIENTATION-2026   2026-09-28 09:00-16:00
--   row 3   Lalitha Srinivasan         STUDENT-ASSESSMENT-INTRO-2026      2026-08-29 09:00-16:00
--   row 43  Subashini Ramaswamy        SKILL-ECOSYSTEM-ORIENTATION-2026   2026-10-01 10:00-13:00
-- Each event uses the trainer's group: the four stream mappings that carry a combined_class_group_id and hold the course. The sheet's topic is
-- kept in remarks ('Sheet row N: <topic> (<session id>)'). Room number is empty (not in the sheet). created_by and creation_request_id stay empty,
-- as in the other sessions seeds. Students of a session are the non-deleted learners of that stream program, semester 4, section A, status blank (unmarked).
--
-- An event is skipped with a NOTICE, never forced, when: the group is not found, complete (4 classes) and in exactly one combined group; a mapping is
-- not valid for the course and date; the session does not fit inside the group's shared slot; or the trainer already has an overlapping session that day.
-- Safe to re-run: fixed combined_group_id per event, session ids derived from it, unique (session, student) records; an event whose 4 sessions already exist is left alone.
--
-- PRE-CHECK (read-only), run first:
--   1. The Combine groups must exist: expect 5 groups of 4 mappings.
--      SELECT combined_class_group_id, count(*) FROM public.organization_staff_assignments WHERE notes LIKE 'Soundarya sheet MBA Combine class%' GROUP BY 1;
--   2. Students per stream (semester 4, section A): expect Finance 12, Marketing 15, HR 18, Business Analytics 13 (58 per event, 290 records in total).
--      SELECT p.specializations, count(*) FROM public.learners l JOIN public.programs p ON p.id = l.program_id
--        WHERE p.code = 'MBA' AND l.semester = 4 AND l.section = 'A' AND NOT coalesce(l.is_deleted, false) GROUP BY 1;

BEGIN;

DO $$
BEGIN
  IF to_regprocedure('public.guard_combined_session_changes()') IS NULL OR NOT EXISTS (SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'college_attendance_sessions' AND column_name = 'combined_group_id') THEN
    RAISE EXCEPTION 'Apply migration 20270117000000_combined_class_sessions.sql before this seed';
  END IF;
END $$;

DO $$
DECLARE
  e record; cid uuid; mids uuid[]; n int; ngroups int; staff uuid;
BEGIN
  FOR e IN SELECT * FROM (VALUES
    ('d0323de8-71c9-51c7-869f-6c6df85253e3'::uuid, 'sandhyamohan.sharath@gmail.com'::text, 'STUDENT-ASSESSMENT-INTRO-2026'::text, '2026-08-29'::date, '10:00'::time, '13:00'::time, 'Sheet row 44: Student Assessments & Registration (SES-MCA-001)'::text),
    ('5aa3c130-7c3f-5bee-a875-5be4bbf55bb6'::uuid, 'maheswarikumar27@gmail.com'::text, 'POWERBI-CORE-FOUND-2026'::text, '2026-09-23'::date, '09:00'::time, '16:00'::time, 'Sheet row 30: Tool Based : PowerBi / Excel /. AI (SES-MBA-017)'::text),
    ('e79be594-b4e1-54ac-be77-c5605364bcb0'::uuid, 'koutham8505@gmail.com'::text, 'SKILL-ECOSYSTEM-ORIENTATION-2026'::text, '2026-09-28'::date, '09:00'::time, '16:00'::time, 'Sheet row 40: Skill ecosystem - Orientation & Marketplace; AI-assisted research, documentation, presentation creation and SkillPassport evidence; Digital-tools completion, portfolio, marketplace and job applications & Virtual Interviews (SES-MBA-021)'::text),
    ('8bbcd611-c2ba-57af-8a8c-73b2df1a515e'::uuid, 'lalitha@rareminds.in'::text, 'STUDENT-ASSESSMENT-INTRO-2026'::text, '2026-08-29'::date, '09:00'::time, '16:00'::time, 'Sheet row 3: Student Assessments (SES-MBA-002)'::text),
    ('0e4bc4ec-d251-5f7c-9ade-ded19c0aa762'::uuid, 'subashini.r@rareminds.in'::text, 'SKILL-ECOSYSTEM-ORIENTATION-2026'::text, '2026-10-01'::date, '10:00'::time, '13:00'::time, 'Sheet row 43: Applied Concepts and AI Applications; Digital business, AI productivity tools, responsible AI and Skill Ecosystem orientation (SES-MBA-024)'::text)
  ) AS t(sgid, email, course_code, day, st, en, remarks)
  LOOP
    SELECT co.course_id INTO cid FROM public.courses co WHERE co.code = e.course_code AND co.deleted_at IS NULL AND co.status = 'Active';
    -- the trainer's four stream mappings that belong to a combined group and hold the course
    SELECT array_agg(a.id ORDER BY a.id), count(DISTINCT a.combined_class_group_id), min(a.staff_id::text)::uuid INTO mids, ngroups, staff
    FROM public.organization_staff_assignments a
    JOIN public.organization_staff s ON s.id = a.staff_id AND lower(s.email) = e.email
    JOIN public.program_sections ps ON ps.id = a.section_id AND ps.semester = 4 AND ps.section = 'A'
    JOIN public.programs p ON p.id = ps.program_id AND p.code = 'MBA'
      AND p.specializations IN (ARRAY['Finance'], ARRAY['HR'], ARRAY['Marketing'], ARRAY['Business Analytics'])
    WHERE a.is_active AND a.combined_class_group_id IS NOT NULL AND cid IS NOT NULL AND a.assigned_courses @> jsonb_build_array(cid::text);
    n := coalesce(array_length(mids, 1), 0);
    IF n <> 4 OR ngroups <> 1 THEN
      RAISE NOTICE 'Combine session % % skipped: expected the 4 mappings of one combined group for course %, found % mappings in % groups', e.email, e.day, e.course_code, n, ngroups;
      CONTINUE;
    END IF;
    IF (SELECT count(*) FROM public.college_attendance_sessions WHERE combined_group_id = e.sgid) = 4 THEN
      CONTINUE;  -- already created by an earlier run
    END IF;
    IF EXISTS (SELECT 1 FROM public.organization_staff_assignments a
               WHERE a.id = ANY(mids) AND NOT (
                 public.external_teaching_mapping_valid(a.id, a.staff_id, a.college_id, a.section_id, cid, e.day)
                 AND public.external_teaching_slot_covers(a.id, e.day, e.st, e.en, cid, a.section_id)
                 AND EXISTS (SELECT 1 FROM public.assignment_time_slots ts WHERE ts.assignment_id = a.id AND ts.start_time <= e.st AND ts.end_time >= e.en))) THEN
      RAISE NOTICE 'Combine session % % skipped: a mapping is not valid for the date or the session does not fit inside the shared slot', e.email, e.day;
      CONTINUE;
    END IF;
    IF EXISTS (SELECT 1 FROM public.college_attendance_sessions x
               WHERE x.organization_staff_id = staff AND x.date = e.day AND x.status <> 'cancelled' AND x.start_time < e.en AND x.end_time > e.st) THEN
      RAISE NOTICE 'Combine session % % skipped: the trainer already has an overlapping session', e.email, e.day;
      CONTINUE;
    END IF;

    -- 1. One session per class, all sharing the event's combined_group_id
    INSERT INTO public.college_attendance_sessions
      (id, college_id, department_id, program_id, program_section_id, department_name, program_name, semester, section, academic_year,
       date, start_time, end_time, subject_name, subject_code, faculty_name, remarks,
       instructor_source, lms_course_id, staff_assignment_id, organization_staff_id, original_organization_staff_id, assignment_version_at_creation, combined_group_id)
    SELECT md5(e.sgid::text || ':' || ps.id::text)::uuid, a.college_id, ps.department_id, ps.program_id, ps.id, d.name, p.name, ps.semester, ps.section, ps.academic_year,
      e.day, e.st, e.en, co.title, co.code, s.first_name || ' ' || s.last_name, e.remarks,
      'platform_staff', co.course_id, a.id, s.id, s.id, a.assignment_version, e.sgid
    FROM public.organization_staff_assignments a
    JOIN public.organization_staff s ON s.id = a.staff_id
    JOIN public.program_sections ps ON ps.id = a.section_id
    JOIN public.programs p ON p.id = ps.program_id
    JOIN public.departments d ON d.id = ps.department_id
    JOIN public.courses co ON co.course_id = cid
    WHERE a.id = ANY(mids)
    ON CONFLICT (id) DO NOTHING;

    -- 2. One blank attendance record per student per session (same columns the app writes; status NULL = unmarked)
    INSERT INTO public.college_attendance_records
      (session_id, learner_id, learner_name, roll_number, department_name, program_name, program_id, semester, section, date, status,
       subject_name, subject_code, faculty_name, college_id, organization_staff_id)
    SELECT ss.id, l.id, l.name, coalesce(l.roll_number, ''), ss.department_name, ss.program_name, ss.program_id, ss.semester, ss.section, ss.date, NULL,
      ss.subject_name, ss.subject_code, ss.faculty_name, ss.college_id, ss.organization_staff_id
    FROM public.college_attendance_sessions ss
    JOIN public.organization_staff_assignments m ON m.id = ss.staff_assignment_id
    JOIN public.learners l ON l.college_id = ss.college_id AND l.program_id = ss.program_id
      AND l.semester = ss.semester AND l.section = ss.section AND NOT coalesce(l.is_deleted, false)
      AND (jsonb_array_length(coalesce(m.metadata->'specializations', '[]'::jsonb)) = 0 OR m.metadata->'specializations' @> jsonb_build_array(l.specialization))
    WHERE ss.combined_group_id = e.sgid
    ON CONFLICT (session_id, learner_id) DO NOTHING;

    -- 3. Student counts on the sessions (the app does this right after creating the records)
    UPDATE public.college_attendance_sessions ss
    SET total_learners = (SELECT count(*) FROM public.college_attendance_records r WHERE r.session_id = ss.id)
    WHERE ss.combined_group_id = e.sgid
      AND ss.total_learners IS DISTINCT FROM (SELECT count(*) FROM public.college_attendance_records r WHERE r.session_id = ss.id);
  END LOOP;
END $$;

COMMIT;
