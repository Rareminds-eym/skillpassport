-- Seed for SkillPassport App DB (production)
-- Creates 14 historical MCA sessions (semester 4, section A) for 3 trainers, plus one blank attendance record per learner.
-- Safe and idempotent: fixed session ids, a session is skipped if the trainer already has an overlapping session, and
-- records are unique per (session, learner), so a rerun creates nothing new.
-- Runs after the production trainers seed (20261023100100_seed_soundarya_trainers_skillpassport.sql) and the MCA assignments seed (20261023100200_seed_soundarya_mca_trainer_assignments.sql). Nothing is written to the SSO database.
--
-- FOLLOWS the app's create-session action (20270113_staff_attendance_split.sql): the assignment must be valid on the date
-- (external_teaching_mapping_valid), the trainer's time slot must cover it (external_teaching_slot_covers), and the trainer must
-- not already have an overlapping non-cancelled session ("Trainer is already booked"). Columns and learner records are the
-- same ones the app writes.
--
-- WHAT IS CREATED (dates and times are copied exactly from the Educator Attendance tab of the Soundarya workbook):
--   karthikeyan201219996@gmail.com  rows 48-51, 56-58  (7 sessions)
--   surajsp263@gmail.com            rows 52-55, 59-60  (6 sessions)
--   raghu.astepahead@gmail.com      row 62             (1 session)
-- Course for every session: 'Grama Resource Connect - Web Developer L1'. The sheet's own topic is kept in remarks
-- ('Sheet row N: <topic> (<session id>)') because none of the sheet's course names exist in the database.
--
-- NOT CREATED: MBA rows (2-44); Sandhya Mohan rows 45-47 (her MCA times overlap her MBA rows 7, 11, 13); row 61
-- (Rareminds-Clients is not a trainer).
--
-- created_by and creation_request_id are left NULL: the app uses them only as a retry guard for a logged-in admin's request.
-- Learner records: every non-deleted learner of college + MCA + semester 4 + section A, status NULL (unmarked), as the app does.
-- The assignment has no specialization filter, so none is applied. Staff and learner attendance are marked later through the
-- educator and learner attendance imports.
--
-- PRE-CHECK (read-only), run first; both must return the numbers shown:
--   SELECT count(*) FROM public.organization_staff_assignments a JOIN public.organization_staff s ON s.id = a.staff_id
--     WHERE a.is_active AND lower(s.email) IN ('karthikeyan201219996@gmail.com', 'surajsp263@gmail.com', 'raghu.astepahead@gmail.com');   -- 3
--   SELECT count(*) FROM public.learners l JOIN public.programs p ON p.id = l.program_id JOIN public.organizations c ON c.id = l.college_id
--     WHERE c.name = 'Soundarya Institute of Management and Science' AND p.code = 'MCA' AND l.semester = 4 AND l.section = 'A'
--     AND NOT coalesce(l.is_deleted, false);   -- the learners that will get a record in every session

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
  ('959b9124-0364-52e2-b069-ef69756dac2b'::uuid, 'karthikeyan201219996@gmail.com'::text, '2026-09-11'::date, '13:30'::time, '16:00'::time, 'Sheet row 48: HTML Fundamentals (SES-MCA-005)'::text),
  ('d319001a-4f6c-5814-a36d-dad3b0b21c2c'::uuid, 'karthikeyan201219996@gmail.com'::text, '2026-09-12'::date, '13:30'::time, '16:00'::time, 'Sheet row 49: HTML Fundamentals (SES-MCA-006)'::text),
  ('fd00401a-36d9-5ce4-986e-5e5e9620714c'::uuid, 'karthikeyan201219996@gmail.com'::text, '2026-09-15'::date, '13:30'::time, '16:00'::time, 'Sheet row 50: CSS Fundamentals (SES-MCA-007)'::text),
  ('0c3ddee1-5e3c-5303-bad5-90f00f9badba'::uuid, 'karthikeyan201219996@gmail.com'::text, '2026-09-16'::date, '13:30'::time, '16:00'::time, 'Sheet row 51: CSS Fundamentals (SES-MCA-008)'::text),
  ('ab2ddc89-9244-5ca5-b54d-6a749222a013'::uuid, 'surajsp263@gmail.com'::text, '2026-09-21'::date, '09:00'::time, '16:00'::time, 'Sheet row 52: Front-end / React implementation (SES-MCA-009)'::text),
  ('547b3be3-cef1-5408-8d70-c24861720227'::uuid, 'surajsp263@gmail.com'::text, '2026-09-22'::date, '09:00'::time, '16:00'::time, 'Sheet row 53: Backend / APIs / Node (SES-MCA-010)'::text),
  ('0a00d7b5-9960-5554-9d07-2bf7990f0c5a'::uuid, 'surajsp263@gmail.com'::text, '2026-09-23'::date, '09:00'::time, '16:00'::time, 'Sheet row 54: Database / SQL /Authentication / RBAC / security (SES-MCA-011)'::text),
  ('13d6fccf-8113-5dd3-b3a1-e17c3e263222'::uuid, 'surajsp263@gmail.com'::text, '2026-09-24'::date, '09:00'::time, '16:00'::time, 'Sheet row 55: Debugging / integration /Deployment / environments (SES-MCA-012)'::text),
  ('ff099cdb-ca50-546a-8660-d623a3041c99'::uuid, 'karthikeyan201219996@gmail.com'::text, '2026-09-25'::date, '09:00'::time, '15:00'::time, 'Sheet row 56: Project orientation & SDLC /Requirement understanding & user stories (SES-MCA-013)'::text),
  ('8488a994-3afe-54e7-8aba-d8b81f9dbc83'::uuid, 'karthikeyan201219996@gmail.com'::text, '2026-09-26'::date, '10:00'::time, '13:00'::time, 'Sheet row 57: Documentation / README / technical presentation / (SES-MCA-014)'::text),
  ('7bbeb09b-3572-5c0e-86ad-139146c11242'::uuid, 'karthikeyan201219996@gmail.com'::text, '2026-09-28'::date, '09:00'::time, '16:00'::time, 'Sheet row 58: Skill ecosystem - Orientation & Marketplace; AI-assisted research, documentation, presentation creation and SkillPassport evidence; Digital-tools completion, portfolio, marketplace and job applications (SES-MCA-015)'::text),
  ('e51eae5b-6435-5b6c-afd9-2e9eb44f5653'::uuid, 'surajsp263@gmail.com'::text, '2026-09-29'::date, '09:00'::time, '16:00'::time, 'Sheet row 59: Agile/Scrum/project execution/Git workflow & team collaboration /Testing mindset / defect reporting /Communication & project defence ,Interviews (SES-MCA-016)'::text),
  ('8a9bc53a-9196-5a3f-a9c2-5d40c380a4fd'::uuid, 'surajsp263@gmail.com'::text, '2026-09-30'::date, '09:00'::time, '16:00'::time, 'Sheet row 60: Resume / GitHub / interview articulation /Mock project / behavioural -Interviews (SES-MCA-017)'::text),
  ('3dcc0b82-46d0-5a88-a2c2-1e3195f7a553'::uuid, 'raghu.astepahead@gmail.com'::text, '2026-10-16'::date, '09:00'::time, '12:00'::time, 'Sheet row 62: Testing'::text)
) AS v(id, email, date, start_time, end_time, remarks)
JOIN public.organization_staff s ON lower(s.email) = v.email
  AND s.organization_id = '00000000-0000-0000-0000-000000000001' AND s.account_status = 'active'
