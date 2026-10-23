-- Create 10 historical MBA sessions (semester 4, section A) for 4 trainers, plus one blank attendance record per student of the trainer's stream.
-- Runs after the production trainers seed (20261023100100_seed_soundarya_trainers_skillpassport.sql) and the MBA assignments seed (20261023100500_seed_soundarya_mba_trainer_assignments.sql). Nothing is written to the SSO database.
-- Follows the app's create_session action (20270113_staff_attendance_split.sql) and the college-admin "Create Attendance Session" form:
-- Department / Course (the stream's MBA program) / Semester / Section come from the class, Subject is the trainer's mapped course,
-- Faculty is the trainer's assignment, Date and times come from the sheet, Room Number and Remarks are optional, Total Learners is automatic.
-- The assignment must be valid on the date, the trainer's time slot must cover it (no slots = any time) and the trainer must not already
-- have an overlapping session; a row that fails a check is skipped, never forced.
--
-- WHAT IS CREATED (Educator Attendance tab of the Soundarya workbook 4: dates and times are copied as they are):
--   row 31  Poornima    HR                 2026-09-24 09:00-16:00  MBA-HR-L1-ONBOARDING
--   row 32  Ajay        Finance            2026-09-24 09:00-16:00  MBA-FIN-L1-SRILAKSHMI
--   row 33  Vishwanath  Marketing          2026-09-24 09:00-16:00  MBA-MKT-L1-SWAADFIT
--   row 34  Poornima    HR                 2026-09-25 09:00-16:00  MBA-HR-L1-ONBOARDING
--   row 35  Ajay        Finance            2026-09-25 09:00-16:00  MBA-FIN-L1-SRILAKSHMI
--   row 36  Vishwanath  Marketing          2026-09-25 09:00-16:00  MBA-MKT-L1-SWAADFIT
--   row 37  Poornima    HR                 2026-09-26 09:00-16:00  MBA-HR-L1-ONBOARDING
--   row 38  Ajay        Finance            2026-09-26 09:00-16:00  MBA-FIN-L1-SRILAKSHMI
--   row 39  Vishwanath  Marketing          2026-09-26 09:00-16:00  MBA-MKT-L1-SWAADFIT
--   row 42  Sadiq       Business Analytics 2026-09-30 13:30-16:00  MBA-BA-L1-SRILAKSHMI
-- Each session uses the trainer's own LMS course (courses.code above), found in the trainer's assignment. The sheet's topic is kept in
-- remarks ('Sheet row N: <topic> (<session id>)'). Room number is empty (not in the sheet); subject code and academic year come from
-- the course and the section. created_by and creation_request_id stay empty, as in the MCA sessions seed.
-- The class is the MBA program whose specialization list is exactly the stream, never the code 'MBA' alone (five MBA records share it).
-- Students of a session are the non-deleted learners of that stream program, semester 4, section A, status blank (unmarked).
-- Three trainers teach at the same time on 24 to 26 Sep: that is allowed, each has their own stream class.
--
-- NOT CREATED: MBA trainers without a confirmed course (Sandhya Mohan, Subashini Ramaswamy, Lalitha Srinivasan, Visakh Madhu,
-- Krishnalatha Atmakuri, Maheswari kumar, Koutham K A); MCA sessions are in the MCA sessions seed.
-- Skipped on purpose, never forced: a missing trainer, class, course or assignment, an overlapping session of the same trainer.
-- Safe to re-run: fixed session ids, unique (session, student) records and the overlap check mean a second run inserts nothing.
--
-- PRE-CHECK (read-only), run first:
--   1. The four trainers must each have an active assignment for their stream class that covers the dates: expect 4 rows.
--      SELECT s.email, p.specializations, a.start_date, a.end_date FROM public.organization_staff_assignments a
--        JOIN public.organization_staff s ON s.id = a.staff_id JOIN public.programs p ON p.id = a.program_id
--        WHERE a.is_active AND p.code = 'MBA' AND lower(s.email) IN ('cacsajay22@gmail.com', 'vishwanathgurlhosur@gmail.com', 'poornima.du@gmail.com', 'msadiq.india@gmail.com');
--   2. The students must be linked to the stream program with section 'A' and semester 4: expect Finance 12, Marketing 15, HR 18, Business Analytics 13.
--      A student on the generic MBA program, or with another section text, gets NO record and the learner attendance import will find an empty class.
--      SELECT p.specializations, count(*) FROM public.learners l JOIN public.programs p ON p.id = l.program_id
--        WHERE p.code = 'MBA' AND l.semester = 4 AND l.section = 'A' AND NOT coalesce(l.is_deleted, false) GROUP BY 1;

BEGIN;

-- 1. Sessions
INSERT INTO public.college_attendance_sessions
  (id, college_id, department_id, program_id, program_section_id, department_name, program_name, semester, section, academic_year,
   date, start_time, end_time, subject_name, subject_code, faculty_name, remarks,
   instructor_source, lms_course_id, staff_assignment_id, organization_staff_id, original_organization_staff_id, assignment_version_at_creation)
SELECT v.id, c.id, ps.department_id, ps.program_id, ps.id, d.name, p.name, ps.semester, ps.section, ps.academic_year,
  v.date, v.start_time, v.end_time, co.title, co.code, s.first_name || ' ' || s.last_name, v.remarks,
  'platform_staff', co.course_id, a.id, s.id, s.id, a.assignment_version
FROM (VALUES
  ('d0e19023-a79b-5210-824f-18d2cd308e53'::uuid, 'poornima.du@gmail.com'::text, 'HR'::text, 'MBA-HR-L1-ONBOARDING'::text, '2026-09-24'::date, '09:00'::time, '16:00'::time, 'Sheet row 31: Domain foundation and stream-specific functional concepts (SES-MBA-018)'::text),
  ('ed04cfb3-467c-5d1b-a143-86306bf789da'::uuid, 'cacsajay22@gmail.com'::text, 'Finance'::text, 'MBA-FIN-L1-SRILAKSHMI'::text, '2026-09-24'::date, '09:00'::time, '16:00'::time, 'Sheet row 32: Domain foundation and stream-specific functional concepts (SES-MBA-018)'::text),
  ('6886c001-5167-5b70-bc5a-b0a3622e877e'::uuid, 'vishwanathgurlhosur@gmail.com'::text, 'Marketing'::text, 'MBA-MKT-L1-SWAADFIT'::text, '2026-09-24'::date, '09:00'::time, '16:00'::time, 'Sheet row 33: Domain foundation and stream-specific functional concepts (SES-MBA-018)'::text),
  ('d830d391-17a3-54bd-b56b-a48e6fbea390'::uuid, 'poornima.du@gmail.com'::text, 'HR'::text, 'MBA-HR-L1-ONBOARDING'::text, '2026-09-25'::date, '09:00'::time, '16:00'::time, 'Sheet row 34: Domain foundation and stream-specific functional concepts (SES-MBA-019)'::text),
  ('bf7ad410-e697-544f-b67d-943aa28c733e'::uuid, 'cacsajay22@gmail.com'::text, 'Finance'::text, 'MBA-FIN-L1-SRILAKSHMI'::text, '2026-09-25'::date, '09:00'::time, '16:00'::time, 'Sheet row 35: Domain foundation and stream-specific functional concepts (SES-MBA-019)'::text),
  ('550187b5-eed4-5b5f-94cd-4760947e3c07'::uuid, 'vishwanathgurlhosur@gmail.com'::text, 'Marketing'::text, 'MBA-MKT-L1-SWAADFIT'::text, '2026-09-25'::date, '09:00'::time, '16:00'::time, 'Sheet row 36: Domain foundation and stream-specific functional concepts (SES-MBA-019)'::text),
  ('d4a9c478-dd18-5cd9-af5c-aa3802f32af8'::uuid, 'poornima.du@gmail.com'::text, 'HR'::text, 'MBA-HR-L1-ONBOARDING'::text, '2026-09-26'::date, '09:00'::time, '16:00'::time, 'Sheet row 37: Interview communication and boot camp (SES-MBA-020)'::text),
  ('578b5ee3-8b2b-5b8f-9769-a78c35723914'::uuid, 'cacsajay22@gmail.com'::text, 'Finance'::text, 'MBA-FIN-L1-SRILAKSHMI'::text, '2026-09-26'::date, '09:00'::time, '16:00'::time, 'Sheet row 38: Interview communication and boot camp (SES-MBA-020)'::text),
  ('80e7fc05-4246-5048-b520-ce12768cbcc9'::uuid, 'vishwanathgurlhosur@gmail.com'::text, 'Marketing'::text, 'MBA-MKT-L1-SWAADFIT'::text, '2026-09-26'::date, '09:00'::time, '16:00'::time, 'Sheet row 39: Interview communication and boot camp (SES-MBA-020)'::text),
  ('768c6d53-1cc5-5971-abfc-9e4eee3f00a6'::uuid, 'msadiq.india@gmail.com'::text, 'Business Analytics'::text, 'MBA-BA-L1-SRILAKSHMI'::text, '2026-09-30'::date, '13:30'::time, '16:00'::time, 'Sheet row 42: Business Analytics (SES-MBA-023)'::text)
) AS v(id, email, stream, course_code, date, start_time, end_time, remarks)
JOIN public.organization_staff s ON lower(s.email) = v.email
  AND s.organization_id = '00000000-0000-0000-0000-000000000001' AND s.account_status = 'active'
JOIN public.organizations c ON c.name = 'Soundarya Institute of Management and Science' AND c.organization_type = 'college'
JOIN public.departments d ON d.college_id = c.id
JOIN public.programs p ON p.department_id = d.id AND p.code = 'MBA' AND p.specializations = ARRAY[v.stream]
JOIN public.program_sections ps ON ps.program_id = p.id AND ps.department_id = d.id
  AND ps.semester = 4 AND ps.section = 'A' AND ps.status = 'active'
JOIN public.courses co ON co.code = v.course_code AND co.deleted_at IS NULL AND co.status = 'Active'
JOIN public.organization_staff_assignments a ON a.staff_id = s.id AND a.section_id = ps.id AND a.is_active
WHERE public.external_teaching_mapping_valid(a.id, s.id, c.id, ps.id, co.course_id, v.date)
  AND public.external_teaching_slot_covers(a.id, v.date, v.start_time, v.end_time, co.course_id, ps.id)
  AND NOT EXISTS (
    SELECT 1 FROM public.college_attendance_sessions x
    WHERE x.organization_staff_id = s.id AND x.date = v.date AND x.status <> 'cancelled'
      AND x.start_time < v.end_time AND x.end_time > v.start_time)
ON CONFLICT (id) DO NOTHING;

-- 2. One blank attendance record per student per session (same columns the app writes; status NULL = unmarked)
INSERT INTO public.college_attendance_records
  (session_id, learner_id, learner_name, roll_number, department_name, program_name, program_id, semester, section, date, status,
   subject_name, subject_code, faculty_name, college_id, organization_staff_id)
SELECT ss.id, l.id, l.name, coalesce(l.roll_number, ''), ss.department_name, ss.program_name, ss.program_id, ss.semester, ss.section, ss.date, NULL,
  ss.subject_name, ss.subject_code, ss.faculty_name, ss.college_id, ss.organization_staff_id
FROM public.college_attendance_sessions ss
JOIN public.learners l ON l.college_id = ss.college_id AND l.program_id = ss.program_id
  AND l.semester = ss.semester AND l.section = ss.section AND NOT coalesce(l.is_deleted, false)
WHERE ss.id IN ('d0e19023-a79b-5210-824f-18d2cd308e53', 'ed04cfb3-467c-5d1b-a143-86306bf789da', '6886c001-5167-5b70-bc5a-b0a3622e877e', 'd830d391-17a3-54bd-b56b-a48e6fbea390', 'bf7ad410-e697-544f-b67d-943aa28c733e', '550187b5-eed4-5b5f-94cd-4760947e3c07', 'd4a9c478-dd18-5cd9-af5c-aa3802f32af8', '578b5ee3-8b2b-5b8f-9769-a78c35723914', '80e7fc05-4246-5048-b520-ce12768cbcc9', '768c6d53-1cc5-5971-abfc-9e4eee3f00a6')
ON CONFLICT (session_id, learner_id) DO NOTHING;

-- 3. Student counts on the sessions (the app does this right after creating the records)
UPDATE public.college_attendance_sessions ss
SET total_learners = (SELECT count(*) FROM public.college_attendance_records r WHERE r.session_id = ss.id)
WHERE ss.id IN ('d0e19023-a79b-5210-824f-18d2cd308e53', 'ed04cfb3-467c-5d1b-a143-86306bf789da', '6886c001-5167-5b70-bc5a-b0a3622e877e', 'd830d391-17a3-54bd-b56b-a48e6fbea390', 'bf7ad410-e697-544f-b67d-943aa28c733e', '550187b5-eed4-5b5f-94cd-4760947e3c07', 'd4a9c478-dd18-5cd9-af5c-aa3802f32af8', '578b5ee3-8b2b-5b8f-9769-a78c35723914', '80e7fc05-4246-5048-b520-ce12768cbcc9', '768c6d53-1cc5-5971-abfc-9e4eee3f00a6')
  AND ss.total_learners IS DISTINCT FROM (SELECT count(*) FROM public.college_attendance_records r WHERE r.session_id = ss.id);

COMMIT;