JOIN public.organizations c ON c.name = 'Soundarya Institute of Management and Science' AND c.organization_type = 'college'
JOIN public.departments d ON d.college_id = c.id
JOIN public.programs p ON p.department_id = d.id AND p.code = 'MCA'
JOIN public.program_sections ps ON ps.program_id = p.id AND ps.department_id = d.id
  AND ps.semester = 4 AND ps.section = 'A' AND ps.status = 'active'
JOIN public.courses co ON co.title = 'Grama Resource Connect - Web Developer L1' AND co.deleted_at IS NULL AND co.status = 'Active'
JOIN public.organization_staff_assignments a ON a.staff_id = s.id AND a.section_id = ps.id AND a.is_active
WHERE public.external_teaching_mapping_valid(a.id, s.id, c.id, ps.id, co.course_id, v.date)
  AND public.external_teaching_slot_covers(a.id, v.date, v.start_time, v.end_time, co.course_id, ps.id)
  AND NOT EXISTS (
    SELECT 1 FROM public.college_attendance_sessions x
    WHERE x.organization_staff_id = s.id AND x.date = v.date AND x.status <> 'cancelled'
      AND x.start_time < v.end_time AND x.end_time > v.start_time)
ON CONFLICT (id) DO NOTHING;

-- 2. One blank attendance record per learner per session (same columns the app writes; status NULL = unmarked)
INSERT INTO public.college_attendance_records
  (session_id, learner_id, learner_name, roll_number, department_name, program_name, program_id, semester, section, date, status,
   subject_name, subject_code, faculty_name, college_id, organization_staff_id)
SELECT ss.id, l.id, l.name, coalesce(l.roll_number, ''), ss.department_name, ss.program_name, ss.program_id, ss.semester, ss.section, ss.date, NULL,
  ss.subject_name, ss.subject_code, ss.faculty_name, ss.college_id, ss.organization_staff_id
FROM public.college_attendance_sessions ss
JOIN public.learners l ON l.college_id = ss.college_id AND l.program_id = ss.program_id
  AND l.semester = ss.semester AND l.section = ss.section AND NOT coalesce(l.is_deleted, false)
WHERE ss.id IN ('959b9124-0364-52e2-b069-ef69756dac2b', 'd319001a-4f6c-5814-a36d-dad3b0b21c2c', 'fd00401a-36d9-5ce4-986e-5e5e9620714c', '0c3ddee1-5e3c-5303-bad5-90f00f9badba', 'ab2ddc89-9244-5ca5-b54d-6a749222a013', '547b3be3-cef1-5408-8d70-c24861720227', '0a00d7b5-9960-5554-9d07-2bf7990f0c5a', '13d6fccf-8113-5dd3-b3a1-e17c3e263222', 'ff099cdb-ca50-546a-8660-d623a3041c99', '8488a994-3afe-54e7-8aba-d8b81f9dbc83', '7bbeb09b-3572-5c0e-86ad-139146c11242', 'e51eae5b-6435-5b6c-afd9-2e9eb44f5653', '8a9bc53a-9196-5a3f-a9c2-5d40c380a4fd', '3dcc0b82-46d0-5a88-a2c2-1e3195f7a553')
ON CONFLICT (session_id, learner_id) DO NOTHING;

-- 3. Learner counts on the sessions (the app does this right after creating the records)
UPDATE public.college_attendance_sessions ss
SET total_learners = (SELECT count(*) FROM public.college_attendance_records r WHERE r.session_id = ss.id)
WHERE ss.id IN ('959b9124-0364-52e2-b069-ef69756dac2b', 'd319001a-4f6c-5814-a36d-dad3b0b21c2c', 'fd00401a-36d9-5ce4-986e-5e5e9620714c', '0c3ddee1-5e3c-5303-bad5-90f00f9badba', 'ab2ddc89-9244-5ca5-b54d-6a749222a013', '547b3be3-cef1-5408-8d70-c24861720227', '0a00d7b5-9960-5554-9d07-2bf7990f0c5a', '13d6fccf-8113-5dd3-b3a1-e17c3e263222', 'ff099cdb-ca50-546a-8660-d623a3041c99', '8488a994-3afe-54e7-8aba-d8b81f9dbc83', '7bbeb09b-3572-5c0e-86ad-139146c11242', 'e51eae5b-6435-5b6c-afd9-2e9eb44f5653', '8a9bc53a-9196-5a3f-a9c2-5d40c380a4fd', '3dcc0b82-46d0-5a88-a2c2-1e3195f7a553')
  AND ss.total_learners IS DISTINCT FROM (SELECT count(*) FROM public.college_attendance_records r WHERE r.session_id = ss.id);

COMMIT;
